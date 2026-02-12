import type { ILangWithoutSystem } from '@shared/locales'
import type { Composer } from 'vue-i18n'
import { defaultLocale, fallbackLocale, lang, langCode, messages } from '@shared/locales'
import { usePreferredLanguages } from '@vueuse/core'
import { computed } from 'vue'
import { createI18n } from 'vue-i18n'

const importMessages = computed(() => messages())

export { langCode } from '@shared/locales'
export const langList = computed(() => lang())

export function defaultLang(value?: ILangWithoutSystem | 'system'): ILangWithoutSystem {
  let lang = value

  if (!lang) {
    try {
      const store = localStorage.getItem('setting')
      if (store) {
        const parsed = JSON.parse(store)
        lang = parsed.lang
      }
    }
    catch {}
  }

  if (!lang || lang === 'system') {
    const languages = usePreferredLanguages()
    const preferred = languages.value[0]
    lang = preferred as ILangWithoutSystem
  }

  if (!langCode.includes(lang as ILangWithoutSystem)) {
    lang = defaultLocale
  }

  return lang as ILangWithoutSystem
}

export const i18n = createI18n({
  legacy: false, // 关闭兼容模式
  locale: defaultLang(), // 默认语言
  fallbackLocale, // 回退语言
  messages: importMessages.value, // 语言消息
  globalInjection: true, // 全局注入
})

export const t: Composer['t'] = i18n.global.t

export default i18n
