import { defineStore } from 'pinia';

export const isLogin = defineStore('isLogin', {
  state: () => ({
    value: false, // 登录状态，默认为false
  }),
  getters: {
    // 如果需要，可以在这里添加getter
  },
  actions: {
    // 设置登录状态的方法
    set(status: boolean) {
      this.value = status;
    }
  },
});

export const token = defineStore('token', {
  state: () => ({ value: null as string | null }),
  actions: {
    set(token: string) {
      this.value = token;
    }
  }
})