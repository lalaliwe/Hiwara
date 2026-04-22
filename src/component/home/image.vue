<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch, inject } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import { getImageList as api_getImageList } from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';

const tab = ref<'date' | 'trending' | 'popularity' | 'views' | 'likes'>('date');
const tabArray = [
  { value: 'date', text: '最新' },
  { value: 'trending', text: '流行' },
  { value: 'popularity', text: '人气' },
  { value: 'views', text: '观看量' },
  { value: 'likes', text: '点赞量' },
];

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

const imageList = ref<ListItem[][]>(Array.from({ length: tabArray.length }, () => []));
let page: number[] = new Array(tabArray.length).fill(0);
const listMore = ref<boolean[]>(new Array(tabArray.length).fill(false))

let showBeen = false;
const homeTab = inject('isTab') as { value: 'video' | 'image' | 'subscribe' | 'forum' | 'my' };
watch(() => homeTab.value, (val) => {
  if (val === 'image' || !showBeen) {
    initGetImageListData();
    showBeen = true;
  }
}, { immediate: true });

// 注入刷新令牌
const refreshToken = inject('refreshToken') as { value: number };
// 监听刷新令牌变化，执行刷新
watch(refreshToken, () => {
  console.log('刷新图片');
  refreshData();
});

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
  // 按需加载数据逻辑
  const tabIndex = tabArray.findIndex(item => item.value === newVal);
  if (tabIndex !== -1 && imageList.value[tabIndex].length === 0) {
    getImageList(tabIndex);
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

// 刷新数据
function refreshData() {
  const tabIndex = tabArray.findIndex(item => item.value === tab.value);
  if (tabIndex !== -1) {
    // 清空当前 Tab 的数据
    imageList.value[tabIndex] = [];
    page[tabIndex] = 0;
    listMore.value[tabIndex] = false;
    // 重新获取数据
    getImageList(tabIndex);
  }
}

onActivated(() => {
  // 遍历所有 tab，恢复其保存的位置
  listRefs.value.forEach((el, index) => {
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: scrollTopArray[index] });
    }
  });
});

// 初始获取图片列表数据
function initGetImageListData() {
  const tabIndex = tabArray.findIndex(item => item.value === tab.value);
  if (imageList.value[tabIndex].length === 0) {
    getImageList(tabIndex);
  }
}
// 下滑列表到底获取数据
async function loadMoreData({ done }: any, index: number) {
  await getImageList(index);
  if (listMore.value[index]) {
    done('empty');
  } else {
    done('ok');
  }
}
// 获取图片列表
async function getImageList(tabNum: number) {
  try {
    const sort = tabArray[tabNum].value;
    const res = await api_getImageList(page[tabNum], sort);
    console.log(res);
    if (res && res.results && res.results.length > 0) {
      const newImages = res.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : 'file-loss',
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.numComments || 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      imageList.value[tabNum] = [...imageList.value[tabNum], ...newImages];
      page[tabNum]++;
    } else {
      listMore.value[tabNum] = true;
    }
  } catch (error) {
    console.error('Error fetching image list:', error);
  }
}

</script>

<template>
  <div>
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
    <!-- 替换为 Swiper -->
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide v-for="(item, i) in tabArray" :key="`tabs-window_${item.value}`">
        <div v-if="imageList[i].length === 0" class="loading">
          <loadingHuawu class="anime" />
          <div class="loading-text">
            数据加载中<span class="dots"></span>
          </div>
        </div>
        <div v-else class="list-view" :ref="(el) => setListRef(el, i)" @scroll="(e) => handleScroll(i, e)">
          <v-infinite-scroll color="#00796B" @load="(state) => loadMoreData(state, i)" :disabled="listMore[i]">
            <div class="grid">
              <template v-for="(listItem, index) in imageList[i]" :key="listItem.id">
                <cardButton type="image" :id="listItem.id" :title="listItem.title" :img="listItem.img"
                  :author="listItem.author" :time="listItem.time" :viewNum="listItem.viewNum"
                  :likeNum="listItem.likeNum" :longNum="listItem.longNum" :isR18="listItem.isR18" />
              </template>
            </div>
            <template v-slot:empty>
              <div class="listEnd">
                已经到底了
              </div>
            </template>
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
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px) 0;
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

.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .anime {
    width: 200px;
  }

  .loading-text {
    font-family: 'AaXinRui85-2';
    color: #00796B;

    .dots::after {
      content: '';
      animation: dotsAnimation 1s infinite;
    }
  }

  @keyframes dotsAnimation {
    0% {
      content: '.';
    }

    16.66% {
      content: '..';
    }

    33.32% {
      content: '...';
    }

    49.98% {
      content: '....';
    }

    66.64% {
      content: '.....';
    }

    83.3% {
      content: '......';
    }

    100% {
      content: '.';
    }
  }
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}
</style>
