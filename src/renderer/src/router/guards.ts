import type { Router } from 'vue-router'
// import { useNProgress } from '@vueuse/integrations/useNProgress'
import { asyncRoutes, asyncRoutesByFilesystem } from './routes'
import '@renderer/assets/styles/nprogress.css'
import { createBuildWatcherLoading } from '@renderer/utils/build-watcher'

function setupRoutes(router: Router) {
  router.beforeEach(async (to) => {
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()
    const tabbarStore = useTabbarStore()
    const favoritesStore = useFavoritesStore()
    // 是否已登录
    if (userStore.isLogin) {
      // 是否已根据权限动态生成并注册路由
      if (routeStore.isGenerate) {
        // 导航栏如果不是 single 模式，则需要根据 path 定位主导航的选中状态
        settingsStore.settings.menu.mode !== 'single' && menuStore.setActived(to.path)
        // 如果已登录状态下，进入登录页会强制跳转到主页
        if (to.name === 'login') {
          return {
            path: settingsStore.settings.home.fullPath,
            replace: true,
          }
        }
        // 如果未开启主页，但进入的是主页，则会进入第一个固定标签页或者侧边栏导航第一个模块
        else if (!settingsStore.settings.home.enable && to.fullPath === settingsStore.settings.home.fullPath) {
          const firstPin = tabbarStore.list.find(v => v.isPin)
          if (settingsStore.settings.tabbar.enable && firstPin) {
            return {
              path: firstPin.fullPath,
              replace: true,
            }
          }
          else if (menuStore.sidebarMenus.length > 0) {
            return {
              path: menuStore.sidebarMenusFirstDeepestPath,
              replace: true,
            }
          }
        }
      }
      else {
        try {
          // 获取用户权限
          settingsStore.settings.app.enablePermission && await userStore.getPermissions()
          // 获取用户偏好设置
          settingsStore.settings.userPreferences.enable && await userStore.getPreferences()
          // 生成动态路由
          switch (settingsStore.settings.app.routeBaseOn) {
            case 'frontend':
              routeStore.generateRoutesAtFront(asyncRoutes)
              break
            case 'backend':
              await routeStore.generateRoutesAtBack()
              break
            case 'filesystem':
              routeStore.generateRoutesAtFilesystem(asyncRoutesByFilesystem)
              // 文件系统生成的路由，需要手动生成导航数据
              switch (settingsStore.settings.menu.baseOn) {
                case 'frontend':
                  menuStore.generateMenusAtFront()
                  break
                case 'backend':
                  await menuStore.generateMenusAtBack()
                  break
              }
              break
          }
          // 注册并记录路由数据
          // 记录的数据会在登出时会使用到，不使用 router.removeRoute 是考虑配置的路由可能不一定有设置 name ，则通过调用 router.addRoute() 返回的回调进行删除
          const removeRoutes: (() => void)[] = []
          routeStore.routes.forEach((route) => {
            if (!/^(?:https?:|mailto:|tel:)/.test(route.path)) {
              removeRoutes.push(router.addRoute(route))
            }
          })
          if (settingsStore.settings.app.routeBaseOn !== 'filesystem') {
            routeStore.systemRoutes.forEach((route) => {
              removeRoutes.push(router.addRoute(route))
            })
          }
          routeStore.setCurrentRemoveRoutes(removeRoutes)
          // 复原标签页
          settingsStore.settings.tabbar.enable && await tabbarStore.recoveryStorage()
          // 复原收藏夹
          settingsStore.settings.toolbar.favorites && await favoritesStore.recoveryStorage()
        }
        catch { }
        // 动态路由生成并注册后，重新进入当前路由
        return {
          path: to.path,
          query: to.query,
          replace: true,
        }
      }
    }
    else {
      if (!to?.meta?.whiteList) {
        return {
          name: 'login',
          query: {
            redirect: to.fullPath !== settingsStore.settings.home.fullPath ? to.fullPath : undefined,
          },
        }
      }
    }
  })
}

// 当父级路由未配置重定向时，自动重定向到有访问权限的子路由
function setupRedirectAuthChildrenRoute(router: Router) {
  router.beforeEach((to) => {
    const { auth } = useAuth()
    const currentRoute = router.getRoutes().find(route => route.path === (to.matched.at(-1)?.path ?? ''))
    if (!currentRoute?.redirect) {
      const findAuthRoute = currentRoute?.children?.find(route => route.meta?.menu !== false && auth(route.meta?.auth ?? ''))
      if (findAuthRoute) {
        return findAuthRoute
      }
    }
  })
}

// 最大化
function setupMaximize(router: Router) {
  router.afterEach((to, from) => {
    const settingsStore = useSettingsStore()
    if (to.meta.maximize) {
      settingsStore.setMainPageMaximize(true)
    }
    else if (from.meta.exitMaximize) {
      settingsStore.setMainPageMaximize(false)
    }
  })
}

