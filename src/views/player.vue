<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, watch, provide, onDeactivated } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import videoPlayer from '../component/player/videoPlayer.vue';
import infoView from '../component/player/info.vue';
import commentView from '../component/player/comment.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import {
  getVideoInfo as api_getVideoInfo,
  getVideoFileSQ as api_getVideoFileSQ,
  addAria2Download,
  buildAria2Filename
} from '../core/api';
import { showShortToast } from '../core/toast';
import { setupStore } from '../core/store';
import { insertVideoHistory } from '../core/database';
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

const router = useRouter();
const route = useRoute();

const tab = ref('info');  // 当前选中的tab
const id = ref(route.params.id);  // 视频id
const title = ref<string>('');   // 视频标题
const synopsis = ref<string>('');  // 视频简介
const poster = ref<string>(''); //视频封面
const playNum = ref<number>(0);  // 播放次数
const likeNum = ref<number>(0);  // 点赞数
const createdAt = ref<string>('');  // 创建时间
const isLike = ref(false);  // 是否已点赞
const tags = ref<string[]>([]);  // 标签
const authorname = ref<string>('');  // 作者名称
const username = ref<string>(''); // 用户名
const avatar = ref<string>('');   // 作者头像
const uid = ref<string>('');  // 作者ID
const fansNum = ref<number>(0);   // 作者粉丝数（无API）
const videoNum = ref<number>(0);  // 作者视频数（无API）
const isFollow = ref(false);  // 是否已关注
const slug = ref<string>('');
const fileExtension = ref('.mp4'); // 视频文件扩展名，用于 aria2 下载

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

