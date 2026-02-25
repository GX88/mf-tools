<script setup lang="ts">
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
import { allRoutes } from '@renderer/src/router'
import { ChevronRight } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

function getIcon(iconName?: string) {
  if (!iconName) { return undefined }
  return (LucideIcons as any)[iconName] || LucideIcons.File
}

const menuItems = computed(() => {
  const routes = allRoutes || []
  const menuRoutes: any[] = []

  // 处理 Root 路由，将 children 提升
  routes.forEach((route: any) => {
    if (route.path === '/' && route.children) {
      // 为子路由添加父路径前缀（如果需要）
      // 在这里，Root 的 path 是 /，子路由 path 是 dashboard
      // 最终路径应该是 /dashboard
      const children = route.children.map(child => ({
        ...child,
        path: child.path.startsWith('/') ? child.path : `/${child.path}`,
      }))
      menuRoutes.push(...children)
    }
    else {
      menuRoutes.push(route)
    }
  })

  return menuRoutes
    .filter(
      route =>
        !route.meta?.hidden && route.children && route.children.some(child => !child.meta?.hidden),
    )
    .map(r => ({
      title: r.meta?.title || r.name,
      url: r.path,
      icon: getIcon(r.meta?.icon),
      isActive: route.path.startsWith(r.path), // 简单的激活状态判断
      items: r.children
        ?.filter(child => !child.meta?.hidden)
        .map(child => ({
          title: child.meta?.title || child.name,
          url: child.path.startsWith('/')
            ? child.path
            : `${r.path}/${child.path}`.replace(/\/+/g, '/'),
        })),
    }))
})
</script>

<template>
  <SidebarGroup v-if="menuItems.length > 0">
    <SidebarGroupLabel>菜单</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in menuItems" :key="item.title">
        <Collapsible as-child :default-open="item.isActive" class="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton
                :tooltip="item.title"
                :is-active="item.isActive"
                :class="item.isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
              >
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                  <!-- 判断data-active是否为true -->
                  <SidebarMenuSubButton
                    as-child
                    :class="
                      route.path === subItem.url
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
                        : ''
                    "
                  >
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
