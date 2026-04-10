<script setup lang="ts">
import homeNavigation from '../component/home/navigation.vue';
import homeVideo from '../component/home/video.vue';
import homeImage from '../component/home/image.vue';
import homeSubscribe from '../component/home/subscribe.vue';
import homeForum from '../component/home/forum.vue';
import homeMy from '../component/home/my.vue';
import { ref, onMounted, onBeforeUnmount, onActivated } from 'vue';
// import { on } from 'hammerjs';
import { lockPortrait } from '../plugins/useOrientation'
import { setStatusBarTextStyle, setNavigationBarButtonStyle } from '../plugins/navbarStyle'

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Home'
})

const isTab = ref("subscribe");

// 添加双击返回检测相关变量
let lastBackPressedTime: number | null = null;
const DOUBLE_BACK_PRESS_TIMEOUT = 2000; // 2秒内再次按下返回键则退出

// 应用页面设置的函数
const applyPageSettings = () => {
  // 固定竖屏
  lockPortrait()
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
  // 设置导航栏黑色按钮
  setNavigationBarButtonStyle('dark')
}

// 初始加载时应用设置
applyPageSettings()

// 当页面被激活时（从 keep-alive 缓存中恢复）也应用设置
onActivated(() => {
  applyPageSettings()
})

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
const handleTabChange = (tab: string) => {
  isTab.value = tab;
}

// 处理返回键事件，将tab切换到subscribe
const handleBackPressed = () => {
  const currentTime = Date.now();
  
  if(isTab.value !== 'subscribe') {
    // 如果不在订阅页面，则切换到订阅页面
    isTab.value = 'subscribe';
    // 记录点击时间，以便实现双击退出
    showShortToast('再按一次返回键退出应用');
    lastBackPressedTime = currentTime;
  } else {
    // 如果已经在订阅页面，执行双击退出逻辑
    if (lastBackPressedTime && currentTime - lastBackPressedTime <= DOUBLE_BACK_PRESS_TIMEOUT) {
      moveTaskToBack(); // 执行退出
    } else {
      // 第一次点击，提示用户再按一次退出
      showShortToast('再按一次返回键退出应用');
      lastBackPressedTime = currentTime;
    }
  }
}

// 导入showShortToast函数
import { showShortToast } from '../core/toast';

// 导入moveTaskToBack函数
import { moveTaskToBack } from '../plugins/appControl';
</script>

<template>
  <div id="homeView">
    <!-- 内容区域 -->
    <homeVideo class="main" v-if="isTab === 'video'" />
    <homeImage class="main" v-else-if="isTab === 'image'" />
    <homeSubscribe class="main" v-else-if="isTab === 'subscribe'" />
    <homeForum class="main" v-else-if="isTab === 'forum'" />
    <homeMy class="main" v-else-if="isTab === 'my'" />
    <!-- 底部按钮 -->
    <homeNavigation class="bottom" :model-value="isTab" @update:tab="handleTabChange" />
  </div>
</template>

<style lang="scss" scoped>
#homeView {
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  overflow: hidden;
  z-index: 1;
}

.bottom {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 400;
}
</style>