<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onUnmounted, onActivated, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Like as iconLike,
  ShareOne as iconShareOne,
  DownloadFour as iconDownloadFour,
  CopyLink as iconCopyLink,
} from '@icon-park/vue-next';
import test1Img from '../../static/img/test1.jpg';
import defaultAvatarImg from '../../static/img/avatar-default.jpg';
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png';
import avatarErrorImg from '../../static/img/avatar-error.png';
import cardButton from '../cardButton.vue';
import {
  getImageIwara,
  getVideoRecommendByUser,
  getVideoRecommendByOther,
  likeVideo,
  unlikeVideo,
  followUser,
  unfollowUser,
} from '../../core/api';
import { showShortToast } from '../../core/toast';

const { t } = useI18n();
import { useRouter } from 'vue-router';

const router = useRouter();

// 格式化时间（支持多语言）
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

interface Props {
  title: string, // 标题
  synopsis: string, // 描述
  playNum: number, // 播放数
  likeNum: number, // 点赞数
  createdAt: string,  // 创建时间 (原始字符串)
  isLike: boolean,  // 是否已点赞
  tags: string[], // 标签
  authorname: string, // 作者昵称
  username: string, // 用户名
  avatar: string, // 作者头像    
  fansNum: number, // 粉丝数
  videoNum: number, // 视频数
  isFollow: boolean,  // 是否已关注
  isMyFans?: boolean,  // 是否是粉丝（互粉状态）
  vid: string, // 视频ID
  uid: string, // 用户ID
  download: string, // 下载链接
  slug: string, // 视频slug
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'like', isLiked: boolean): void;
  (e: 'follow', isFollowed: boolean): void;
}>();

// 复制下载链接到剪贴板
async function copyDownloadLink() {
  if (!props.download) {
    showShortToast(t('common.fetchDownloadFailed'));
    return;
  }
  try {
    await navigator.clipboard.writeText(props.download);
    showShortToast(t('common.downloadLinkCopied'));
  } catch (err) {
    console.error('复制失败:', err);
    showShortToast(t('common.fetchDownloadFailed'));
  }
}

// 使用 Web Share API 分享下载链接
async function shareDownloadLink() {
  if (!props.download) {
    showShortToast(t('common.fetchDownloadFailed'));
    return;
  }
  // 检查浏览器是否支持 Web Share API
  if (!navigator.share) {
    showShortToast(t('common.shareNotSupported'));
    return;
  }
  try {
    let shareUrl: string;
    if (props.slug === '')
      shareUrl = `https://iwara.tv/video/${props.vid}`;
    else
      shareUrl = `https://iwara.tv/video/${props.vid}/${props.slug}`;
    await navigator.share({
      title: props.title || t('player.shareTitle'),
      text: t('player.shareText', { title: props.title }),
      url: shareUrl,
    });
    showShortToast(t('common.shareSuccess'));
  } catch (err) {
    // 用户取消分享不显示错误提示
    if ((err as Error).name !== 'AbortError') {
      console.error('分享失败:', err);
      showShortToast(t('common.shareFailed'));
    }
  }
}

const expand = ref(false);  // 是否展开
const titleRef = ref<HTMLElement | null>(null); // 标题元素
const titleCollapseHeightRef = ref<HTMLElement | null>(null); // 标题折叠高度元素
const titleExpandHeightRef = ref<HTMLElement | null>(null); // 标题展开高度元素
const synopsisHeightRef = ref<HTMLElement | null>(null); // 描述高度元素

// 高度缓存对象
const heights = ref({
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0
});

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
// 初始化列表数据
const authorOtherVideoList = ref<ListItem[]>([]); // 作者其他视频
const recommendVideoList = ref<ListItem[]>([]); // 推荐视频

// 当前滚动条位置
let scrollTop = 0;
const infoViewRef = ref<HTMLElement>();
const infoViewContentRef = ref<HTMLElement>(); // 内层内容容器
let contentResizeObserver: ResizeObserver | null = null; // ResizeObserver 实例

// 加载状态
const isLoadingAuthorVideos = ref(false);
const isLoadingRecommendVideos = ref(false);
const isFollowing = ref(false); // 关注操作进行中状态
const isLiking = ref(false); // 点赞操作进行中状态

