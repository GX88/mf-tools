import type { Settings } from '#/global'
import apiUser from '@renderer/api/modules/user'
import router from '@renderer/router'
import settingsDefault from '@renderer/settings'
import eventBus from '@renderer/utils/eventBus'
import { diffTwoObj, mergeWithoutUndefinedProps } from '@renderer/utils/object'
import { cloneDeep } from 'es-toolkit'

export const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const tabbarStore = useTabbarStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()

    const account = ref(localStorage.getItem('account') ?? '')
    const token = ref(localStorage.getItem('token') ?? '')
    const avatar = ref(localStorage.getItem('avatar') ?? '')
    const permissions = ref<string[]>([])
    const isLogin = computed(() => {
      if (token.value) {
        return true
      }
      return false
    })

    // 登录
    async function login(_data: {
      account: string
      password: string
      code: string
      sign: string
      timestamp: string
    }) {
      // const res = await apiUser.login(_data)
      localStorage.setItem('account', '18636045060')
      localStorage.setItem('token', '1234567890')
      localStorage.setItem(
        'avatar',
        'https://fastly.picsum.photos/id/196/200/200.jpg?hmac=sQvBWK3YS9nyc8fxqMAEar9EpxOlkMcWL-VePbARdIU',
      )
      account.value = '18636045060'
      token.value = '1234567890'
      avatar.value
        = 'https://fastly.picsum.photos/id/196/200/200.jpg?hmac=sQvBWK3YS9nyc8fxqMAEar9EpxOlkMcWL-VePbARdIU'
    }

    // 手动登出
    function logout(redirect = router.currentRoute.value.fullPath) {
      localStorage.removeItem('token')
      token.value = ''
      router
        .push({
          name: 'login',
          query: {
            ...(redirect !== settingsStore.settings.home.fullPath
              && router.currentRoute.value.name !== 'login' && { redirect }),
          },
        })
        .then(logoutCleanStatus)
    }
    // 请求登出
    function requestLogout() {
      if (
        settingsStore.settings.app.loginExpiredMode === 'redirect'
        || !routeStore.isGenerate
      ) {
        localStorage.removeItem('token')
        token.value = ''
        router
          .push({
            name: 'login',
            query: {
              ...(router.currentRoute.value.fullPath
                !== settingsStore.settings.home.fullPath
                && router.currentRoute.value.name !== 'login' && {
                redirect: router.currentRoute.value.fullPath,
              }),
            },
          })
          .then(logoutCleanStatus)
      }
      else {
        // 此处仅清除 localStorage 中登录状态的变量，以保证在弹出登录窗口模式下页面展示依旧正常
        localStorage.removeItem('token')
        eventBus.emit('global-login-again-visible')
      }
    }
    // 登出后清除状态
    function logoutCleanStatus() {
      localStorage.removeItem('account')
      localStorage.removeItem('avatar')
      account.value = ''
      avatar.value = ''
      permissions.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.setActived(0)
    }

    // 获取权限
    async function getPermissions() {
      const res = await apiUser.permission()
      permissions.value = res.data.permissions
    }

    // 修改密码
    async function editPassword(data: {
      password: string
      newPassword: string
    }) {
      await apiUser.passwordEdit(data)
    }

    // 框架已将可提供给用户配置的选项提取出来，请勿新增其他选项，不需要的选项可以在这里注释掉
    const preferences = ref<Settings.all>({
      app: {
        themeSync: settingsDefault.app.themeSync,
        colorScheme: settingsDefault.app.colorScheme,
        lightTheme: settingsDefault.app.lightTheme,
        darkTheme: settingsDefault.app.darkTheme,
        radius: settingsDefault.app.radius,
        enableColorAmblyopiaMode: settingsDefault.app.enableColorAmblyopiaMode,
        enableProgress: settingsDefault.app.enableProgress,
        defaultLang: settingsDefault.app.defaultLang,
      },
      menu: {
        mode: settingsDefault.menu.mode,
        style: settingsDefault.menu.style,
        enableDark: settingsDefault.menu.enableDark,
        mainMenuClickMode: settingsDefault.menu.mainMenuClickMode,
        subMenuUniqueOpened: settingsDefault.menu.subMenuUniqueOpened,
        subMenuCollapse: settingsDefault.menu.subMenuCollapse,
        subMenuAutoCollapse: settingsDefault.menu.subMenuAutoCollapse,
        enableSubMenuCollapseButton:
          settingsDefault.menu.enableSubMenuCollapseButton,
      },
      layout: {
        widthMode: settingsDefault.layout.widthMode,
        widthModeScope: settingsDefault.layout.widthModeScope,
      },
      mainPage: {
        enableTransition: settingsDefault.mainPage.enableTransition,
        transitionMode: settingsDefault.mainPage.transitionMode,
      },
      topbar: {
        mode: settingsDefault.topbar.mode,
        switchTabbarAndToolbar: settingsDefault.topbar.switchTabbarAndToolbar,
      },
      tabbar: {
        style: settingsDefault.tabbar.style,
        enableIcon: settingsDefault.tabbar.enableIcon,
        dblclickAction: settingsDefault.tabbar.dblclickAction,
        enableMemory: settingsDefault.tabbar.enableMemory,
      },
      toolbar: {
        breadcrumb: settingsDefault.toolbar.breadcrumb,
        navSearch: settingsDefault.toolbar.navSearch,
        fullscreen: settingsDefault.toolbar.fullscreen,
        pageReload: settingsDefault.toolbar.pageReload,
        colorScheme: settingsDefault.toolbar.colorScheme,
        layout: settingsDefault.toolbar.layout,
      },
      breadcrumb: {
        style: settingsDefault.breadcrumb.style,
        enableMainMenu: settingsDefault.breadcrumb.enableMainMenu,
      },
    })
    // isPreferencesUpdating 用于防止循环更新
    let isPreferencesUpdating = false
    watch(
      () => settingsStore.settings,
      (val) => {
        if (!settingsStore.settings.userPreferences.enable) {
          return
        }
        if (!isPreferencesUpdating) {
          isPreferencesUpdating = true
          preferences.value = mergeWithoutUndefinedProps(
            val,
            preferences.value,
          )
        }
        else {
          isPreferencesUpdating = false
        }
      },
      {
        deep: true,
      },
    )
    watch(
      preferences,
      (val) => {
        if (!settingsStore.settings.userPreferences.enable) {
          return
        }
        if (!isPreferencesUpdating) {
          isPreferencesUpdating = true
          settingsStore.updateSettings(cloneDeep(val))
        }
        else {
          isPreferencesUpdating = false
        }
        updatePreferences(cloneDeep(val))
      },
      {
        deep: true,
      },
    )
    // isPreferencesInited 用于防止初始化时触发更新
    let isPreferencesInited = false
    // 获取偏好设置
    async function getPreferences() {
      let data: Settings.all = {}
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        if (localStorage.has('userPreferences')) {
          data
            = JSON.parse(localStorage.getItem('userPreferences') as string)[
              account.value
            ] || {}
        }
      }
      else if (
        settingsStore.settings.userPreferences.storageTo === 'server'
      ) {
        const res = await apiUser.preferences()
        data = JSON.parse(res.data.preferences || '{}') as Settings.all
      }
      preferences.value = mergeWithoutUndefinedProps(data, preferences.value)
    }
    // 更新偏好设置
    async function updatePreferences(data: Settings.all = {}) {
      if (!isPreferencesInited) {
        isPreferencesInited = true
        return
      }
      if (!isLogin.value) {
        return
      }
      data = diffTwoObj(settingsDefault, data)
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        const userPreferencesData = localStorage.has('userPreferences')
          ? JSON.parse(localStorage.getItem('userPreferences') as string)
          : {}
        userPreferencesData[account.value] = data
        localStorage.setItem(
          'userPreferences',
          JSON.stringify(userPreferencesData),
        )
      }
      else if (
        settingsStore.settings.userPreferences.storageTo === 'server'
      ) {
        await apiUser.preferencesEdit(JSON.stringify(data))
      }
    }

    return {
      account,
      token,
      avatar,
      permissions,
      isLogin,
      login,
      logout,
      requestLogout,
      getPermissions,
      editPassword,
      preferences,
      getPreferences,
      updatePreferences,
    }
  },
)
