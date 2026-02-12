import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

// renderer
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

import viteVueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        // 主进程路径别名：修复 @logger 解析失败问题
        '@logger': resolve('src/main/services/LoggerService'),
        // 补充常用别名，确保主进程内与 shared 包的导入正常解析
        '@main': resolve('src/main'),
        '@shared': resolve('packages/shared'),
        '@pkg': resolve('package.json'),
      },
    },
  },
  preload: {},
  renderer: {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        dts: resolve('src/renderer/src/types/auto-imports.d.ts'), // 自动导入类型声明文件
        dirs: [resolve('src/renderer/src/store/modules')],
      }),
      Components({
        dts: resolve('src/renderer/src/types/components.d.ts'), // 自动导入组件类型声明文件
        dirs: [resolve('src/renderer/src/components/ui')],
        deep: true,
        // 包含的文件类型
        extensions: ['vue'],
        // 排除的文件
        exclude: [/node_modules/],
      }),
      tailwindcss(),
      viteVueDevTools(),
    ],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('packages/shared'),
        '@pkg': resolve('package.json'),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          additionalData: `@import "${resolve('src/renderer/src/assets/style/index.less')}";`,
        },
      },
    },
  },
})
