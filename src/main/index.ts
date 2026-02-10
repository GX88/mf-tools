import process from 'node:process'

import { app, crashReporter } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

import { loggerService } from '@logger'
import { registerIpc } from '@main/ipc'
import { appLocale } from '@main/services/AppLocale'
import { trayService } from '@main/services/TrayService'
import { menuService } from '@main/services/MenuService'
import { proxyManager } from '@main/services/ProxyManager'
import { configManager } from '@main/services/ConfigManager'
import { windowService } from '@main/services/WindowService'
import { isDev, isLinux, isMacOS, isWindows } from '@main/utils/systeminfo'
import { handleProtocolUrl, setupAppImageDeepLink } from '@main/services/ProtocolClient'

import { LOG_MODULE } from '@shared/config/logger'
import { runAsyncFunction } from '@shared/modules/function'
import { isBoolean, isHttp } from '@shared/modules/validate'
import { APP_NAME, APP_NAME_PROTOCOL } from '@shared/config/appinfo'

const logger = loggerService.withContext(LOG_MODULE.MAIN)

// 启用本地崩溃报告，仅将信息写入本地，不上报服务器
crashReporter.start({
  productName: APP_NAME,
  submitURL: '',
  uploadToServer: false
})

/**
 * 进程级运行环境配置
 *
 * - 关闭 TLS 校验与 Electron 的安全告警（便于抓包、调试 HTTPS）
 * - 在生产环境中统一捕获未处理异常与未处理 Promise 拒绝，并落到主进程日志
 *
 * 注意：这里是通用调试/稳定性配置，与视频业务无关
 */
const setupEnv = () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // ignore TLS certificate errors
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true' // disable security warnings

  // in production mode, handle uncaught exception and unhandled rejection globally
  if (!isDev) {
    // handle uncaught exception
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error)
    })

    // handle unhandled rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`)
    })
  }
}

/**
 * 基于配置对 Electron 应用做一次性启动参数设置
 *
 * 主要职责：
 * - 根据 ConfigManager 决定是否关闭硬件加速
 * - 针对 Windows / Linux Wayland / 通用 Linux 做窗口动画、全局快捷键等兼容配置
 * - 配置 Chromium 的 enable-features / disable-features 以及安全相关开关
 *
 * 说明：
 * - enable-features 中包含若干视频解码相关开关（HEVC/VA-API 等），这些是底层解码能力，
 *   并不意味着业务层一定有播放器逻辑；如未来完全不再需要可在此处进一步精简
 */
const setupApp = async () => {
  // 根据配置选择是否关闭硬件加速
  const dbHardwareAcceleration = configManager.hardwareAcceleration
  const disableHardwareAcceleration = isBoolean(dbHardwareAcceleration)
    ? !dbHardwareAcceleration
    : false
  if (disableHardwareAcceleration) {
    app.disableHardwareAcceleration()
  }

  /**
   * 关闭 Chromium 窗口动画
   *
   * 目的：
   * - 避免窗口显示时的透明闪烁（Windows 上尤为明显）
   * 参考：
   * - https://github.com/electron/electron/issues/12130#issuecomment-627198990
   */
  if (isWindows) {
    app.commandLine.appendSwitch('wm-window-animations-disabled')
  }

  /**
   * [Linux / Wayland] 启用 GlobalShortcutsPortal
   *
   * 用于在 Wayland 协议下正确注册全局快捷键
   * 参考：https://www.electronjs.org/docs/latest/api/global-shortcut
   */
  if (isLinux && process.env.XDG_SESSION_TYPE === 'wayland') {
    app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
  }

  /**
   * [Linux] 设置窗口 class 和 name
   *
   * - 让窗口管理器在 X11 / Wayland 下都能正确识别应用
   */
  if (isLinux) {
    app.commandLine.appendSwitch('class', APP_NAME)
    app.commandLine.appendSwitch('name', APP_NAME)
  }

  // Chromium 特性开关：按需启用部分底层能力
  const enableFeatures = [
    'DocumentPolicyIncludeJSCallStacksInCrashReports', // 未响应渲染进程时采集 JS 调用栈
    'EarlyEstablishGpuChannel', // 提前建立 GPU 通道以提升渲染性能
    'EstablishGpuChannelAsync', // 异步建立 GPU 通道
    // 以下特性是底层视频解码能力，与本项目是否存在播放器 UI 无直接绑定，可视需求保留/裁剪
    'PlatformHEVCDecoderSupport', // HEVC（H.265）硬件解码支持
    'VaapiVideoDecoder', // VA-API 视频解码器
    'UseMultiPlaneFormatForHardwareVideo', // 修复硬件视频帧池相关问题
    'VaapiIgnoreDriverChecks', // 忽略 VA-API 驱动兼容性检查
    'CanvasOopRasterization' // Canvas OOP 光栅化，提高渲染性能
  ]
  app.commandLine.appendSwitch('enable-features', enableFeatures.join(','))
  // 下列开关用于简化调试与抓包场景：关闭证书校验 / 同源策略 / HTTP 缓存
  app.commandLine.appendSwitch('ignore-certificate-errors') // 忽略证书错误
  app.commandLine.appendSwitch('disable-web-security') // 关闭同源安全策略
  app.commandLine.appendSwitch('disable-http-cache') // 关闭 HTTP 缓存

  /**
   * 禁用部分 Chromium 特性
   *
   * - 关闭 OutOfBlinkCors 以放宽 CORS 限制（配合抓包 / 跨域调试）
   * - 调整 SameSite / CookiesWithoutSameSiteMustBeSecure 等 cookie 策略
   * - 关闭 BlockInsecurePrivateNetworkRequests 方便内部网络调试
   */
  const disableFeatures = [
    'OutOfBlinkCors',
    'SameSiteByDefaultCookies',
    'CookiesWithoutSameSiteMustBeSecure',
    'BlockInsecurePrivateNetworkRequests'
  ]
  app.commandLine.appendSwitch('disable-features', disableFeatures.join(','))
}

