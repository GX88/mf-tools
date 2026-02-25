<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import BaseApi from '@renderer/src/api/base'

import { cn } from '@renderer/src/lib/utils'
import { t } from '@renderer/src/locales'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'
import { md5 } from '@shared/modules/crypto'
import { toast } from 'vue-sonner'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const userStore = useUserStore()

const username = ref('')
const password = ref('')
const code = ref('')

const smsCodeSent = ref(true)
const isLoggingIn = ref(false)
const isSendingCode = ref(false)
const smsCountdown = ref(0)
let smsTimer: number | null = null

async function handleLogin(e: Event) {
  e.preventDefault()
  if (isLoggingIn.value) {
    return
  }
  isLoggingIn.value = true
  try {
    const timestamp = Date.now().toString()
    await userStore.login({
      account: username.value,
      password: md5(password.value),
      code: code.value,
      sign: await handleGetDeviceId(timestamp),
      timestamp,
    })
  }
  finally {
    isLoggingIn.value = false
  }
}

async function getSmsCode() {
  if (isSendingCode.value || smsCountdown.value > 0 || !username.value || !username.value.trim()) {
    return
  }

  isSendingCode.value = true
  try {
    const timestamp = Date.now().toString()
    await BaseApi.smsCode({
      phone: username.value,
      sign: await handleGetDeviceId(timestamp),
      timestamp,
    })
    toast.success(t('login.message.smsSent'))

    smsCodeSent.value = true
    smsCountdown.value = 60
    if (smsTimer !== null) {
      clearInterval(smsTimer)
    }
    smsTimer = window.setInterval(() => {
      smsCountdown.value -= 1
      if (smsCountdown.value <= 0) {
        smsCountdown.value = 0
        smsCodeSent.value = false
        if (smsTimer !== null) {
          clearInterval(smsTimer)
          smsTimer = null
        }
      }
    }, 1000)
  }
  finally {
    isSendingCode.value = false
  }
}

watch(username, (newValue) => {
  const hasUsername = !!newValue && newValue.trim() !== ''
  if (hasUsername && smsCountdown.value === 0) {
    smsCodeSent.value = false
  }
  if (!hasUsername) {
    smsCodeSent.value = true
  }
})

async function handleGetDeviceId(timestamp: string) {
  const deviceId = (await window.electron.ipcRenderer.invoke(
    IPC_CHANNEL.DEVICE_ID,
    timestamp,
  )) as string
  return deviceId
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <form class="w-full" @submit="handleLogin">
      <FieldGroup class="gap-4">
        <div class="flex flex-col items-center gap-1 text-center mb-4">
          <h1 class="text-3xl font-medium tracking-tight text-foreground">
            {{ $t('login.title') }}
          </h1>
          <p class="text-muted-foreground/80 text-sm">
            {{ $t('login.subTitle') }}
          </p>
        </div>
        <Field class="gap-1.5">
          <FieldLabel for="username" class="font-medium tracking-wider text-muted-foreground/70">
            {{ $t('login.username') }}
          </FieldLabel>
          <Input
            id="username"
            v-model="username"
            type="phone"
            :placeholder="$t('login.username_placeholder')"
            class="h-10 bg-(--login-input-bg) border border-(--login-input-border) shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/50"
            required
          />
        </Field>
        <Field class="gap-1.5">
          <div class="flex items-center">
            <FieldLabel for="code" class="font-medium tracking-wider text-muted-foreground/70">
              {{ $t('login.code') }}
            </FieldLabel>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="code"
              v-model="code"
              type="text"
              :maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              :placeholder="$t('login.code_placeholder')"
              class="flex-1 h-10 bg-(--login-input-bg) border border-(--login-input-border) shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 text-[14px] placeholder:text-muted-foreground/50"
              required
              @input="code = code.replace(/\D/g, '')"
            />
            <Button
              type="button"
              class="shrink-0 h-10 px-4 font-medium transition-all duration-200 text-[13px] rounded-md shadow-sm border border-slate-200"
              :variant="smsCodeSent ? 'secondary' : 'default'"
              :disabled="smsCodeSent || isSendingCode"
              @click="getSmsCode"
            >
              <Spinner v-if="isSendingCode" class="mr-1.5 animate-spin" />
              <span v-if="smsCountdown > 0" class="tabular-nums"> {{ smsCountdown }}s </span>
              <span v-else>
                {{ $t('login.button.getCode') }}
              </span>
            </Button>
          </div>
        </Field>
        <Field class="gap-1.5">
          <div class="flex items-center">
            <FieldLabel for="password" class="font-medium tracking-wider text-muted-foreground/70">
              {{ $t('login.password') }}
            </FieldLabel>
            <a
              href="#"
              class="ml-auto text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {{ $t('login.forgotPassword') }}
            </a>
          </div>
          <Input
            id="password"
            v-model="password"
            type="password"
            :placeholder="$t('login.password_placeholder')"
            class="h-10 bg-(--login-input-bg) border border-(--login-input-border) shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 text-[14px] placeholder:text-muted-foreground/50"
            required
          />
        </Field>
        <Field class="mt-2">
          <Button
            type="submit"
            class="w-full h-11 text-[15px] font-semibold border-none shadow-md hover:shadow-lg transition-all duration-200 rounded-md active:scale-[0.98]"
            :disabled="isLoggingIn"
          >
            <Spinner v-if="isLoggingIn" class="mr-2 animate-spin" />
            <span>
              {{ $t('login.button.submit') }}
            </span>
          </Button>
        </Field>
        <FieldSeparator
          class="*:data-[slot=field-separator-content]:bg-[#f0f0f0]/80 tracking-[0.2em] font-medium text-muted-foreground/30 mt-4"
        >
          {{ $t('login.otherLogin') }}
        </FieldSeparator>
        <Field class="grid grid-cols-3 gap-4">
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                fill="currentColor"
              />
            </svg>
            <span class="sr-only">Login with Apple</span>
          </Button>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span class="sr-only">Login with Google</span>
          </Button>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                fill="currentColor"
              />
            </svg>
            <span class="sr-only">Login with Meta</span>
          </Button>
        </Field>
        <FieldDescription class="text-center mt-4 text-muted-foreground/80">
          {{ $t('login.registerTip') }}
          <a href="#" class="font-medium text-primary/80 hover:text-primary transition-none">
            {{ $t('login.registerLink') }}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  </div>
</template>
