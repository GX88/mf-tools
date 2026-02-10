<script setup lang="ts">
import type { SidebarProps } from '@renderer/src/components/ui/sidebar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarProvider,
  SidebarInset
} from '@renderer/src/components/ui/sidebar'

import NavMain from './components/NavMain.vue'
import NavProjects from './components/NavProjects.vue'
import NavUser from './components/NavUser.vue'
import TeamSwitcher from './components/TeamSwitcher.vue'
import LayoutHeader from './components/LayoutHeader.vue'
import LayoutContent from './components/LayoutContent.vue'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon'
})

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  }
}
</script>

<template>
  <SidebarProvider>
    <Sidebar v-bind="props">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavProjects />
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser :user="data.user" />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <header
        class="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b drag-region"
      >
        <layout-header />
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <layout-content class="min-h-full rounded-md" />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
