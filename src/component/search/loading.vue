<template>
  <div class="search-loading">
    <div class="animation-container">
      <loadingHuawu />
      <div class="loading-text">
        数据加载中<span class="dots"></span>
      </div>
    </div>
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

  .animation-container {
    width: 200px;
    text-align: center;
    color: #00796B;
  }

  .loading-text {
    font-family: 'AaXinRui85-2';
  }

  .dots::after {
    content: '';
    animation: dotsAnimation 1s infinite;
  }
}

@keyframes dotsAnimation {
  0% {
    content: '.';
  }

  16.66% {
    content: '..';
  }

  33.32% {
    content: '...';
  }

  49.98% {
    content: '....';
  }

  66.64% {
    content: '.....';
  }

  83.3% {
    content: '......';
  }

  100% {
    content: '.';
  }
}
</style>