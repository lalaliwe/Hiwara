<script setup lang="ts">
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated } from 'vue';

const videoListView = ref();
const imageListView = ref();

const tab = ref('video');
interface ItemList {
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
}
let videoList: ItemList[] = [];
const imageList = [];
for (let i = 0; i < 20; i++) {
  videoList.push({
    title: `测试标题${i + 1}`,
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10:00',
    isR18: false,
  });
  imageList.push({
    title: `测试标题${i + 1}`,
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
}
let videoScrollTop = 0;
let imageScrollTop = 0;

onActivated(() => {
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    // console.log(videoScrollTop);
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
    // console.log(imageScrollTop);
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
            <template v-for="(item, index) in videoList">
              <cardButton type="video" :title="item.title" :img="item.img" :author="item.author" :time="item.time"
                :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum" :isR18="item.isR18" />
            </template>
          </div>
        </v-infinite-scroll>
      </div>
    </v-tabs-window-item>
    <v-tabs-window-item value="image">
      <div class="list-view" ref="imageListView" @scroll="handleImageScroll">
        <v-infinite-scroll color="#00796B">
          <div class="grid">
            <template v-for="(item, index) in imageList">
              <cardButton type="image" :title="item.title" :img="item.img" :author="item.author" :time="item.time"
                :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum" :isR18="item.isR18" />
            </template>
          </div>
        </v-infinite-scroll>
      </div>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style lang="scss" scoped>
.tabs {}

.tabs-window {
  height: calc(100% - 36px);

  :deep(.v-window__container) {
    height: 100%;
  }

  .v-window-item {
    height: 100%;
  }

  .list-view {
    height: 100%;
    overflow: auto;
  }

  :deep(.v-infinite-scroll__side) {
    margin: 5px 0;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}
</style>