import type { PluginOption } from 'vite'
import Unocss from 'unocss/vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'electron-vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import viteVueDevTools from 'vite-plugin-vue-devtools'
import { envParse, parseLoadedEnv } from 'vite-plugin-env-parse'
import { compression } from 'vite-plugin-compression2'
import Archiver from 'vite-plugin-archiver'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-meta-layouts'
import { resolve } from 'node:path'

export default function createVitePlugins(mode: string, isBuild = false) {
  const viteEnv = parseLoadedEnv(loadEnv(mode, process.cwd()))

  const vitePlugins: (PluginOption | PluginOption[])[] = [
    vue(),
    vueJsx(),
    viteVueDevTools(),

    // https://github.com/unplugin/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        'vue-i18n',
      ],
      dts: resolve('src/renderer/src/types/auto-imports.d.ts'),
      dirs: [
        resolve('src/renderer/src/store/modules'),
        resolve('src/renderer/src/utils/composables'),
      ],
    }),

    // https://github.com/unplugin/unplugin-vue-components
    Components({
      globs: [
        resolve('src/renderer/src/ui/components/*/index.vue'),
        resolve('src/renderer/src/components/*/index.vue'),
      ],
      dts: resolve('src/renderer/src/types/components.d.ts'),
    }),

    // https://github.com/intlify/bundle-utils/tree/main/packages/unplugin-vue-i18n
    VueI18n({
      runtimeOnly: false,
      compositionOnly: true,
      fullInstall: true,
    }),

    Unocss(),

    // https://github.com/dishait/vite-plugin-vue-meta-layouts
    Layouts({
      defaultLayout: 'index',
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      dirs: 'src/renderer/src/views',
      exclude: [
        '**/components/**/*.vue',
      ],
    }),

    // https://github.com/nonzzz/vite-plugin-compression
    viteEnv.VITE_BUILD_COMPRESS && compression({
      exclude: [/\.(br)$/, /\.(gz)$/],
      algorithms: viteEnv.VITE_BUILD_COMPRESS.split(',').map((item: string) => ({
        gzip: 'gzip',
        brotli: 'brotliCompress',
      }[item])),
    }),

    viteEnv.VITE_BUILD_ARCHIVE && Archiver({
      archiveType: viteEnv.VITE_BUILD_ARCHIVE,
    }),
  ]

  return vitePlugins
}
