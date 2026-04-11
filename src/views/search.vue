<script setup lang="ts">
import { onActivated, ref } from 'vue';
import topBar from '../component/search/topBar.vue';
import empty from '../component/search/empty.vue';
import SearchLoading from '../component/search/loading.vue';
import searchResult from '../component/search/searchResult.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'Search'
})

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()
// 进入页面时，重新应用页面设置
onActivated(() => {
  applyPageSettings()
})

const searching = ref<'empty' | 'loading' | 'result'>('empty');
const tab = ref('video');

const searchHistory = ref<string[]>([]);
const searchRecommend = ref<string[]>([]);
// 生成搜索历史测试数据
for (let i = 0; i < 100; i++) {
  searchHistory.value.push(`搜索历史${i}`);
  searchRecommend.value.push(`搜索推荐${i}`);
}
interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
}
const videoResult = ref<ListItem[]>([]);
const imageResult = ref<ListItem[]>([]);
// 生成搜索结果测试数据
for (let i = 0; i < 100; i++) {
  videoResult.value.push({
    id: `video_${i}`,
    title: `视频结果${i}`,
    img: 'https://picsum.photos/200/300',
    author: '作者',
    time: '2023-01-01',
    viewNum: '1000',
    likeNum: '100',
    longNum: '10:00',
    isR18: false
  });
  imageResult.value.push({
    id: `image_${i}`,
    title: `插画结果${i}`,
    img: 'https://picsum.photos/200/300',
    author: '作者',
    time: '2023-01-01',
    viewNum: '1000',
    likeNum: '100',
    longNum: '10',
    isR18: false
  });
}
</script>
<template>
  <div id="searchView">
    <topBar class="topBar" />
    <empty v-if="searching === 'empty'" :search-history="searchHistory" :search-recommend="searchRecommend" />
    <SearchLoading v-else-if="searching === 'loading'" />
    <searchResult v-else-if="searching === 'result'" :video-result="videoResult" :image-result="imageResult"
      v-model:tab="tab" />
  </div>
</template>
<style lang="scss" scoped>
#searchView {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 1
}

.topBar {
  position: absolute;
  top: 0;
  z-index: 500;
}
</style>