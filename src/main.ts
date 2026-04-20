import { createApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";
import router from "./router";
import "./assets/style.scss";

// 在 Vue 挂载前立即设置背景色，防止闪烁
// document.documentElement.style.backgroundColor = '#4DB6AC';
// document.body.style.backgroundColor = '#4DB6AC';

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const vuetify = createVuetify({
  components,
  directives,
})

import { install } from '@icon-park/vue-next/es/all'
import '@icon-park/vue-next/styles/index.css';


import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

import Hammer from 'hammerjs';

// 初始化数据库
import { initDatabase, checkUserIsLogin } from "./core/database";
await initDatabase();

// 引入store
import { isLogin } from "./core/store";

// 检测是否为桌面端（非触摸设备）
const isDesktop = !window.matchMedia('(pointer: coarse)').matches;
if (isDesktop) {
  document.documentElement.classList.add('desktop-only');
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);
install(app);
install(app, 'i');
library.add(fas, far, fab)
app.component('font-awesome-icon', FontAwesomeIcon);
app.config.globalProperties.$hammer = Hammer;

app.mount("#app");

router.isReady().then(() => {
  // 检查用户登录状态
  checkUserIsLogin().then((result) => {
    isLogin().set(result);
  }).catch(() => {
    isLogin().set(false);
  }).finally(() => {
    hideLoading();
  });
});

// 隐藏加载遮罩
function hideLoading() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('fade');
    setTimeout(() => {
      loadingElement.classList.add('hidden');
    }, 200);
  }
}

/** 测试代码 */
// import { getDeviceInfo } from "./plugins/deviceInfo";
// const deviceInfo = await getDeviceInfo();
// console.log(deviceInfo);
