<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getImageIwara } from '../../core/api';
import notImg from '../../static/img/not-img.jpg';
import iwaraSVG from '../../assets/svg/iwara.svg';

// 定义列表项接口
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
  lastWatchDate: string;
}

const props = defineProps<{
  item: ListItem;
  type: 'video' | 'image'; // 添加类型区分
}>();

// 处理图片源，初始状态如果有图片链接则显示空字符串，等待 API 加载
const displayImg = ref(props.item.img ? '' : notImg);

onMounted(async () => {
  if (props.item.img) {
    // 使用 API 获取图片，避免直接从网页获取导致的 403 错误
    try {
      console.log(`加载${props.type === 'video' ? '视频' : '插画'}历史封面:`, props.item.id);
      displayImg.value = await getImageIwara(props.item.img);
      console.log(`${props.type === 'video' ? '视频' : '插画'}历史封面加载成功:`, props.item.id);
    } catch (error) {
      console.error(`${props.type === 'video' ? '视频' : '插画'}历史封面加载失败:`, props.item.id, error);
      displayImg.value = notImg;
    }
  }
});
</script>

<template>
  <v-list-item class="list-item">
    <!-- 左侧：预览图 -->
    <template v-slot:prepend>
      <v-img :src="displayImg" :alt="item.title" aspect-ratio="4/3" width="106.7" height="80" cover
        class="rounded">
        <template v-slot:placeholder>
          <div class="placeholder">
            <img :src="iwaraSVG" class="img" />
          </div>
        </template>
        <template v-slot:error>
          <img height="100%" :src="notImg" cover />
        </template>
      </v-img>
    </template>

    <!-- 中间：标题和信息 -->
    <div class="list-content">
      <div class="list-title">
        {{ item.title }}
      </div>
      <div class="list-subtitle">
        {{ item.author }} • {{ item.time }}
      </div>
      <div class="list-stats">
        <template v-if="type === 'video'">
          {{ item.viewNum }}播放 • {{ item.likeNum }}点赞 • {{ item.longNum }}
        </template>
        <template v-else>
          {{ item.viewNum }}浏览 • {{ item.likeNum }}收藏 • {{ item.longNum }}张
        </template>
      </div>
    </div>

    <!-- 右侧：R18标记 -->
    <template v-slot:append v-if="item.isR18">
      <v-chip color="red" size="small" label>R18</v-chip>
    </template>
  </v-list-item>
</template>

<style lang="scss" scoped>
.list-item {
  border-bottom: 1px solid #eee;
  padding: 8px 16px;

  .placeholder {
    width: 100%;
    height: 100%;
    background-color: #d0d0d0;
    display: flex;
    justify-content: center;
    align-items: center;

    .img {
      width: 40px;
    }
  }

  .list-content {
    flex: 1;
    min-width: 0; // 允许内容压缩
    margin: 0 16px;

    .list-title {
      font-weight: 500;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list-subtitle {
      font-size: 0.8rem;
      color: #616161;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 4px;
    }

    .list-stats {
      font-size: 0.75rem;
      color: #959595;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>