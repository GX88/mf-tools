import { defineStore } from 'pinia'
import { getToken, setToken, removeToken } from '@renderer/src/utils/auth'
import BaseApi, { LoginRequest } from '@renderer/src/api/base'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    customerName: ''
  }),
  getters: {
    isLogin: (state) => !!state.token
  },
  actions: {
    // 模拟登录，实际项目应调用 API
    async login(data: LoginRequest) {
      const res = await BaseApi.login(data)

      this.token = res.data.token
      setToken(res.data.token)

      this.name = res.data.name
      this.customerName = res.data.customerName

      // 登录成功后，跳转到首页
      const { default: router } = await import('@renderer/src/router')
      router.push('/')
    },
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
    }
  },
  persist: true
})