// 聚合状态：'failed' | 'loading' | 'success'
type VideoInfoState = 'failed' | 'loading' | 'success';
const videoInfoState = ref<VideoInfoState>('loading');

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
const currentDownloadUrl = computed(() => {
  return videoFile.value[videoSelect.value]?.download || '';
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
  videoInfoState.value = 'loading'; // 开始加载
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
      slug.value = data.slug || '';
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
        authorname.value = data.user.name || '';
        username.value = data.user.username || '';
        uid.value = data.user.id || '';
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
      fileExtension.value = extension;
      const filename = `Iwara - ${data.title} [${data.id}]${extension}`;
      await fetchVideoFile(data.fileUrl, filename);

      // 数据获取成功
      videoInfoState.value = 'success';

      // 添加视频历史记录
      try {
        // 解析 createdAt 为时间戳
        const createTimeTimestamp = data.createdAt ? new Date(data.createdAt).getTime() : 0;

        await insertVideoHistory(
          data.id,
          data.title || '',
          data.user?.name || '',
          poster.value,
          data.file?.duration || 0, // 视频时长（秒）
          createTimeTimestamp // 作品发布时间
        );
        console.log('视频历史记录已添加:', data.id);
      } catch (error) {
        console.error('添加视频历史记录失败:', error);
      }
    } else {
      console.error(`状态码：${res.status}`, `错误信息：${res.statusText}`);
      showShortToast('获取视频信息失败');
      videoInfoState.value = 'failed';
    }
  } catch (error) {
    console.error(error);
    showShortToast('获取视频信息失败');
    videoInfoState.value = 'failed';
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
// 重试加载视频信息
const retryFetchVideoInfo = () => {
  fetchVideoInfo();
};

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

const likeTrigger = (val: boolean) => {
  isLike.value = val;
  if (val) {
    // 点赞时触发 aria2 下载
    addAria2DownloadTask();
  }
}

/**
 * 向 aria2 发送添加下载任务的请求
 * 从 store 读取 aria2 配置，按 标题[id]username.扩展名 格式命名文件
 * 仅在 aria2 启用且推送失败时提示用户
 */
async function addAria2DownloadTask() {
  const setup = setupStore();
  // 检查 aria2 开关是否开启
  if (!setup.aria2Switch) {
    return;
  }
  // 检查是否有下载链接
  const downloadUrl = currentDownloadUrl.value;
  if (!downloadUrl) {
    console.warn('aria2 下载失败: 未获取到下载链接');
    return;
  }
  // 检查 RPC 地址是否已配置
  if (!setup.aria2Rpc || setup.aria2Rpc.trim() === '') {
    console.warn('aria2 下载失败: 未配置 RPC 地址');
    return;
  }

  // 构建文件名: 标题[id]username.扩展名
  const filename = buildAria2Filename(
    title.value,
    id.value as string,
    username.value,
    fileExtension.value
  );

  console.log('aria2 开始添加下载任务:', {
    rpc: setup.aria2Rpc,
    dir: setup.aria2Download,
    filename: filename,
    url: downloadUrl.substring(0, 50) + '...',
  });

  const result = await addAria2Download(
    setup.aria2Rpc,
    setup.aria2Token || null,
    downloadUrl,
    setup.aria2Download,
    filename
  );

  if (result.ok) {
    console.log('aria2 下载任务添加成功, GID:', result.result);
  } else {
    console.error('aria2 下载任务添加失败:', result.error);
    showShortToast(`aria2 添加失败`);
  }
}
const followTrigger = (val: boolean) => {
  isFollow.value = val;
}

</script>
<template>
  <div id="playerView">
    <div class="topBar"></div>
    <div class="video-player-wrapper">
      <videoPlayer class="video-player" :poster="poster" :src="currentVideoSrc" :title="title"
        :server="currentServer" :video-files="videoFile" :current-definition-index="videoSelect"
        @refresh-server="refreshVideoFile" @definition-change="selectDefinition" />
    </div>

    <!-- 加载中 -->
    <div class="status-view" v-if="videoInfoState === 'loading'">
      <loadingHuawu>数据加载中</loadingHuawu>
    </div>

    <!-- 加载失败 -->
    <div class="status-view" v-else-if="videoInfoState === 'failed'">
      <errorHuawu>数据加载失败了喵~</errorHuawu>
    </div>

    <!-- 加载成功：视频信息 + Swiper 内容 -->
    <div class="video-info" v-else>
      <div class="tabs">
        <div class="tabs-bar">
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
        <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
          @slide-change="onSlideChange">
          <swiper-slide>
            <infoView :title="title" :synopsis="synopsis" :playNum="playNum"
              :likeNum="likeNum" :createdAt="createdAt" :isLike="isLike" :tags="tags" :authorname="authorname"
              :username="username" :avatar="avatar" :fansNum="fansNum" :videoNum="videoNum" :isFollow="isFollow"
              :vid="id as string" :uid="uid" :download="currentDownloadUrl" :slug="slug" @like="likeTrigger"
              @follow="followTrigger" />
          </swiper-slide>
          <swiper-slide>
            <commentView :vid="id as string" />
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
  </div>
</template>
<style lang="scss" scoped>
#playerView {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

.topBar {
  height: env(safe-area-inset-top, 0);
  width: 100%;
  background-color: #000;
}

.video-player-wrapper {
  position: relative;
  width: 100%;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
}

/* 加载/失败 状态容器 */
.status-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  background-color: var(--color-bg-card);

  :deep(.v-tab) {
    min-width: 0 !important;
    color: var(--color-text-muted);

    &.v-tab--selected {
      color: var(--color-primary);
    }
  }

  .tabs-bar {
    display: flex;

    .left {
      flex: 1;
      padding: 0 16px;
    }

    .right {
      display: flex;
      padding: 0 14px;
      color: var(--color-text-muted);
      font-size: 0.9rem;

      span {
        display: inline-flex;
        align-items: center;
        user-select: none;
        justify-content: center;
        cursor: pointer;
      }

      span:nth-child(1) {
        padding: 0 6px;
      }

      span:nth-child(2) {
        padding: 0 6px;
      }
    }
  }
}

.tabs-content {
  flex: 1;
  overflow: hidden;

  .tabs-window {
    height: 100%;

    :deep(.swiper-wrapper) {
      height: 100%;
    }

    :deep(.swiper-slide) {
      height: 100%;
    }
  }
}
</style>
