import fs from 'node:fs'
import { resolve } from 'node:path'

// renderer
import { defineConfig, loadEnv } from 'electron-vite'
import pkg from './package.json'
import dayjs from 'dayjs'
import createVitePlugins from './src/renderer/vite/plugins'


export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  // 全局 scss 资源
  const scssResources: string[] = []
  fs.readdirSync('src/renderer/src/assets/styles/resources').forEach((dirname) => {
    if (fs.statSync(`src/assets/styles/resources/${dirname}`).isFile()) {
      scssResources.push(`@use "/src/assets/styles/resources/${dirname}" as *;`)
    }
  })

  return {
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
      server: {
        host: true,
        port: 9000,
        proxy: {
          '/proxy': {
            target: env.VITE_APP_API_BASEURL,
            changeOrigin: command === 'serve' && env.VITE_OPEN_PROXY === 'true',
            rewrite: path => path.replace(/\/proxy/, ''),
          },
        }
      },
      // 构建选项 https://cn.vitejs.dev/config/build-options
      build: {
        outDir: mode === 'production' ? 'dist' : `dist-${mode}`,
        sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
      },
      define: {
        __SYSTEM_INFO__: JSON.stringify({
          pkg: {
            version: pkg.version,
            dependencies: pkg.dependencies,
            devDependencies: pkg.devDependencies,
          },
          lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }),
      },
      plugins: createVitePlugins(mode, command === 'build'),
      resolve: {
        alias: {
          '#': resolve('src/renderer/src/types'),
          '@renderer': resolve('src/renderer/src'),
          '@shared': resolve('packages/shared'),
          '@pkg': resolve('package.json'),
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: scssResources.join(''),
          },
        },
      },
    },
  }
})
