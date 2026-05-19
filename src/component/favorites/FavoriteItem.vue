<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getImageIwara } from '../../core/api';
import notImg from '../../static/img/not-img.jpg';
import iwaraSVG from '../../assets/svg/iwara.svg';

const router = useRouter();

// 定义列表项接口
interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  createTime: string;
  longNum: number;
  isR18: boolean;
  favoriteDate: string;
  favoriteTime?: number; // 添加可选的完整时间戳字段
}

const props = defineProps<{
  item: ListItem;
  type: 'video' | 'image'; // 添加类型区分
}>();

console.log('item:', props.item);

// 处理图片源，初始状态如果有图片链接则显示空字符串，等待 API 加载
const displayImg = ref(props.item.img ? '' : notImg);

// 格式化时长
const formatDuration = (seconds: number, type: 'video' | 'image'): string => {
  if (type === 'image') {
    return `${seconds}张`;
  }

  // 视频类型：将秒数转换为时间格式
  const totalSeconds = seconds;
  if (isNaN(totalSeconds)) {
    return '0:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    // 有小时：H:MM:SS
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    // 无小时：MM:SS（分钟至少两位）
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 格式化时间为 HH:MM
const formatTime = (timestamp?: number): string => {
  if (!timestamp) {
    return '';
  }
  
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// 点击列表项跳转
function clickItem() {
  if (!props.item.id) {
    console.error('缺少id');
    return;
  }
  if (props.type === 'video') {
    router.push({ path: `/player/${props.item.id}` });
  } else if (props.type === 'image') {
    router.push({ path: `/image/${props.item.id}` });
  }
}

onMounted(async () => {
  if (props.item.img) {
    // 使用 API 获取图片，避免直接从网页获取导致的 403 错误
    try {
      displayImg.value = await getImageIwara(props.item.img);
    } catch (error) {
      console.error(`${props.type === 'video' ? '视频' : '插画'}收藏封面加载失败:`, props.item.id, error);
      displayImg.value = notImg;
    }
  }
});
</script>

<template>
  <v-list-item class="list-item" @click="clickItem">
    <!-- 左侧：预览图 -->
    <template v-slot:prepend>
      <v-img :src="displayImg" :alt="item.title" aspect-ratio="16/10" width="128" height="80" cover class="rounded">
        <div class="longNum">
          {{ formatDuration(item.longNum, type) }}
        </div>
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
        <font-awesome-icon icon="fa-regular fa-user" />
        {{ item.author }}
      </div>
      <div class="list-stats">
        <font-awesome-icon icon="fa-regular fa-clock" />
        {{ item.favoriteDate }} {{ formatTime(item.favoriteTime) }}
      </div>
    </div>
  </v-list-item>
</template>

<style lang="scss" scoped>
.list-item {
  border-bottom: 1px solid #eee;
  padding: 8px 16px;

  .longNum {
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    position: absolute;
    right: 4px;
    bottom: 4px;
    border-radius: 4px;
    font-size: 0.75rem;
    padding: 2px 4px;
  }

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
      font-size: 0.8rem;
      color: #616161;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>