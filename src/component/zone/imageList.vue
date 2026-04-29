<script setup lang="ts">
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref } from 'vue';

defineOptions({
  name: 'ImageList'
})

interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: number;
  likeNum: number;
  longNum: number;
  isR18: boolean;
}

const imageList = ref<ListItem[]>([]);
for (let i = 0; i < 20; i++) {
  imageList.value.push({
    id: Math.random().toString(36).slice(2),
    title: `测试标题${i + 1}`,
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: 100,
    likeNum: 100,
    longNum: 10,
    isR18: false,
  });
}
</script>

<template>
  <div class="list-content">
    <div class="list-view">
      <v-infinite-scroll color="#00796B">
        <div class="grid">
          <template v-for="item in imageList" :key="item.id">
            <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
              :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
              :isR18="item.isR18" />
          </template>
        </div>
      </v-infinite-scroll>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-content {
  padding-bottom: 20px;
}

.list-view {
  height: 100%;
  overflow-y: auto;

  .v-infinite-scroll {
    padding: 10px 0;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}
</style>