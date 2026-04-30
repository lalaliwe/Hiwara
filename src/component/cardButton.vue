<script setup lang="ts">
import notImg from '../static/img/not-img.jpg';
import lossImg from '../static/img/loss.png';
import placeholder from '../static/img/placeholder.png';
import placeholderDark from '../static/img/placeholder-dark.png';
import { computed, type PropType, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getImageIwara } from '../core/api';

const router = useRouter();

const props = defineProps({
  type: { type: String, default: 'video' },
  id: { type: String },
  title: { type: String },
  img: { type: String },
  author: { type: String },
  time: { type: String },
  viewNum: { type: Number },
  likeNum: { type: Number },
  longNum: { type: Number },
  isR18: { type: Boolean, default: false },
});

// 中文大数单位数组，按从小到大排列
const chineseUnits = [
  { value: 1, name: '' },           // 个位
  { value: 10000, name: '万' },     // 万
  { value: 100000000, name: '亿' }, // 亿
  { value: 1000000000000, name: '兆' }, // 兆
  { value: 10000000000000000, name: '京' }, // 京
  { value: 100000000000000000000, name: '垓' }, // 垓
  { value: 1000000000000000000000000, name: '秭' }, // 秭
  { value: 10000000000000000000000000000, name: '穰' }, // 穂
  { value: 100000000000000000000000000000000, name: '沟' }, // 沟
  { value: 1000000000000000000000000000000000000, name: '涧' }, // 涧
  { value: 10000000000000000000000000000000000000000, name: '正' }, // 正
  { value: 100000000000000000000000000000000000000000000, name: '载' }, // 载
  { value: 1000000000000000000000000000000000000000000000000, name: '极' } // 极
];

// 最大支持的数值（10000极）
const MAX_SUPPORTED_VALUE = 10000 * 1000000000000000000000000000000000000000000000000;

// 数字格式化函数 - 支持所有中文大数单位
const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';

  // 小于10000直接显示
  if (num < 10000) {
    return num.toString();
  }

  // 超过最大支持范围显示∞
  if (num > MAX_SUPPORTED_VALUE) {
    return '∞';
  }

  // 从最大的单位开始查找合适的单位
  for (let i = chineseUnits.length - 1; i >= 0; i--) {
    const unit = chineseUnits[i];
    if (num >= unit.value) {
      const result = num / unit.value;
      // 优化小数显示：如果是整数或者小数部分为0，则不显示小数点
      if (result === Math.floor(result)) {
        return Math.floor(result) + unit.name;
      } else {
        // 保留一位小数，但如果小数部分为0则显示整数
        const rounded = Math.round(result * 10) / 10;
        if (rounded === Math.floor(rounded)) {
          return Math.floor(rounded) + unit.name;
        } else {
          return rounded.toFixed(1) + unit.name;
        }
      }
    }
  }

  // 默认返回原数字（理论上不会到达这里）
  return num.toString();
};

// 时间格式化函数 - 将秒数转换为 hh:mm:ss 或 mm:ss 格式
const formatTime = (seconds: number): string => {
  // 如果不能解析为有效数字，返回默认值
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  // 计算时、分、秒
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // 根据是否存在小时来确定格式
  if (hours > 0) {
    // 显示为 hh:mm:ss 格式
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    // 显示为 mm:ss 格式
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 时间显示格式化函数
const formatTimeDisplay = (timeStr: string | undefined): string => {
  if (!timeStr) return '';

  const now = new Date();
  const date = new Date(timeStr);

  // 检查日期是否有效
  if (isNaN(date.getTime())) return '';

  // 计算时间差（毫秒）
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // 获取当天零点的时间戳用于比较“今天”、“昨天”等
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  // 十分钟及以内：X分钟前
  if (diffMinutes < 10) {
    // 如果是负数或极小值（比如未来时间或刚发生），显示刚刚或0分钟前
    const mins = diffMinutes < 0 ? 0 : diffMinutes;
    return `${mins}分钟前`;
  }

  // 十分钟以上一小时以内：XX分钟前
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  // 今天：今天 HH:mm
  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  }

  // 昨天：昨天 HH:mm
  if (diffDays === 1) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  }

  // 前天：2天前 HH:mm
  if (diffDays === 2) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `2天前 ${hours}:${minutes}`;
  }

  // 大前天：3天前 HH:mm
  if (diffDays === 3) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `3天前 ${hours}:${minutes}`;
  }

  // 再往前：YYYY-MM-DD
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 计算属性用于格式化显示的数字
const formattedViewNum = computed(() => formatNumber(props.viewNum ?? 0));
const formattedLikeNum = computed(() => formatNumber(props.likeNum ?? 0));
// 根据type决定是否格式化longNum：视频类型显示为时间格式，图像类型使用大数格式
const formattedLongNum = computed(() => {
  if (props.type === 'video') {
    // 视频类型，格式化为时间格式
    return formatTime(props.longNum ?? 0);
  } else {
    // 图像类型，使用数字格式化
    return formatNumber(props.longNum ?? 0);
  }
});

