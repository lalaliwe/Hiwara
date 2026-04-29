<script setup lang="ts">
import { computed } from 'vue'
import huawu1 from '../static/img/error-huawu/1.png'
import huawu2 from '../static/img/error-huawu/2.png'
import huawu3 from '../static/img/error-huawu/3.png'
import huawu4 from '../static/img/error-huawu/4.png'
import huawu5 from '../static/img/error-huawu/5.png'
import huawu6 from '../static/img/error-huawu/6.png'
import huawu7 from '../static/img/error-huawu/7.png'
import huawu8 from '../static/img/error-huawu/8.png'

// 随机选择一张图片
const huawuImages = [huawu1, huawu2, huawu3, huawu4, huawu5, huawu6, huawu7, huawu8]
const randomImage = computed(() => {
  const randomIndex = Math.floor(Math.random() * huawuImages.length)
  return huawuImages[randomIndex]
})
</script>

<template>
  <div class="error-huawu-container">
    <img :src="randomImage" alt="error-huawu" />
    <div v-if="$slots.default" class="error-text">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
@font-face {
  font-family: 'AaXinRui85-2';
  src: url('/fonts/AaXinRui85-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.error-huawu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

img {
  display: block;
  width: 120px;
}

.error-text {
  font-family: 'AaXinRui85-2';
  color: #00796B;
  margin-top: 16px;
}
</style>