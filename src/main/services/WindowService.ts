import { join } from 'node:path'
import url from 'node:url'

import { app, BrowserWindow, ipcMain, nativeImage, nativeTheme, shell } from 'electron'
import type { BrowserWindowConstructorOptions } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { merge } from 'es-toolkit'

import { loggerService } from '@logger'
import { appLocale } from '@main/services/AppLocale'
import { contextMenu } from '@main/services/ContextMenu'
import { configManager } from '@main/services/ConfigManager'
import { initSessionUserAgent } from '@main/services/WebviewService'

import { LOG_MODULE } from '@shared/config/logger'
import { WINDOW_NAME } from '@shared/config/windowName'
import { titleBarOverlayDark, titleBarOverlayLight } from '@shared/config/appinfo'
import { isUndefined } from '@shared/modules/validate'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'
import {
  convertUriToStandard,
  ELECTRON_TAG,
  isLocalhostURI,
  UNSAFE_HEADERS
} from '@shared/modules/headers'

import { APP_DATABASE_PATH, APP_FILE_PATH } from '@main/utils/path'
import { isDev, isLinux, isMacOS, isWindows, isPackaged } from '@main/utils/systeminfo'

import iconPath from '../../../build/icon.png?asset'

// 窗口相关日志记录器，统一为窗口管理模块打日志
const logger = loggerService.withContext(LOG_MODULE.APP_WINDOW)
// Linux 平台下的应用图标，其他平台不需要在这里显式指定
const linuxIcon = isLinux ? nativeImage.createFromPath(iconPath) : undefined

/**
 * 窗口管理服务（单例）
 *
 * - 负责统一创建 / 管理主窗口、内置浏览器窗口、抓包窗口等所有 BrowserWindow
 * - 维护 winPool，保存窗口实例与最近崩溃时间，用于容错重启和资源清理
 * - 封装显示 / 隐藏 / 关闭 / 重载等通用窗口操作，屏蔽不同平台的差异
 * - 在 createMainWindow / createBrowserWindow 中注入业务相关配置（webview、窗口样式等）
 * - 在 setupWebRequestHeaders 中统一处理网络请求头，属于业务工具逻辑，并非视频播放相关
 */
export class WindowService {
  private static instance: WindowService | null = null
  private winPool = new Map<string, { window: BrowserWindow | null; lastCrashTime: number }>()

