<script setup lang="ts">

</script>

<template>
  <div class="top-view">
    <div class="avatar">
      <img src="../static/img/default-avatar.jpg" alt="Avatar" />
    </div>
    <div class="search">

      <div class="input"></div>
    </div>
    <div class="logo">
      Hiwara
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 使用多重字体加载方案，确保兼容性 */
@font-face {
  font-family: 'riwenlogo';
  /* 优先使用相对路径（Android assets目录） */
  src: url('/fonts/riwenlogo.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.top-view {
  position: fixed;
  top: 0;
  background-color: #00796B;
  color: #fff;
  height: calc(60px + env(safe-area-inset-top, 0));
  width: 100%;
  /* 安全区域适配 - 避免状态栏遮挡内容 */
  /* 标准方案：使用CSS环境变量 */
  padding-top: env(safe-area-inset-top, 0);
  /* 回退方案：对于不支持env的设备，使用固定值 */
  // padding-top: max(env(safe-area-inset-top, 0), 24px);
  /* 确保内容不会被底部导航栏遮挡（如果有的话） */
  // padding-bottom: env(safe-area-inset-bottom, 0);
  display: flex;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.input {
  background-color: #fff;
  border-radius: 30px;
  flex: 1;
  height: 32px;
  align-self: center;
}

.logo {
  font-family: 'riwenlogo', sans-serif;
  font-size: 1.2rem;
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}
</style>