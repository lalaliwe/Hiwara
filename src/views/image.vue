<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import test1img from '../static/img/test1.jpg';
import { setNavBarStyle } from '../core/navbarStyle'
import { useRouter } from 'vue-router';
import ImageInfo from '../component/image/info.vue';
import RecommendList from '../component/image/recommendList.vue';
import IllustrationView from '../component/image/illustrationView.vue';

defineOptions({
  name: 'Image'
})

setNavBarStyle({ style: 'dark' })
const router = useRouter();

// 插画图片数据
const illustrationImages = ref<string[]>([test1img]);
// 添加更多测试图片（模拟多张插画）
// for (let i = 0; i < 3; i++) {
//   illustrationImages.value.push(test1img);
// }

// 插画信息数据（全部独立变量）
const title = ref('测试标题');
const viewCount = ref(100);
const createdAt = ref('2020-01-01 18:37');
const illustrationId = ref('1234567890');
const resolution = ref('1200x800');
const synopsis = ref('测试简介');
const tags = ref<string[]>([]);
for (let i = 0; i < 100; i++) {
  tags.value.push(`标签${i}`);
}

// 作者信息
const authorname = ref('测试作者');
const fansNum = ref(100);
const imageNum = ref(10);
const isFollow = ref(false);

// 推荐列表
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
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
  recommendVideoList.value.push({
    id: Math.random().toString(36).slice(2),
    title: '推荐测试标题',
    img: '',
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
}

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const imageContainerRef = ref<HTMLElement | null>(null);

// 返回顶部
function scrollToTop() {
  const container = imageContainerRef.value;
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
function handleScroll() {
  const container = imageContainerRef.value;
  const topElement = document.querySelector('.top') as HTMLElement;

  if (!container || !topElement) return;

  // 获取 illustrationView 的位置
  const illustrationView = container.querySelector('.illustrationView') as HTMLElement;
  if (!illustrationView) return;

  // 计算 illustrationView 底部相对于容器视口的位置
  const illustrationViewBottomInViewport = illustrationView.offsetTop + illustrationView.offsetHeight - container.scrollTop;

  // top 元素的高度（包括 padding 和 safe-area-inset）
  const topHeight = topElement.offsetHeight;

  // 当 illustrationView 的底部在视口中的位置 < top 元素的高度时
  // 说明 illustrationView 已经滚到了 top 元素下方，top 的投影会落在空白区域
  isTopGreen.value = illustrationViewBottomInViewport < topHeight;
}

onMounted(() => {
  // 监听滚动事件
  const container = imageContainerRef.value;
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }
})

onUnmounted(() => {
  // 清理事件监听器
  const container = imageContainerRef.value;
  if (container) {
    container.removeEventListener('scroll', handleScroll);
  }
})
</script>
<template>
  <div class="image-container" ref="imageContainerRef">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click.stop="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click.stop="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>

    <!-- 第一部分：图片区域（已拆分为子组件） -->
    <IllustrationView :images="illustrationImages" />

    <!-- 第二部分：插画信息区域（已拆分为子组件） -->
    <ImageInfo 
      :title="title"
      :view-count="viewCount"
      :created-at="createdAt"
      :illustration-id="illustrationId"
      :resolution="resolution"
      :synopsis="synopsis"
      :tags="tags"
      :authorname="authorname"
      :fans-num="fansNum"
      :image-num="imageNum"
      :is-follow="isFollow"
      @follow-click="handleFollowClick"
    />

    <!-- 第三部分：推荐列表（已拆分为子组件） -->
    <RecommendList 
      :author-other-video-list="authorOtherVideoList"
      :recommend-video-list="recommendVideoList"
    />
  </div>
</template>
<style lang="scss" scoped>
.image-container {
  height: 100%;
  overflow: auto;
  background-color: #fff;
  position: relative;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.top {
  position: fixed;
  top: 0;
  z-index: 300;
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
  background-color: #00796B;
}
</style>