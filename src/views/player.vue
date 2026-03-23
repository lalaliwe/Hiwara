<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

// 设置组件名称，确保与路由name一致
defineOptions({
  name: 'Player'
})

const router = useRouter();

const tab = ref('info');

const title = '这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是标题这是'
const synopsis = '这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介这个是简介'
const isFollow = ref(false);

const expand = ref(false);
const titleCollapseHeightRef = ref<HTMLElement | null>(null);
const titleExpandHeightRef = ref<HTMLElement | null>(null);
const synopsisHeightRef = ref<HTMLElement | null>(null);
const heights = {
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0
};
const titleRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  console.log('✅ Player mounted');
  await nextTick();
  calculateHeights();
  if (titleRef.value) {
    titleRef.value.style.height = heights.titleCollapse + 'px';
    titleRef.value.style.whiteSpace = 'nowrap';
  }
})
onUnmounted(() => {
  console.log('❌ Player unmounted');
})
watch(expand, (val) => {
  if (titleRef.value) {
    if (val) {
      // === 展开逻辑 ===
      titleRef.value.style.whiteSpace = 'normal';
      titleRef.value.style.height = heights.titleExpand + 'px';
    } else {
      // === 折叠逻辑 (修改部分) ===
      const el = titleRef.value;
      // 1. 先执行第一条：设置高度（触发折叠动画）
      el.style.height = heights.titleCollapse + 'px';
      // 定义回调函数
      const onTransitionEnd = (e: { propertyName: string; }) => {
        // 确保监听的是 height 的变化，而不是其他属性（如 opacity 等）
        if (e.propertyName !== 'height') return;
        // 2. 动画结束后执行第二条：设置不换行
        // 只有当 expand 仍然为 false 时才执行（防止快速点击导致状态错乱）
        if (!expand.value) {
          el.style.whiteSpace = 'nowrap';
        }
        // 3. 移除监听器，避免内存泄漏
        el.removeEventListener('transitionend', onTransitionEnd);
      };
      // 添加监听器
      el.addEventListener('transitionend', onTransitionEnd);
    }
  }
})

function calculateHeights() {
  if (titleCollapseHeightRef.value) {
    heights.titleCollapse = titleCollapseHeightRef.value.offsetHeight;
  }
  if (titleExpandHeightRef.value) {
    heights.titleExpand = titleExpandHeightRef.value.offsetHeight;
  }
  if (synopsisHeightRef.value) {
    heights.synopsis = synopsisHeightRef.value.offsetHeight;
  }
  console.log('高度信息：', heights);
  return heights;
}
function goBack() {
  router.push('/');
}
function clickFollow() {
  isFollow.value = !isFollow.value;
}
</script>
<template>
  <div class="page">
    <div class="statusBarPlaceholder"></div>
    <div class="video-player">
      <video src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4" controls></video>
    </div>
    <div class="tabs">
      <div class="tabs-elements">
        <v-tabs class="left" v-model="tab" color="#00796B" density="comfortable">
          <v-tab value="info">简介</v-tab>
          <v-tab value="comment">评论</v-tab>
        </v-tabs>
        <div class="right">
          <span>
            <font-awesome-icon icon="fa-solid fa-film" />1080P
          </span>
        </div>
      </div>
      <v-divider></v-divider>
    </div>
    <div class="info">
      <v-tabs-window v-model="tab" class="tabs-window">
        <v-tabs-window-item value="info">
          <div class="author">
            <div class="avatar">
              <img src="../static/img/default-avatar.jpg" alt="">
            </div>
            <div class="userinfo">
              <div class="username">用户名</div>
              <div class="userdata">100粉丝 100视频</div>
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
          <div class="more" :class="{ expanded: expand }">
            <font-awesome-icon icon="fa-solid fa-angle-down" />
          </div>
          <div class="title" ref="titleRef" @click="expand = !expand">
            {{ title }}
          </div>
          <div class="synopsis" :style="{ height: expand ? `${heights.synopsis}px` : 0 }">
            {{ synopsis }}
          </div>
          <div class="calculateHeight">
            <div class="titleCollapseHeight" ref="titleCollapseHeightRef">
              {{ title }}
            </div>
            <div class="titleExpandHeight" ref="titleExpandHeightRef">
              {{ title }}
            </div>
            <div class="synopsisHeight" ref="synopsisHeightRef">
              {{ synopsis }}
            </div>
          </div>
        </v-tabs-window-item>
        <v-tabs-window-item value="comment">
          评论
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.page {
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
  background-color: #000;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
  }
}

.tabs {
  .v-tab {
    min-width: 0 !important;
  }

  .tabs-elements {
    display: flex;

    .left {
      flex: 1;
      padding: 0 0.6rem;
    }

    .right {
      padding: 0 1rem;
      display: flex;
      align-items: center;
      color: #616161;
      font-size: 0.9rem;
    }
  }
}

.info {
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
    }
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

      .username {
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

  .more {
    position: relative;
    height: 0;
    top: 6px;
    left: -8px;
    text-align: right;
    font-size: 0.7rem;
    color: #616161;

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

  .title {
    padding: 5px 20px 5px 10px;
    // white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 1rem;
    transition: height 0.3s ease-in-out;
  }

  .synopsis {
    padding: 0 10px;
    color: #616161;
    font-size: 0.8rem;
    overflow: hidden;
    transition: height 0.3s ease-in-out;
  }

  .calculateHeight {
    overflow: hidden;
    height: 0;

    .titleCollapseHeight {
      padding: 5px 20px 5px 10px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 1rem;
    }

    .titleExpandHeight {
      padding: 5px 20px 5px 10px;
      font-size: 1rem;
    }

    .synopsisHeight {
      padding: 0 10px;
      color: #616161;
      font-size: 0.8rem;
    }
  }
}
</style>