<script setup lang="ts">
import Language from './components/Language.vue'

defineOptions({
  name: 'QuickMenu',
})

const props = defineProps({
  filter: {
    type: Array,
    default: () => [],
  },
})

function isFilter(name: string) {
  return props.filter.includes(name)
}
</script>

<template>
  <div class="quick-menu">
    <Language v-if="!isFilter('language')" class="system-function" />
  </div>
</template>

<style lang="less" scoped></style>
