<script setup lang="ts">
import { ref, onActivated } from 'vue';
import topBar from '../component/search/topBar.vue';
import empty from '../component/search/empty.vue';
import SearchLoading from '../component/search/loading.vue';
import cardButton from '../component/cardButton.vue';

const searching = ref<'empty' | 'loading' | 'result'>('result');
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

const videoListView = ref();
const imageListView = ref();
let videoScrollTop = 0;
let imageScrollTop = 0;

onActivated(() => {
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
    imageListView.value.scrollTo({ top: imageScrollTop });
  }
});

function handleVideoScroll(event: any): void {
  videoScrollTop = event.target.scrollTop;
}

function handleImageScroll(event: any): void {
  imageScrollTop = event.target.scrollTop;
}
</script>
<template>
  <div id="search">
    <topBar />
    <empty v-if="searching === 'empty'" :search-history="searchHistory" :search-recommend="searchRecommend" />
    <SearchLoading v-else-if="searching === 'loading'" />
    <div v-else-if="searching === 'result'" class="content result">
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="video">视频</v-tab>
          <v-tab value="image">插画</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
      <v-tabs-window v-model="tab" class="tabs-window">
        <v-tabs-window-item value="video">
          <div class="list-view" ref="videoListView" @scroll="handleVideoScroll">
            <v-infinite-scroll color="#00796B">
              <div class="grid">
                <template v-for="item in videoResult" :key="item.id">
                  <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                    :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                    :isR18="item.isR18" />
                </template>
              </div>
            </v-infinite-scroll>
          </div>
        </v-tabs-window-item>
        <v-tabs-window-item value="image">
          <div class="list-view" ref="imageListView" @scroll="handleImageScroll">
            <v-infinite-scroll color="#00796B">
              <div class="grid">
                <template v-for="item in imageResult" :key="item.id">
                  <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                    :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                    :isR18="item.isR18" />
                </template>
              </div>
            </v-infinite-scroll>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>
<style lang="scss" scoped>
#search {
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  // 移除安全区域padding以避免底部空白
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {}

.tabs-window {
  flex: 1;

  :deep(.v-window__container) {
    height: 100%;
  }

  .v-window-item {
    height: 100%;
    overflow: hidden;
  }

  .list-view {
    height: 100%;
    overflow: auto;
    // 确保列表视图占据完整高度，无额外margin
    margin: 0;
    padding: 0;

    .v-infinite-scroll {
      padding: 10px 0 env(safe-area-inset-bottom, 0) 0;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}
</style>