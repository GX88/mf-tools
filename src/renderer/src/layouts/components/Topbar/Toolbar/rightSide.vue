<script setup lang="ts">
import { useSlots } from '@renderer/slots'
import Tools from './tools.vue'

defineOptions({
  name: 'ToolbarRightSide',
})
</script>

<template>
  <div class="flex items-center">
    <Tools mode="right-side" />
    <component :is="useSlots('toolbar-end')" />
  </div>
</template>
