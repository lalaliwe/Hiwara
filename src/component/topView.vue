<script setup lang="ts">

</script>

<template>
  <div class="top-view">
    Hiwara
  </div>
</template>

<style scoped>
.top-view {
  background-color: #00796B;
  color: #fff;
  height: 40px;
  /* 安全区域适配 - 避免状态栏遮挡内容 */
  /* 标准方案：使用CSS环境变量 */
  padding-top: env(safe-area-inset-top, 0);
  /* 回退方案：对于不支持env的设备，使用固定值 */
  padding-top: max(env(safe-area-inset-top, 0), 24px);
  /* 确保内容不会被底部导航栏遮挡（如果有的话） */
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>