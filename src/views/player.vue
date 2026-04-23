<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, watch, provide, onDeactivated } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import videoPlayer from '../component/player/videoPlayer.vue';
import infoView from '../component/player/info.vue';
import commentView from '../component/player/comment.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import {
  getVideoInfo as api_getVideoInfo,
  getVideoFileSQ as api_getVideoFileSQ
} from '../core/api';
import { showShortToast } from '../core/toast';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

const router = useRouter();
const route = useRoute();

const tab = ref('info');  // 当前选中的tab
const id = ref(route.params.id);  // 视频id
const isLoading = ref(true); // 新增：加载状态
const title = ref<string>('');   // 视频标题
const synopsis = ref<string>('');  // 视频简介
const playNum = ref<number>(0);  // 播放次数
const likeNum = ref<number>(0);  // 点赞数
const createdAt = ref<string>('');  // 创建时间
const isLike = ref(false);  // 是否已点赞
const tags = ref<string[]>([]);  // 标签
const authorname = ref<string>('');  // 作者名称
const fansNum = ref<number>(0);
const videoNum = ref<number>(0);
const isFollow = ref(false);  // 是否已关注

interface VideoFileItem {
  id: string;
  name: string;
  server: string;
  type: string;
  view: string;
  download: string;
}
const videoFile = ref<VideoFileItem[]>([]);

// --- Swiper 联动逻辑 ---
const swiperInstance = ref<SwiperType | null>(null);

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'info' ? 0 : 1;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
});

const onSlideChange = (swiper: SwiperType) => {
  tab.value = swiper.activeIndex === 0 ? 'info' : 'comment';
};
// --- End Swiper 联动逻辑 ---

const goBack = () => {
  router.back();
};
provide('goBack', goBack);
const goHome = () => {
  router.replace('/');
};
provide('goHome', goHome);

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}

// 获取视频信息
const fetchVideoInfo = async () => {
  isLoading.value = true; // 开始加载
  try {
    const res = await api_getVideoInfo(id.value as string);
    // console.log(res);
    if (res.ok) {
      const data = res.data;
      title.value = data.title || '';
      synopsis.value = data.body || '';
      playNum.value = data.numViews || 0;
      likeNum.value = data.numLikes || 0;
      isLike.value = data.liked || false;
      // 修改: 直接传递原始时间字符串，由 info 组件格式化
      createdAt.value = data.createdAt || '';
      // 处理标签
      if (data.tags && Array.isArray(data.tags)) {
        tags.value = data.tags.map((tag: any) => tag.id);
      } else {
        tags.value = [];
      }
      // 处理作者信息
      if (data.user) {
        authorname.value = data.user.name || data.user.username || '';
        isFollow.value = data.user.following || false;
      }
      // 获取视频文件
      let extension = '.mp4'; // 默认扩展名
      if (data.file?.name) {
        const lastDotIndex = data.file.name.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          extension = data.file.name.substring(lastDotIndex);
        }
      }
      const filename = `Iwara - ${data.title} [${data.id}]${extension}`;
      fetchVideoFile(data.fileUrl, filename);
    } else {
      console.error(`状态码：${res.status}`, `错误信息：${res.statusText}`);
      showShortToast('获取视频信息失败');
    }
  } catch (error) {
    console.error(error);
    showShortToast('获取视频信息失败');
  } finally {
    isLoading.value = false; // 结束加载
  }
};
fetchVideoInfo();
// 获取视频文件
async function fetchVideoFile(url: string, filename: string) {
  try {
    const res = await api_getVideoFileSQ(url, filename)
    // console.log(res);
    // 补全逻辑：解析并存储视频文件信息
    if (res.ok && res.data && Array.isArray(res.data)) {
      videoFile.value = res.data.map((item: any) => {
        // 从 view URL 中提取 server 名称 (例如: //hime.iwara.tv/... -> hime)
        let server = 'unknown';
        if (item.src && item.src.view) {
          const match = item.src.view.match(/\/\/([^.]+)\./);
          if (match && match[1]) {
            server = match[1];
          }
        }
        return {
          id: item.id,
          name: item.name,
          server: server,
          type: item.type,
          view: `https:${item.src?.view}` || '',
          download: `https:${item.src?.download}` || ''
        };
      });
      console.log('Processed video files:', videoFile.value);
    }
  } catch (error) {
    showShortToast('获取视频文件失败');
    console.error('获取视频文件失败：', error);
  }
}

onActivated(() => {
  applyPageSettings()
  console.log('🔄 Player activated', id.value);
})
onDeactivated(() => {
  console.log('⏸️ Player deactivated', id.value);
})
onMounted(() => {
  applyPageSettings();
});
onUnmounted(() => {
  console.log('❌ Player unmounted', id.value);
})
</script>
<template>
  <div id="playerView">
    <div class="topBar"></div>
    <videoPlayer class="video-player" />
    <div class="tabs">
      <div class="tabs-elements">
        <v-tabs class="left" v-model="tab" color="#00796B" density="comfortable">
          <v-tab value="info">简介</v-tab>
          <v-tab value="comment">评论</v-tab>
        </v-tabs>
        <div class="right">
          <span>
            <font-awesome-icon icon="fa-solid fa-server" />hiwara
          </span>
          <span>
            <font-awesome-icon icon="fa-solid fa-film" />1080P
          </span>
        </div>
      </div>
      <v-divider></v-divider>
    </div>
    <div class="tabs-content">
      <!-- 替换为 Swiper -->
      <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
        @slide-change="onSlideChange">
        <swiper-slide>
          <!-- 修改：只有当非加载状态时才渲染 infoView，确保数据已准备就绪 -->
          <infoView v-if="!isLoading" :title="title" :synopsis="synopsis" :playNum="playNum" :likeNum="likeNum"
            :createdAt="createdAt" :isLike="isLike" :tags="tags" :authorname="authorname" :fansNum="fansNum"
            :videoNum="videoNum" :isFollow="isFollow" />
        </swiper-slide>
        <swiper-slide>
          <commentView />
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>
<style lang="scss" scoped>
#playerView {
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.topBar {
  height: env(safe-area-inset-top, 0);
  width: 100%;
  background-color: #000;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.tabs {
  .v-tab {
    min-width: 0 !important;
  }

  .tabs-elements {
    display: flex;

    .left {
      flex: 1;
      padding: 0 14px;
    }

    .right {
      padding: 0 10px;
      display: flex;
      align-items: center;
      color: #616161;
      font-size: 0.9rem;

      span {
        padding: 0 4px;
      }
    }
  }
}

.tabs-content {
  flex: 1;
  overflow: hidden;

  .tabs-window {
    height: 100%;

    // 让 Swiper 内部结构继承 100% 高度
    :deep(.swiper-wrapper) {
      height: 100%;
    }

    // 替代原 .v-window-item 的功能：高度100% + 内部滚动
    :deep(.swiper-slide) {
      height: 100%;
    }
  }
}
</style>
