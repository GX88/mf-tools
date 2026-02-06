import { defineStore } from 'pinia';
import { getToken, setToken, removeToken } from '@renderer/src/utils/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    avatar: '',
    roles: [] as string[],
  }),
  getters: {
    isLogin: (state) => !!state.token,
  },
  actions: {
    // 模拟登录，实际项目应调用 API
    login(token: string) {
      this.token = token;
      setToken(token);
    },
    // 登出
    async logout() {
      this.token = '';
      this.roles = [];
      removeToken();
      const { default: router } = await import('@renderer/src/router');
      router.push('/login');
    },
    // 重置 Token
    resetToken() {
      this.token = '';
      this.roles = [];
      removeToken();
    }
  },
  persist: true,
});
