<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import {
  Like as iconLike,
  ShareOne as iconShareOne,
  DownloadFour as iconDownloadFour,
  CopyLink as iconCopyLink,
} from '@icon-park/vue-next';
import test1Img from '../../static/img/test1.jpg';
import cardButton from '../cardButton.vue';

const props = defineProps<{
  title: string, // 标题
  synopsis: string, // 描述
  playNum: number, // 播放数
  likeNum: number, // 点赞数
  createdAt: string,  // 创建时间
  isLike: boolean,  // 是否已点赞
  tags: string[], // 标签
  authorname: string, // 作者昵称
  fansNum: number, // 粉丝数
  videoNum: number, // 视频数
  isFollow: boolean,  // 是否已关注
}>()

const expand = ref(false);
const titleRef = ref<HTMLElement | null>(null);
const titleCollapseHeightRef = ref<HTMLElement | null>(null);
const titleExpandHeightRef = ref<HTMLElement | null>(null);
const synopsisHeightRef = ref<HTMLElement | null>(null);

// 高度缓存对象
const heights = ref({
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0
});

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
    img: test1Img,
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
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
}

onMounted(() => {
  calculateHeights();
  if (titleRef.value) {
    titleRef.value.style.height = heights.value.titleCollapse + 'px';
    titleRef.value.style.whiteSpace = 'nowrap';
  }
})

// 简化 watch 逻辑，使用 nextTick 确保 DOM 更新后设置样式
watch(expand, async (val) => {
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
      if (!expand.value) {
        el.style.whiteSpace = 'nowrap';
      }
    }, 300); // 与 transition 时间匹配
  }
}, { immediate: true });

function calculateHeights() {
  heights.value.titleCollapse = titleCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.titleExpand = titleExpandHeightRef.value?.offsetHeight || 0;
  heights.value.synopsis = synopsisHeightRef.value?.offsetHeight || 0;
}

// 关注
function clickFollow() {
}
// 点赞
function clickLike() {
}
</script>
<template>
  <div class="author">
    <div class="avatar">
      <img src="../../static/img/default-avatar.jpg" alt="">
    </div>
    <div class="userinfo">
      <div class="authorname">{{ authorname }}</div>
      <div class="userdata">{{ fansNum }}粉丝 {{ videoNum }}视频</div>
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
  <div class="infomsg">
    <font-awesome-icon icon="fa-regular fa-circle-play" /> {{ playNum }}
    &nbsp;
    <font-awesome-icon icon="fa-regular fa-clock" /> {{ createdAt }}
  </div>
  <div class="synopsis" :style="{ height: expand ? `${heights.synopsis}px` : 0 }">
    <div class="text">
      {{ synopsis }}
    </div>
    <div class="tags">
      <v-chip class="tag" v-for="tag in tags" size="small">{{ tag }}</v-chip>
    </div>
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
      <div class="tags">
        <v-chip class="tag" v-for="tag in tags" size="small">{{ tag }}</v-chip>
      </div>
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
      <iconShareOne theme="two-tone" size="22" :fill="['#424242', '#00796B']" />
      <br>
      分享
    </div>
    <div>
      <iconDownloadFour theme="two-tone" size="22" :fill="['#424242', '#00796B']" />
      <br>
      缓存
    </div>
    <div>
      <iconCopyLink theme="multi-color" size="22" :fill="['#424242', '#00796B', '#FFF', '#00796B']" />
      <br>
      下载链接
    </div>
  </div>
  <div class="recommend">
    <div class="label">
      该作者其他视频
    </div>
    <div class="lists">
      <div v-for="(item, index) in authorOtherVideoList">
        <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
          :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
          :isR18="item.isR18" />
      </div>
    </div>
    <div class="label">
      更多推荐
    </div>
    <div class="lists">
      <div v-for="(item, index) in authorOtherVideoList">
        <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
          :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
          :isR18="item.isR18" />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
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

.more {
  position: relative;
  height: 0;
  top: 4px;
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
  padding: 5px 15px 5px 10px;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 1.1rem;
  transition: height 0.3s ease-in-out;
}

.infomsg {
  padding: 0 10px;
  font-size: 0.8rem;
  color: #616161;
}

.synopsis {
  padding: 0 10px;
  color: #616161;
  font-size: 0.8rem;
  overflow: hidden;
  transition: height 0.3s ease-in-out;

  .text {
    padding: 4px 0 2px 0;
  }

  .tags {
    padding: 2px 0 4px 0;

    .tag {
      margin: 2px 2px 2px 0;
    }
  }
}

.calculateHeight {
  overflow: hidden;
  height: 0;

  .titleCollapseHeight {
    padding: 5px 15px 5px 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 1.1rem;
  }

  .titleExpandHeight {
    padding: 5px 15px 5px 10px;
    font-size: 1.1rem;
  }

  .synopsisHeight {
    padding: 0 10px;
    color: #616161;
    font-size: 0.8rem;

    .text {
      padding: 4px 0 2px 0;
    }

    .tags {
      padding: 2px 0 4px 0;

      .tag {
        margin: 2px 2px 2px 0;
      }
    }
  }
}

.operation {
  padding: 10px 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-items: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */

  div {
    text-align: center;
    color: #616161;
    font-size: 0.8rem;
    width: 55px;
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