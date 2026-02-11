<script setup lang="ts">
import QuickMenu from '@renderer/src/components/quick-menu/index.vue'

import RouterControl from '@renderer/src/components/router-control/index.vue'
import SystemControl from '@renderer/src/components/system-control/index.vue'
import { SidebarTrigger } from '@renderer/src/components/ui/sidebar'
import { prefix } from '@renderer/src/config/global'
import { ref } from 'vue'

const systemControlFilter = ref([])
</script>

<template>
  <div :class="[`${prefix}-header-container flex justify-between items-center w-full pl-4 pr-2`]">
    <div class="left flex items-center">
      <SidebarTrigger class="-ml-1 no-drag-region" />
      <RouterControl class="no-drag-region" />
    </div>
    <div class="right">
      <QuickMenu :filter="systemControlFilter" />
      <SystemControl :filter="systemControlFilter" />
    </div>
  </div>
</template>
