<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

const tab = ref<'latest' | 'trending' | 'popularity' | 'mostViews' | 'mostLikes'>('latest');
const tabArray = [
  { value: 'latest', text: '最新' },
  { value: 'trending', text: '流行' },
  { value: 'popularity', text: '人气' },
  { value: 'mostViews', text: '观看量' },
  { value: 'mostLikes', text: '点赞量' },
];

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

let videoList: ListItem[][] = Array.from({ length: tabArray.length }, () => []);
for (let i = 0; i < tabArray.length; i++) {
  for (let j = 0; j < 20; j++) {
    videoList[i].push({
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

// --- Swiper 联动逻辑 ---
const swiperInstance = ref<SwiperType | null>(null);

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 1. 监听 tab 变化，控制 Swiper 切换
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = tabArray.findIndex(item => item.value === newVal);
    // 防止滑动 swiper 触发 tab 改变后，又触发 watch 导致的互相死循环
    if (targetIndex !== -1 && swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
});

// 2. 监听 Swiper 滑动，反控 tab 变化
const onSlideChange = (swiper: SwiperType) => {
  const targetItem = tabArray[swiper.activeIndex];
  if (targetItem && tab.value !== targetItem.value) {
    tab.value = targetItem.value as any;
  }
};
// --- End Swiper 联动逻辑 ---


onActivated(() => {
  // 遍历所有 tab，恢复其保存的位置
  listRefs.value.forEach((el, index) => {
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: scrollTopArray[index] });
    }
  });
});
</script>
<template>
  <div>
    <div class="top">
      <searchBar />
      <div class="tabs">
        <div class="tabs-elements">
          <!-- 保留 Vuetix Tabs 头部 -->
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
    <!-- 替换为 Swiper -->
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide v-for="(item, i) in tabArray" :key="`tabs-window_${item.value}`">
        <div class="list-view" :ref="(el) => setListRef(el, i)" @scroll="(e) => handleScroll(i, e)">
          <v-infinite-scroll color="#00796B">
            <div class="grid">
              <template v-for="(listItem, index) in videoList[i]" :key="listItem.id">
                <cardButton type="video" :id="listItem.id" :title="listItem.title" :img="listItem.img"
                  :author="listItem.author" :time="listItem.time" :viewNum="listItem.viewNum"
                  :likeNum="listItem.likeNum" :longNum="listItem.longNum" :isR18="listItem.isR18" />
              </template>
            </div>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
    </swiper>
  </div>
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
      --v-tabs-height: 40px;
    }

    .v-tab {
      min-width: 0 !important;
    }
  }
}

/* Swiper 容器样式替换原 .tabs-window */
.tabs-window {
  z-index: 1;
  width: 100%;
  height: 100%;

  :deep(.swiper-wrapper) {
    height: 100%;
  }

  :deep(.swiper-slide) {
    height: auto;
    overflow: hidden;
  }

  .list-view {
    height: 100vh;
    /* 解决 Swiper 内部高度计算问题 */
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px);
    }

    .v-infinite-scroll {
      padding: calc(60px + 40px + 1px + 10px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0)) 0;
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
