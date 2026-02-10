<script setup lang="ts">
defineOptions({
  name: 'RouterControl'
})

const props = defineProps({
  filter: {
    type: Array,
    default: () => []
  }
})

import { Button } from '@renderer/src/components/ui/button'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { emitterChannel, emitterSource } from '@renderer/src/config/emitterChannel'
import emitter from '@renderer/src/utils/emitter'

const router = useRouter()
const route = useRoute()

const active = ref({
  back: false,
  forward: false
})

watch(route, () => {
  const routeState = window.history.state || {}
  active.value.back = !!routeState?.back
  active.value.forward = !!routeState?.forward
})

const isFilter = (name: string) => {
  return props.filter.includes(name)
}

const goBack = () => router.back()

const goForward = () => router.forward()

/**
 * 刷新当前路由
 * 不是全部重载页面，区分局部数据刷新和全局强制刷新
 * reloadableModules 中配置哪些页面需要局部刷新，通过事件总线通知对应页面重新获取数据
 */
const goRefresh = () => {
  // TODO: 测试用，后续根据实际情况调整
  const reloadableModules = new Set(['test'])
  const name = route.name as string | undefined
  console.log(name)

  if (name && reloadableModules.has(name)) {
    const channel = emitterChannel[`REFRESH_${name.toUpperCase()}_CONFIG`]
    emitter.emit(channel, { source: emitterSource.LAYOUT_HEADER_SEARCH })
  } else {
    // file protocol not supported reload
    window.location.href = window.location.href.replace(/\?.*|$/, `?_t=${Date.now()}`)
  }
}
</script>

<template>
  <div class="router-control">
    <Button
      v-if="!isFilter('back')"
      variant="ghost"
      size="icon"
      :disabled="!active.back"
      class="control-button control-button__back"
      @click="goBack"
    >
      <ChevronLeft />
    </Button>

    <Button
      v-if="!isFilter('forward')"
      variant="ghost"
      size="icon"
      :disabled="!active.forward"
      class="control-button control-button__forward"
      @click="goForward"
    >
      <ChevronRight />
    </Button>

    <Button
      v-if="!isFilter('refresh')"
      variant="ghost"
      size="icon"
      class="control-button control-button__refresh"
      @click="goRefresh"
    >
      <RotateCw />
    </Button>
  </div>
</template>

<style lang="less" scoped></style>
