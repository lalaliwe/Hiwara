<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, onActivated } from 'vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'History'
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
  lastWatchDate: string; // 添加最后观看日期字段
}

// 定义选项卡
const tab = ref('video');

// 内部维护历史记录数据
const videoHistory = ref<ListItem[]>([]);
const imageHistory = ref<ListItem[]>([]);

const videoPage = ref(1);
const imagePage = ref(1);
const pageSize = 15;
const videoIsLoading = ref(false);
const imageIsLoading = ref(false);
const videoHasFinished = ref(false);
const imageHasFinished = ref(false);

// 生成历史记录测试数据，包含随机日期
const generateTestData = (type: 'video' | 'image', pageNum: number) => {
  // 如果是第一页，清空现有数据
  if (pageNum === 1) {
    if (type === 'video') {
      videoHistory.value = [];
    } else {
      imageHistory.value = [];
    }
  }

  // 生成最近几天的日期
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // 根据类型生成数据
  for (let i = 0; i < pageSize; i++) {
    const itemId = (pageNum - 1) * pageSize + i;
    const randomDate = dates[Math.floor(Math.random() * dates.length)];
    
    if (type === 'video') {
      videoHistory.value.push({
        id: `video_${itemId}`,
        title: `视频历史${itemId}`,
        img: 'https://picsum.photos/200/300',
        author: '作者',
        time: '2023-01-01',
        viewNum: '1000',
        likeNum: '100',
        longNum: '10:00',
        isR18: false,
        lastWatchDate: randomDate
      });
    } else {
      imageHistory.value.push({
        id: `image_${itemId}`,
        title: `插画历史${itemId}`,
        img: 'https://picsum.photos/200/300',
        author: '作者',
        time: '2023-01-01',
        viewNum: '1000',
        likeNum: '100',
        longNum: '10',
        isR18: false,
        lastWatchDate: randomDate
      });
    }
  }
};

// 加载更多视频数据
const loadMoreVideoData = async () => {
  if (videoIsLoading.value || videoHasFinished.value) {
    return Promise.resolve();
  }

  videoIsLoading.value = true;

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 增加页码并生成新数据
  videoPage.value++;
  generateTestData('video', videoPage.value);

  // 模拟加载完所有数据（这里假设最多加载5页）
  if (videoPage.value >= 5) {
    videoHasFinished.value = true;
  }

  videoIsLoading.value = false;

  return Promise.resolve();
};

// 加载更多插画数据
const loadMoreImageData = async () => {
  if (imageIsLoading.value || imageHasFinished.value) {
    return Promise.resolve();
  }

  imageIsLoading.value = true;

  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 增加页码并生成新数据
  imagePage.value++;
  generateTestData('image', imagePage.value);

  // 模拟加载完所有数据（这里假设最多加载5页）
  if (imagePage.value >= 5) {
    imageHasFinished.value = true;
  }

  imageIsLoading.value = false;

  return Promise.resolve();
};

// 按日期分组数据
const groupByDate = (items: ListItem[]) => {
  const grouped: Record<string, ListItem[]> = {};

  // 按日期排序
  items.sort((a, b) => new Date(b.lastWatchDate).getTime() - new Date(a.lastWatchDate).getTime());

  // 按日期分组
  items.forEach(item => {
    if (!grouped[item.lastWatchDate]) {
      grouped[item.lastWatchDate] = [];
    }
    grouped[item.lastWatchDate].push(item);
  });

  return grouped;
};

// 生成测试数据
generateTestData('video', 1);
generateTestData('image', 1);

const videoListView = ref();
const imageListView = ref();
let videoScrollTop = 0;
let imageScrollTop = 0;

// 处理滚动事件
function handleVideoScroll(event: Event): void {
  videoScrollTop = (event.target as HTMLElement).scrollTop;
}

function handleImageScroll(event: Event): void {
  imageScrollTop = (event.target as HTMLElement).scrollTop;
}

// 页面激活时恢复滚动位置
onActivated(() => {
  applyPageSettings()

  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
    imageListView.value.scrollTo({ top: imageScrollTop });
  }
});
</script>

<template>
  <div id="historyView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          历史记录
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="video">
            视频
          </v-tab>
          <v-tab value="image">
            插画
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item value="video">
        <div class="list" ref="videoListView" @scroll="handleVideoScroll">
          <v-infinite-scroll color="#00796B" :on-load="loadMoreVideoData" :has-more="!videoHasFinished">
            <div v-for="(groupItems, date) in groupByDate(videoHistory)" :key="date" class="date-group">
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
                  </div>

                  <!-- 右侧：R18标记 -->
                  <template v-slot:append v-if="item.isR18">
                    <v-chip color="red" size="small" label>R18</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-infinite-scroll>
        </div>
      </v-tabs-window-item>
      <v-tabs-window-item value="image">
        <div class="list" ref="imageListView" @scroll="handleImageScroll">
          <v-infinite-scroll color="#00796B" :on-load="loadMoreImageData" :has-more="!imageHasFinished">
            <div v-for="(groupItems, date) in groupByDate(imageHistory)" :key="date" class="date-group">
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
                      {{ item.viewNum }}浏览 • {{ item.likeNum }}收藏 • {{ item.longNum }}张
                    </div>
                  </div>
                </v-list-item>
              </v-list>
            </div>
          </v-infinite-scroll>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#historyView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
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

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }
  }
}

.tabs-window {
  flex: 1;
  overflow: hidden;

  :deep(.v-window__container),
  :deep(.v-window-item) {
    height: 100%;
  }

  .list {
    height: 100%;
    padding: calc(60px + 40px + 1px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
    overflow: auto;

    &::-webkit-scrollbar-track {
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 env(safe-area-inset-bottom, 0) 0;
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
      }
    }
  }
}
</style>