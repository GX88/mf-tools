import type { ILang, ILangWithoutSystem } from '@shared/locales'
import type { InitOptions } from 'i18next'
import { loggerService } from '@logger'
import { configManager } from '@main/services/ConfigManager'
import { LOG_MODULE } from '@shared/config/logger'
import { defaultLocale, fallbackLocale, langCode, messages } from '@shared/locales'
import { app } from 'electron'
import i18n, { changeLanguage, init as createI18n } from 'i18next'

const logger = loggerService.withContext(LOG_MODULE.APP_LOCALE)

/**
 * 应用国际化与语言环境管理服务（单例）
 *
 * - 基于 i18next 初始化主进程的多语言支持
 * - 根据配置或系统语言自动推导默认语言（defaultLang）
 * - 提供运行时切换语言的能力（changeLocale）
 * - 对外暴露 isChinaMainland 用于区分中国大陆与其他地区
 */
export class AppLocale {
  private static instance: AppLocale

  /**
   * 构造函数
   *
   * - 当前实现中不做额外初始化工作
   * - 预留后续如注入配置、扩展依赖的能力
   */
  constructor() {}

  /**
   * 获取 AppLocale 单例实例
   *
   * - 外部通过导出的 appLocale 使用，一般无需直接调用该方法
   */
  public static getInstance(): AppLocale {
    if (!AppLocale.instance) {
      AppLocale.instance = new AppLocale()
    }
    return AppLocale.instance
  }

  /**
   * 初始化 i18n 资源与配置
   *
   * - 从 shared 层的 messages() 动态构造 i18next 所需的 resources
   * - 根据当前默认语言（defaultLang）和 fallbackLocale 完成配置
   * - 注册 missingKeyHandler，在缺失文案时输出警告日志，便于排查
   */
  public async init(): Promise<void> {
    const resources = Object.fromEntries(
      Object.entries(messages()).map(([k, v]) => [k, { translation: v }]),
    ) as InitOptions['resources']

    await createI18n({
      resources,
      lng: this.defaultLang(),
      fallbackLng: fallbackLocale,
      interpolation: {
        escapeValue: false,
      },
      saveMissing: true,
      missingKeyHandler: (_lngs: readonly string[], _ns: string, key: string) => {
        logger.warn(`Missing key: ${key}`)
      },
    })
  }

  /**
   * 切换当前应用语言
   *
   * @param value 目标语言（可为 'system'，此时会回落到 defaultLang 逻辑）
   *
   * - 若与当前语言相同则直接返回
   * - 底层调用 i18next.changeLanguage，并在成功/失败时记录日志
   */
  public changeLocale(value: ILang): void {
    const lang = this.defaultLang(value)

    if (i18n.language === lang) {
      return
    }

    changeLanguage(lang, (error) => {
      if (error) {
        return logger.error(`Failed to change language: ${error.message}`)
      }
      logger.info(`Language changed to ${lang}`)
    })
  }

  /**
   * 计算应用的默认语言（去除 'system' 概念后的真实语言）
   *
   * @param value 可选的显式语言配置；不传时优先读取 ConfigManager 中的 lang
   * @returns 一个合法的 ILangWithoutSystem，例如 'zh-CN' / 'en-US'
   *
   * 逻辑说明：
   * - 若配置为 'system' 或未设置，则从 app.getLocale() 推导
   * - 对中文语言做细分：
   *   - Windows/macOS: 支持 zh-hans / zh-hant 形式
   *   - Linux: zh-XY 形式，根据国家码（CN/SG/MY）区分简体 / 繁体
   * - 若推导出的语言不在 langCode 列表中，则回落到 defaultLocale
   */
  public defaultLang(value?: ILang): ILangWithoutSystem {
    let lang = value

    if (!lang) {
      lang = configManager.lang
    }
    if (!lang || lang === 'system') {
      const appLocale = app.getLocale()
      if (appLocale.startsWith('zh')) {
        const region = appLocale.split('-')[1]

        // On Windows and macOS, Chinese languages returned by
        // app.getPreferredSystemLanguages() start with zh-hans
        // for Simplified Chinese or zh-hant for Traditional Chinese,
        // so we can easily determine whether to use Simplified or Traditional.
        // However, on Linux, Chinese languages returned by that same API
        // are of the form zh-XY, where XY is a country code.
        // For China (CN), Singapore (SG), and Malaysia (MY)
        // country codes, assume they use Simplified Chinese.
        // For other cases, assume they use Traditional.
        if (['hans', 'cn', 'sg', 'my'].includes(region.toLocaleLowerCase())) {
          lang = 'zh-CN'
        }

        lang = 'zh-TW'
      }

      lang = appLocale as ILangWithoutSystem
    }

    if (!langCode.includes(lang)) {
      lang = defaultLocale
    }

    return lang
  }

  /**
   * 判断当前默认语言是否为中国大陆地区（简体中文）
   *
   * - 通过 defaultLang() 推导出的语言是否为 'zh-CN' 来判断
   * - 供业务层做区域差异化配置时使用（如接口域名、内容开关等）
   */
  public isChinaMainland(): boolean {
    const lang = this.defaultLang()
    return lang === 'zh-CN'
  }
}

export const appLocale = AppLocale.getInstance()

export { t } from 'i18next'
