<script setup lang="ts">
import { Copyright } from 'lucide-vue-next'

// const { t } = useI18n()
</script>

<template>
  <PublicHeader>
    <div class="flex min-h-full flex-col">
      <div
        class="flex flex-1 flex-col items-center justify-center py-12 px-6">
        <div class="w-full max-w-sm">
          <!-- <LoginForm /> -->
        </div>
      </div>

      <div
        class="w-full shrink-0 flex flex-col gap-1.5 pb-8 text-muted-foreground/60 text-[12px] tracking-wide">
        <div class="px-6 flex items-center justify-center gap-1">
          <Copyright :size="14" class="mt-px opacity-70" />
          {{ $t('login.copyright') }}
        </div>
        <div class="px-6 text-center opacity-70">
          {{ $t('login.terms') }}
          <RouterLink
            to="/legal/terms"
            class="underline underline-offset-4 hover:text-primary transition-colors">
            {{ $t('login.termsService') }}
          </RouterLink>
          和
          <RouterLink
            to="/legal/privacy"
            class="underline underline-offset-4 hover:text-primary transition-colors">
            {{ $t('login.privacyPolicy') }}
          </RouterLink>。
        </div>
      </div>
    </div>
  </PublicHeader>
</template>
