<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
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
let imageList: ListItem[][] = Array.from({ length: tabArray.length }, () => []);
for (let i = 0; i < tabArray.length; i++) {
  for (let j = 0; j < 20; j++) {
    imageList[i].push({
      id: Math.random().toString(36).slice(2),
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
  <div class="top">
    <searchBar />
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
  </div>
  <v-tabs-window v-model="tab" class="tabs-window">
    <v-tabs-window-item v-for="(item, i) in tabArray" :value="item.value" :key="`tabs-window_${item.value}`">
      <div class="list-view" :ref="(el) => setListRef(el, i)" @scroll="(e) => handleScroll(i, e)">
        <v-infinite-scroll color="#00796B">
          <div class="grid">
            <template v-for="(item, index) in imageList[i]" :key="index">
              <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                :isR18="item.isR18" />
            </template>
          </div>
        </v-infinite-scroll>
      </div>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style lang="scss" scoped>
.top {
  position: absolute;
  width: 100%;
  top: 0;
  z-index: 500;
  backdrop-filter: blur(10px);

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

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

    .v-tabs--density-compact {
      --v-tabs-height: 36px;
    }

    .v-tab {
      min-width: 0 !important;
    }
  }
}

.tabs-window {
  z-index: 1;

  :deep(.v-window__container) {
    height: 100%;

    .v-window-item {
      height: 100%;
    }
  }

  .list-view {
    height: 100%;
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      margin: calc(60px + 36px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px);
    }

    .v-infinite-scroll {
      padding: calc(60px + 36px + 1px + 10px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0)) 0;
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