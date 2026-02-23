<script setup lang="ts">
import notImg from '../static/img/not-img.jpg';
import placeholder from '../static/img/placeholder.png';
import placeholderDark from '../static/img/placeholder-dark.png';
import { computed } from 'vue';

const props = defineProps({
  type: { type: String, default: 'video' },
  title: { type: String },
  img: { type: String },
  author: { type: String },
  time: { type: String },
  viewNum: { type: String },
  likeNum: { type: String },
  longNum: { type: String },
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
  { value: 10000000000000000000000000000, name: '穰' }, // 穰
  { value: 100000000000000000000000000000000, name: '沟' }, // 沟
  { value: 1000000000000000000000000000000000000, name: '涧' }, // 涧
  { value: 10000000000000000000000000000000000000000, name: '正' }, // 正
  { value: 100000000000000000000000000000000000000000000, name: '载' }, // 载
  { value: 1000000000000000000000000000000000000000000000000, name: '极' } // 极
];

// 最大支持的数值（10000极）
const MAX_SUPPORTED_VALUE = 10000 * 1000000000000000000000000000000000000000000000000;

// 数字格式化函数 - 支持所有中文大数单位
const formatNumber = (numStr: string): string => {
  const num = parseInt(numStr);
  if (isNaN(num)) return numStr;

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

// 计算属性用于格式化显示的数字
const formattedViewNum = computed(() => formatNumber(props.viewNum || '0'));
const formattedLikeNum = computed(() => formatNumber(props.likeNum || '0'));
const formattedLongNum = computed(() => formatNumber(props.longNum || '0'));
</script>

<template>
  <v-card v-ripple>
    <v-img :src="img" cover class="card-image">
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
    <v-card-item class="title">
      <v-card-title>
        {{ title }}
      </v-card-title>
    </v-card-item>
    <v-card-item class="info2">
      <div class="content">
        <div class="author">
          <font-awesome-icon icon="fa-regular fa-user" />{{ author }}
        </div>
        <div class="time">
          {{ time }}
        </div>
      </div>
    </v-card-item>
  </v-card>
</template>

<style lang="scss" scoped>
.card-image {
  aspect-ratio: 16 / 10;
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
      font-weight: bold;
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
      svg{
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
  padding: 0.4rem 0.625rem;

  .v-card-title {
    font-size: 1rem;
  }
}

.info2 {
  padding: 0rem 0.625rem 0.4rem 0.625rem;
  font-size: 0.8rem;

  .content {
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