/**
 * 在 app ready 之后设置应用生命周期相关的事件与初始化流程
 *
 * 主要内容：
 * - 创建主窗口，并初始化托盘 / 菜单
 * - 注册主进程 IPC 入口
 * - 配置安全 DNS、AppImage deep link、单实例 URL 处理等
 * - 设置窗口激活、全部关闭、二次实例等通用行为
 *
 * 该函数承接 main() 中的基础配置，完成主进程事件的整体 wiring
 */
const setupReady = () => {
  app.whenReady().then(async () => {
    // [Windows] 设置 App User Model ID，确保系统通知 / 任务栏行为正常
    electronApp.setAppUserModelId(import.meta.env.VITE_MAIN_BUNDLE_ID || 'com.mf.faith')

    // 设置 DoH（DNS over HTTPS），提升 DNS 安全性：仅在配置为 HTTPS 地址时开启
    const hostResolver = configManager.dns
    if (isHttp(hostResolver, true)) {
      logger.info(`Using secure dns: ${hostResolver}`)
      app.configureHostResolver({
        secureDnsMode: 'secure',
        secureDnsServers: [hostResolver]
      })
    }

    // 创建主窗口并同步托盘、菜单状态
    const mainWindow = windowService.createMainWindow()

    trayService.updateTray(true)
    menuService.updateMenu(true)

    // 注册所有主进程 IPC 处理逻辑
    registerIpc(mainWindow, app)

    // [Linux / AppImage] 设置 deep link 处理
    await setupAppImageDeepLink()

    if (isDev) {
      // 开发模式下自动安装 Vue Devtools，方便调试渲染进程
      installExtension([VUEJS_DEVTOOLS])
        .then(([...args]) =>
          logger.info(`Added devtool extensions: ${args.map((arg) => arg.name).join(', ')}`)
        )
        .catch((error) => logger.error('An error occurred: ', error))
    }
  })

  // [macOS] 应用激活时的行为：没有窗口则重新创建，有则全部显示
  app.on('activate', function () {
    const windowNames = windowService.getAllNames()
    if (windowNames.length === 0) {
      windowService.createMainWindow()
    } else {
      windowService.showAllWindows()
    }
  })

  // 所有窗口关闭时：非 macOS 直接退出，macOS 保持常驻（符合原生体验）
  app.on('window-all-closed', () => {
    if (!isMacOS) app.quit()
  })

  // [macOS] 已运行状态下的协议唤起处理
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleProtocolUrl(url)
  })

  /**
   * 从命令行参数中解析协议 URL 并交给 ProtocolClient 处理
   *
   * @param args 启动参数列表
   */
  const handleOpenUrl = (args: string[]) => {
    const url = args.find((arg) => arg.startsWith(APP_NAME_PROTOCOL))
    if (url) handleProtocolUrl(url)
  }

  // [Windows/Linux] 进程首次启动时，从命令行参数中处理 deep link URL
  handleOpenUrl(process.argv)

  // 单实例锁触发的二次实例事件处理
  app.on('second-instance', (_event, argv) => {
    windowService.showAllWindows()

    // Protocol handler for Windows/Linux
    // The commandLine is an array of strings where the last item might be the URL
    handleOpenUrl(argv)
  })

  // 为每个新创建的 BrowserWindow 挂载快捷键优化（F12/DevTools 等）
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 统一标记应用正在退出，供窗口服务等模块做差异化处理
  app.on('before-quit', async () => {
    app.isQuitting = true
  })

  // 即将退出时的收尾逻辑：目前只做日志 flush，预留插件/服务清理位置
  app.on('will-quit', async (e: Electron.Event) => {
    e.preventDefault()

    // await filmCmsTerminate()
    // await fastifyService.stop()
    // await pluginService.clean()
    logger.finish()

    app.exit(0)
  })

  // 其余主进程逻辑建议拆分到独立 service / 模块中，在此文件中统一引入
}

/**
 * 应用主入口
 *
 * 顺序：
 * 1. setupEnv：配置进程级环境变量与异常捕获
 * 2. setupApp：配置 Electron 启动参数与 Chromium 特性开关
 * 3. requestSingleInstanceLock：确保应用单实例运行
 * 4. 配置代理、初始化国际化，并调用 setupReady 注册生命周期事件
 */
const main = async () => {
  setupEnv()
  setupApp()

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  } else {
    // await fileStorage.initRequireDir()
    // await dbService.init()
    await proxyManager.configureProxy(configManager.proxy)
    // await fastifyService.start()

    appLocale.init()
    setupReady()

    runAsyncFunction(() => {
      // pluginService.autoLaunch()
    })
  }
}

main()
