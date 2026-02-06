import { resolve } from 'path'
import { defineConfig } from 'electron-vite'

// renderer
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

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
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('packages/shared'),
        '@pkg': resolve('package.json')
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          additionalData: `@import "${resolve('src/renderer/src/assets/style/index.less')}";`
        }
      }
    }
  }
})
