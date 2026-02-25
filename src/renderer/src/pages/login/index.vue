<script setup lang="ts">
import QuickMenu from '@renderer/src/components/quick-menu/index.vue'
import SystemControl from '@renderer/src/components/system-control/index.vue'
import { Copyright } from 'lucide-vue-next'
import LoginForm from './components/loginForm.vue'
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-white relative login-page-bg">
    <!-- 顶部固定标题栏 -->
    <div
      class="w-full shrink-0 relative h-11 bg-[#f0f0f0]/80 flex items-center justify-between drag-region pr-2 pl-4 z-20"
    >
      <img src="@renderer/src/assets/images/login/logo.png" alt="logo" class="h-5 w-auto">
      <div class="flex items-center">
        <QuickMenu />
        <Separator orientation="vertical" class="h-4! mx-2 bg-[#c2c2c2]" />
        <SystemControl />
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="flex-1 overflow-y-auto relative z-10 bg-[#f0f0f0]/60">
      <div class="flex min-h-full flex-col">
        <div class="flex flex-1 flex-col items-center justify-center py-12 px-6">
          <div class="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>

        <div
          class="w-full shrink-0 flex flex-col gap-1.5 pb-8 text-muted-foreground/60 text-[12px] tracking-wide"
        >
          <div class="px-6 flex items-center justify-center gap-1">
            <Copyright :size="14" class="mt-px opacity-70" />
            {{ $t('login.copyright') }}
          </div>
          <div class="px-6 text-center opacity-70">
            {{ $t('login.terms') }}
            <a href="#" class="underline underline-offset-4 hover:text-primary transition-colors">
              {{ $t('login.termsService') }}
            </a>
            和
            <a href="#" class="underline underline-offset-4 hover:text-primary transition-colors">
              {{ $t('login.privacyPolicy') }} </a>。
          </div>
        </div>
      </div>
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
