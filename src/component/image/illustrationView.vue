<script setup lang="ts">
import { ref } from 'vue';

interface IllustrationViewProps {
  images: string[]; // 插画图片URL数组
}

const props = defineProps<IllustrationViewProps>();

// 图片展开状态
const imageExpand = ref(false);

// 如果没有传入图片，默认显示占位图
const placeholderImg = '../static/img/placeholder.png';
</script>

<template>
  <div class="illustrationView">
    <!-- 主图 -->
    <v-img 
      v-if="images.length > 0" 
      cover 
      :src="images[0]"
    >
      <template v-slot:placeholder>
        <v-img cover :src="placeholderImg"></v-img>
      </template>
    </v-img>
    <!-- 占位图（如果没有主图） -->
    <v-img 
      v-else 
      cover 
      :src="placeholderImg"
    ></v-img>
    
    <!-- 额外的图片（展开时显示） -->
    <v-img 
      v-if="imageExpand && images.length > 1" 
      v-for="(img, index) in images.slice(1)" 
      :key="index" 
      cover 
      :src="img"
    ></v-img>
    
    <!-- 展开/收起按钮（只有多张图片时才显示） -->
    <span 
      v-if="images.length > 1"
      class="expand-btn" 
      @click="imageExpand = !imageExpand"
    >
      {{ imageExpand ? '收起' : '展开全部' }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.illustrationView {
  width: 100%;
  position: relative;

  .expand-btn {
    color: #fff;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    display: inline-block;
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 6px 10px;
    font-size: 0.9rem;
    user-select: none;
    cursor: pointer;
  }
}
</style>