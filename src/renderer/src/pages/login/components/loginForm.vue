<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import BaseApi from '@renderer/src/api/base'

import { cn } from '@renderer/src/lib/utils'
import { t } from '@renderer/src/locales'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'
import { md5 } from '@shared/modules/crypto'
import { REGEXP_ONLY_DIGITS } from 'vue-input-otp'
import { toast } from 'vue-sonner'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const route = useRoute()
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

    toast.success(t('login.message.success'))

    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
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
  <div :class="cn('flex flex-col gap-8', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit="handleLogin">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">
                {{ $t('login.title') }}
              </h1>
              <p class="text-muted-foreground text-balance">
                {{ $t('login.subTitle') }}
              </p>
            </div>
            <Field>
              <FieldLabel for="username">
                {{ $t('login.username') }}
              </FieldLabel>
              <Input
                id="username"
                v-model="username"
                type="phone"
                :placeholder="$t('login.username_placeholder')"
                required
              />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="code">
                  {{ $t('login.code') }}
                </FieldLabel>
              </div>
              <div class="flex items-center justify-between">
                <InputOTP
                  v-model="code"
                  :maxlength="6"
                  :pattern="REGEXP_ONLY_DIGITS"
                  class="w-full"
                >
                  <InputOTPGroup :class="cn('flex items-center justify-between w-full')">
                    <InputOTPSlot :index="0" class="w-full" />
                    <InputOTPSlot :index="1" class="w-full" />
                    <InputOTPSlot :index="2" class="w-full" />
                    <InputOTPSlot :index="3" class="w-full" />
                    <InputOTPSlot :index="4" class="w-full" />
                    <InputOTPSlot :index="5" class="w-full" />
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="button"
                  class="ml-2"
                  :disabled="smsCodeSent || isSendingCode"
                  @click="getSmsCode"
                >
                  <Spinner v-if="isSendingCode" class="mr-2 animate-spin" />
                  <span v-if="smsCountdown > 0"> {{ smsCountdown }}s </span>
                  <span v-else>
                    {{ $t('login.button.getCode') }}
                  </span>
                </Button>
              </div>
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password">
                  {{ $t('login.password') }}
                </FieldLabel>
                <a href="#" class="ml-auto text-sm underline-offset-2 hover:underline">
                  {{ $t('login.forgotPassword') }}
                </a>
              </div>
              <Input
                id="password"
                v-model="password"
                type="password"
                :placeholder="$t('login.password_placeholder')"
                required
              />
            </Field>
            <Field>
              <Button type="submit" :disabled="isLoggingIn">
                <Spinner v-if="isLoggingIn" class="mr-2 animate-spin" />
                <span>
                  {{ $t('login.button.submit') }}
                </span>
              </Button>
            </Field>
            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-card tracking-wider">
              {{ $t('login.otherLogin') }}
            </FieldSeparator>
            <Field class="grid grid-cols-3 gap-4">
              <Button variant="outline" type="button" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Apple</span>
              </Button>
              <Button variant="outline" type="button" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Google</span>
              </Button>
              <Button variant="outline" type="button" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Meta</span>
              </Button>
            </Field>
            <FieldDescription class="text-center">
              {{ $t('login.registerTip') }}
              <a href="#" class="underline-offset-2 hover:underline">
                {{ $t('login.registerLink') }}
              </a>
            </FieldDescription>
          </FieldGroup>
        </form>
        <div class="bg-muted relative hidden md:block">
          <img
            src="@renderer/src/assets/images/login/placeholder.svg"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          >
        </div>
      </CardContent>
    </Card>
  </div>
</template>
