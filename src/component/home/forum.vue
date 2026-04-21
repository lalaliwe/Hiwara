<script setup lang="ts">

</script>
<template>
  <div>
    <div class="topBar">
      <div class="label">
        论坛
      </div>
    </div>
    <div>
      
    </div>
  </div>
</template>
<style lang="scss" scoped>
.topBar {
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 400;
  padding: env(safe-area-inset-top, 0) 16px 0 16px;
  height: calc(60px + env(safe-area-inset-top, 0));
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  user-select: none;

  .label {
    font-size: 1.2rem;
    font-weight: bold;
  }
}
</style>