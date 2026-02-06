<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next"
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { allRoutes } from '@renderer/src/router'
import * as LucideIcons from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@renderer/src/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@renderer/src/components/ui/sidebar'

const route = useRoute()

const getIcon = (iconName?: string) => {
  if (!iconName) return undefined
  return (LucideIcons as any)[iconName] || LucideIcons.File
}

const menuItems = computed(() => {
  const routes = allRoutes || []
  let menuRoutes: any[] = []

  // 处理 Root 路由，将 children 提升
  routes.forEach((route: any) => {
    if (route.path === '/' && route.children) {
      // 为子路由添加父路径前缀（如果需要）
      // 在这里，Root 的 path 是 /，子路由 path 是 dashboard
      // 最终路径应该是 /dashboard
      const children = route.children.map(child => ({
        ...child,
        path: child.path.startsWith('/') ? child.path : `/${child.path}`
      }))
      menuRoutes.push(...children)
    } else {
      menuRoutes.push(route)
    }
  })

  return menuRoutes
    .filter(route => !route.meta?.hidden && route.children && route.children.some(child => !child.meta?.hidden))
    .map(r => ({
      title: r.meta?.title || r.name,
      url: r.path,
      icon: getIcon(r.meta?.icon),
      isActive: route.path.startsWith(r.path), // 简单的激活状态判断
      items: r.children?.filter(child => !child.meta?.hidden).map(child => ({
        title: child.meta?.title || child.name,
        url: child.path.startsWith('/') ? child.path : `${r.path}/${child.path}`.replace(/\/+/g, '/')
      }))
    }))
})
</script>

<template>
  <SidebarGroup v-if="menuItems.length > 0">
    <SidebarGroupLabel>菜单</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in menuItems" :key="item.title">
        <Collapsible
          as-child
          :default-open="item.isActive"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.title">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                  <SidebarMenuSubButton as-child>
                    <RouterLink :to="subItem.url">
                      <span>{{ subItem.title }}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
