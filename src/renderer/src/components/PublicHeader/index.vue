<script setup lang="ts">
import QuickMenu from '@renderer/components/QuickMenu/index.vue'
import SystemControl from '@renderer/components/SystemControl/index.vue'

defineOptions({
  name: 'PublicHeaderLayout',
})
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col overflow-hidden bg-white relative login-page-bg">
    <div
      class="w-full shrink-0 relative h-11 bg-[#f0f0f0]/80 flex items-center justify-between drag-region pr-2 pl-4 z-20">
      <img src="@renderer/assets/images/logo.svg" alt="logo"
        class="h-5 w-auto">
      <div class="flex items-center">
        <QuickMenu />
        <Separator orientation="vertical"
          class="h-4! mx-2 bg-[#c2c2c2]" />
        <SystemControl />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto relative z-10 bg-[#f0f0f0]/60">
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
