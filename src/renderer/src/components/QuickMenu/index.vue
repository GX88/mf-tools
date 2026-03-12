<script setup lang="ts">
import Language from '@renderer/layouts/components/Topbar/Toolbar/I18n/index.vue'

defineOptions({
  name: 'QuickMenu',
})

const props = defineProps({
  filter: {
    type: Array,
    default: () => [],
  },
  theme: {
    type: String,
    default: 'auto',
  },
})

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="quick-menu">
    <div class="no-drag-region">
      <Language v-if="!settingsStore.settings.toolbar.i18n"
        tag="span" />
    </div>
  </div>
</template>

<style lang="less" scoped></style>
