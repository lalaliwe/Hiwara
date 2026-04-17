import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false, // 登录状态，默认为false
  }),

  getters: {
    // 如果需要，可以在这里添加getter
  },

  actions: {
    // 设置登录状态的方法
    setLoginStatus(status: boolean) {
      this.isLoggedIn = status;
    },

    // 登录操作
    login() {
      this.isLoggedIn = true;
    },

    // 登出操作
    logout() {
      this.isLoggedIn = false;
    }
  },
});