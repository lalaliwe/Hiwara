<script setup lang="ts">
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated } from 'vue';
const tab = ref('latest');
const tabArray = [
  { value: 'latest', text: '最新' },
  { value: 'trending', text: '流行' },
  { value: 'popularity', text: '人气' },
  { value: 'mostViews', text: '观看量' },
  { value: 'mostLikes', text: '点赞量' },
]
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
let videoList: ItemList[][] = Array.from({ length: tabArray.length }, () => []);
for (let i = 0; i < tabArray.length; i++) {
  for (let j = 0; j < 20; j++) {
    videoList[i].push({
      title: `${tabArray[i].text}${j + 1}`,
      img: test1Img,
      author: '测试作者',
      time: '2021-09-09',
      viewNum: '100',
      likeNum: '100',
      longNum: '10',
      isR18: false,
    });
  }
}

const listRefs = ref<HTMLElement[]>([]);
let scrollTopArray: number[] = new Array(tabArray.length).fill(0);
const setListRef = (el: any, index: number) => {
  if (el) {
    listRefs.value[index] = el as HTMLElement;
  }
};
const handleScroll = (index: number, event: Event) => {
  const target = event.target as HTMLElement;
  if (target) {
    scrollTopArray[index] = target.scrollTop;
  }
};
onActivated(() => {
  // 遍历所有 tab，恢复其保存的位置
  listRefs.value.forEach((el, index) => {
    if (el && typeof el.scrollTo === 'function') {
      // 使用 scrollTo 方法恢复位置
      el.scrollTo({ top: scrollTopArray[index] });
    }
  });
});

</script>
<template>
  <div class="tabs">
    <div class="tabs-elements">
      <v-tabs class="left" v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
        <v-tab v-for="item in tabArray" :value="item.value" :key="`tabs_${item.value}`">
          {{ item.text }}
        </v-tab>
      </v-tabs>
      <div class="rigth">
        <font-awesome-icon icon="fa-solid fa-align-right" />
      </div>
    </div>
    <v-divider></v-divider>
  </div>
  <v-tabs-window v-model="tab" class="tabs-window">
    <v-tabs-window-item v-for="(item, i) in tabArray" :value="item.value" :key="`tabs-window_${item.value}`">
      <div class="list-view" :ref="(el) => setListRef(el, i)" @scroll="(e) => handleScroll(i, e)">
        <v-infinite-scroll color="#00796B">
          <div class="grid">
            <template v-for="(item, index) in videoList[i]">
              <cardButton type="video" :title="item.title" :img="item.img" :author="item.author" :time="item.time"
                :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum" :isR18="item.isR18" />
            </template>
          </div>
        </v-infinite-scroll>
      </div>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style lang="scss" scoped>
.tabs {
  .tabs-elements {
    display: flex;

    .left {
      flex: 1;
    }

    .rigth {
      width: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .v-tab {
    min-width: 0 !important;
  }
}

.tabs-window {
  height: calc(100% - 36px);

  :deep(.v-window__container) {
    height: 100%;
  }

  .v-window-item {
    height: 100%;
    overflow: auto;
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