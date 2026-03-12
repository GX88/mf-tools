<script setup lang="ts">
import Provider from './ui/provider/index.vue'

const route = useRoute()
const { auth } = useAuth()

const isAuth = computed(() => {
  return route.matched.every((item) => {
    return auth(item.meta.auth ?? '')
  })
})
</script>

<template>
  <Provider>
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="isAuth" />
    </RouterView>
    <FaToast />
    <FaNotification />
  </Provider>
</template>