// 关注按钮状态合并计算
const followBtn = computed(() => {
  if (props.isFollow && props.isMyFans) return { text: t('player.followMutual'), variant: 'outlined' as const, icon: 'fa-solid fa-bars' };
  if (props.isFollow) return { text: t('player.followed'), variant: 'outlined' as const, icon: 'fa-solid fa-bars' };
  if (props.isMyFans) return { text: t('player.followBack'), variant: 'flat' as const, icon: 'fa-solid fa-plus' };
  return { text: t('player.follow'), variant: 'flat' as const, icon: 'fa-solid fa-plus' };
});

// 加载作者其他视频
async function loadAuthorOtherVideos() {
  if (!props.vid || !props.uid) return;

  isLoadingAuthorVideos.value = true;
  try {
    const response = await getVideoRecommendByUser(props.vid, props.uid);
    if (response.ok && response.data.results) {
      authorOtherVideoList.value = await Promise.all(response.data.results.map(async (item: any) => ({
        id: item.id,
        title: item.title,
        img: item.file ? `https://i.iwara.tv/image/thumbnail/${item.file.id}/thumbnail-${String(item.thumbnail ?? 0).padStart(2, '0')}.jpg` : test1Img,
        author: item.user?.name || item.user?.username || '',
        time: item.createdAt,  // 传递原始时间字符串，让cardButton自己格式化
        viewNum: item.numViews || 0,
        likeNum: item.numLikes || 0,
        longNum: item.file?.duration || 0,
        isR18: item.rating === 'ecchi' || item.rating === 'r18',
      })));
    }
  } catch (error) {
    console.error('Failed to load author other videos:', error);
  } finally {
    isLoadingAuthorVideos.value = false;
  }
}

// 加载推荐视频
async function loadRecommendVideos() {
  if (!props.vid) return;

  isLoadingRecommendVideos.value = true;
  try {
    const response = await getVideoRecommendByOther(props.vid);
    if (response.ok && response.data.results) {
      recommendVideoList.value = await Promise.all(response.data.results.map(async (item: any) => ({
        id: item.id,
        title: item.title,
        img: item.file ? `https://i.iwara.tv/image/thumbnail/${item.file.id}/thumbnail-${String(item.thumbnail ?? 0).padStart(2, '0')}.jpg` : test1Img,
        author: item.user?.name || item.user?.username || '',
        time: item.createdAt,  // 传递原始时间字符串，让cardButton自己格式化
        viewNum: item.numViews || 0,
        likeNum: item.numLikes || 0,
        longNum: item.file?.duration || 0,
        isR18: item.rating === 'ecchi' || item.rating === 'r18',
      })));
    }
  } catch (error) {
    console.error('Failed to load recommend videos:', error);
  } finally {
    isLoadingRecommendVideos.value = false;
  }
}

// 在setup阶段立即加载数据（在onMounted之前）
loadAuthorOtherVideos();
loadRecommendVideos();

// 处理窗口大小改变
function handleResize() {
  calculateHeights();
}

function calculateHeights() {
  heights.value.titleCollapse = titleCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.titleExpand = titleExpandHeightRef.value?.offsetHeight || 0;
  heights.value.synopsis = synopsisHeightRef.value?.offsetHeight || 0;
}
// 保存滚动条位置
function handleSroll(e: Event): void {
  scrollTop = (e.target as HTMLElement).scrollTop;
}
onActivated(() => {
  // 恢复滚动条位置
  if (infoViewRef.value && typeof infoViewRef.value.scrollTo === 'function')
    infoViewRef.value.scrollTo({ top: scrollTop });
})

