<script setup lang="ts">
import homeSearchBar from '../component/homeSearchBar.vue';
import homeBottomButton from '../component/homeBottomButton.vue';
import homeVideo from '../component/homeVideo.vue';
import homeImage from '../component/homeImage.vue';
import homeSubscribe from '../component/homeSubscribe.vue';
import homeForum from '../component/homeForum.vue';
import homeMy from '../component/homeMy.vue';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { on } from 'hammerjs';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Home'
})

const isTab = ref("subscribe");

onMounted(() => {
  console.log('✅ Home mounted');
})

onBeforeUnmount(() => {
  console.log('❌ Home unmounted');
})

// 处理底部按钮tab变化
const handleTabChange = (tab: string) => {
  isTab.value = tab;
  console.log('HomeAsb changed to:', tab);
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