<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import videoPlayer from '../component/player/videoPlayer.vue';
import infoView from '../component/player/info.vue';
import commentView from '../component/player/comment.vue';
import { setNavBarStyle } from '../plugins/navbarStyle'

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

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

// 设置导航栏样式
setNavBarStyle({ style: 'light' })

onMounted(() => {
  console.log('✅ Player mounted');
})
onUnmounted(() => {
  console.log('❌ Player unmounted');
})
</script>
<template>
  <div id="playerView">
    <div class="statusBarPlaceholder"></div>
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
      <v-tabs-window v-model="tab" class="tabs-window">
        <v-tabs-window-item value="info">
          <infoView :title="title" :synopsis="synopsis" :playNum="playNum" :likeNum="likeNum" :createdAt="createdAt"
            :isLike="isLike" :tags="tags" :authorname="authorname" :fansNum="fansNum" :videoNum="videoNum"
            :isFollow="isFollow" />
        </v-tabs-window-item>
        <v-tabs-window-item value="comment">
          <commentView />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>
<style lang="scss" scoped>
#playerView {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.statusBarPlaceholder {
  height: env(safe-area-inset-top, 0);
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

    :deep(.v-window__container) {
      height: 100%;
    }

    .v-window-item {
      height: 100%;
      overflow: auto;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  }
}
</style>