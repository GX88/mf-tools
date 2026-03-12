<script lang="ts" setup>
import { Button } from '@renderer/src/components/ui/button'
import { isMacOS } from '@renderer/src/utils/systeminfo'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'

import { Maximize, Minimize, Minus, Pin, PinOff, X } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

defineOptions({
  name: 'SystemControl',
})

const props = defineProps({
  filter: {
    type: Array,
    default: () => [],
  },
})

const active = ref({
  isPinned: false,
  isMaximized: false,
})

onMounted(() => {
  setupWindowListeners()
  setupWindowStatus()
})

function isFilter(name: string) {
  return props.filter.includes(name)
}

function setupWindowListeners() {
  if (isMacOS) {
    attachFullscreenListener()
  }
  else {
    attachMaximizeListener()
  }
}

async function setupWindowStatus() {
  const statusPin = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_PIN)
  active.value.isPinned = statusPin
  const statusMax = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MAX)
  active.value.isMaximized = statusMax
}

async function handlePinWindow() {
  active.value.isPinned = !active.value.isPinned
  const status = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_PIN, 0)
  active.value.isPinned = status // sync
}

function handleMinimizeWindow() {
  window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MIN, 1)
}

async function handleMaximizeWindow() {
  active.value.isMaximized = !active.value.isMaximized
  const status = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MAX, 0)
  active.value.isMaximized = status // sync
}

function handleCloseWindow() {
  window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_CLOSE, 1)
}

function attachFullscreenListener() {
  window.electron.ipcRenderer.removeAllListeners(IPC_CHANNEL.WINDOW_FULLSCREEN)
  window.electron.ipcRenderer.on(IPC_CHANNEL.WINDOW_FULLSCREEN, (_, fullscreen: boolean) => {
    if (fullscreen) {
      document.documentElement.setAttribute('fullscreen', String(fullscreen))
    }
    else {
      document.documentElement.removeAttribute('fullscreen')
    }
  })
}

function attachMaximizeListener() {
  window.electron.ipcRenderer.removeAllListeners(IPC_CHANNEL.WINDOW_MAX)
  window.electron.ipcRenderer.on(IPC_CHANNEL.WINDOW_MAX, (_, maximized: boolean) => {
    active.value.isMaximized = maximized
  })
}
</script>

<template>
  <div class="system-controls flex gap-1 items-center justify-between drag-region">
    <Button
      v-if="!isFilter('pin')"
      class="no-drag-region"
      variant="ghost"
      size="icon"
      @click="handlePinWindow"
    >
      <Pin v-if="!active.isPinned" class="size-4" />
      <PinOff v-else class="size-4" />
    </Button>

    <template v-if="!isMacOS">
      <Button
        v-if="!isFilter('min')"
        class="no-drag-region"
        variant="ghost"
        size="icon"
        @click="handleMinimizeWindow"
      >
        <Minus class="size-4" />
      </Button>
      <Button
        v-if="!isFilter('max')"
        class="no-drag-region"
        variant="ghost"
        size="icon"
        @click="handleMaximizeWindow"
      >
        <Maximize v-if="!active.isMaximized" class="size-4" />
        <Minimize v-else class="size-4" />
      </Button>
      <Button
        v-if="!isFilter('close')"
        variant="ghost"
        size="icon"
        style="transform: scaleX(-1)"
        class="control-button control-button__close no-drag-region"
        @click="handleCloseWindow"
      >
        <X class="size-5" />
      </Button>
    </template>
  </div>
</template>

<style lang="less" scoped>
.system-controls {
  .control-button {
    &.control-button__close {
      &:hover {
        color: var(--destructive-foreground) !important;
      }
    }
  }
}
</style>
