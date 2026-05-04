<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated } from 'vue';
import test1img from '../static/img/test1.jpg';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import { useRouter, useRoute } from 'vue-router';
import ImageInfo from '../component/image/info.vue';
import RecommendList from '../component/image/recommendList.vue';
import imgPreview from '../component/image/imgPreview.vue';
import {
  getImageInfo as api_getImageInfo,
} from '../core/api';
import { showShortToast } from '../core/toast';
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';
import fullScreen from '../component/image/fullScreen.vue';
import comment from '../component/image/comment.vue';

defineOptions({
  name: 'Image'
})

const router = useRouter();
const route = useRoute();

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏黑色文字
  setStatusBarTextStyle('dark')
}
applyPageSettings()

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
const title = ref<string>('');  // 插画标题
const viewCount = ref<number>(0); // 插画浏览数
const createdAt = ref<string>('');  // 插画创建时间
const resolution = ref<string>(''); // 插画分辨率
const synopsis = ref<string>(''); // 插画简介
const tags = ref<string[]>([]); // 插画标签数组

// 作者信息
const authorname = ref<string>(''); // 作者名称
const uid = ref<string>(''); // 作者ID
const fansNum = ref<number>(0); // 粉丝数
const imageNum = ref<number>(0);  // 插画数量
const isFollow = ref<boolean>(false); // 是否已关注作者

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const imageContainerRef = ref<HTMLElement | null>(null);

const fullScreenRef = ref();

// 返回顶部
function scrollToTop() {
  const container = imageContainerRef.value;
  if (container)
    container.scrollTo({ top: 0, behavior: 'smooth' });
}

// 返回
function goBack() {
  router.back();
}
// 回到主界面
function goHome() {
  router.replace('/');
}

// 关注
function handleFollow() {
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
  // 当页面被激活时（从 keep-alive 缓存中恢复）也应用设置
  applyPageSettings()
  // 恢复滚动条位置
  if (imageContainerRef.value && typeof imageContainerRef.value.scrollTo === 'function')
    imageContainerRef.value.scrollTo({ top: scrollTop });
})
onMounted(() => {
  // 监听滚动事件
  const container = imageContainerRef.value;
  if (container)
    container.addEventListener('scroll', handleScroll);
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
    uid.value = imageInfo.user.id;
    isFollow.value = imageInfo.user.followedBy;
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
  } catch (error) {
    console.error(`获取插画信息失败：`, error);
    showShortToast('获取插画信息失败');
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
      <loadingHuawu>正在加载数据</loadingHuawu>
    </div>
    <div v-else-if="isState === 'failed'" class="state-container">
      <errorHuawu>数据加载失败了喵~</errorHuawu>
    </div>
    <div v-else-if="isState === 'success'" class="image-container" ref="imageContainerRef" @scroll="handleScroll">

      <!-- 第一部分：图片区域（已拆分为子组件） -->
      <imgPreview :pid="pid" :images="illustrationImages" @resolution="handleResolution"
        @fullScreen="fullScreenTrigger" />

      <!-- 第二部分：插画信息区域（已拆分为子组件） -->
      <ImageInfo v-if="isState === 'success'" :title="title" :view-count="viewCount" :created-at="createdAt" :pid="pid"
        :resolution="resolution" :synopsis="synopsis" :tags="tags" :authorname="authorname" :fans-num="fansNum"
        :image-num="imageNum" :is-follow="isFollow" @commentTrigger="handleCommentTrigger" />
      <!-- 第三部分：推荐列表（已拆分为子组件） -->
      <RecommendList :pid="pid" :uid="uid" />
    </div>
    <fullScreen class="drawer" :style="{ right: fullScreenVisible ? '0px' : '-100vw' }" ref="fullScreenRef"
      @close="fullScreenVisible = false" :images="illustrationImages" />
    <comment class="drawer" :pid="pid" :style="{ right: commentVisible ? '0px' : '-100vw' }" @close="commentVisible = false" />
  </div>
</template>
<style lang="scss" scoped>
#imageView {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.top {
  position: fixed;
  top: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  color: #fff;
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
  background-color: rgba(0, 121, 107, 0.9);
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
  background-color: #fff;
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