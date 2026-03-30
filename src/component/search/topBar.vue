<script setup lang="ts">
import { ref } from 'vue';
</script>

<template>
  <div class="top-view">
    <div class="goback">
      <font-awesome-icon icon="fa-solid fa-angle-left" />
    </div>
    <div class="search">
      <input type="text">
      <span class="icon">
        <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
      </span>
    </div>
    <div class="submit-btn">
      搜索
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top-view {
  background-color: #00796B;
  height: calc(60px + env(safe-area-inset-top, 0));
  width: 100%;
  /* 安全区域适配 - 避免状态栏遮挡内容 */
  /* 标准方案：使用CSS环境变量 */
  // padding-top: env(safe-area-inset-top, 0);
  /* 回退方案：对于不支持env的设备，使用固定值 */
  // padding-top: max(env(safe-area-inset-top, 0), 24px);
  /* 确保内容不会被底部导航栏遮挡（如果有的话） */
  // padding-bottom: env(safe-area-inset-bottom, 0);
  padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) 0 env(safe-area-inset-left, 0);
  display: flex;
}
.goback{
  width: 45px;
  height: 60px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.4rem;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  user-select: none;
  cursor: pointer;
  // padding-right: 10px;
  position: relative;

  input {
    background-color: #fff;
    border-radius: 30px;
    flex: 1;
    height: 32px;
    outline: none;
    padding: 0 10px 0 36px;
    font-size: 0.9rem;
    line-height: 32px;
    border: none;
    width: 100%;
  }

  .icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 14px;
    pointer-events: none;
  }
}
.submit-btn {
  height: 60px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  padding: 0 14px 0 10px;
}
</style>