<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserInfo from '../component/zone/userInfo.vue' // 导入新的UserInfo组件

defineOptions({
  name: 'Zone'
})

const route = useRoute()
const router = useRouter()

const myself = ref<boolean>(route.query.myself == 'true')
const nickname = ref('测试用户')
const userSignature = '测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名'
const followNum = ref(100)
const fansNum = ref(100)

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const zoneContainerRef = ref<HTMLElement | null>(null);

// 返回顶部
function scrollToTop() {
  const container = zoneContainerRef.value;
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
function routerGoTo(path: string, query?: any) {
  if (query) {
    router.push({
      path: path,
      query: query
    });
  } else {
    router.push(path);
  }
}
// 处理滚动事件
function handleScroll() {
  const container = zoneContainerRef.value;
  const topElement = document.querySelector('.top') as HTMLElement;

  if (!container || !topElement) return;

  // 获取 zone-bg 的位置
  const zoneBg = container.querySelector('.zone-bg') as HTMLElement;
  if (!zoneBg) return;

  // 计算 zone-bg 底部相对于容器视口的位置
  const zoneBgBottomInViewport = zoneBg.offsetTop + zoneBg.offsetHeight - container.scrollTop;

  // top 元素的高度（包括 padding 和 safe-area-inset）
  const topHeight = topElement.offsetHeight;

  // 当 zone-bg 的底部在视口中的位置 < top 元素的高度时
  // 说明 zone-bg 已经滚到了 top 元素下方，top 的投影会落在空白区域
  isTopGreen.value = zoneBgBottomInViewport < topHeight;
}

onMounted(() => {
  // 监听滚动事件
  const container = zoneContainerRef.value;
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }
  // 监听窗口大小改变
  window.addEventListener('resize', handleResize);
})
onUnmounted(() => {
  // 清理事件监听器
  const container = zoneContainerRef.value;
  if (container) {
    container.removeEventListener('scroll', handleScroll);
  }
  // 移除窗口大小改变监听器
  window.removeEventListener('resize', handleResize);
})

// 处理窗口大小改变
function handleResize() {
  // 在这里可以添加任何需要响应窗口大小变化的逻辑
}
</script>
<template>
  <div id="zoneView" ref="zoneContainerRef">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click.stop="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click.stop="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>
    <div class="zone-bg"></div>
    <div class="content">
      <UserInfo :nickname="nickname" :userSignature="userSignature" :followNum="followNum" :fansNum="fansNum"
        @navigate-to="routerGoTo" />
      <div style="height: 10000px;"></div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
#zoneView {
  overflow: auto;
  background-color: #fff;
  position: relative;
  padding-bottom: env(safe-area-inset-bottom, 0);
  height: 100vh;
}

.top {
  position: fixed;
  top: 0;
  z-index: 400;
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

.zone-bg {
  width: 100%;
  height: 160px;
  /* 可根据需要调整高度 */
  background-image: url('https://picsum.photos/200/300');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #BDBDBD;
  z-index: 0;
}
</style>