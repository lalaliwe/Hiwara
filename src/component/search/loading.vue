<template>
  <div class="search-loading">
    <loadingHuawu>数据加载中</loadingHuawu>
  </div>
</template>

<script setup lang="ts">
import loadingHuawu from '../loadingHuawu.vue';
</script>

<style lang="scss" scoped>
@font-face {
  font-family: 'AaXinRui85-2';
  /* 优先使用相对路径（Android assets目录） */
  src: url('/fonts/AaXinRui85-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.search-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  user-select: none;
}
</style>