<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getVideoHistoryList } from '../../core/database';
import { showShortToast } from '../../core/toast';
import MediaItem from '../MediaItem.vue';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';

// 定义列表项接口
interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  createTime: string;
  longNum: number;
  isR18: boolean;
  dateText: string;
  timestamp?: number;
}

const { t } = useI18n();

const videoHistory = ref<ListItem[]>([]);
const videoPage = ref(0); // 改为从0开始，与subscribe.vue保持一致
const pageSize = 15;
const videoIsLoading = ref(false);
const videoHasFinished = ref(false);

// 加载更多失败标记
const videoLoadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const videoState = ref<ListState>('loading');

// 加载更多视频数据
const loadMoreVideoData = async ({ done }: any = { done: () => { } }) => {
  if (videoIsLoading.value || videoHasFinished.value) {
    return;
  }

  videoIsLoading.value = true;

  try {
    // console.log('加载视频历史，页码:', videoPage.value);
    const newItems = await getVideoHistoryList(videoPage.value, pageSize);

    if (newItems.length > 0) {
      // 如果是第一页且之前是 loading 状态，更新为 success
      if (videoPage.value === 0 && videoState.value === 'loading') {
        videoState.value = 'success';
      }

      // 转换数据格式
      const convertedItems = newItems.map(item => ({
        ...item,
        longNum: Number(item.longNum), // 将 string 转换为 number
        dateText: item.lastWatchDate,
        timestamp: item.accessTime
      }));

      // 追加数据
      videoHistory.value = [...videoHistory.value, ...convertedItems];
      videoPage.value++;

      // console.log('视频历史加载成功，新增', newItems.length, '条');
      done('ok');
    } else {
      videoHasFinished.value = true;

      // 如果还没开始加载（第一页）且没有数据，更新为 empty
      if (videoPage.value === 0 && videoState.value === 'loading') {
        videoState.value = 'empty';
      }

      // console.log('视频历史已全部加载');
      done('empty');
    }
  } catch (error) {
    console.error('加载视频历史失败:', error);
    showShortToast(t('common.error'));

    // 如果是第一页加载失败，更新为 failed
    if (videoPage.value === 0 && videoState.value === 'loading') {
      videoState.value = 'failed';
    } else {
      // 翻页加载失败，设置失败标记
      videoLoadMoreFailed.value = true;
    }
    done('error');
  } finally {
    videoIsLoading.value = false;
  }
};

// 内部加载函数（用于初始化和刷新，不需要 done 回调）
const loadVideoDataInternal = async () => {
  await loadMoreVideoData();
};

// 刷新数据
const refreshData = () => {
  // console.log('刷新视频历史数据');
  // 清空视频列表数据
  videoHistory.value = [];
  videoPage.value = 0;
  videoHasFinished.value = false;
  videoLoadMoreFailed.value = false;
  videoState.value = 'loading';

  // 重新加载第一页
  loadVideoDataInternal();
};

// 点击错误图片刷新数据
const handleErrorClick = () => {
  refreshData();
};

// 按日期分组数据（使用 computed 缓存结果，避免每次渲染都重新计算）
const groupedVideoHistory = computed(() => {
  const grouped: Record<string, ListItem[]> = {};

  // 创建副本进行排序，避免修改原数组
  const sortedItems = [...videoHistory.value].sort((a, b) =>
    new Date(b.dateText).getTime() - new Date(a.dateText).getTime()
  );

  // 按日期分组
  sortedItems.forEach(item => {
    if (!grouped[item.dateText]) {
      grouped[item.dateText] = [];
    }
    grouped[item.dateText].push(item);
  });

  return grouped;
});

// 初始加载第一页数据
loadMoreVideoData();

const videoListView = ref();
let videoScrollTop = 0;

// 处理滚动事件
function handleVideoScroll(event: Event): void {
  const target = event.target as HTMLElement;
  if (target) {
    videoScrollTop = target.scrollTop;
  }
}

// 页面激活时恢复滚动位置
defineExpose({
  restoreScroll: () => {
    if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
      videoListView.value.scrollTo({ top: videoScrollTop });
    }
  },
  refreshData // 暴露刷新方法供父组件调用
});
</script>

<template>
  <!-- 加载状态 -->
  <div v-if="videoState === 'loading'" class="loading">
    <loadingHuawu>{{ t('history.video.loading') }}</loadingHuawu>
    <!-- 数据加载中 -->
  </div>

  <!-- 加载失败状态 -->
  <div v-else-if="videoState === 'failed'" class="loading" @click="handleErrorClick">
    <errorHuawu>{{ t('history.video.error') }}</errorHuawu>
    <!-- 视频历史加载失败了喵~ -->
  </div>

  <!-- 空数据状态 -->
  <div v-else-if="videoState === 'empty'" class="loading" @click="handleErrorClick">
    <errorHuawu>{{ t('history.video.noRecords') }}</errorHuawu>
    <!-- 暂无视频历史记录 -->
  </div>

  <!-- 成功加载状态 -->
  <v-infinite-scroll v-else ref="videoListView" color="#00796B" @load="loadMoreVideoData" :disabled="videoHasFinished"
    @scroll="handleVideoScroll" class="list-view">
    <div v-for="(groupItems, date) in groupedVideoHistory" :key="date" class="date-group">
      <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? t('history.video.today') : date }}</div>
      <!-- {{ date === new Date().toISOString().split('T')[0] ? '今天' : date }} -->
      <v-list lines="two" class="pa-0">
        <MediaItem v-for="(item, index) in groupItems" :key="index" :item="item" type="video" />
      </v-list>
    </div>
    <!-- 加载失败提示 -->
    <template v-slot:error="{ props }">
      <div class="load-more-failed">
        <span>{{ t('history.video.loadFailed') }}</span>
        <!-- 加载失败， -->
        <span class="retry-btn" v-bind="props">{{ t('history.video.retry') }}</span>
        <!-- 点击重试 -->
      </div>
    </template>
    <!-- 已到底部提示 -->
    <template v-slot:empty>
      <div class="listEnd">
        {{ t('history.video.reachedBottom') }}
        <!-- 已经到底了喵~ -->
      </div>
    </template>
  </v-infinite-scroll>
</template>

<style lang="scss" scoped>
.list-view {
  $top: calc(env(safe-area-inset-top, 0) + 60px + 40px);
  $bottom: calc(env(safe-area-inset-bottom, 0));
  height: calc(100vh - env(safe-area-inset-top, 0) - $bottom);
  padding-top: $top;
  padding-bottom: $bottom;
  overflow: auto;

  &::-webkit-scrollbar-track {
    margin: calc($top + 4px) 0 calc($bottom + 4px) 0;
  }

  .date-group {
    .date-header {
      padding: 12px 16px 8px;
      background-color: #f0f0f0;
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
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