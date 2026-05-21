<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
import DateFilter from './DateFilter.vue';
// import test1Img from '../../static/img/test1.jpg';
import { ref, computed, onActivated, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import { getImageList as api_getImageList } from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { showShortToast } from '../../core/toast';
import type { VInfiniteScroll } from 'vuetify/components'

const { t } = useI18n();

const tab = ref<'date' | 'trending' | 'popularity' | 'views' | 'likes'>('date');
const tabArray = computed(() => [
  { value: 'date', text: t('home.image.sortTabs.date') },
  { value: 'trending', text: t('home.image.sortTabs.trending') },
  { value: 'popularity', text: t('home.image.sortTabs.popularity') },
  { value: 'views', text: t('home.image.sortTabs.views') },
  { value: 'likes', text: t('home.image.sortTabs.likes') },
]);

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

const imageList = ref<ListItem[][]>(Array.from({ length: tabArray.value.length }, () => []));
let page: number[] = new Array(tabArray.value.length).fill(0);
const listMore = ref<boolean[]>(new Array(tabArray.value.length).fill(false))

// 加载更多失败标记
const loadMoreFailed = ref<boolean[]>(new Array(tabArray.value.length).fill(false))

// 每个tab的加载状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const state = ref<ListState[]>(new Array(tabArray.value.length).fill('loading'));

let showBeen = false;
const homeTab = inject('isTab') as { value: 'video' | 'image' | 'subscribe' | 'forum' | 'my' };
watch(() => homeTab.value, (val) => {
  if (val === 'image' && !showBeen) {
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

const listRefs = ref<InstanceType<typeof VInfiniteScroll>[]>([]);;
let scrollTopArray: number[] = new Array(tabArray.value.length).fill(0);

const setListRef = (el: any, index: number) => {
  if (el) {
    listRefs.value[index] = el as InstanceType<typeof VInfiniteScroll>;
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
    const targetIndex = tabArray.value.findIndex(item => item.value === newVal);
    // 防止滑动 swiper 触发 tab 改变后，又触发 watch 导致的互相死循环
    if (targetIndex !== -1 && swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
  initGetImageListData();
});

// 2. 监听 Swiper 滑动，反控 tab 变化
const onSlideChange = (swiper: SwiperType) => {
  const targetItem = tabArray.value[swiper.activeIndex];
  if (targetItem && tab.value !== targetItem.value) {
    tab.value = targetItem.value as any;
  }
};

// --- End Swiper 联动逻辑 ---

onActivated(() => {
  // 遍历所有 tab，恢复其保存的位置
  listRefs.value.forEach((el, index) => {
    if (el)
      el.$el.scrollTop = scrollTopArray[index];
  });
});

// 初始获取图片列表数据
function initGetImageListData() {
  const tabIndex = tabArray.value.findIndex(item => item.value === tab.value);
  if (state.value[tabIndex] === 'loading') {
    getImageList(tabIndex).then((res) => {
      if (res.length > 0)
        state.value[tabIndex] = 'success';
      else
        state.value[tabIndex] = 'empty';
    }).catch(() => {
      state.value[tabIndex] = 'failed';
    });
  }
}
// 刷新数据
function refreshData() {
  const tabIndex = tabArray.value.findIndex(item => item.value === tab.value);
  if (tabIndex !== -1) {
    // 清空当前 Tab 的数据
    imageList.value[tabIndex] = [];
    page[tabIndex] = 0;
    listMore.value[tabIndex] = false;
    loadMoreFailed.value[tabIndex] = false;
    state.value[tabIndex] = 'loading';
    // 重新获取数据
    getImageList(tabIndex).then((res) => {
      if (res.length > 0)
        state.value[tabIndex] = 'success';
      else
        state.value[tabIndex] = 'empty';
    }).catch(() => {
      state.value[tabIndex] = 'failed';
    });
  }
}
// 点击错误图片刷新数据
function handleErrorClick(index: number) {
  const tabIndex = tabArray.value.findIndex(item => item.value === tab.value);
  if (tabIndex === index) {
    refreshData();
  }
}
// 下滑列表到底追加数据
async function loadMoreData({ done }: any, index: number) {
  getImageList(index).then((res) => {
    if (res.length > 0) done('ok');
    else {
      listMore.value[index] = true;
      done('empty');
    }
  }).catch(() => {
    loadMoreFailed.value[index] = true;
    done('error');
  });
}
// 获取图片列表
async function getImageList(tabNum: number): Promise<any> {
  try {
    const sort = tabArray.value[tabNum].value;
    const date = dateFilter.value; // 使用全局时间筛选条件
    const res = await api_getImageList(page[tabNum], sort, date);
    console.log(`获取插画列表 - Tab:${tabNum}, Page:${page[tabNum]}, Sort:${sort}, Date:${date}`);
    // console.log(res);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    if (res.data.results && res.data.results.length > 0) {
      const newImages = res.data.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : 'file-loss',
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.numImages || 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      imageList.value[tabNum] = [...imageList.value[tabNum], ...newImages];
      page[tabNum]++;
      // 返回数据
      return newImages
    } else {
      // 返回空数组
      return []
    }
  } catch (error) {
    console.error(`获取插画列表失败:`, error);
    showShortToast('获取插画列表失败');
    throw error;
  }
}

// 全局时间筛选条件（对所有tab生效），格式：'2026' 或 '2026-1'，undefined表示全部年份
const dateFilter = ref<string | undefined>(undefined);

// 时间选择器组件引用
const dateFilterRef = ref<InstanceType<typeof DateFilter> | null>(null);

// 打开时间选择器
function openDateFilter() {
  dateFilterRef.value?.openDrawer();
}

// 时间选择器确认回调
function handleDateConfirm(dateParam: string | undefined) {
  console.log('图片 - 时间筛选变更:', dateParam);
  // 设置全局时间筛选条件
  dateFilter.value = dateParam;
  // 刷新当前tab的数据
  refreshData();
}

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
          
          <!-- 触发按钮 -->
          <div class="rigth" @click="openDateFilter">
            <font-awesome-icon icon="fa-solid fa-align-right" />
          </div>
        </div>
        <v-divider></v-divider>
      </div>
    </div>
    
    <!-- 时间筛选器组件 -->
    <DateFilter ref="dateFilterRef" v-model="dateFilter" @confirm="handleDateConfirm" />
    
    <!-- 替换为 Swiper -->
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide v-for="(item, i) in tabArray" :key="`tabs-window_${item.value}`">
        <div v-if="state[i] === 'failed'" class="loading" @click="handleErrorClick(i)">
          <errorHuawu>{{ t('home.image.loadFailed') }}{{ t('home.navigation.image') }}</errorHuawu>
        </div>
        <div v-else-if="state[i] === 'empty'" class="loading" @click="handleErrorClick(i)">
          <errorHuawu>{{ t('home.navigation.image') }}{{ t('home.image.noRecords') }}</errorHuawu>
        </div>
        <div v-else-if="state[i] === 'loading'" class="loading">
          <loadingHuawu>{{ t('home.image.loading') }}</loadingHuawu>
        </div>
        <v-infinite-scroll v-else color="#00796B" @load="(state) => loadMoreData(state, i)" :disabled="listMore[i]"
          class="list-view" :ref="(el) => setListRef(el, i)" @scroll="(e: Event) => handleScroll(i, e)">
          <div class="grid">
            <template v-for="(listItem, index) in imageList[i]" :key="listItem.id">
              <cardButton type="image" :data="{
                id: listItem.id,
                title: listItem.title,
                img: listItem.img,
                author: listItem.author,
                time: listItem.time,
                viewNum: listItem.viewNum,
                likeNum: listItem.likeNum,
                longNum: listItem.longNum,
                isR18: listItem.isR18
              }" />
            </template>
          </div>
          <template v-slot:error="{ props }">
            <div class="load-more-failed">
              <span>{{ t('home.image.loadFailed') }}</span>
              <span class="retry-btn" v-bind=props>{{ t('home.image.retry') }}</span>
            </div>
          </template>
          <template v-slot:empty>
            <div class="listEnd">
              {{ t('home.image.reachedBottom') }}
            </div>
          </template>
        </v-infinite-scroll>
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
        cursor: pointer;
        
        &:active {
          opacity: 0.6;
        }
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
    $top: calc(env(safe-area-inset-top, 0) + 60px + 40px);
    $bottom: calc(env(safe-area-inset-bottom, 0) + 60px);
    height: calc(100vh - $top - 10px - $bottom);
    padding-top: calc($top + 10px);
    padding-bottom: $bottom;

    &::-webkit-scrollbar-track {
      margin: calc($top + 4px) 0 calc($bottom + 4px) 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 0 10px 0 10px;

      >* {
        content-visibility: auto;
        contain-intrinsic-size: 0 180px;
      }
    }
  }
}

.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: #757575;
  font-size: 0.9rem;

  .retry-btn {
    color: #00796B;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>