onMounted(() => {
  calculateHeights();
  if (titleRef.value) {
    titleRef.value.style.height = heights.value.titleCollapse + 'px';
    titleRef.value.style.whiteSpace = 'nowrap';
  }

  // 监听窗口大小改变事件
  window.addEventListener('resize', handleResize);

  // 监听内层内容容器高度变化（推荐视频等异步加载导致），重新计算
  if (infoViewContentRef.value) {
    contentResizeObserver = new ResizeObserver(() => {
      calculateHeights();
    });
    contentResizeObserver.observe(infoViewContentRef.value);
  }
})
onUnmounted(() => {
  // 移除窗口大小改变监听器
  window.removeEventListener('resize', handleResize);
  // 断开 ResizeObserver
  if (contentResizeObserver) {
    contentResizeObserver.disconnect();
    contentResizeObserver = null;
  }
})
// 简化 watch 逻辑，使用 nextTick 确保 DOM 更新后设置样式
watch(expand, async (val) => {
  if (!titleRef.value) return;

  if (val) {
    // === 展开逻辑 ===
    titleRef.value.style.whiteSpace = 'normal';
    titleRef.value.style.height = heights.value.titleExpand + 'px';
  } else {
    // === 折叠逻辑 ===
    const el = titleRef.value;
    el.style.height = heights.value.titleCollapse + 'px';

    // 等待一帧让浏览器应用 height 变化，然后设置 whiteSpace
    await nextTick();
    setTimeout(() => {
      if (!expand.value) {
        el.style.whiteSpace = 'nowrap';
      }
    }, 300); // 与 transition 时间匹配
  }
}, { immediate: true });

// 头像 URL（响应式）
const avatarUrl = ref<string>('');

// 加载头像
async function loadAvatar() {
  if (!props.avatar || props.avatar.trim() === '') {
    // avatar 为空，使用默认头像
    avatarUrl.value = defaultAvatarImg;
  } else {
    try {
      // avatar 不为空，通过 API 获取
      avatarUrl.value = await getImageIwara(props.avatar);
    } catch (error) {
      console.error('Failed to load avatar:', error);
      // 加载失败时使用默认头像
      avatarUrl.value = avatarErrorImg;
    }
  }
}

// 监听 avatar prop 变化，立即执行
watch(() => props.avatar, () => {
  loadAvatar();
}, { immediate: true });

// 关注
function clickFollow() {
  // 如果正在执行关注操作，直接返回
  if (isFollowing.value) return;
  console.log(props.uid);
  isFollowing.value = true;
  if (props.isFollow) {
    emit('follow', false);
    unfollowUser(props.uid).then((res) => {
      if (res.ok && res.status === 204) {
        console.log('取消关注成功');
        showShortToast(t('common.unfollowed'));
      } else {
        console.log('取消关注失败');
        showShortToast(t('common.unfollowFailed'));
        emit('follow', true);
      }
    }).catch((error) => {
      console.error('取消关注请求失败:', error);
      showShortToast(t('common.unfollowFailed'));
      emit('follow', true);
    }).finally(() => {
      isFollowing.value = false;
    })
  } else {
    emit('follow', true);
    followUser(props.uid).then((res) => {
      if (res.ok && res.status === 201) {
        console.log('关注成功');
        showShortToast(t('common.followed'));
      } else {
        console.log('关注失败');
        showShortToast(t('common.followFailed'));
        emit('follow', false);
      }
    }).catch((error) => {
      console.error('关注请求失败:', error);
      showShortToast(t('common.followFailed'));
      emit('follow', false);
    }).finally(() => {
      isFollowing.value = false;
    })
  }
}
// 点赞
function clickLike() {
  // 如果正在执行点赞操作，直接返回
  if (isLiking.value) return;
  isLiking.value = true;
  if (props.isLike) {
    emit('like', false);
    unlikeVideo(props.vid).then((res) => {
      if (res.ok && res.status === 204) {
        console.log('取消点赞成功');
        showShortToast(t('common.unliked'));
      } else {
        console.log('取消点赞失败');
        showShortToast(t('common.unlikeFailed'));
        emit('like', true);
      }
    }).catch((error) => {
      console.error('取消点赞请求失败:', error);
      showShortToast(t('common.unlikeFailed'));
      emit('like', true);
    }).finally(() => {
      isLiking.value = false;
    })
  } else {
    emit('like', true);
    likeVideo(props.vid).then((res) => {
      if (res.ok && res.status === 201) {
        console.log('点赞成功');
        showShortToast(t('common.liked'));
      } else {
        console.log('点赞失败');
        showShortToast(t('common.likeFailed'));
        emit('like', false);
      }
    }).catch((error) => {
      console.error('点赞请求失败:', error);
      showShortToast(t('common.likeFailed'));
      emit('like', false);
    }).finally(() => {
      isLiking.value = false;
    });
  }
}
function toZone() {
  router.push({
    path: `/zone/${props.username}`,
  });
}
function downloadVideo() {
  showShortToast('功能未开放');
}

