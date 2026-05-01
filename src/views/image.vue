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
const illustrationImages = ref<string[]>([]);

// 页面状态
const isState = ref<'failed' | 'loading' | 'success'>('loading');

// 插画信息数据（全部独立变量）
const id = ref<string>(route.params.id as string);  // 插画ID
const title = ref<string>('');  // 插画标题
const viewCount = ref<number>(0); // 插画浏览数
const createdAt = ref<string>('');  // 插画创建时间
const resolution = ref<string>(''); // 插画分辨率
const synopsis = ref<string>(''); // 插画简介
const tags = ref<string[]>([]); // 插画标签数组

// 作者信息
const authorname = ref<string>(''); // 作者名称
const fansNum = ref<number>(0); // 粉丝数
const imageNum = ref<number>(0);  // 插画数量
const isFollow = ref<boolean>(false); // 是否已关注作者

// 推荐列表
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
const authorOtherVideoList = ref<ListItem[]>([]);
const recommendVideoList = ref<ListItem[]>([]);
// 测试数据生成
for (let i = 0; i < 5; i++) {
  authorOtherVideoList.value.push({
    id: Math.random().toString(36).slice(2),
    title: '作者测试标题',
    img: '', // 图片路径由子组件内部处理
    author: '测试作者',
    time: '2021-09-09',
    viewNum: 100,
    likeNum: 100,
    longNum: 10,
    isR18: false,
  });
  recommendVideoList.value.push({
    id: Math.random().toString(36).slice(2),
    title: '推荐测试标题',
    img: '',
    author: '测试作者',
    time: '2021-09-09',
    viewNum: 100,
    likeNum: 100,
    longNum: 10,
    isR18: false,
  });
}

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const imageContainerRef = ref<HTMLElement | null>(null);

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

// 处理关注状态变化
function handleFollowClick(newFollowState: boolean) {
  isFollow.value = newFollowState;
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
    const res = await api_getImageInfo(id.value as string);
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
    isFollow.value = imageInfo.user.followedBy;
    // 插画文件数组
    illustrationImages.value = imageInfo.files.map((file: any) => {
      const src = `https://i.iwara.tv/image/large/${file.id}/${file.name}`;
      return src;
    });
    // 更新页面状态
    isState.value = 'success';
  } catch (error) {
    console.error(`获取插画信息失败`, error);
    showShortToast('获取插画信息失败');
    isState.value = 'failed';
    throw error;
  }
}
</script>
<template>
  <div id="imageView">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click.stop="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click.stop="goHome">
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
      <imgPreview :images="illustrationImages" />

      <!-- 第二部分：插画信息区域（已拆分为子组件） -->
      <ImageInfo v-if="isState === 'success'" :title="title" :view-count="viewCount" :created-at="createdAt"
        :illustration-id="id" :resolution="resolution" :synopsis="synopsis" :tags="tags" :authorname="authorname"
        :fans-num="fansNum" :image-num="imageNum" :is-follow="isFollow" @follow-click="handleFollowClick" />

      <!-- 第三部分：推荐列表（已拆分为子组件） -->
      <RecommendList :author-other-video-list="authorOtherVideoList" :recommend-video-list="recommendVideoList" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
#imageView {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  cursor: pointer;

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
</style>