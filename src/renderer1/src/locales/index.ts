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
  legacy: false,
  locale: defaultLang(),
  fallbackLocale,
  messages: importMessages.value,
  globalInjection: true,
})

export const t: Composer['t'] = i18n.global.t

export interface I18nTextProps {
  label?: string
  i18nKey?: string
  i18nParams?: Record<string, unknown> | unknown[]
}

export function resolveI18nText(props: I18nTextProps) {
  if (props.i18nKey) {
    return t(props.i18nKey, props.i18nParams as never)
  }
  return props.label
}

export default i18n
