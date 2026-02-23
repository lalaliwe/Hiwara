<script setup lang="ts">
import homeSearchBar from '../component/homeSearchBar.vue';
import homeBottomButton from '../component/homeBottomButton.vue';
import homeVideo from '../component/homeVideo.vue';
import homeImage from '../component/homeImage.vue';
import homeSubscribe from '../component/homeSubscribe.vue';
import homeForum from '../component/homeForum.vue';
import homeMy from '../component/homeMy.vue';
import { ref } from 'vue';

const isTab = ref("subscribe");

// 处理底部按钮tab变化
const handleTabChange = (tab: string) => {
  isTab.value = tab;
}
</script>

<template>
  <homeSearchBar />
  <div class="main">
    <homeVideo v-if="isTab === 'video'" />
    <homeImage v-else-if="isTab === 'image'" />
    <homeSubscribe v-else-if="isTab === 'subscribe'" />
    <homeForum v-else-if="isTab === 'forum'" />
    <homeMy v-else-if="isTab === 'my'" />
  </div>
  <homeBottomButton :model-value="isTab" @update:tab="handleTabChange" />
</template>

<style lang="scss" scoped>
.main {
  height: calc(100% - 60px - 75px - env(safe-area-inset-top, 0));
}
</style>