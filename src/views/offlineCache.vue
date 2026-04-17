<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, onActivated } from 'vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'OfflineCache'
})

const router = useRouter();
const route = useRoute();

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

const goBack = () => {
  router.back();
}

// 定义列表项接口
interface CacheItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
  cacheProgress: number; // 缓存进度百分比
  cacheDate: string; // 缓存日期
}

// 内部维护缓存数据
const videoCache = ref<CacheItem[]>([]);

// 生成缓存测试数据，包含随机日期和进度
const generateTestData = () => {
  // 清空现有数据
  videoCache.value = [];

  // 生成最近几天的日期
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // 生成视频缓存数据
  for (let i = 0; i < 15; i++) {
    const randomDate = dates[Math.floor(Math.random() * dates.length)];
    videoCache.value.push({
      id: `video_${i}`,
      title: `视频缓存${i}`,
      img: 'https://picsum.photos/200/300',
      author: '作者',
      time: '2023-01-01',
      viewNum: '1000',
      likeNum: '100',
      longNum: '10:00',
      isR18: true,
      cacheProgress: Math.floor(Math.random() * 100), // 随机缓存进度
      cacheDate: randomDate
    });
  }
};

// 按日期分组数据
const groupByDate = (items: CacheItem[]) => {
  const grouped: Record<string, CacheItem[]> = {};

  // 按日期排序
  items.sort((a, b) => new Date(b.cacheDate).getTime() - new Date(a.cacheDate).getTime());

  // 按日期分组
  items.forEach(item => {
    if (!grouped[item.cacheDate]) {
      grouped[item.cacheDate] = [];
    }
    grouped[item.cacheDate].push(item);
  });

  return grouped;
};

// 生成测试数据
generateTestData();

const videoListView = ref();
let videoScrollTop = 0;

// 处理滚动事件
function handleVideoScroll(event: Event): void {
  videoScrollTop = (event.target as HTMLElement).scrollTop;
}

// 页面激活时恢复滚动位置
onActivated(() => {
  applyPageSettings()

  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
});
</script>

<template>
  <div id="offlineCacheView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          离线缓存
        </div>
      </div>
    </div>
    <div class="list" ref="videoListView" @scroll="handleVideoScroll">
      <div v-for="(groupItems, date) in groupByDate(videoCache)" :key="date" class="date-group">
        <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? '今天' : date }}</div>
        <v-list lines="two" class="pa-0">
          <v-list-item v-for="(item, index) in groupItems" :key="index" class="list-item">
            <!-- 左侧：预览图 -->
            <template v-slot:prepend>
              <v-img :src="item.img" :alt="item.title" aspect-ratio="4/3" width="106.7" height="80" cover
                class="rounded"></v-img>
            </template>
            <!-- 中间：标题和信息 -->
            <div class="list-content">
              <div class="list-title">
                {{ item.title }}
              </div>
              <div class="list-subtitle">
                {{ item.author }} • {{ item.time }}
              </div>
              <div class="list-stats">
                {{ item.viewNum }}播放 • {{ item.likeNum }}点赞 • {{ item.longNum }}
              </div>
              <!-- 缓存进度条 -->
              <div class="cache-progress-container">
                <v-progress-linear 
                  :model-value="item.cacheProgress" 
                  color="#00796B" 
                  height="4"
                  rounded
                ></v-progress-linear>
                <div class="cache-progress-text">
                  {{ item.cacheProgress === 100 ? '缓存完成' : item.cacheProgress + '%' }}
                </div>
              </div>
            </div>
          </v-list-item>
        </v-list>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#offlineCacheView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  height: 100%;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
    padding-top: env(safe-area-inset-top, 0);
    height: calc(env(safe-area-inset-top, 0) + 60px);
    background-color: rgba(0, 121, 107, 0.9);
    color: #fff;
    display: flex;
    align-items: center;
    user-select: none;

    .goback {
      padding: 0 16px;
      height: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;

      svg {
        font-size: 1.5rem;
        color: white;
      }

      &:active {
        opacity: 0.7;
      }
    }

    .label {
      font-size: 1.2rem;
      font-weight: 500;
    }
  }
}

.list {
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  overflow: auto;

  .date-group {
    .date-header {
      padding: 12px 16px 8px;
      background-color: #f0f0f0;
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }
  }

  .list-item {
    border-bottom: 1px solid #eee;
    padding: 8px 16px;

    .list-content {
      flex: 1;
      min-width: 0; // 允许内容压缩
      margin: 0 16px;

      .list-title {
        font-weight: 500;
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-subtitle {
        font-size: 0.8rem;
        color: #616161;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 4px;
      }

      .list-stats {
        font-size: 0.75rem;
        color: #959595;
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cache-progress-container {
        margin-top: 8px;

        .cache-progress-text {
          font-size: 0.7rem;
          color: #666;
          text-align: right;
          margin-top: 4px;
        }
      }
    }
  }
}
</style>