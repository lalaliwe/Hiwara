<script setup lang="ts">
import cardButton from '../cardButton.vue';

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

interface recommendListProps {
  authorOtherVideoList: ListItem[];
  recommendVideoList: ListItem[];
}

const props = defineProps<recommendListProps>();
</script>

<template>
  <div class="recommend">
    <div class="label">
      该作者其他视频
    </div>
    <div class="lists">
      <div v-for="(item, index) in authorOtherVideoList" :key="item.id">
        <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
          :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
          :isR18="item.isR18" />
      </div>
    </div>
    <div class="label">
      更多推荐
    </div>
    <div class="lists">
      <div v-for="(item, index) in recommendVideoList" :key="item.id">
        <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
          :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
          :isR18="item.isR18" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recommend {
  padding: 0 10px 10px 10px;

  .label {
    font-size: 1rem;
    margin: 10px 0;
  }

  .lists {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    // padding: 10px;
  }
}
</style>