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
const titleCollapseHeightRef = ref<HTMLElement | null>(null);
const titleExpandHeightRef = ref<HTMLElement | null>(null);
const synopsisHeightRef = ref<HTMLElement | null>(null);
const heights = {
  titleCollapse: 0,
  titleExpand: 0,
  synopsis: 0
};
const titleRef = ref<HTMLElement | null>(null);

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
let authorOtherVideoList: ListItem[] = [];
let recommendVideoList: ListItem[] = [];
for (let i = 0; i < 5; i++) {
  authorOtherVideoList.push({
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
  recommendVideoList.push({
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

onMounted(async () => {
  await nextTick();
  calculateHeights();
  if (titleRef.value) {
    titleRef.value.style.height = heights.titleCollapse + 'px';
    titleRef.value.style.whiteSpace = 'nowrap';
  }
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
    font-size: 1rem;
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