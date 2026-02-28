<script setup lang="ts">
import cardButton from '../component/cardButton.vue';
import test1Img from '../static/img/test1.jpg';
import { ref } from 'vue';
const tab = ref('video');
const videoList = [];
for (let i = 0; i < 20; i++) {
  videoList.push({
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

</script>
<template>
  <div class="tabs">
    <v-tabs v-model="tab" color="#00796B" align-tabs="center" fixed-tabs>
      <v-tab value="video">最新</v-tab>
    </v-tabs>
    <v-divider></v-divider>
  </div>
  <v-tabs-window v-model="tab" class="tabs-window">
    <v-tabs-window-item value="video">
      <v-infinite-scroll color="#00796B">
        <div class="grid">
          <template v-for="(item, index) in videoList">
            <cardButton type="video" :title="item.title" :img="item.img" :author="item.author" :time="item.time"
              :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum" :isR18="item.isR18" />
          </template>
        </div>
      </v-infinite-scroll>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style lang="scss" scoped>
.tabs {}

.tabs-window {
  height: calc(100% - 48.8px);

  :deep(.v-window__container) {
    height: 100%;
  }

  .v-window-item {
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