  /**
   * 获取 WindowService 单例实例
   *
   * - 外部模块通过导出的 windowService 使用，无需自行 new
   */
  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService()
    }
    return WindowService.instance
  }

  /**
   * 获取当前已注册的所有窗口名称列表
   *
   * - 名称即 winPool 的 key，例如 WINDOW_NAME.MAIN / WINDOW_NAME.BROWSER 等
   * - 主要用于调试或管理场景（比如遍历输出当前窗口池）
   */
  public getAllNames(): string[] {
    return Array.from(this.winPool.keys())
  }

  /**
   * 获取当前所有有效的 BrowserWindow 实例
   *
   * - 过滤掉已销毁或为 null 的窗口
   * - 常用于批量操作（显示 / 隐藏 / 关闭 / 重载全部窗口）
   */
  public getAllWindows(): BrowserWindow[] {
    return Array.from(this.winPool.values())
      .map((item) => item.window!)
      .filter((win) => win instanceof BrowserWindow)
  }

  /**
   * 通过 BrowserWindow 实例反查其在 winPool 中注册的名称
   *
   * @param mainWindow 目标窗口实例
   * @returns 对应的窗口名称；若未在 winPool 中注册则返回 null
   */
  public getWindowName(mainWindow: BrowserWindow): string | null {
    for (const [name, item] of this.winPool.entries()) {
      if (item.window === mainWindow) {
        return name
      }
    }

    return null
  }

  /**
   * 根据名称或实例获取 BrowserWindow
   *
   * @param window 窗口名称（字符串）或 BrowserWindow 实例
   * @returns 对应的 BrowserWindow；不存在或已销毁则返回 null
   */
  public getWindow(window: string | BrowserWindow): BrowserWindow | null {
    if (typeof window === 'string') {
      if (this.winPool.has(window)) {
        return this.winPool.get(window)?.window as BrowserWindow
      }
    } else if (typeof window === 'object' && window instanceof BrowserWindow) {
      return window
    }

    return null
  }

  /**
   * 显示并激活指定窗口
   *
   * - 若窗口最小化则先恢复
   * - Windows 平台通过透明度 hack 避免动画问题
   * - Linux 平台做特殊处理：先隐藏再显示，确保窗口能被置顶
   * - 所有平台都会在必要时取消全屏、取消静音并调用 focus()
   *
   * 注意：该逻辑是通用的窗口显示行为，与视频播放场景无关
   */
  public showWindow(window: string | BrowserWindow) {
    const mainWindow = this.getWindow(window)

    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    if (isWindows) {
      mainWindow.setOpacity(1)
    }

    /**
     * [Linux] Special handling for window activation
     * When the window is visible but covered by other windows, simply calling show() and focus()
     * is not enough to bring it to the front. We need to hide it first, then show it again.
     * This mimics the "close to tray and reopen" behavior which works correctly.
     */
    if (isLinux && mainWindow.isVisible() && !mainWindow.isFocused()) {
      mainWindow.hide()
      setImmediate(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
        }
      })
      return
    }

    /**
     * About setVisibleOnAllWorkspaces
     *
     * [macOS] Known Issue
     *  setVisibleOnAllWorkspaces true/false will NOT bring window to current desktop in Mac (works fine with Windows)
     *  AppleScript may be a solution, but it's not worth
     *
     * [Linux] Known Issue
     *  setVisibleOnAllWorkspaces In Linux environments (especially KDE Wayland) this can cause windows to go into a "false popup" state
     */
    if (!isLinux) {
      mainWindow.setVisibleOnAllWorkspaces(true)
    }

    /**
     * [macOS] After being closed in fullscreen, the fullscreen behavior will become strange when window shows again
     * So we need to set it to FALSE explicitly.
     * althougle other platforms don't have the issue, but it's a good practice to do so
     *
     *  Check if window is visible to prevent interrupting fullscreen state when clicking dock icon
     */
    if (mainWindow.isFullScreen() && !mainWindow.isVisible()) {
      mainWindow.setFullScreen(false)
    }

    mainWindow.webContents.setAudioMuted(false)
    mainWindow.show()
    mainWindow.focus()

    if (!isLinux) {
      mainWindow.setVisibleOnAllWorkspaces(false)
    }
  }

  /**
   * 显示所有已注册窗口
   *
   * - 内部遍历 winPool，对每个窗口调用 showWindow
   */
  public showAllWindows() {
    const windows = this.getAllWindows()
    windows.forEach((win) => this.showWindow(win))
  }

  /**
   * 隐藏指定窗口
   *
   * - 会将 webContents 置为静音，避免隐藏后仍有声音播放
   * - Windows：通过设置透明度并最小化来规避动画与焦点问题
   * - macOS：同时隐藏 App，模拟关闭到 Dock 的效果
   * - Linux：直接调用 hide()
   */
  public hideWindow(window: string | BrowserWindow) {
    const mainWindow = this.getWindow(window)

    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    mainWindow.webContents.setAudioMuted(true)

    // [macOs/Windows] hacky fix
    // previous window(not self-app) should be focused again after miniWindow hide
    // this workaround is to make previous window focused again after miniWindow hide
    if (isWindows) {
      mainWindow.setOpacity(0) // don't show the minimizing animation
      mainWindow.minimize()
      return
    } else if (isMacOS) {
      mainWindow.hide()
      app.hide()
      return
    }

    mainWindow.hide()
  }

  /**
   * 隐藏所有窗口
   *
   * - 内部遍历 winPool，对每个窗口调用 hideWindow
   */
  public hideAllWindows() {
    const windows = this.getAllWindows()
    windows.forEach((win) => this.hideWindow(win))
  }

  /**
   * 切换单个窗口的显示 / 隐藏状态
   *
   * - 若当前可见则调用 hideWindow，反之调用 showWindow
   * - 对全屏状态有额外保护逻辑（注释中有说明）
   */
  public toggleWindow(window: string | BrowserWindow) {
    const mainWindow = this.getWindow(window)

    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    // should not toggle main window when in full screen
    // but if the main window is close to tray when it's in full screen, we can show it again
    // (it's a bug in macos, because we can close the window when it's in full screen, and the state will be remained)
    // if (mainWindow?.isFullScreen() && mainWindow.isVisible()) {
    //   return;
    // }

    mainWindow.isVisible() ? this.hideWindow(mainWindow) : this.showWindow(mainWindow)
  }

  /**
   * 统一切换所有窗口的显示 / 隐藏状态
   *
   * - 只要有任意一个窗口可见，就隐藏全部；否则显示全部
   */
  public toggleAllWindows() {
    const windows = this.getAllWindows()
    const isVisable = windows.some((win) => win.isVisible())

    windows.forEach((win) => {
      isVisable ? this.hideWindow(win) : this.showWindow(win)
    })
  }

  /**
   * 关闭指定窗口并从 winPool 中移除
   *
   * - 优先调用 close()，如遇异常则强制 destroy()
   * - 关闭后会删除 winPool 中对应条目，避免内存泄漏
   */
  public closeWindow(window: string | BrowserWindow) {
    const mainWindow = this.getWindow(window)
    const mainWindowName = this.getWindowName(mainWindow!)

    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.close()
      } catch {
        mainWindow.destroy()
      }
    }

    if (mainWindowName) {
      this.winPool.delete(mainWindowName)
    }
  }

  /**
   * 关闭所有窗口并清空 winPool
   *
   * - 通过 closeWindow 逐一关闭，随后清空窗口池
   */
  public closeAllWindows = () => {
    const windows = this.getAllWindows()
    windows.forEach((win) => this.closeWindow(win))
    this.winPool.clear()
  }

  /**
   * 重新加载指定窗口内容
   *
   * @param window 目标窗口
   * @param force  是否忽略缓存强制重载
   */
  public reloadWindow(window: string | BrowserWindow, force: boolean = false) {
    const mainWindow = this.getWindow(window)

    if (mainWindow && !mainWindow.isDestroyed()) {
      force ? mainWindow.webContents.reloadIgnoringCache() : mainWindow.webContents.reload()
    }
  }

  /**
   * 重新加载所有窗口内容
   *
   * @param force 是否忽略缓存强制重载
   */
  public reloadAllWindows(force: boolean = false) {
    const windows = this.getAllWindows()
    windows.forEach((win) => this.reloadWindow(win, force))
  }

  /**
   * 安全关闭窗口：先通知渲染进程，再销毁窗口
   *
   * - 通过 IPC_CHANNEL.WINDOW_DESTROY 给渲染进程发送「准备销毁」事件
   * - 渲染进程在完成清理后回发 WINDOW_DESTROY_RELAY 作为确认
   * - 若指定时间（800ms）内未收到确认，主进程会兜底直接销毁窗口
   *
   * 该逻辑是典型的窗口生命周期管理，与视频播放业务无关
   */
  private safeClose(mainWindow: BrowserWindow) {
    const finish = () => {
      ipcMain.removeListener(IPC_CHANNEL.WINDOW_DESTROY_RELAY, onAck)
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy()
    }

    const onAck = () => {
      if (timer) clearTimeout(timer)
      finish()
    }

    const timer = setTimeout(() => onAck(), 800)

    ipcMain.once(IPC_CHANNEL.WINDOW_DESTROY_RELAY, onAck)
    mainWindow.webContents.send(IPC_CHANNEL.WINDOW_DESTROY)
  }

  /**
   * 监听渲染进程退出事件并做容错处理
   *
   * - 当 render-process-gone 触发时，记录崩溃时间
   * - 如果两次崩溃间隔 > 1 分钟，则尝试重载当前窗口
   * - 否则视为持续性错误，直接退出整个应用
   */
  private setupWindowMonitor(mainWindow: BrowserWindow) {
    mainWindow.webContents.on('render-process-gone', (_, details) => {
      logger.error(`Renderer process crashed with: ${JSON.stringify(details)}`)
      const currentTime = Date.now()
      const mainWindowName = this.getWindowName(mainWindow)!
      const lastCrashTime = this.winPool.get(mainWindowName)?.lastCrashTime || 0
      this.winPool.set(mainWindowName, { window: mainWindow, lastCrashTime })
      if (currentTime - lastCrashTime > 60 * 1000) {
        // If greater than 1 minute, restart the rendering process
        mainWindow.webContents.reload()
      } else {
        // If less than 1 minute, exit the application
        app.exit(1)
      }
    })
  }

  /**
   * 为当前窗口及所有 webview/webContents 注册统一右键菜单
   *
   * - 使用 ContextMenu 服务为主窗口绑定上下文菜单
   * - 通过 app 的 web-contents-created 事件，为后续创建的 webContents 同样绑定菜单
   *
   * 注意：这里依赖的是通用的 ContextMenu 服务，与视频相关逻辑无关
   */
  private setupContextMenu(mainWindow: BrowserWindow) {
    contextMenu.contextMenu(mainWindow.webContents)
    // setup context menu for all webviews
    app.on('web-contents-created', (_, webContents) => {
      contextMenu.contextMenu(webContents)
    })

    // Dangerous API
    if (isDev) {
      // mainWindow.webContents.on('will-attach-webview', (_, webPreferences) => {
      //   webPreferences.preload = join(import.meta.dirname, '../preload/index.js');
      // });
    }
  }

  /**
   * 绑定与窗口尺寸 / 状态变更相关的事件
   *
   * - ready-to-show：首次展示窗口时做一些平台兼容处理
   * - will-resize / resize：在窗口尺寸变化时同步 zoomFactor，并通知渲染进程窗口大小
   * - restore：窗口从最小化恢复时重新设置 zoomFactor
   * - maximize / unmaximize / enter-full-screen / leave-full-screen：
   *   通过 IPC 通知渲染进程更新 UI 状态（最大化 / 全屏图标等）
   */
  private setupWindowEvents(mainWindow: BrowserWindow) {
    mainWindow.once('ready-to-show', () => {
      // mainWindow.webContents.setZoomFactor(configManager.zoom);

      // [mac]hacky-fix: miniWindow set visibleOnFullScreen:true will cause dock icon disappeared
      app.dock?.show()
      mainWindow.show()
    })

    // set the zoom factor again when the window is going to resize
    //
    // this is a workaround for the known bug that
    // the zoom factor is reset to cached value when window is resized after routing to other page
    // see: https://github.com/electron/electron/issues/10572
    //
    mainWindow.on('will-resize', () => {
      mainWindow.webContents.setZoomFactor(configManager.zoom)
      mainWindow.webContents.send(IPC_CHANNEL.WINDOW_SIZE, mainWindow.getSize())
    })

    // set the zoom factor again when the window is going to restore
    // minimize and restore will cause zoom reset
    mainWindow.on('restore', () => {
      mainWindow.webContents.setZoomFactor(configManager.zoom)
    })

    // ARCH: as `will-resize` is only for Win & Mac,
    // linux has the same problem, use `resize` listener instead
    // but `resize` will fliker the ui
    if (isLinux) {
      mainWindow.on('resize', () => {
        mainWindow.webContents.setZoomFactor(configManager.zoom)
        mainWindow.webContents.send(IPC_CHANNEL.WINDOW_SIZE, mainWindow.getSize())
      })
    }

    mainWindow.on('maximize', () => {
      mainWindow.webContents.send(IPC_CHANNEL.WINDOW_MAX, mainWindow.isMaximized())
    })

    mainWindow.on('unmaximize', () => {
      mainWindow.webContents.send(IPC_CHANNEL.WINDOW_MAX, mainWindow.isMaximized())
    })

    mainWindow.on('enter-full-screen', () => {
      mainWindow.webContents.send(IPC_CHANNEL.WINDOW_FULLSCREEN, mainWindow.isFullScreen())
    })

    mainWindow.on('leave-full-screen', () => {
      mainWindow.webContents.send(IPC_CHANNEL.WINDOW_FULLSCREEN, mainWindow.isFullScreen())
    })
  }

  /**
   * 针对 webContents 的导航与新窗口打开行为做统一处理
   *
   * - will-navigate：拦截主窗口内部导航，除开发环境地址外统一交给外部浏览器
   * - setWindowOpenHandler：
   *   - 对 GitHub / catni / pagespy 等 OAuth/登录地址允许新开窗口
   *   - 对 http://file/ 前缀的本地文件，使用 shell.openPath 打开
   *   - 其余地址通过内置「Browser」窗口打开，避免在主窗口中失控跳转
   *
   * 这一块属于业务工具中的浏览器跳转逻辑，不涉及视频播放场景
   */
  private setupWebContentsHandlers(mainWindow: BrowserWindow) {
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.includes('localhost:5173')) {
        return
      }

      event.preventDefault()
      shell.openExternal(url)
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      const { url } = details

      const oauthProviderUrls = ['github.com', 'catni.cn', 'pagespy.org']

      if (oauthProviderUrls.some((link) => url.includes(link))) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            webPreferences: {
              partition: 'persist:webview'
            }
          }
        }
      }

      if (url.includes('http://file/')) {
        const fileName = url.replace('http://file/', '')
        const filePath = `${APP_FILE_PATH}/${fileName}`
        shell.openPath(filePath).catch((error) => logger.error('Failed to open file:', error))
      } else {
        // mainWindow.webContents.send(IPC_CHANNEL.URI_BLOCKED, url);
        // shell.openExternal(details.url);

        let window = this.getWindow(WINDOW_NAME.BROWSER)
        if (window && !window.isDestroyed()) {
          this.showWindow(window)
          window.webContents.send(IPC_CHANNEL.BROWSER_NAVIGATE, url)
        } else {
          window = this.createBrowserWindow()
          window.webContents.once('did-finish-load', () => {
            setTimeout(() => {
              window!.webContents.send(IPC_CHANNEL.BROWSER_NAVIGATE, url)
            }, 1000)
          })
        }
      }

      return { action: 'deny' }
    })

    this.setupWebRequestHeaders(mainWindow)
  }

  /**
   * 统一处理所有网络请求的请求头与响应头
   *
   * - onBeforeRequest：根据自定义协议转换 URL，记录需要重写 Header 的请求
   * - onBeforeSendHeaders：合并自定义 Header，处理 UA / Accept-Language 等字段
   * - onHeadersReceived：放宽 X-Frame-Options / CSP，便于在内置 webview 中展示页面
   *   同时强制将 Set-Cookie 标记为 SameSite=None; Secure
   *
   * 注意：
   * - 这里的逻辑是 HTTP 抓包 / 调试类工具常见的处理方式
   * - 没有与音视频播放相关的特殊 header（如 Range、DRM、HLS 等）
   */
  private setupWebRequestHeaders(mainWindow: BrowserWindow) {
    const reqMap = new Map<number, { redirect: string; headers: Record<string, any> }>()

    mainWindow.webContents.session.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const { id, url } = details

        // Block devtools detector requests
        if (['devtools-detector', 'disable-devtool'].some((f) => url.includes(f))) {
          callback({ cancel: true })
          return
        }

        const { redirect, headers } = convertUriToStandard(url)
        if (headers && Object.keys(headers).length && url !== redirect) {
          reqMap.set(id, { redirect, headers })
          callback({ cancel: false, redirectURL: redirect })
        } else {
          callback({ cancel: false })
        }
      }
    )

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      const { id, requestHeaders, url } = details
      const customHeaders = reqMap.has(id) ? reqMap.get(id)!.headers : {}
      if (reqMap.has(id)) reqMap.delete(id)

      UNSAFE_HEADERS.forEach((key) => {
        requestHeaders[key] = !isUndefined(customHeaders[key])
          ? customHeaders[key]
          : !isUndefined(requestHeaders[`${ELECTRON_TAG}-${key}`])
            ? requestHeaders[`${ELECTRON_TAG}-${key}`]
            : requestHeaders[key]
        delete requestHeaders[`${ELECTRON_TAG}-${key}`]

        if (key === 'User-Agent' && requestHeaders[key]?.includes(ELECTRON_TAG)) {
          requestHeaders[key] = configManager.ua
        }

        if (isUndefined(requestHeaders[key]) || isLocalhostURI(requestHeaders[key])) {
          delete requestHeaders[key]
        }
      })

      // Accept-Language
      const language = appLocale.defaultLang()
      requestHeaders['Accept-Language'] = `${language}, en;q=0.9, *;q=0.5`

      // Custom Header
      if (url.includes('doubanio.com') && !requestHeaders.Referer) {
        requestHeaders.Referer = 'https://api.douban.com/'
      }

      // Handle redirect mode
      if (requestHeaders.Redirect === 'manual')
        reqMap.set(id, { redirect: url, headers: requestHeaders })

      callback({ requestHeaders })
    })

    mainWindow.webContents.session.webRequest.onHeadersReceived(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const { id, responseHeaders } = details

        // Frame
        ;['X-Frame-Options', 'x-frame-options'].forEach((key) => delete responseHeaders?.[key])

        // Content-Security-Policy
        ;['Content-Security-Policy', 'content-security-policy'].forEach(
          (key) => delete responseHeaders?.[key]
        )

        // Set-Cookie
        ;['Set-Cookie', 'set-cookie'].forEach((key) => {
          if (responseHeaders?.[key]) {
            responseHeaders[key] = responseHeaders![key].map((ck) => `${ck}; SameSite=None; Secure`)
          }
        })

        if (reqMap.has(id)) reqMap.delete(id)

        callback({ cancel: false, responseHeaders })
      }
    )
  }

  // see: https://github.com/electron/electron/issues/42055#issuecomment-2449365647
  /**
   * 调整 DevTools 的字体与样式（仅在 Windows + 开发环境下生效）
   *
   * - 通过在 devtools-opened 时向 DevTools DOM 注入一段 CSS
   * - 将源代码字体统一改为 consolas，并缩小字号，提升可读性
   * - 对自动补全弹窗的字体做额外覆盖
   */
  private replaceDevtoolsFont = (mainWindow: BrowserWindow) => {
    // only for windows and dev, don't do this in production to avoid performance issues
    if (isWindows && isDev) {
      mainWindow.webContents.on('devtools-opened', () => {
        const css = `
          :root {
            --sys-color-base: var(--ref-palette-neutral100);
            --source-code-font-family: consolas !important;
            --source-code-font-size: 12px;
            --monospace-font-family: consolas !important;
            --monospace-font-size: 12px;
            --default-font-family: system-ui, sans-serif;
            --default-font-size: 12px;
            --ref-palette-neutral99: #ffffffff;
          }
          .theme-with-dark-background {
            --sys-color-base: var(--ref-palette-secondary25);
          }
          body {
            --default-font-family: system-ui, sans-serif;
          }
      `
        mainWindow.webContents.devToolsWebContents?.executeJavaScript(`
          const overriddenStyle = document.createElement('style');
          overriddenStyle.innerHTML = '${css.replaceAll('\n', ' ')}';
          document.body.append(overriddenStyle);
          document.querySelectorAll('.platform-windows').forEach(el => el.classList.remove('platform-windows'));
          addStyleToAutoComplete();
          const observer = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
              if (mutation.type === 'childList') {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                  const item = mutation.addedNodes[i];
                  if (item.classList.contains('editor-tooltip-host')) {
                      addStyleToAutoComplete();
                  }
                }
              }
            }
          });
          observer.observe(document.body, {childList: true});
          function addStyleToAutoComplete() {
            document.querySelectorAll('.editor-tooltip-host').forEach(element => {
              if (element.shadowRoot.querySelectorAll('[data-key="overridden-dev-tools-font"]').length === 0) {
                const overriddenStyle = document.createElement('style');
                overriddenStyle.setAttribute('data-key', 'overridden-dev-tools-font');
                overriddenStyle.innerHTML = '.cm-tooltip-autocomplete ul[role=listbox] {font-family: consolas !important;}';
                element.shadowRoot.append(overriddenStyle);
              }
            });
          }
      `)
      })
    }
  }

  /**
   * 创建或复用一个基础窗口
   *
   * - 若同名窗口已存在且未销毁，则直接激活并返回（复用模式）
   * - 若不存在，则创建新的 BrowserWindow，并应用通用配置与各类事件绑定
   *
   * @param windowName 窗口在 winPool 中的名称
   * @param options    额外的窗口配置（会与默认配置 merge）
   */
  public createWindow(
    windowName: string,
    options?: BrowserWindowConstructorOptions
  ): BrowserWindow {
    let mainWindow = this.getWindow(windowName)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
      return mainWindow
    }

    // 默认 BrowserWindow 配置，偏向业务调试工具场景：
    // - 关闭 webSecurity 以便跨域调试
    // - 禁用 sandbox、开启 contextIsolation 以兼顾安全与可用性
    // - zoomFactor 由 ConfigManager 统一管理，方便全局缩放
    mainWindow = new BrowserWindow(
      merge(
        {
          width: 960,
          height: 600,
          show: false,
          autoHideMenuBar: true,
          transparent: false,
          ...(isLinux ? { icon: linuxIcon } : {}),
          webPreferences: {
            allowRunningInsecureContent: true,
            backgroundThrottling: false,
            contextIsolation: true,
            nodeIntegration: false,
            preload: join(import.meta.dirname, '../preload/index.js'),
            sandbox: false,
            spellcheck: false,
            webSecurity: false,
            zoomFactor: configManager.zoom
          }
        },
        options || {}
      )
    )

    // 开发阶段调整 DevTools 字体、注册右键菜单与崩溃监控
    this.replaceDevtoolsFont(mainWindow)
    this.setupContextMenu(mainWindow)
    this.setupWindowMonitor(mainWindow)

    mainWindow.on('closed', () => {
      this.winPool.delete(windowName)

      if (app.isQuitting && this.getAllWindows().length === 0) {
        app.quit()
      }
    })

    this.winPool.set(windowName, { window: mainWindow, lastCrashTime: 0 })

    return mainWindow
  }

  /**
   * 创建主窗口
   *
   * - 使用 electron-window-state 持久化窗口大小与位置
   * - Windows / Linux 使用无边框窗口，由前端实现自定义标题栏
   * - macOS 使用原生标题栏并配置 titleBarOverlay
   * - 开启 webviewTag，便于在主界面中嵌入多个 webview（业务面板 / 调试面板）
   *
   * 这里的配置偏向业务工具类应用，并非视频播放窗口的专用配置
   */
  public createMainWindow(): BrowserWindow {
    const mainWindowState = windowStateKeeper({
      path: APP_DATABASE_PATH,
      file: `${WINDOW_NAME.MAIN}-window-state.json`,
      defaultWidth: 1000,
      defaultHeight: 640,
      fullScreen: false,
      maximize: false
    })

    const mainWindow = this.createWindow(WINDOW_NAME.MAIN, {
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 1000,
      minHeight: 640,
      show: false,
      autoHideMenuBar: true,
      transparent: false,
      vibrancy: 'sidebar',
      visualEffectState: 'active',
      // For Windows and Linux, we use frameless window with custom controls
      // For Mac, we keep the native title bar style
      ...(isMacOS
        ? {
            titleBarStyle: 'hidden',
            titleBarOverlay: nativeTheme.shouldUseDarkColors
              ? titleBarOverlayDark
              : titleBarOverlayLight,
            trafficLightPosition: { x: 8, y: 14 }
          }
        : {
            frame: false // Frameless window for Windows and Linux
          }),
      backgroundColor: isMacOS
        ? undefined
        : nativeTheme.shouldUseDarkColors
          ? '#181818'
          : '#FFFFFF',
      darkTheme: nativeTheme.shouldUseDarkColors,
      webPreferences: {
        webviewTag: true
      }
    })

    mainWindowState.manage(mainWindow)

    // 主窗口的生命周期、尺寸事件与网络请求头处理均在此处挂载
    this.setupWindowEvents(mainWindow)
    this.setupWebContentsHandlers(mainWindow)

    // 开发模式走 Vite dev server，生产环境加载打包后的 index.html
    if (!isPackaged && process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      mainWindow.loadFile(join(import.meta.dirname, '../renderer/index.html'))
    }

    // 初始化 webview 的 User-Agent，后续所有 webview 请求都会使用统一 UA
    initSessionUserAgent()

    return mainWindow
  }

  /**
   * 创建内置浏览器窗口
   *
   * - 与主窗口类似，同样使用 windowStateKeeper 持久化大小与位置
   * - 主要用于承载外部链接或内置浏览器页面（例如 BROWSER 路由）
   * - 关闭事件会走 safeClose，先通知渲染进程做清理再销毁窗口
   */
  public createBrowserWindow(): BrowserWindow {
    const mainWindowState = windowStateKeeper({
      path: APP_DATABASE_PATH,
      file: `${WINDOW_NAME.BROWSER}-window-state.json`,
      defaultWidth: 1000,
      defaultHeight: 640,
      fullScreen: false,
      maximize: false
    })

    const mainWindow = this.createWindow(WINDOW_NAME.BROWSER, {
      minWidth: 1024,
      minHeight: 740,
      show: false,
      autoHideMenuBar: true,
      transparent: false,
      vibrancy: 'sidebar',
      visualEffectState: 'active',
      // For Windows and Linux, we use frameless window with custom controls
      // For Mac, we keep the native title bar style
      ...(isMacOS
        ? {
            titleBarStyle: 'hidden',
            titleBarOverlay: nativeTheme.shouldUseDarkColors
              ? titleBarOverlayDark
              : titleBarOverlayLight,
            trafficLightPosition: { x: 8, y: 14 }
          }
        : {
            frame: false // Frameless window for Windows and Linux
          }),
      backgroundColor: isMacOS
        ? undefined
        : nativeTheme.shouldUseDarkColors
          ? '#181818'
          : '#FFFFFF',
      darkTheme: nativeTheme.shouldUseDarkColors,
      webPreferences: {
        webviewTag: true
      }
    })

    mainWindowState.manage(mainWindow)

    // 浏览器窗口同样需要通用的事件与网络请求处理
    this.setupWindowEvents(mainWindow)
    this.setupWebContentsHandlers(mainWindow)

    // 拦截默认 close 行为，改为安全关闭流程，避免直接 destroy 导致渲染端未清理
    mainWindow.on('close', (event: Electron.Event) => {
      event.preventDefault()
      this.safeClose(mainWindow)
    })

    // 为浏览器窗口指定默认加载的 hash 路由为 #/browser
    if (!isPackaged && process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/browser`)
    } else {
      mainWindow.loadURL(
        url.format({
          pathname: join(import.meta.dirname, '../renderer/index.html'),
          protocol: 'file:',
          slashes: true,
          hash: 'browser'
        })
      )
    }

    return mainWindow
  }

  /**
   * 创建抓包窗口（Sniffer）
   *
   * - 窗口名称为 `${WINDOW_NAME.SNIFFER}-${uuid}`，可同时存在多个抓包会话
   * - 仅在 debug 模式下自动展示窗口并设置 zoomFactor，便于调试
   *
   * 该窗口属于抓包 / 调试类业务，与视频播放无关
   */
  public createSnifferWindow(uuid: string): BrowserWindow {
    const mainWindow = this.createWindow(`${WINDOW_NAME.SNIFFER}-${uuid}`, {})

    const debug = configManager.debug

    if (debug) {
      mainWindow.once('ready-to-show', () => {
        mainWindow.webContents.setZoomFactor(configManager.zoom)

        // [mac]hacky-fix: miniWindow set visibleOnFullScreen:true will cause dock icon disappeared
        app.dock?.show()
        mainWindow.show()
      })
    }

    return mainWindow
  }
}

export const windowService = WindowService.getInstance()
