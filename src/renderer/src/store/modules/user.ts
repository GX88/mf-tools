import type { LoginRequest } from '@renderer/src/api/base'
import { t } from '@renderer/src/locales'
import { getToken, removeToken, setToken } from '@renderer/src/utils/auth'
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    customerName: '',
  }),
  getters: {
    isLogin: state => !!state.token,
  },
  actions: {
    // 模拟登录，实际项目应调用 API
    async login(data?: LoginRequest) {
      // console.log(data);
      if (!data) {
        toast.error(t('login.message.error'))
        return
      }

      this.token = '123456'
      setToken(this.token)

      toast.success(t('login.message.success'))

      const { default: router } = await import('@renderer/src/router')
      router.push('/')
    },
    // async login(data: LoginRequest) {
    //   const res = await BaseApi.login(data)

    //   this.token = res.data.token
    //   setToken(res.data.token)

    //   this.name = res.data.name
    //   this.customerName = res.data.customerName

    // toast.success(t('login.message.success'))

    //   // 登录成功后，跳转到首页
    //   const { default: router } = await import('@renderer/src/router')
    //   router.push('/')
    // },
    // 登出
    async logout() {
      this.token = ''
      this.name = ''
      this.customerName = ''
      removeToken()
      const { default: router } = await import('@renderer/src/router')
      router.push('/login')
    },
    // 重置 Token
    resetToken() {
      this.token = ''
      this.name = ''
      this.customerName = ''
      removeToken()
    },
  },
  persist: true,
})
