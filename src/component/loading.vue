<script setup lang="ts">
</script>
<template>
  <div class="animation">
    <img src="../static/img/huawuLoading.png" alt="">
  </div>
</template>
<style lang="scss" scoped>
.animation {
  overflow: hidden;
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
</style>