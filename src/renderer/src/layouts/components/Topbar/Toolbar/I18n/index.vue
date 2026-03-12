<script setup lang="ts">
import { localesName } from '@renderer/locales'

defineOptions({
  name: 'I18n',
})

const settingsStore = useSettingsStore()
const { t } = useI18n({ useScope: 'global' })

const langItems = computed(() => {
  const items = Object.keys(localesName).map((item: any) => ({
    label: localesName[item],
    disabled: settingsStore.lang === item && settingsStore.settings.app.defaultLang !== 'system',
    handle: () => settingsStore.setDefaultLang(item),
  }))

  items.unshift({
    label: t('common.followSystem'),
    disabled: !settingsStore.settings.app.defaultLang || settingsStore.settings.app.defaultLang === 'system',
    handle: () => settingsStore.setDefaultLang('system'),
  })

  return items
})

const isAnimating = ref(false)

watch(() => settingsStore.lang, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isAnimating.value = true
  }
})
</script>

<template>
  <FaDropdown :items="[langItems]">
    <FaButton variant="ghost" size="icon" class="size-9"
      :class="{ animation: isAnimating }"
      @animationend="isAnimating = false">
      <FaIcon name="i-ri:translate" class="size-4" />
    </FaButton>
  </FaDropdown>
</template>

<style scoped>
.animation {
  transform-origin: center top;
  animation: animation 1s;
}

@keyframes animation {
  0% {
    transform: rotateY(0deg);
  }

  100% {
    transform: rotateY(360deg);
  }
}
</style>
