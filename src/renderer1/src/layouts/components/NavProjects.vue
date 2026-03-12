<script setup lang="ts">
import { computed } from 'vue'
import { allRoutes } from '@renderer/src/router'
import * as LucideIcons from 'lucide-vue-next'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/src/components/ui/sidebar'

const getIcon = (iconName?: string) => {
  if (!iconName) return undefined
  return (LucideIcons as any)[iconName] || LucideIcons.File
}

const projects = computed(() => {
  const routes = allRoutes || []
  let menuRoutes: any[] = []

  // 处理 Root 路由，将 children 提升
  routes.forEach((route: any) => {
    if (route.path === '/' && route.children) {
      const children = route.children.map((child) => ({
        ...child,
        path: child.path.startsWith('/') ? child.path : `/${child.path}`
      }))
      menuRoutes.push(...children)
    } else {
      menuRoutes.push(route)
    }
  })

  // 筛选出没有子集且未隐藏的路由
  return menuRoutes
    .filter((route) => !route.meta?.hidden && (!route.children || route.children.length === 0))
    .map((route) => ({
      name: route.meta?.title || route.name,
      url: route.path,
      icon: getIcon(route.meta?.icon)
    }))
})
</script>

<template>
  <SidebarGroup v-if="projects.length > 0" class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>总览</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in projects" :key="item.name">
        <SidebarMenuButton as-child>
          <RouterLink :to="item.url">
            <component :is="item.icon" />
            <span>{{ item.name }}</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
