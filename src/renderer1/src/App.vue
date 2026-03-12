<script setup lang="ts">
import { Toaster } from '@renderer/src/components/ui/sonner'
</script>

<template>
  <div>
    <router-view />
    <Toaster />
  </div>
</template>
