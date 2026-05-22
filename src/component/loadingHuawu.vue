<script setup lang="ts">
</script>

<template>
  <div class="loading-huawu-container">
    <div class="animation">
      <img src="../static/img/huawuLoading.png" alt="">
    </div>
    <div v-if="$slots.default" class="loading-text">
      <slot></slot><span class="dots"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@font-face {
  font-family: 'AaXinRui85-2';
  src: url('/fonts/AaXinRui85-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.loading-huawu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.animation {
  overflow: hidden;
  width: 200px;
  aspect-ratio: 1086 / 724;
  img {
    width: 100%;
    animation: moveUp 2.5s steps(33, end) infinite;
  }
}

@keyframes moveUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(calc(-100% / 33 * 33));
  }
}

.loading-text {
  font-family: 'AaXinRui85-2';
  color: var(--color-primary);
  // margin-top: 16px;
  
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