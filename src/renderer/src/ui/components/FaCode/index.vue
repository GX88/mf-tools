<i18n lang="json">
{
  "zh-CN": {
    "copied": "已复制"
  },
  "zh-TW": {
    "copied": "已複製"
  },
  "en-US": {
    "copied": "Copied"
  }
}
</i18n>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@renderer/utils'
import { useClipboard } from '@vueuse/core'

defineOptions({
  name: 'FaCode',
})

const props = defineProps<{
  code: string
  class?: HTMLAttributes['class']
}>()

const settingsStore = useSettingsStore()

const { t } = useI18n()

const { copy, copied, isSupported } = useClipboard()
</script>

<template>
  <div
    :class="
      cn('group relative w-full rounded-lg bg-dark p-4 text-light', props.class)
    "
  >
    <pre class="w-full overflow-auto whitespace-pre-line">
      <code class="whitespace-pre" tabindex="0">{{ code }}</code>
    </pre>
    <FaButton
      v-if="isSupported"
      variant="secondary"
      :class="
        cn(
          'border border-light/20 px-2.5 absolute end-3 top-3 opacity-0 transition-opacity group-hover:opacity-100',
          {
            'opacity-100': settingsStore.mode === 'mobile',
          },
        )
      "
      @click="copy(code)"
    >
      {{ copied ? t("copied") : "" }}
      <FaIcon
        :name="copied ? 'i-tabler:clipboard-check' : 'i-tabler:clipboard'"
        class="size-4"
      />
    </FaButton>
  </div>
</template>

<style scoped>
@font-face {
  font-family: FontWithASyntaxHighlighter;
  src: url("FontWithASyntaxHighlighter-Regular.woff2") format("woff2");
}

code {
  font-family: FontWithASyntaxHighlighter, monospace;
}
</style>