// 进度条
function setupProgress(router: Router) {
  // 原型 nprogress 加载环（已注释）
  // const { isLoading } = useNProgress()
  // router.beforeEach(() => {
  //   const settingsStore = useSettingsStore()
  //   if (settingsStore.settings.app.enableProgress) {
  //     isLoading.value = true
  //   }
  // })
  // router.afterEach(() => {
  //   const settingsStore = useSettingsStore()
  //   if (settingsStore.settings.app.enableProgress) {
  //     isLoading.value = false
  //   }
  // })

  // 移植的加载三角
  const buildWatcherLoading = createBuildWatcherLoading()
  router.beforeEach(() => {
    const settingsStore = useSettingsStore()
    if (settingsStore.settings.app.enableProgress) {
      buildWatcherLoading.show()
    }
  })
  router.afterEach(() => {
    const settingsStore = useSettingsStore()
    if (settingsStore.settings.app.enableProgress) {
      buildWatcherLoading.hide()
    }
  })
}

// 标题
function setupTitle(router: Router) {
  router.afterEach((to) => {
    const settingsStore = useSettingsStore()
    if (settingsStore.settings.app.routeBaseOn !== 'filesystem') {
      settingsStore.setTitle(to.matched?.at(-1)?.meta?.title ?? to.meta.title)
    }
    else {
      settingsStore.setTitle(to.meta.title)
    }
  })
}

// 页面缓存
function setupKeepAlive(router: Router) {
  router.afterEach(async (to, from) => {
    const keepAliveStore = useKeepAliveStore()
    if (to.fullPath !== from.fullPath) {
      if (to.meta.cache && !to.meta.iframe) {
        const componentName = to.matched.at(-1)?.components?.default.name
        if (componentName) {
          // 缓存当前页面前，先判断是否需要进行清除缓存，判断依据：
          // 1. 如果 to.meta.cache 为 boolean 类型，并且不为 true，则需要清除缓存
          // 2. 如果 to.meta.cache 为 string 类型，并且与 from.name 不一致，则需要清除缓存
          // 3. 如果 to.meta.cache 为 array 类型，并且不包含 from.name，则需要清除缓存
          // 4. 如果 to.meta.noCache 为 string 类型，并且与 from.name 一致，则需要清除缓存
          // 5. 如果 to.meta.noCache 为 array 类型，并且包含 from.name，则需要清除缓存
          // 6. 如果是刷新页面，则需要清除缓存
          let shouldClearCache = false
          if (typeof to.meta.cache === 'boolean') {
            shouldClearCache = !to.meta.cache
          }
          else if (typeof to.meta.cache === 'string') {
            shouldClearCache = to.meta.cache !== from.name
          }
          else if (Array.isArray(to.meta.cache)) {
            shouldClearCache = !to.meta.cache.includes(from.name as string)
          }
          if (to.meta.noCache) {
            if (typeof to.meta.noCache === 'string') {
              shouldClearCache = to.meta.noCache === from.name
            }
            else if (Array.isArray(to.meta.noCache)) {
              shouldClearCache = to.meta.noCache.includes(from.name as string)
            }
          }
          if (from.name === 'reload') {
            shouldClearCache = true
          }
          if (shouldClearCache) {
            keepAliveStore.remove(componentName)
            await nextTick()
          }
          keepAliveStore.add(componentName)
        }
        else {
          // turbo-console-disable-next-line
          console.warn('[Fantastic-admin] 该页面组件未设置组件名，会导致缓存失效，请检查')
        }
      }
    }
  })
}

// iframe 缓存
function setupIframeCache(router: Router) {
  router.afterEach((to, from) => {
    const iframeStore = useIframeStore()
    if (to.fullPath !== from.fullPath) {
      if (to.meta.iframe) {
        iframeStore.open({
          path: to.fullPath,
          src: (to.query.iframe as string) ?? to.meta.iframe,
          title: (to.query.title as string) ?? to.meta.title,
        })
      }
      if (from.meta.iframe) {
        if (from.meta.cache) {
          switch (typeof from.meta.cache) {
            case 'string':
              if (from.meta.cache !== to.name) {
                iframeStore.close(from.fullPath)
              }
              break
            case 'object':
              if (!from.meta.cache.includes(to.name as string)) {
                iframeStore.close(from.fullPath)
              }
              break
          }
          if (from.meta.noCache) {
            switch (typeof from.meta.noCache) {
              case 'string':
                if (from.meta.noCache === to.name) {
                  iframeStore.close(from.fullPath)
                }
                break
              case 'object':
                if (from.meta.noCache.includes(to.name as string)) {
                  iframeStore.close(from.fullPath)
                }
                break
            }
          }
          if (to.name === 'reload') {
            iframeStore.close(from.fullPath)
          }
        }
        else {
          iframeStore.close(from.fullPath)
        }
      }
    }
  })
}

// 其他
function setupOther(router: Router) {
  router.afterEach(() => {
    document.documentElement.scrollTop = 0
  })
}

export default function setupGuards(router: Router) {
  setupRoutes(router)
  setupRedirectAuthChildrenRoute(router)
  setupMaximize(router)
  setupProgress(router)
  setupTitle(router)
  setupKeepAlive(router)
  setupIframeCache(router)
  setupOther(router)
}
