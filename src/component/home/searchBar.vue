<script setup lang="ts">
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const isAI = ref(false)

const tabSwitchToMy = inject<() => void>('tabSwitchToMy')

function toggleAI() {
  isAI.value = !isAI.value
}
function toSearch() {
  router.push('/search')
}
</script>

<template>
  <div class="top-view">
    <div class="avatar" @click="tabSwitchToMy">
      <img src="../../static/img/avatar-default.jpg" alt="Avatar" />
    </div>
    <div class="search" @click="toSearch">
      <div class="input">
        <span>
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
          {{ t('home.searchBar.placeholder') }}
        </span>
      </div>
    </div>
    <div class="logo" @click="toggleAI">
      <span v-if="isAI">
        Hiwara AI
      </span>
      <span v-else>
        Hiwara
      </span>
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
  background-color: var(--color-primary-90);
  color: var(--color-text-on-primary);
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
  box-shadow: var(--shadow-top-bar);
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  user-select: none;
  cursor: pointer;

  .input {
    background-color: var(--color-bg-card);
    border-radius: 30px;
    flex: 1;
    height: 32px;
    color: var(--color-text-muted);
    display: flex;
    justify-content: start;
    align-items: center;

    span {
      display: inline-block;
      padding: 0 10px;
      font-size: 0.9rem;
    }
  }
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



.logo {
  font-family: 'riwenlogo', sans-serif;
  font-size: 1.2rem;
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  cursor: pointer;
  user-select: none;
}
</style>