<script setup lang="ts">
import type { I18nTextProps } from '@renderer/src/locales'
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { cn } from '@renderer/src/lib/utils'
import { resolveI18nText } from '@renderer/src/locales'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps, I18nTextProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})

const labelText = computed(() => resolveI18nText(props))
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot v-if="$slots.default" />
    <template v-else>
      {{ labelText }}
    </template>
  </Primitive>
</template>
