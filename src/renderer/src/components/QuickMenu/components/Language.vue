<script setup lang="ts">
import type { ILang } from '@shared/locales'
import { langList } from '@renderer/locales'
import { Languages } from 'lucide-vue-next'
import { computed } from 'vue'

defineProps({
  theme: {
    type: String,
    default: 'auto',
  },
})

const storeSetting = useSettingsStore()
const { t } = useI18n({ useScope: 'global' })

const LANG_OPTIONS = computed(() => [
  { value: 'auto', label: t('common.followSystem') },
  ...langList.value.map(lang => ({ value: lang.value, label: lang.label })),
])
const theme = computed(() => storeSetting.lang)
const currentLang = computed(() => (storeSetting.lang === 'system' ? 'auto' : storeSetting.lang))

const dropdownItems = computed(() => [
  LANG_OPTIONS.value.map(item => ({
    label: item.label,
    icon: currentLang.value === item.value ? 'i-lucide:check' : undefined,
    handle: () => setLanguage(item.value as ILang),
  })),
])

async function setLanguage(lang: ILang) {
  storeSetting.updateConfig({ lang })

  // await putSetting({ key: 'lang', value: lang });
}
</script>

<template>
  <div class="quick-menu__language no-drag-region">
    <FaDropdown :items="dropdownItems" align="center"
      :side-offset="4">
      <FaButton variant="ghost" size="icon">
        <Languages class="size-4" :theme="theme" />
      </FaButton>
    </FaDropdown>
  </div>
</template>

<style lang="less" scoped></style>
