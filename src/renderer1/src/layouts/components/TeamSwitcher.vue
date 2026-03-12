<script setup lang="ts">
import { ChevronsUpDown, Plus, GalleryVerticalEnd } from 'lucide-vue-next'
import { ref, onMounted, computed, watch } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@renderer/src/components/ui/dropdown-menu'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@renderer/src/components/ui/sidebar'
import { useHospitalStore } from '@renderer/src/store/modules/hospital'

const hospitalStore = useHospitalStore()

onMounted(() => {
  hospitalStore.getHospitalList()
})

const teams = computed(() => {
  return hospitalStore.hospitalList.map((item) => ({
    name: item.hospitalName,
    logo: GalleryVerticalEnd,
    plan: item.hospitalCode
  }))
})

const { isMobile } = useSidebar()
const activeTeam = ref<{ name: string; logo: any; plan: string } | undefined>(undefined)

watch(
  teams,
  (newTeams) => {
    if (newTeams && newTeams.length > 0 && !activeTeam.value) {
      activeTeam.value = newTeams[0]
    }
  },
  { immediate: true }
)
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <component :is="activeTeam?.logo" class="size-4" v-if="activeTeam?.logo" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ activeTeam?.name || '选择医院' }}
              </span>
              <span class="truncate text-xs">{{ activeTeam?.plan || '' }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground"> Teams </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(team, index) in teams"
            :key="team.name"
            class="gap-2 p-2"
            @click="activeTeam = team"
          >
            <div class="flex size-6 items-center justify-center rounded-sm border">
              <component :is="team.logo" class="size-3.5 shrink-0" />
            </div>
            {{ team.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <Plus class="size-4" />
            </div>
            <div class="font-medium text-muted-foreground">添加客户</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
