<script setup lang="ts">
import { ref } from 'vue'

import { prefix } from '@renderer/src/config/global'
import { SidebarTrigger } from '@renderer/src/components/ui/sidebar'
import RouterControl from '@renderer/src/components/router-control/index.vue'
import SystemControl from '@renderer/src/components/system-control/index.vue'

const systemControlFilter = ref([])
</script>

<template>
  <div :class="[`${prefix}-header-container flex justify-between items-center w-full pl-4 pr-2`]">
    <div class="left flex items-center">
      <sidebar-trigger class="-ml-1 no-drag-region" />
      <router-control class="no-drag-region" />
    </div>
    <div class="right">
      <system-control :filter="systemControlFilter" />
    </div>
  </div>
</template>
