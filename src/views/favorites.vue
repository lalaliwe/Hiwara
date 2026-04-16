<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, onActivated } from 'vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'Favorites'
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
  favoriteDate: string; // 添加收藏日期字段
}

// 定义选项卡，默认为 'video'
const tab = ref<'video' | 'image'>(route.query.type === 'image' ? 'image' : 'video');

// 内部维护收藏数据
const videoFavorites = ref<ListItem[]>([]);
const imageFavorites = ref<ListItem[]>([]);

// 生成收藏测试数据，包含随机日期
const generateTestData = () => {
  // 清空现有数据
  videoFavorites.value = [];
  imageFavorites.value = [];

  // 生成最近几天的日期
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // 生成视频收藏数据
  for (let i = 0; i < 15; i++) {
    const randomDate = dates[Math.floor(Math.random() * dates.length)];
    videoFavorites.value.push({
      id: `video_${i}`,
      title: `视频收藏${i}`,
      img: 'https://picsum.photos/200/300',
      author: '作者',
      time: '2023-01-01',
      viewNum: '1000',
      likeNum: '100',
      longNum: '10:00',
      isR18: false,
      favoriteDate: randomDate
    });
  }

  // 生成插画收藏数据
  for (let i = 0; i < 15; i++) {
    const randomDate = dates[Math.floor(Math.random() * dates.length)];
    imageFavorites.value.push({
      id: `image_${i}`,
      title: `插画收藏${i}`,
      img: 'https://picsum.photos/200/300',
      author: '作者',
      time: '2023-01-01',
      viewNum: '1000',
      likeNum: '100',
      longNum: '10',
      isR18: false,
      favoriteDate: randomDate
    });
  }
};

// 按日期分组数据
const groupByDate = (items: ListItem[]) => {
  const grouped: Record<string, ListItem[]> = {};
  
  // 按日期排序
  items.sort((a, b) => new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime());
  
  // 按日期分组
  items.forEach(item => {
    if (!grouped[item.favoriteDate]) {
      grouped[item.favoriteDate] = [];
    }
    grouped[item.favoriteDate].push(item);
  });
  
  return grouped;
};

// 生成测试数据
generateTestData();

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
  <div id="favoritesView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          我的收藏
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
          <div v-for="(groupItems, date) in groupByDate(videoFavorites)" :key="date" class="date-group">
            <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? '今天' : date }}</div>
            <v-list lines="two" class="pa-0">
              <v-list-item v-for="(item, index) in groupItems" :key="index" class="list-item">
                <!-- 左侧：预览图 -->
                <template v-slot:prepend>
                  <v-img 
                    :src="item.img" 
                    :alt="item.title"
                    aspect-ratio="4/3"
                    width="106.7"
                    height="80"
                    cover
                    class="rounded"
                  ></v-img>
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
        </div>
      </v-tabs-window-item>
      <v-tabs-window-item value="image">
        <div class="list" ref="imageListView" @scroll="handleImageScroll">
          <div v-for="(groupItems, date) in groupByDate(imageFavorites)" :key="date" class="date-group">
            <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? '今天' : date }}</div>
            <v-list lines="two" class="pa-0">
              <v-list-item v-for="(item, index) in groupItems" :key="index" class="list-item">
                <!-- 左侧：预览图 -->
                <template v-slot:prepend>
                  <v-img 
                    :src="item.img" 
                    :alt="item.title"
                    aspect-ratio="4/3"
                    width="106.7"
                    height="80"
                    cover
                    class="rounded"
                  ></v-img>
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
                
                <!-- 右侧：R18标记 -->
                <template v-slot:append v-if="item.isR18">
                  <v-chip color="red" size="small" label>R18</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#favoritesView {
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
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(env(safe-area-inset-bottom, 0) + 4px) 0;
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