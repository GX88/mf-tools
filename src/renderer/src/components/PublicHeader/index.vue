<script setup lang="ts">
import QuickMenu from '@renderer/components/QuickMenu/index.vue'
import SystemControl from '@renderer/components/SystemControl/index.vue'
import { Separator } from '@renderer/ui/shadcn/ui/separator'
import { isMacOS } from '@renderer/utils/systeminfo'

defineOptions({
  name: 'PublicHeaderLayout',
})
</script>

<template>
  <div
    class="login-page-bg relative h-screen w-screen flex flex-col overflow-hidden bg-white"
  >
    <div
      class="drag-region relative z-20 h-11 w-full flex shrink-0 items-center justify-between bg-[#f0f0f0]/80 pl-4 pr-2"
    >
      <div>
        <img
          v-if="isMacOS"
          src="@renderer/assets/images/logo.svg"
          alt="logo"
          class="h-5 w-auto"
        >
      </div>
      <div class="flex items-center">
        <QuickMenu />
        <Separator orientation="vertical" class="mx-2 bg-[#c2c2c2] h-4!" />
        <SystemControl />
      </div>
    </div>

    <div class="relative z-10 flex-1 overflow-y-auto bg-[#f0f0f0]/60">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.login-page-bg {
  background-color: #ffffff;
  background-image:
    linear-gradient(#f0f0f0 1px, transparent 1px),
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.flip-vertical {
  transform: rotate(180deg) scaleX(-1);
}
</style>
