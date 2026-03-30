<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue';
import test1img from '../static/img/test1.jpg'
import placeholderImg from '../static/img/placeholder.png'
import { setNavBarStyle } from '../core/navbarStyle'
import { useRouter } from 'vue-router';
import cardButton from '../component/cardButton.vue';

defineOptions({
  name: 'Image'
})

setNavBarStyle({ style: 'dark' })
const router = useRouter();

// 图片展开状态
const imageExpand = ref(false);

// 插画信息展开状态
const infoExpand = ref(false);
const titleRef = ref<HTMLElement | null>(null);
const tagsContainerRef = ref<HTMLElement | null>(null);
const titleCollapseHeightRef = ref<HTMLElement | null>(null);
const titleExpandHeightRef = ref<HTMLElement | null>(null);
const synopsisHeightRef = ref<HTMLElement | null>(null);
const tagsCollapseHeightRef = ref<HTMLElement | null>(null);
const tagsExpandHeightRef = ref<HTMLElement | null>(null);

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const imageContainerRef = ref<HTMLElement | null>(null);

// 高度缓存对象
const heights = ref({
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0,
  tagsCollapse: 0,
  tagsExpand: 0,
});

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
    img: test1img,
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
    img: test1img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
}

// 标签容器高度（computed 缓存）
const tagsContainerHeight = computed(() => {
  if (!heights.value.tagsCollapse || !heights.value.tagsExpand) return 'auto';
  if (infoExpand.value) {
    return `${heights.value.tagsExpand}px`;
  } else {
    const linesNum = heights.value.tagsExpand / heights.value.tagsCollapse;
    if (linesNum < 3) {
      return `${heights.value.tagsCollapse * linesNum}px`;
    } else {
      return `${heights.value.tagsCollapse * 3}px`;
    }
  }
});

// 处理窗口大小改变
function handleResize() {
  calculateHeights();
}

onMounted(() => {
  calculateHeights();
  if (titleRef.value) {
    titleRef.value.style.height = heights.value.titleCollapse + 'px';
    titleRef.value.style.whiteSpace = 'nowrap';
  }
  
  // 监听滚动事件
  const container = imageContainerRef.value;
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }
  
  // 监听窗口大小改变事件
  window.addEventListener('resize', handleResize);
})

onUnmounted(() => {
  // 清理事件监听器
  const container = imageContainerRef.value;
  if (container) {
    container.removeEventListener('scroll', handleScroll);
  }
  // 移除窗口大小改变监听器
  window.removeEventListener('resize', handleResize);
})

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

// 简化 watch 逻辑，使用 nextTick 确保 DOM 更新后设置样式
watch(infoExpand, async (val) => {
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
      if (!infoExpand.value) {
        el.style.whiteSpace = 'nowrap';
      }
    }, 300); // 与 transition 时间匹配
  }
}, { immediate: true });

function calculateHeights() {
  heights.value.titleCollapse = titleCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.titleExpand = titleExpandHeightRef.value?.offsetHeight || 0;
  heights.value.synopsis = synopsisHeightRef.value?.offsetHeight || 0;
  heights.value.tagsCollapse = tagsCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.tagsExpand = tagsExpandHeightRef.value?.offsetHeight || 0;
}

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

