import { computed, type App, watch } from 'vue'

import { cloneDeep } from 'es-toolkit'
import { createI18n } from 'vue-i18n'
import type { ILangWithoutSystem } from '@shared/locales'
import { defaultLocale, fallbackLocale, lang, langCode, messages } from '@shared/locales'
import { usePreferredLanguages } from '@vueuse/core'

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
    catch { }
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

const i18n = createI18n({
  legacy: false,
  flatJson: true,
  fallbackLocale,
  messages: importMessages.value,
  missingWarn: false,
  fallbackWarn: false,
})

function install(app: App) {
  const settingsStore = useSettingsStore()
  i18n.global.locale.value = settingsStore.lang
  watch(
    () => settingsStore.lang,
    (val) => {
      i18n.global.locale.value = val
    },
  )
  app.use(i18n)
}

function getLocales() {
  return cloneDeep(messages())
}

const localesName: Record<string, any> = {}
const allMessages = messages()
for (const key in allMessages) {
  switch (key) {
    case 'zh-CN':
      localesName[key] = '中文(简体)'
      break
    case 'zh-TW':
      localesName[key] = '中文(繁體)'
      break
    case 'en-US':
      localesName[key] = 'English'
      break
    default:
      localesName[key] = key
  }
}

// 用于路由 meta 配置，方便在 VSCode I18n Ally 插件进行显示，无实际作用
function $t(key: string) {
  return key
}

export default { install }

export {
  $t,
  getLocales,
  i18n,
  localesName,
}
