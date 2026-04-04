<script setup lang="ts">
import homeTopBar from '../component/home/topBar.vue';
import homeBottomButton from '../component/home/bottomButton.vue';
import homeVideo from '../component/home/video.vue';
import homeImage from '../component/home/image.vue';
import homeSubscribe from '../component/home/subscribe.vue';
import homeForum from '../component/home/forum.vue';
import homeMy from '../component/home/my.vue';
import { ref, onMounted, onBeforeUnmount, onActivated } from 'vue';
// import { on } from 'hammerjs';
import { lockPortrait } from '../plugins/useOrientation'
import { setNavBarStyle } from '../plugins/navbarStyle'

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Home'
})

const isTab = ref("subscribe");

// 应用页面设置的函数
const applyPageSettings = () => {
  // 固定竖屏
  lockPortrait()
  // 设置导航栏样式
  setNavBarStyle({ style: 'light' })
}

// 初始加载时应用设置
applyPageSettings()

// 当页面被激活时（从 keep-alive 缓存中恢复）也应用设置
onActivated(() => {
  applyPageSettings()
})

onMounted(() => {
  // console.log('✅ Home mounted');
})
onBeforeUnmount(() => {
  // console.log('❌ Home unmounted');
})
// 处理底部按钮tab变化
const handleTabChange = (tab: string) => {
  isTab.value = tab;
}
</script>

<template>
  <div id="home">
    <!-- 导航栏 -->
    <homeTopBar class="top" />
    <!-- 主内容区域 -->
    <homeVideo class="main" v-if="isTab === 'video'" />
    <homeImage class="main" v-else-if="isTab === 'image'" />
    <homeSubscribe class="main" v-else-if="isTab === 'subscribe'" />
    <homeForum class="main" v-else-if="isTab === 'forum'" />
    <homeMy class="main" v-else-if="isTab === 'my'" />
    <!-- 底部按钮 -->
    <homeBottomButton class="bottom" :model-value="isTab" @update:tab="handleTabChange" />
  </div>
</template>

<style lang="scss" scoped>
#home {
  height: 100%;
  background-color: #fafafa; // Material Design背景色
  display: flex;
  flex-direction: column;
}

.top {
  z-index: 400;
}

.main {
  // height: calc(100% - 60px - 60px - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0));
  // padding: 0 env(safe-area-inset-right, 0) 0 env(safe-area-inset-left, 0);
  background-color: #fafafa;
  flex: 1;
  z-index: 1;
  overflow: hidden;
}

.bottom {
  z-index: 500;
}
</style>