// 关注
function clickFollow() {
  isFollow.value = !isFollow.value;
}
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
    <!-- 第一部分：图片区域 -->
    <div class="illustrationView">
      <v-img cover :src="test1img">
        <template v-slot:placeholder>
          <v-img cover :src="placeholderImg"></v-img>
        </template>
      </v-img>
      <v-img v-if="imageExpand" v-for="i in 9" :key="i" cover :src="test1img"></v-img>
      <span class="expand-btn" @click="imageExpand = !imageExpand">
        {{ imageExpand ? '收起' : '展开全部' }}
      </span>
    </div>

    <!-- 第二部分：插画信息区域 -->
    <div class="more" :class="{ expanded: infoExpand }" @click="infoExpand = !infoExpand">
      <font-awesome-icon icon="fa-solid fa-angle-down" />
    </div>
    <div class="title" ref="titleRef" @click="infoExpand = !infoExpand">
      {{ title }}
    </div>
    <div class="infomsg">
      <font-awesome-icon icon="fa-regular fa-eye" /> {{ viewCount }}
      &nbsp;
      <font-awesome-icon icon="fa-regular fa-clock" /> {{ createdAt }}
      <br>
      插画 ID {{ illustrationId }}
      &nbsp;
      分辨率 {{ resolution }}
    </div>
    <div class="author">
      <div class="avatar">
        <img src="../static/img/default-avatar.jpg" alt="">
      </div>
      <div class="userinfo">
        <div class="authorname">{{ authorname }}</div>
        <div class="userdata">{{ fansNum }}粉丝 {{ imageNum }}插画</div>
      </div>
      <div class="follow">
        <v-btn class="btn" :color="isFollow ? '#E0E0E0' : '#00796B'" @click="clickFollow">
          <span v-if="isFollow">
            <font-awesome-icon icon="fa-solid fa-bars" /> 已关注
          </span>
          <span v-else>
            <font-awesome-icon icon="fa-solid fa-plus" /> 关注
          </span>
        </v-btn>
      </div>
    </div>
    <div class="synopsis" :style="{ height: infoExpand ? `${heights.synopsis}px` : 0 }">
      <div class="text">
        {{ synopsis }}
      </div>
    </div>
    <div class="tags" ref="tagsContainerRef" :style="{ height: tagsContainerHeight }">
      <v-chip class="tag" v-for="tag in tags" :key="tag" size="small">{{ tag }}</v-chip>
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
      </div>
      <div class="tagsCollapseHeight" ref="tagsCollapseHeightRef">
        <v-chip class="tag" size="small">{{ tags[0] }}</v-chip>
      </div>
      <div class="tagsExpandHeight" ref="tagsExpandHeightRef">
        <v-chip class="tag" v-for="tag in tags" :key="tag" size="small">{{ tag }}</v-chip>
      </div>
    </div>
    <div class="recommend">
      <div class="label">
        该作者其他视频
      </div>
      <div class="lists">
        <div v-for="(item, index) in authorOtherVideoList">
          <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
            :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
            :isR18="item.isR18" />
        </div>
      </div>
      <div class="label">
        更多推荐
      </div>
      <div class="lists">
        <div v-for="(item, index) in authorOtherVideoList">
          <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
            :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
            :isR18="item.isR18" />
        </div>
      </div>
    </div>
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

.illustrationView {
  width: 100%;
  position: relative;

  .expand-btn {
    color: #fff;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    display: inline-block;
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 6px 10px;
    font-size: 0.9rem;
    user-select: none;
    cursor: pointer;
  }
}

.more {
  position: relative;
  height: 0;
  top: 8px;
  left: -8px;
  text-align: right;
  font-size: 0.7rem;
  color: #616161;

  // 旋转过渡动画
  :deep(svg) {
    transition: transform 0.3s ease-in-out;
  }

  // 展开状态 - 箭头旋转 180 度向上
  &.expanded {
    :deep(svg) {
      transform: rotate(180deg);
    }
  }
}

.title {
  padding: 15px 15px 0 10px;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 1.1rem;
  transition: height 0.3s ease-in-out;
}

.infomsg {
  padding: 10px 10px 0 10px;
  font-size: 0.8rem;
  color: #616161;
}

.author {
  display: flex;

  .avatar {
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
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
    }

    .userdata {
      font-size: 0.7rem;
      color: #616161;
    }
  }

  .follow {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 10px;

    .btn {
      width: 80px;
    }
  }
}

.synopsis {
  padding: 0 10px;
  color: #616161;
  font-size: 0.8rem;
  overflow: hidden;
  transition: height 0.3s ease-in-out;

  .text {
    padding-top: 10px;
  }
}

.tags {
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  margin: 10px;

  .tag {
    margin: 2px 2px 2px 0;
  }
}

.calculateHeight {
  overflow: hidden;
  height: 0;

  .titleCollapseHeight {
    @extend .title;
    white-space: nowrap;
  }

  .titleExpandHeight {
    @extend .title;
  }

  .synopsisHeight {
    @extend .synopsis;
  }

  .tagsCollapseHeight,
  .tagsExpandHeight {
    @extend .tags;
  }
}

.recommend {
  .label {
    font-size: 0.8rem;
    padding: 0 10px;
    color: #616161;
  }

  .lists {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
  }
}
</style>