// 格式化后的时间显示
const formattedTime = computed(() => formatTimeDisplay(props.time));

// 处理图片源，初始状态如果有图片链接则显示占位图，等待 API 加载
const displayImg = ref(props.img && props.img !== 'file-loss'
  ? (import.meta.env.MODE === 'development' || true ? placeholder : placeholder) // 始终先显示占位图，避免闪烁
  : (props.img === 'file-loss' ? lossImg : placeholder));

onMounted(async () => {
  if (props.img && props.img !== 'file-loss') {
    // 使用 API 获取图片，避免直接从网页获取导致的 403 错误
    try {
      displayImg.value = await getImageIwara(props.img);
    } catch (error) {
      // console.error('Failed to load image via API:', error);
      // 如果 API 失败，尝试回退到直接 URL（可选，或者保持占位图/错误图）
      // 这里为了用户体验，如果 API 失败，可以选择不更新 displayImg 保持占位图，或者显示错误图
      // 根据原有逻辑 fallback to direct url，但通常直接 url 会 403，所以建议显示 notImg 或保持 placeholder
      displayImg.value = notImg;
    }
  }
});

async function clickCard() {
  if (!props.id) {
    console.error('缺少id');
    return;
  }
  if (props.type === 'video') {
    router.push({ path: `/player/${props.id}` });
  } else if (props.type === 'image') {
    router.push({ path: `/image/${props.id}` });
  }
}
</script>

<template>
  <div class="card-button" v-ripple @click="clickCard">
    <!-- 修改 src 绑定逻辑，确保初始显示正确，并添加 transition 实现淡入效果 -->
    <v-img :src="displayImg" cover class="card-image" transition="fade-transition">
      <div class="info1">
        <div></div>
        <div class="isR18">
          <span v-if="isR18">
            R-18
          </span>
        </div>
        <div class="viewNum">
          <span v-if="type === 'video'">
            <font-awesome-icon icon="fa-regular fa-circle-play" />{{ formattedViewNum }}
          </span>
          <span v-else-if="type === 'image'">
            <font-awesome-icon icon="fa-regular fa-eye" />{{ formattedViewNum }}
          </span>
          &nbsp;
          <span>
            <font-awesome-icon icon="fa-regular fa-heart" />{{ formattedLikeNum }}
          </span>
        </div>
        <div class="longNum">
          <span>
            {{ formattedLongNum }}
          </span>
        </div>
      </div>
      <template v-slot:placeholder>
        <v-img height="100%" :src="placeholder" cover></v-img>
      </template>
      <template v-slot:error>
        <v-img height="100%" :src="notImg" cover></v-img>
      </template>
    </v-img>
    <div class="title">
      <div>{{ title }}</div>
    </div>
    <div class="info2">
      <div class="content">
        <div class="author">
          <font-awesome-icon icon="fa-regular fa-user" />{{ author }}
        </div>
        <div class="time">
          {{ formattedTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-button {
  height: 180px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.card-image {
  // aspect-ratio: 16 / 10;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

.info1 {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);


  .isR18 {
    display: flex;
    justify-content: flex-end;
    align-items: start;
    padding: 6px;

    span {
      display: inline-block;
      background: #ff3c00b0;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      font-size: 0.6rem;
      font-weight: 500;
      padding: 1px 4px;
      color: #fff;
      font-family: sans-serif;
    }
  }

  .viewNum {
    display: flex;
    justify-content: flex-start;
    align-items: end;
    padding: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      display: inline-block;
      font-size: 0.7rem;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);

      svg {
        filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.4));
      }
    }
  }

  .longNum {
    display: flex;
    justify-content: flex-end;
    align-items: end;
    padding: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      display: inline-block;
      font-size: 0.7rem;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
  }
}

.title {
  font-size: 1rem;
  height: 2rem;
  overflow: hidden;

  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-self: start;

  div {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.info2 {
  padding: 0 10px;
  font-size: 0.8rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-self: start;

  .content {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 50%);

    div {
      color: #616161;
      font-size: 0.8rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    div:nth-child(2) {
      text-align: right;
    }
  }
}
</style>