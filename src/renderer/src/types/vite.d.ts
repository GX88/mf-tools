/// <reference types="vite/client" />

declare module 'virtual:generated-pages' {
  import type { RouteRecordRaw } from 'vue-router'
  const routes: RouteRecordRaw[]
  export default routes
}

declare module 'virtual:meta-layouts' {
  import type { RouteRecordRaw } from 'vue-router'
  export function setupLayouts(routes: RouteRecordRaw[]): RouteRecordRaw[]
}

// 扩展 ImportMeta 接口以包含 glob 和 env
interface ImportMeta {
  readonly env: ImportMetaEnv
  glob: (pattern: string, options?: { eager?: boolean }) => Record<string, any>
}
