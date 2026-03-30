<script setup lang="ts">
import homeSearchBar from '../component/home/searchBar.vue';
import homeBottomButton from '../component/home/bottomButton.vue';
import homeVideo from '../component/home/video.vue';
import homeImage from '../component/home/image.vue';
import homeSubscribe from '../component/home/subscribe.vue';
import homeForum from '../component/home/forum.vue';
import homeMy from '../component/home/my.vue';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { on } from 'hammerjs';
import { lockPortrait } from '../core/useOrientation'
import { setNavBarStyle } from '../core/navbarStyle'

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Home'
})

const isTab = ref("subscribe");

// 固定竖屏
lockPortrait()
// 设置导航栏样式
setNavBarStyle({ style: 'light' })


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
    <homeSearchBar />
    <div class="main">
      <homeVideo v-if="isTab === 'video'" />
      <homeImage v-else-if="isTab === 'image'" />
      <homeSubscribe v-else-if="isTab === 'subscribe'" />
      <homeForum v-else-if="isTab === 'forum'" />
      <homeMy v-else-if="isTab === 'my'" />
    </div>
    <homeBottomButton :model-value="isTab" @update:tab="handleTabChange" />
  </div>
</template>

<style lang="scss" scoped>
#home {
  height: 100%;
  background-color: #fafafa; // Material Design背景色
}

.main {
  height: calc(100% - 60px - 60px - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0));
  padding: 0 env(safe-area-inset-right, 0) 0 env(safe-area-inset-left, 0);
  background-color: #fafafa;
}
</style>