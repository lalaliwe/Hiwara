<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getImageHistoryList } from '../../core/database';
import { showShortToast } from '../../core/toast';
import HistoryItem from './HistoryItem.vue';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';

// 定义列表项接口
interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  createTime: string;
  longNum: string;
  isR18: boolean;
  lastWatchDate: string;
}

const { t } = useI18n();

const imageHistory = ref<ListItem[]>([]);
const imagePage = ref(0); // 改为从0开始
const pageSize = 15;
const imageIsLoading = ref(false);
const imageHasFinished = ref(false);

// 加载更多失败标记
const imageLoadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const imageState = ref<ListState>('loading');

// 加载更多插画数据
const loadMoreImageData = async ({ done }: any = { done: () => {} }) => {
  if (imageIsLoading.value || imageHasFinished.value) {
    return;
  }

  imageIsLoading.value = true;

  try {
    // console.log('加载插画历史，页码:', imagePage.value);
    const newItems = await getImageHistoryList(imagePage.value, pageSize);
    
    if (newItems.length > 0) {
      // 如果是第一页且之前是 loading 状态，更新为 success
      if (imagePage.value === 0 && imageState.value === 'loading') {
        imageState.value = 'success';
      }

      // 追加数据
      imageHistory.value = [...imageHistory.value, ...newItems];
      imagePage.value++;
      
      // console.log('插画历史加载成功，新增', newItems.length, '条');
      done('ok');
    } else {
      imageHasFinished.value = true;
      
      // 如果还没开始加载（第一页）且没有数据，更新为 empty
      if (imagePage.value === 0 && imageState.value === 'loading') {
        imageState.value = 'empty';
      }
      
      // console.log('插画历史已全部加载');
      done('empty');
    }
  } catch (error) {
    console.error('加载插画历史失败:', error);
    showShortToast(t('common.error'));
    
    // 如果是第一页加载失败，更新为 failed
    if (imagePage.value === 0 && imageState.value === 'loading') {
      imageState.value = 'failed';
    } else {
      // 翻页加载失败，设置失败标记
      imageLoadMoreFailed.value = true;
    }
    done('error');
  } finally {
    imageIsLoading.value = false;
  }
};

// 内部加载函数（用于初始化和刷新）
const loadImageDataInternal = async () => {
  await loadMoreImageData();
};

// 刷新数据
const refreshData = () => {
  // console.log('刷新插画历史数据');
  // 清空插画列表数据
  imageHistory.value = [];
  imagePage.value = 0;
  imageHasFinished.value = false;
  imageLoadMoreFailed.value = false;
  imageState.value = 'loading';
  
  // 重新加载第一页
  loadImageDataInternal();
};

// 点击错误图片刷新数据
const handleErrorClick = () => {
  refreshData();
};

// 按日期分组数据（使用 computed 缓存结果，避免每次渲染都重新计算）
const groupedImageHistory = computed(() => {
  const grouped: Record<string, ListItem[]> = {};
  
  // 创建副本进行排序，避免修改原数组
  const sortedItems = [...imageHistory.value].sort((a, b) => 
    new Date(b.lastWatchDate).getTime() - new Date(a.lastWatchDate).getTime()
  );

  // 按日期分组
  sortedItems.forEach(item => {
    if (!grouped[item.lastWatchDate]) {
      grouped[item.lastWatchDate] = [];
    }
    grouped[item.lastWatchDate].push(item);
  });

  return grouped;
});

const imageListView = ref();
let imageScrollTop = 0;

// 处理滚动事件
function handleImageScroll(event: Event): void {
  const target = event.target as HTMLElement;
  if (target) {
    imageScrollTop = target.scrollTop;
  }
}

// 页面激活时恢复滚动位置
defineExpose({
  restoreScroll: () => {
    if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
      imageListView.value.scrollTo({ top: imageScrollTop });
    }
  },
  refreshData // 暴露刷新方法供父组件调用
});

// 初始加载第一页数据
loadImageDataInternal();
</script>

<template>
  <!-- 加载状态 -->
  <div v-if="imageState === 'loading'" class="loading">
    <loadingHuawu>{{ t('common.loading') }}</loadingHuawu>
    <!-- 数据加载中 -->
  </div>
  
  <!-- 加载失败状态 -->
  <div v-else-if="imageState === 'failed'" class="loading" @click="handleErrorClick">
    <errorHuawu>{{ t('player.image') }}{{ t('navigation.history') }}{{ t('common.error') }}</errorHuawu>
    <!-- 插画历史加载失败了喵~ -->
  </div>
  
  <!-- 空数据状态 -->
  <div v-else-if="imageState === 'empty'" class="loading" @click="handleErrorClick">
    <errorHuawu>{{ t('common.no') }}{{ t('player.image') }}{{ t('navigation.history') }}</errorHuawu>
    <!-- 暂无插画历史记录 -->
  </div>
  
  <!-- 成功加载状态 -->
  <v-infinite-scroll 
    v-else
    ref="imageListView" 
    color="#00796B" 
    @load="loadMoreImageData" 
    :disabled="imageHasFinished"
    @scroll="handleImageScroll"
    class="list-view"
  >
    <div v-for="(groupItems, date) in groupedImageHistory" :key="date" class="date-group">
      <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? t('common.today') : date }}</div>
      <!-- {{ date === new Date().toISOString().split('T')[0] ? '今天' : date }} -->
      <v-list lines="two" class="pa-0">
        <HistoryItem 
          v-for="item in groupItems" 
          :key="item.id" 
          :item="item"
          type="image"
        />
      </v-list>
    </div>
    
    <!-- 加载失败提示 -->
    <template v-slot:error="{ props }">
      <div class="load-more-failed">
        <span>{{ t('common.loadFailed') }}</span>
        <!-- 加载失败， -->
        <span class="retry-btn" v-bind="props">{{ t('common.retry') }}</span>
        <!-- 点击重试 -->
      </div>
    </template>
    
    <!-- 已到底部提示 -->
    <template v-slot:empty>
      <div class="listEnd">
        {{ t('common.reachedBottom') }}
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