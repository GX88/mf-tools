<script setup lang="ts">
import type { ILang } from '@shared/locales'
import { Button } from '@renderer/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/src/components/ui/dropdown-menu'
import { cn } from '@renderer/src/lib/utils'
import { langList, t } from '@renderer/src/locales'
import { useSettingStore } from '@renderer/src/store'
import { Check, Languages } from 'lucide-vue-next'
import { computed } from 'vue'

defineProps({
  theme: {
    type: String,
    default: 'auto',
  },
})

const storeSetting = useSettingStore()

const LANG_OPTIONS = computed(() => [
  { value: 'auto', label: t('common.followSystem') },
  ...langList.value.map(lang => ({ value: lang.value, label: lang.label })),
])
const theme = computed(() => storeSetting.displayLang)

async function setLanguage(lang: ILang) {
  storeSetting.updateConfig({ lang })

  // await putSetting({ key: 'lang', value: lang });
}
</script>

<template>
  <div class="quick-menu__language no-drag-region">
    <DropdownMenu :modal="true">
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon">
          <Languages class="size-4" :theme="theme" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-auto" align="center">
        <DropdownMenuItem
          v-for="item in LANG_OPTIONS"
          :key="item.value"
          :class="
            cn(
              'flex justify-between items-center gap-4',
              theme === item.value ? 'bg-accent text-accent-foreground' : '',
            )
          "
          @click="setLanguage(item.value as ILang)"
        >
          <span>{{ item.label }}</span>
          <Check v-if="theme === item.value" class="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<style lang="less" scoped></style>
