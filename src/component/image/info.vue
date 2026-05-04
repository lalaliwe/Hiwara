<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import {
  Like as iconLike,
  ShareOne as iconShareOne,
  DownloadFour as iconDownloadFour,
  CopyLink as iconCopyLink,
  Comments as iconComments
} from '@icon-park/vue-next';

// 插画信息展开状态（内部状态）
const infoExpand = ref(false);
const titleRef = ref<HTMLElement | null>(null);
const tagsContainerRef = ref<HTMLElement | null>(null);
const titleCollapseHeightRef = ref<HTMLElement | null>(null);
const titleExpandHeightRef = ref<HTMLElement | null>(null);
const synopsisHeightRef = ref<HTMLElement | null>(null);
const tagsCollapseHeightRef = ref<HTMLElement | null>(null);
const tagsExpandHeightRef = ref<HTMLElement | null>(null);

// 高度缓存对象
const heights = ref({
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0,
  tagsCollapse: 0,
  tagsExpand: 0,
});

// 接收父组件传递的插画信息数据
interface ImageInfoProps {
  title: string;
  viewCount: number;
  createdAt: string;
  pid: string;
  resolution: string;
  synopsis: string;
  tags: string[];
  authorname: string;
  fansNum: number;
  imageNum: number;
  isFollow: boolean;
}

const props = defineProps<ImageInfoProps>();

// 定义 emits
const emit = defineEmits(['commentTrigger']);

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

  // 监听窗口大小改变事件
  window.addEventListener('resize', handleResize);
})

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

// 点赞状态
const isLike = ref(false);
// 关注按钮点击处理
function clickFollow() { }
// 点赞按钮点击处理
function clickLike() { }
// 格式化时间: YYYY年MM月DD日 HH:mm
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};
</script>

<template>
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
    <font-awesome-icon icon="fa-regular fa-clock" /> {{ formatDate(createdAt) }}
    <br>
    <span>插画ID {{ pid }}</span>
    &nbsp;
    <span v-if="resolution !== ''">分辨率 {{ resolution }}</span>
  </div>
  <div class="author">
    <div class="avatar">
      <img src="../../static/img/avatar-default.jpg" alt="">
    </div>
    <div class="userinfo">
      <div class="authorname">{{ authorname }}</div>
      <div class="userdata" v-if="false">{{ fansNum }}粉丝 {{ imageNum }}插画</div>
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
  <div class="operation">
    <div @click="clickLike">
      <iconLike v-if="isLike" theme="filled" size="22" fill="#FF3D00" />
      <iconLike v-else theme="outline" size="22" fill="#212121" />
      <br>
      <span v-if="isLike">已点赞</span>
      <span v-else>点赞</span>
    </div>
    <div>
      <iconShareOne theme="two-tone" size="22" :fill="['#424242', '#00796B']" /><br>分享
    </div>
    <div @click="emit('commentTrigger')">
      <iconComments theme="multi-color" size="22" :fill="['#484848', '#00796B', '#FFFFFF', '#00796B']" /><br>评论
    </div>
    <div>
      <iconDownloadFour theme="two-tone" size="22" :fill="['#424242', '#00796B']" /><br>缓存
    </div>
    <div>
      <iconCopyLink theme="multi-color" size="22" :fill="['#424242', '#00796B', '#FFF', '#00796B']" /><br>下载链接
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
</template>

<style lang="scss" scoped>
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
  cursor: pointer;
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

.operation {
  padding: 10px 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-items: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */

  div {
    text-align: center;
    color: #616161;
    font-size: 0.8rem;
    width: 55px;
    cursor: pointer;
    user-select: none;
  }
}

.tags {
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  margin: 10px;

  .tag {
    margin: 2px 2px 2px 0;
    color: #000;
    user-select: none;
    cursor: pointer;
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
    white-space: normal;
  }

  .synopsisHeight {
    @extend .synopsis;
    height: auto !important;
  }

  .tagsCollapseHeight,
  .tagsExpandHeight {
    overflow: hidden;
    margin: 10px;

    .tag {
      margin: 2px 2px 2px 0;
    }
  }
}
</style>