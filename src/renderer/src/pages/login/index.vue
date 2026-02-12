<script setup lang="ts">
import QuickMenu from '@renderer/src/components/quick-menu/index.vue'
import SystemControl from '@renderer/src/components/system-control/index.vue'
import { Copyright } from 'lucide-vue-next'
import LoginForm from './components/loginForm.vue'
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-muted">
    <div
      class="w-full shrink-0 relative h-10 bg-white flex items-center justify-between drag-region pr-2 pl-4"
    >
      <img src="@renderer/src/assets/images/login/logo.png" alt="logo" class="h-5 w-auto">
      <div class="flex">
        <QuickMenu />
        <SystemControl />
      </div>
    </div>
    <div class="flex flex-1 flex-col items-center justify-center p-6 md:p-10 bg-white">
      <div class="w-full max-w-sm md:max-w-4xl max-h-sm md:max-h-5xl">
        <LoginForm />
      </div>
    </div>
    <div class="w-full shrink-0 flex flex-col gap-1.5 pb-4 text-muted-foreground text-sm bg-white">
      <div class="px-6 flex items-center justify-center gap-1">
        <Copyright :size="16" class="-mt-0.5" />
        {{ $t('login.copyright') }}
      </div>
      <div class="px-6 text-center">
        {{ $t('login.terms') }}
        <a href="#" class="underline hover:text-primary">
          {{ $t('login.termsService') }}
        </a>
        和
        <a href="#" class="underline hover:text-primary"> {{ $t('login.privacyPolicy') }} </a>。
      </div>
    </div>
  </div>
</template>
