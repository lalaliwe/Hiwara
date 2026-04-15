<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';
import videoPlayer from '../component/player/videoPlayer.vue';
import infoView from '../component/player/info.vue';
import commentView from '../component/player/comment.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

const router = useRouter();

const tab = ref('info');
const title = '测试标题';
const synopsis = '测试简介';
const playNum = 100;
const likeNum = 0;
const createdAt = '2025-02-03 10:00';
const isLike = ref(false);
const tags = ['测试标签1', '测试标签2', '测试标签3', '测试标签4', '测试标签5', '测试标签6', '测试标签7', '测试标签8', '测试标签9', '测试标签10', '测试标签11', '测试标签12', '测试标签13', '测试标签14', '测试标签15', '测试标签16', '测试标签17', '测试标签18', '测试标签19', '测试标签20', '测试标签21', '测试标签22'];
const authorname = '测试用户';
const fansNum = 100;
const videoNum = 10;
const isFollow = ref(false);

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


// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

// 返回
function goBack() {
  router.back();
}
// 回到主界面
function goHome() {
  router.replace('/');
}

onActivated(() => {
  applyPageSettings()
})
onMounted(() => {
  console.log('✅ Player mounted');
})
onUnmounted(() => {
  console.log('❌ Player unmounted');
})
</script>

<template>
  <div id="playerView">
    <div class="topBar">
      <span class="btn" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>
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
        <swiper-slide ">
          <infoView :title="title" :synopsis="synopsis" :playNum="playNum" :likeNum="likeNum" :createdAt="createdAt"
          :isLike="isLike" :tags="tags" :authorname="authorname" :fansNum="fansNum" :videoNum="videoNum"
          :isFollow="isFollow" />
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
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 400;
  color: #fff;
  height: calc(48px + env(safe-area-inset-top, 0));

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

  &::before {
    content: '';
    display: block;
    height: env(safe-area-inset-top, 0);
    width: 100%;
    background-color: #000;
  }
}

.video-player {
  width: 100%;
  margin-top: env(safe-area-inset-top, 0);
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
