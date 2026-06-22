<script setup lang="ts">
import homeNavigation from '../component/home/navigation.vue';
import homeNavigationVertical from '../component/home/navigationVertical.vue';
import homeVideo from '../component/home/video.vue';
import homeImage from '../component/home/image.vue';
import homeSubscribe from '../component/home/subscribe.vue';
import homeForum from '../component/home/forum.vue';
import homeMy from '../component/home/my.vue';
import { ref, nextTick, onMounted, onBeforeUnmount, onActivated, provide, watch } from 'vue';
import { useI18n } from 'vue-i18n';
// import { on } from 'hammerjs';
import { lockPortrait } from '../plugins/useOrientation'
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import { showShortToast } from '../core/toast';
import { moveTaskToBack } from '../plugins/appControl';
import { isLogin as isLoginStore } from '../core/store';

const { t } = useI18n();

// 定义Tab类型
type TabType = 'video' | 'image' | 'subscribe' | 'forum' | 'my';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Home'
})

const isTab = ref<TabType>('subscribe');
// 新增：用于通知子组件刷新的令牌
const refreshToken = ref(0);

// 添加双击返回检测相关变量
let lastBackPressedTime: number | null = null;
const DOUBLE_BACK_PRESS_TIMEOUT = 2000; // 2秒内再次按下返回键则退出

// 自动状态栏文字颜色自适应（根据 --color-primary-90 亮度判断）
useAutoStatusBar({ cssVar: '--color-primary-90' })

// 固定竖屏
lockPortrait()

onMounted(() => {
  // 监听来自App.vue的返回键事件
  window.addEventListener('home-back-pressed', handleBackPressed);
  // console.log('✅ Home mounted');
})
onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('home-back-pressed', handleBackPressed);
  // console.log('❌ Home unmounted');
})
// 处理底部按钮tab变化
const handleTabChange = (tab: TabType) => {
  isTab.value = tab;
}

// 处理返回键事件，将tab切换到subscribe
const handleBackPressed = () => {
  const currentTime = Date.now();

  if (isTab.value !== 'subscribe') {
    // 如果不在订阅页面，则切换到订阅页面
    isTab.value = 'subscribe';
    // 记录点击时间，以便实现双击退出
    showShortToast(t('home.toast.pressAgainToExit'));
    lastBackPressedTime = currentTime;
  } else {
    // 如果已经在订阅页面，执行双击退出逻辑
    if (lastBackPressedTime && currentTime - lastBackPressedTime <= DOUBLE_BACK_PRESS_TIMEOUT) {
      moveTaskToBack(); // 执行退出
    } else {
      // 第一次点击，提示用户再按一次退出
      showShortToast(t('home.toast.pressAgainToExit'));
      lastBackPressedTime = currentTime;
    }
  }
}

const tabSwitchToMy = () => {
  console.log('tabSwitchToMy')
  isTab.value = 'my'
}
provide('tabSwitchToMy', tabSwitchToMy)

provide('isTab', isTab)

const refresh = (data: TabType) => {
  console.log('refresh:', data)
  // 更新刷新令牌，通知子组件
  refreshToken.value++
}
provide('refreshToken', refreshToken)

// 监听登录版本号变化，重新登录时重置选项卡并刷新所有子组件数据
const loginStore = isLoginStore();
watch(() => loginStore.loginVersion, () => {
  // 仅在已登录状态下刷新，避免退出时 token 已清空导致 API 报错
  if (!loginStore.value) return;
  // 重置选项卡到默认的 subscribe
  isTab.value = 'subscribe';
  // 使用 nextTick 确保选项卡切换后再刷新子组件数据
  nextTick(() => {
    refreshToken.value++;
    console.log('重新登录后刷新首页数据');
  });
});

</script>

<template>
  <div id="homeView">
    <!-- 纵向导航（>= md 宽度时显示） -->
    <homeNavigationVertical class="nav-vertical" :model-value="isTab" @update:tab="handleTabChange" @refresh="refresh" />
    <div class="main-wrapper">
      <!-- 内容区域 -->
      <homeVideo class="main" v-show="isTab === 'video'" />
      <homeImage class="main" v-show="isTab === 'image'" />
      <homeSubscribe class="main" v-show="isTab === 'subscribe'" />
      <homeForum class="main" v-show="isTab === 'forum'" />
      <homeMy class="main" v-show="isTab === 'my'" />
    </div>
    <!-- 底部横向导航（< md 宽度时显示） -->
    <homeNavigation class="bottom" :model-value="isTab" @update:tab="handleTabChange" @refresh="refresh" />
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/mixins' as *;

#homeView {
  background-color: var(--color-bg-page);
  display: flex;
  flex-direction: column;

  // 大屏时改为行布局
  @include up(md) {
    flex-direction: row;
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.main {
  flex: 1;
  overflow: hidden;
  z-index: 1;
}

.bottom {
  position: absolute;
  width: 100%;
  z-index: 400;
  left: 0;
  bottom: 0;

  // 大屏时隐藏底部横向导航
  @include up(md) {
    display: none;
  }
}

.nav-vertical {
  display: none;

  // 大屏时显示纵向导航
  @include up(md) {
    display: flex;
    flex-shrink: 0;
    width: 74px;
  }
}
</style>