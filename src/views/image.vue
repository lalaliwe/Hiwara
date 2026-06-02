<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, onActivated } from 'vue';
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ImageInfo from '../component/image/info.vue';
import RecommendList from '../component/image/recommend.vue';
import imgPreview from '../component/image/preview.vue';
import {
  getImageInfo as api_getImageInfo,
} from '../core/api';
import { showShortToast } from '../core/toast';
import { insertImageHistory } from '../core/database';
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';
import fullScreen from '../component/image/fullScreen.vue';
import comment from '../component/image/comment.vue';

const { t } = useI18n();

defineOptions({
  name: 'Image'
})

const router = useRouter();
const route = useRoute();

// 插画图片数据
interface ImageFile {
  id: string;
  name: string;
  width: number;
  height: number;
}
const illustrationImages = ref<ImageFile[]>([]);

// 页面状态
const isState = ref<'failed' | 'loading' | 'success'>('loading');
const fullScreenVisible = ref(false);
const commentVisible = ref(false);

// 插画信息数据（全部独立变量）
const pid = ref<string>(route.params.id as string);  // 插画ID
const slug = ref<string>('');  // 插画slug
const title = ref<string>('');  // 插画标题
const viewCount = ref<number>(0); // 插画浏览数
const createdAt = ref<string>('');  // 插画创建时间
const resolution = ref<string>(''); // 插画分辨率
const synopsis = ref<string>(''); // 插画简介
const tags = ref<string[]>([]); // 插画标签数组

// 作者信息
const authorname = ref<string>(''); // 作者名称
const username = ref<string>(''); // 作者用户名
const uid = ref<string>(''); // 作者ID
const avatar = ref<string>(''); // 作者头像URL
const fansNum = ref<number>(0); // 粉丝数
const imageNum = ref<number>(0);  // 插画数量
const isFollow = ref<boolean>(false); // 是否已关注作者
const isLike = ref<boolean>(false); // 是否已点赞

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const imageContainerRef = ref<HTMLElement | null>(null);

// 自动状态栏文字颜色自适应
// 初始时顶部透明，透出页面背景色；滚动后 .top-green 启用 --color-primary-90
const statusBarBg = computed(() => {
  const varName = isTopGreen.value ? '--color-primary-90' : '--color-bg-page'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
})
useAutoStatusBar({ color: statusBarBg })

const fullScreenRef = ref();

// 返回顶部
function scrollToTop() {
  const container = imageContainerRef.value;
  if (container)
    container.scrollTo({ top: 0, behavior: 'smooth' });
}

// 处理安卓返回键事件（来自 App.vue）
const handleImageBackPressed = () => {
  // 1. 如果全屏打开 → 关闭全屏
  if (fullScreenVisible.value) {
    fullScreenVisible.value = false;
    return;
  }
  // 2. 如果评论打开 → 关闭评论
  if (commentVisible.value) {
    commentVisible.value = false;
    return;
  }
  // 3. 无抽屉打开 → 回退到上一页
  router.back();
};

// 返回
function goBack() {
  router.back();
}
// 回到主界面
function goHome() {
  router.replace('/');
}

// 处理滚动事件
function handleScroll(e: Event) {
  const container = imageContainerRef.value;
  const topElement = document.querySelector('.top') as HTMLElement;

  if (!container || !topElement) return;

  // 获取 imgPreview 的位置
  const imgPreview = container.querySelector('.imgPreview') as HTMLElement;
  if (!imgPreview) return;

  // 计算 imgPreview 底部相对于容器视口的位置
  const imgPreviewBottomInViewport = imgPreview.offsetTop + imgPreview.offsetHeight - container.scrollTop;

  // top 元素的高度（包括 padding 和 safe-area-inset）
  const topHeight = topElement.offsetHeight;

  // 当 imgPreview 的底部在视口中的位置 < top 元素的高度时
  // 说明 imgPreview 已经滚到了 top 元素下方，top 的投影会落在空白区域
  isTopGreen.value = imgPreviewBottomInViewport < topHeight;

  // 同时保存滚动条位置
  scrollTop = (e.target as HTMLElement).scrollTop;
}

