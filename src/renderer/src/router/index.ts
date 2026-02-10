import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@renderer/src/store/modules/user'

// 导入homepage相关固定路由
const homepageModules = import.meta.glob('./modules/**/homepage.ts', { eager: true })

// 其他固定路由
const defaultRouterList: Array<any> = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@renderer/src/pages/login/index.vue'),
    meta: {
      title: '登录',
      icon: 'login',
      single: true,
      hidden: true
    }
  }
]

// 存放固定路由
export const homepageRouterList: Array<RouteRecordRaw> = mapModuleRouterList(homepageModules)

export const allRoutes = [...homepageRouterList, ...defaultRouterList]

// 固定路由模块转换为路由
// 关于单层路由，meta 中设置 { single: true } 即可为单层路由，{ hidden: true } 即可在侧边栏隐藏该路由
export function mapModuleRouterList(modules: Record<string, unknown>): Array<RouteRecordRaw> {
  const routerList: Array<RouteRecordRaw> = []
  Object.keys(modules).forEach((key) => {
    // @ts-expect-error 类型“{}”上不存在属性“default”。ts(2339)
    const mod = modules[key]?.default || {}
    const modList = Array.isArray(mod) ? [...mod] : [mod]
    routerList.push(...modList)
  })
  return routerList
}

export const getActive = (maxLevel: number = 4): string => {
  // 非组件内调用必须通过Router实例获取当前路由
  const route = router.currentRoute.value

  if (!route.path) {
    return ''
  }

  return route.path
    .split('/')
    .filter((_item: string, index: number) => index <= maxLevel && index > 0)
    .map((item: string) => `/${item}`)
    .join('')
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: allRoutes,
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth'
    }
  }
})

const whiteList = ['/login']

router.beforeEach(async (to, _, next) => {
  const userStore = useUserStore()
  const hasToken = userStore.token

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router
