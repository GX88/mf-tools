<script lang="ts" setup>
defineOptions({
  name: 'SystemControl'
})

import { ref, onMounted } from 'vue'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'
import { isMacOS } from '@renderer/src/utils/systeminfo'

import { Button } from '@renderer/src/components/ui/button'
import { Pin } from 'lucide-vue-next'
import { PinOff } from 'lucide-vue-next'
import { Minus } from 'lucide-vue-next'
import { Minimize } from 'lucide-vue-next'
import { Maximize } from 'lucide-vue-next'
import { X } from 'lucide-vue-next'

const active = ref({
  isPinned: false,
  isMaximized: false
})

const props = defineProps({
  filter: {
    type: Array,
    default: () => []
  }
})

onMounted(() => {
  setupWindowListeners()
  setupWindowStatus()
})

const isFilter = (name: string) => {
  return props.filter.includes(name)
}

const setupWindowListeners = () => {
  if (isMacOS) {
    attachFullscreenListener()
  } else {
    attachMaximizeListener()
  }
}

const setupWindowStatus = async () => {
  const statusPin = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_PIN)
  active.value.isPinned = statusPin
  const statusMax = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MAX)
  active.value.isMaximized = statusMax
}

const handlePinWindow = async () => {
  active.value.isPinned = !active.value.isPinned
  const status = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_PIN, 0)
  active.value.isPinned = status // sync
}

const handleMinimizeWindow = () => {
  window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MIN, 1)
}

const handleMaximizeWindow = async () => {
  active.value.isMaximized = !active.value.isMaximized
  const status = await window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_MAX, 0)
  active.value.isMaximized = status // sync
}

const handleCloseWindow = () => {
  window.electron.ipcRenderer.invoke(IPC_CHANNEL.WINDOW_CLOSE, 1)
}

const attachFullscreenListener = () => {
  window.electron.ipcRenderer.removeAllListeners(IPC_CHANNEL.WINDOW_FULLSCREEN)
  window.electron.ipcRenderer.on(IPC_CHANNEL.WINDOW_FULLSCREEN, (_, fullscreen: boolean) => {
    if (fullscreen) {
      document.documentElement.setAttribute('fullscreen', String(fullscreen))
    } else {
      document.documentElement.removeAttribute('fullscreen')
    }
  })
}

const attachMaximizeListener = () => {
  window.electron.ipcRenderer.removeAllListeners(IPC_CHANNEL.WINDOW_MAX)
  window.electron.ipcRenderer.on(IPC_CHANNEL.WINDOW_MAX, (_, maximized: boolean) => {
    active.value.isMaximized = maximized
  })
}
</script>

<template>
  <div class="system-controls flex items-center justify-between drag-region">
    <Button
      class="no-drag-region"
      variant="ghost"
      size="icon"
      v-if="!isFilter('pin')"
      @click="handlePinWindow"
    >
      <Pin v-if="!active.isPinned" class="size-4" />
      <PinOff v-else class="size-4" />
    </Button>

    <template v-if="!isMacOS">
      <Button
        class="no-drag-region"
        variant="ghost"
        size="icon"
        v-if="!isFilter('min')"
        @click="handleMinimizeWindow"
      >
        <Minus class="size-4" />
      </Button>
      <Button
        class="no-drag-region"
        variant="ghost"
        size="icon"
        v-if="!isFilter('max')"
        @click="handleMaximizeWindow"
      >
        <Maximize v-if="!active.isMaximized" class="size-4" />
        <Minimize v-else class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        @click="handleCloseWindow"
        v-if="!isFilter('close')"
        style="transform: scaleX(-1)"
        class="control-button control-button__close no-drag-region"
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
