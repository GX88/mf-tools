import antfu from '@antfu/eslint-config'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export default antfu(
  {
    ignores: ['public', 'dist*', '**/*.d.ts', 'src/renderer/src/types/*.d.ts'],
  },
  {
    rules: {
      'eslint-comments/no-unlimited-disable': 'off', // 禁止使用无限禁用注释
      'no-irregular-whitespace': 'off', // 禁止不规则的空格
      'style/max-statements-per-line': ['error', { max: 3 }], // 限制每行最大语句数为 3
      'curly': ['error', 'all'],
      'ts/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
    },
  },
  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['route', 'i18n', 'script', 'template', 'style'],
        },
      ],
    },
  },
  ...vueI18n.configs['flat/recommended'],
  {
    rules: {
      '@intlify/vue-i18n/no-raw-text': 'off',
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/lang/*.{json,json5,yaml,yml}',
        messageSyntaxVersion: '^10.0.0',
      },
    },
  },
)