// 暗色模式响应式检测
const isDarkMode = ref(detectDarkMode());
let darkModeMediaQuery: MediaQueryList | null = null;
let darkModeChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

function updateDarkMode() {
  isDarkMode.value = detectDarkMode();
}

onMounted(() => {
  // 监听系统暗色模式变化
  darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeChangeHandler = (e: MediaQueryListEvent) => {
    updateDarkMode();
  };
  darkModeMediaQuery.addEventListener('change', darkModeChangeHandler);

  // 监听 .dark-theme class 变化（通过 MutationObserver）
  const observer = new MutationObserver(() => {
    updateDarkMode();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // 存储 observer 以便卸载时断开
  (window as any).__darkModeObserver = observer;
});

onUnmounted(() => {
  if (darkModeMediaQuery && darkModeChangeHandler) {
    darkModeMediaQuery.removeEventListener('change', darkModeChangeHandler);
  }
  // 断开 MutationObserver
  const observer = (window as any).__darkModeObserver;
  if (observer) {
    observer.disconnect();
    (window as any).__darkModeObserver = null;
  }
});

// 暗色模式下图标第一个 fill 值
const iconFirstFill = computed(() => isDarkMode.value ? '#bdbdbd' : '#424242');
const iconLikeOutlineFill = computed(() => isDarkMode.value ? '#bdbdbd' : '#212121');
</script>

<script lang="ts">
/**
 * 暗色模式检测函数
 * 判断依据：.dark-theme class 或系统 prefers-color-scheme: dark
 */
function detectDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark-theme') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches;
}
</script>

<template>
  <div class="infoView" @scroll="handleSroll" ref="infoViewRef">
    <div ref="infoViewContentRef">
      <div class="author">
        <div class="avatar" @click="toZone">
          <!-- <img :src="avatarUrl" alt=""> -->
          <v-img :src="avatarUrl" cover>
            <template v-slot:placeholder>
              <v-img height="100%" :src="avatarPlaceholderImg" cover></v-img>
            </template>
          </v-img>
        </div>
        <div class="userinfo">
          <div class="authorname">
            <span @click="toZone">{{ authorname }}</span>
          </div>
          <!-- <div class="userdata">{{ fansNum }}粉丝 {{ videoNum }}视频</div> -->
        </div>
        <div class="follow">
          <v-btn size="small" :variant="followBtn.variant" color="#00796B" @click="clickFollow" :loading="isFollowing">
            <font-awesome-icon :icon="followBtn.icon" />
            {{ followBtn.text }}
          </v-btn>
        </div>
      </div>
      <div class="more" :class="{ expanded: expand }">
        <font-awesome-icon icon="fa-solid fa-angle-down" />
      </div>
      <div class="title" ref="titleRef" @click="expand = !expand">
        {{ title }}
      </div>
      <div class="infomsg">
        <font-awesome-icon icon="fa-regular fa-circle-play" /> {{ playNum }}
        &nbsp;
        <font-awesome-icon icon="fa-regular fa-clock" /> {{ formatDate(createdAt) }}
      </div>
      <div class="synopsis" :style="{ height: expand ? `${heights.synopsis}px` : 0 }">
        <div class="text">
          {{ synopsis }}
        </div>
        <div class="tags">
          <v-chip class="tag" v-for="tag in tags" size="small">{{ tag }}</v-chip>
        </div>
      </div>
      <div class="calculateHeight">
        <div class="titleCollapseHeight" ref="titleCollapseHeightRef">
          {{ title }}
        </div>
        <div class="titleExpandHeight" ref="titleExpandHeightRef">
          {{ title }}
        </div>
        <div class="synopsisHeight" ref="synopsisHeightRef">
          <div class="text">
            {{ synopsis }}
          </div>
          <div class="tags">
            <v-chip class="tag" v-for="tag in tags" size="small">{{ tag }}</v-chip>
          </div>
        </div>
      </div>
      <div class="operation">
        <div @click="clickLike">
          <iconLike v-if="isLike" theme="filled" size="22" fill="#FF3D00" />
          <iconLike v-else theme="outline" size="22" :fill="iconLikeOutlineFill" />
          <br>
          <span v-if="isLike">{{ t('player.liked') }}</span>
          <span v-else>{{ t('player.like') }}</span>
        </div>
        <div @click="shareDownloadLink">
          <iconShareOne theme="two-tone" size="22" :fill="[iconFirstFill, '#00796B']" /><br>{{ t('player.share') }}
        </div>
        <div @click="downloadVideo">
          <iconDownloadFour theme="two-tone" size="22" :fill="[iconFirstFill, '#00796B']" /><br>{{ t('player.cache') }}
        </div>
        <div @click="copyDownloadLink">
          <iconCopyLink theme="multi-color" size="22" :fill="[iconFirstFill, '#00796B', '#FFF', '#00796B']" /><br>{{
            t('player.downloadLink') }}
        </div>
      </div>
      <div class="recommend">
        <div class="label" v-if="!isLoadingAuthorVideos && authorOtherVideoList.length > 0">
          {{ t('player.authorOtherVideos') }}
        </div>
        <div class="lists" v-if="!isLoadingAuthorVideos && authorOtherVideoList.length > 0">
          <cardButton v-for="(item, index) in authorOtherVideoList" :key="item.id" type="video" :data="{
            id: item.id,
            title: item.title,
            img: item.img,
            author: item.author,
            time: item.time,
            viewNum: item.viewNum,
            likeNum: item.likeNum,
            longNum: item.longNum,
            isR18: item.isR18
          }" class="card-button" />
        </div>
        <div class="label" v-if="!isLoadingRecommendVideos && recommendVideoList.length > 0">
          {{ t('player.moreRecommend') }}
        </div>
        <div class="lists" v-if="!isLoadingRecommendVideos && recommendVideoList.length > 0">
          <cardButton v-for="(item, index) in recommendVideoList" :key="item.id" type="video" :data="{
            id: item.id,
            title: item.title,
            img: item.img,
            author: item.author,
            time: item.time,
            viewNum: item.viewNum,
            likeNum: item.likeNum,
            longNum: item.longNum,
            isR18: item.isR18
          }" class="card-button" />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.infoView {
  height: 100%;
  overflow-y: auto;

  >div {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

.author {
  display: flex;

  .avatar {
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;

    .v-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  .userinfo {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .authorname {
      font-size: 0.9rem;
      cursor: pointer;
      user-select: none;
      color: var(--color-text-primary);
    }

    .userdata {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }
  }

  .follow {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 10px;
  }
}

.more {
  position: relative;
  height: 0;
  top: 4px;
  left: -8px;
  text-align: right;
  font-size: 0.7rem;
  color: var(--color-text-muted);

  // 旋转过渡动画
  :deep(svg) {
    transition: transform 0.3s ease-in-out;
  }

  // 展开状态 - 箭头旋转180度向上
  &.expanded {
    :deep(svg) {
      transform: rotate(180deg);
    }
  }
}

@mixin title-base {
  margin: 5px 0;
  padding: 0 15px 0 10px;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 1.1rem;
  transition: height 0.3s ease-in-out;
  cursor: pointer;
  color: var(--color-text-primary);
}

.title {
  @include title-base;
}

.infomsg {
  padding: 0 10px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

@mixin synopsis-base {
  padding: 0 10px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  overflow: hidden;
  transition: height 0.3s ease-in-out;

  .text {
    padding: 4px 0 2px 0;
  }

  .tags {
    padding: 2px 0 4px 0;

    .tag {
      margin: 2px 2px 2px 0;
      color: var(--color-text-primary);
      user-select: none;
      cursor: pointer;
    }
  }
}

.synopsis {
  @include synopsis-base;
}

.calculateHeight {
  overflow: hidden;
  height: 0;

  .titleCollapseHeight {
    @include title-base;
    white-space: nowrap;
  }

  .titleExpandHeight {
    @include title-base;
  }

  .synopsisHeight {
    @include synopsis-base;
  }
}

.operation {
  padding: 10px 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-items: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */

  div {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    width: 55px;
    cursor: pointer;
    user-select: none;
  }
}

.recommend {
  overflow: hidden;

  .label {
    font-size: 0.8rem;
    padding: 0 10px;
    color: var(--color-text-muted);
  }

  .lists {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
  }
}
</style>