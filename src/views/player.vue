<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, watch, provide, onDeactivated } from 'vue';
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
import { setupStore } from '../core/store';

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
const poster = ref<string>(''); //视频封面
const playNum = ref<number>(0);  // 播放次数
const likeNum = ref<number>(0);  // 点赞数
const createdAt = ref<string>('');  // 创建时间
const isLike = ref(false);  // 是否已点赞
const tags = ref<string[]>([]);  // 标签
const authorname = ref<string>('');  // 作者名称
const avatar = ref<string>('');   // 作者头像
const fansNum = ref<number>(0);   // 作者粉丝数（无API）
const videoNum = ref<number>(0);  // 作者视频数（无API）
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
const videoSelect = ref<number>(0);
const showDefinitionDialog = ref(false); // 控制清晰度选择对话框显示

// 当前选中的视频文件信息
const currentServer = computed(() => {
  return videoFile.value[videoSelect.value]?.server || '';
});
const currentDefinition = computed(() => {
  return videoFile.value[videoSelect.value]?.name || '';
});
const currentVideoSrc = computed(() => {
  return videoFile.value[videoSelect.value]?.view || '';
});

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
        avatar.value = data.user.avatar ? `https://i.iwara.tv/image/avatar/${data.user.avatar.id}/${data.user.avatar.name}` : '';
        isFollow.value = data.user.following || false;
      }
      // 获取视频封面
      if (data.file && data.file.id) {
        // 使用 API 返回的 thumbnail 索引，如果不存在则默认为 0
        const thumbnailIndex = data.thumbnail ?? 0;
        poster.value = `https://i.iwara.tv/image/thumbnail/${data.file.id}/thumbnail-${String(thumbnailIndex).padStart(2, '0')}.jpg`;
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
      // console.log('Processed video files:', videoFile.value);

      // 根据 store 中的 definition 值设置 videoSelect
      const setup = setupStore();
      const targetDefinition = setup.definition;
      // console.log('Target definition:', targetDefinition);
      const selectedIndex = videoFile.value.findIndex(file => file.name === targetDefinition);
      if (selectedIndex !== -1) {
        videoSelect.value = selectedIndex;
      } else {
        // 如果找不到匹配的，默认选择第一个
        videoSelect.value = 0;
      }
      // console.log(videoFile.value[videoSelect.value])
    }
  } catch (error) {
    showShortToast('获取视频文件失败');
    console.error('获取视频文件失败：', error);
  }
}
function definitionTextFormat(text: string): string {
  // 如果输入是数字，返回值后面加个P
  if (!isNaN(Number(text))) {
    return `${text}P`;
  }
  // 如果输入是Source，返回原画
  if (text === 'Source') {
    return '原画';
  }
  // 其他情况返回原文本
  return text;
}

// 选择清晰度
const selectDefinition = async (index: number) => {
  // 如果选择的清晰度与当前相同,则不执行切换
  if (index === videoSelect.value) {
    showDefinitionDialog.value = false;
    return;
  }

  videoSelect.value = index;
  showDefinitionDialog.value = false;

  // 同步到 store 和数据库
  const setup = setupStore();
  await setup.updateSetting('definition', videoFile.value[index].name);

  showShortToast(`已切换到 ${definitionTextFormat(videoFile.value[index].name)}`);
};

// 过滤并排序视频文件列表
const sortedVideoFiles = computed(() => {
  // 先过滤掉 preview
  const filtered = videoFile.value.filter(file => file.name.toLowerCase() !== 'preview');

  // 排序函数
  return filtered.sort((a, b) => {
    // Source(原画)排最后
    if (a.name === 'Source' && b.name !== 'Source') return 1;
    if (a.name !== 'Source' && b.name === 'Source') return -1;

    // 都是数字类型,按数值大小排序
    const aNum = Number(a.name);
    const bNum = Number(b.name);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    // 其他情况保持原顺序
    return 0;
  });
});

// 获取排序后文件在原数组中的索引
const getOriginalIndex = (file: VideoFileItem) => {
  return videoFile.value.findIndex(f => f.id === file.id);
};

// 刷新视频文件列表
const refreshVideoFile = async () => {
  showShortToast('正在切换服务器');
  try {
    const res = await api_getVideoInfo(id.value as string);
    if (res.ok && res.data?.fileUrl) {
      let extension = '.mp4';
      if (res.data.file?.name) {
        const lastDotIndex = res.data.file.name.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          extension = res.data.file.name.substring(lastDotIndex);
        }
      }
      const filename = `Iwara - ${res.data.title} [${res.data.id}]${extension}`;
      await fetchVideoFile(res.data.fileUrl, filename);
    }
  } catch (error) {
    console.error('刷新服务器列表失败:', error);
    showShortToast('刷新服务器列表失败');
  }
};

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
    <videoPlayer class="video-player" :poster="poster" :src="currentVideoSrc" :title="title" :server="currentServer"
      :video-files="videoFile" :current-definition-index="videoSelect" @refresh-server="refreshVideoFile"
      @definition-change="selectDefinition" />
    <div class="tabs">
      <div class="tabs-elements">
        <v-tabs class="left" v-model="tab" color="#00796B" density="comfortable">
          <v-tab value="info">简介</v-tab>
          <v-tab value="comment">评论</v-tab>
        </v-tabs>
        <div class="right" v-if="videoFile.length > 0">
          <span v-ripple @click="refreshVideoFile">
            <font-awesome-icon icon="fa-solid fa-server" />{{ currentServer }}
          </span>
          <span v-ripple @click="showDefinitionDialog = true">
            <font-awesome-icon icon="fa-solid fa-film" />{{ definitionTextFormat(currentDefinition) }}
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
            :createdAt="createdAt" :isLike="isLike" :tags="tags" :authorname="authorname" :avatar="avatar"
            :fansNum="fansNum" :videoNum="videoNum" :isFollow="isFollow" />
        </swiper-slide>
        <swiper-slide>
          <commentView />
        </swiper-slide>
      </swiper>
    </div>

    <!-- 清晰度选择对话框 -->
    <v-dialog v-model="showDefinitionDialog" max-width="400">
      <v-card>
        <v-card-title class="text-center">
          选择清晰度
        </v-card-title>
        <v-divider></v-divider>
        <v-list>
          <v-list-item v-for="(file, index) in sortedVideoFiles" :key="file.id"
            @click="selectDefinition(getOriginalIndex(file))" :active="getOriginalIndex(file) === videoSelect">
            <template v-slot:prepend>
              <v-icon icon="fa-solid fa-film"></v-icon>
            </template>
            <v-list-item-title>{{ definitionTextFormat(file.name) }}</v-list-item-title>
            <template v-slot:append v-if="getOriginalIndex(file) === videoSelect">
              <v-icon color="primary" icon="fa-solid fa-check"></v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
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

      color: #616161;
      font-size: 0.9rem;

      span {
        display: inline-flex;
        align-items: center;
        user-select: none;
        justify-content: center;
        height: 100%;
        cursor: pointer;
      }

      span:nth-child(1) {
        padding: 0 4px;
      }

      span:nth-child(2) {
        width: 68px;
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