// 当前滚动条位置
let scrollTop = 0;
// 保存滚动条位置
function handleSroll(e: Event): void {
  scrollTop = (e.target as HTMLElement).scrollTop;
}
onActivated(() => {
  // 恢复滚动条位置
  if (imageContainerRef.value && typeof imageContainerRef.value.scrollTo === 'function')
    imageContainerRef.value.scrollTo({ top: scrollTop });
})
onMounted(() => {
  // 监听滚动事件
  const container = imageContainerRef.value;
  if (container)
    container.addEventListener('scroll', handleScroll);

  // 监听来自 App.vue 的安卓返回键事件
  window.addEventListener('image-back-pressed', handleImageBackPressed);
})
onBeforeUnmount(() => {
  // 移除返回键事件监听
  window.removeEventListener('image-back-pressed', handleImageBackPressed);
})
onUnmounted(() => {
  // 清理事件监听器
  const container = imageContainerRef.value;
  if (container)
    container.removeEventListener('scroll', handleScroll);
})
// 获取插画信息
getImageInfo();
async function getImageInfo(): Promise<void> {
  try {
    const res = await api_getImageInfo(pid.value as string);
    console.log(res);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    const imageInfo = res.data;
    // 插画信息
    title.value = imageInfo.title;
    slug.value = imageInfo.slug || '';
    viewCount.value = imageInfo.numViews;
    createdAt.value = imageInfo.createdAt;
    synopsis.value = imageInfo.body ? imageInfo.body : '-';
    interface Tag {
      id: string;
      type: string;
      sensitive: boolean;
    }
    tags.value = imageInfo.tags.map((tag: Tag) => tag.id);
    // 用户信息
    authorname.value = imageInfo.user.name;
    username.value = imageInfo.user.username;
    uid.value = imageInfo.user.id;
    avatar.value = imageInfo.user.avatar; // 作者头像
    isFollow.value = imageInfo.user.followedBy;
    isLike.value = imageInfo.liked || false;
    // 插画文件数组
    illustrationImages.value = imageInfo.files.map((file: any) => {
      const id = file.id;
      const name = file.name;
      const width = file.width;
      const height = file.height;
      return { id, name, width, height };
    });
    // 更新页面状态
    isState.value = 'success';

    // 添加插画历史记录
    try {
      // 使用thumbnail作为封面(参照subscribe.vue的实现)
      const coverUrl = imageInfo.thumbnail
        ? `https://i.iwara.tv/image/thumbnail/${imageInfo.thumbnail.id}/${imageInfo.thumbnail.id}.jpg`
        : '';

      // 解析 createdAt 为时间戳
      const createTimeTimestamp = imageInfo.createdAt ? new Date(imageInfo.createdAt).getTime() : 0;

      await insertImageHistory(
        pid.value,
        imageInfo.title,
        imageInfo.user.name,
        coverUrl,
        illustrationImages.value.length, // 插画张数
        createTimeTimestamp // 作品发布时间
      );
      console.log('插画历史记录已添加:', pid.value);
    } catch (error) {
      console.error('添加插画历史记录失败:', error);
    }
  } catch (error) {
    console.error(`获取插画信息失败：`, error);
    showShortToast(t('imageView.fetchInfoFailed'));
    isState.value = 'failed';
    throw error;
  }
}
// 监听图片分辨率事件
function handleResolution(res: { width: number; height: number }) {
  resolution.value = `${res.width}x${res.height}`;
}
// 全屏大图
const fullScreenTrigger = async (num: number) => {
  fullScreenVisible.value = true;
  // 等待下一帧确保组件已渲染
  await new Promise(resolve => requestAnimationFrame(resolve));
  fullScreenRef.value.changeSwiper(num);
  // 调用全屏组件的进入全屏方法
  if (fullScreenRef.value.enterFullscreen) {
    fullScreenRef.value.enterFullscreen();
  }
}
// 打开评论
const handleCommentTrigger = () => {
  console.log('打开评论');
  commentVisible.value = true;
}

// 处理点赞事件
const handleLike = (isLiked: boolean) => {
  isLike.value = isLiked;
}

// 处理关注事件
const handleFollow = (isFollowed: boolean) => {
  isFollow.value = isFollowed;
}
</script>
<template>
  <div id="imageView">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>
    <div v-if="isState === 'loading'" class="state-container">
      <loadingHuawu>{{ t('imageView.loading') }}</loadingHuawu>
    </div>
    <div v-else-if="isState === 'failed'" class="state-container">
      <errorHuawu>{{ t('imageView.failed') }}</errorHuawu>
    </div>
    <div v-else-if="isState === 'success'" class="image-container" ref="imageContainerRef" @scroll="handleScroll">

      <!-- 第一部分：图片区域（已拆分为子组件） -->
      <imgPreview :pid="pid" :images="illustrationImages" @resolution="handleResolution"
        @fullScreen="fullScreenTrigger" />

      <!-- 第二部分：插画信息区域（已拆分为子组件） -->
      <ImageInfo v-if="isState === 'success'" :title="title" :view-count="viewCount" :created-at="createdAt" :pid="pid"
        :slug="slug" :resolution="resolution" :synopsis="synopsis" :tags="tags" :authorname="authorname"
        :username="username" :uid="uid" :avatar="avatar" :fans-num="fansNum" :image-num="imageNum"
        :is-follow="isFollow" :is-like="isLike" @commentTrigger="handleCommentTrigger" @like="handleLike"
        @follow="handleFollow" />
      <!-- 第三部分：推荐列表（已拆分为子组件） -->
      <RecommendList :pid="pid" :uid="uid" />
    </div>
    <fullScreen class="drawer" :style="{ right: fullScreenVisible ? '0px' : '-100vw' }" ref="fullScreenRef"
      @close="fullScreenVisible = false" :images="illustrationImages" />
    <comment class="drawer" :pid="pid" :style="{ right: commentVisible ? '0px' : '-100vw' }"
      @close="commentVisible = false" />
  </div>
</template>
<style lang="scss" scoped>
#imageView {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

.top {
  position: fixed;
  top: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  color: var(--color-text-on-image);
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  // background-color: #00796B;
  width: 100%;
  transition: background-color 0.3s ease-in-out;

  .btn {
    display: inline-flex;
    margin: 4px;
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    cursor: pointer;
    user-select: none;
  }
}

.top-green {
  background-color: var(--color-primary-90);
  backdrop-filter: blur(10px);
}

.state-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--color-bg-card);
  position: relative;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.drawer {
  position: absolute;
  top: 0;
  right: -100vw;
  z-index: 600;
  transition: right 0.3s ease-in-out;
}
</style>
