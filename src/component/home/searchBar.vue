<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ai as aiStore } from '../../core/store';

const { t } = useI18n();
const router = useRouter();

// 获取 ai store 实例
const ai = aiStore();

const tabSwitchToMy = inject<() => void>('tabSwitchToMy')
// 注入刷新令牌，用于切换 AI 状态后通知所有子组件重新获取数据
const refreshToken = inject('refreshToken') as { value: number };

function toggleAI() {
  // 切换 ai store 的值
  ai.value = !ai.value;
  // 递增刷新令牌，触发所有 home 子组件重新获取数据
  refreshToken.value++;
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
      <span v-if="ai.value">
        Hiwara AI
      </span>
      <span v-else>
        Hiwara
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/mixins' as *;

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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  // 大屏时顶栏颜色与竖栏保持一致
  @include up(md) {
    background-color: var(--color-bg-section);
    color: var(--color-primary);

    // 搜索框内文字颜色
    .input span {
      color: var(--color-text-muted);
    }

    // 搜索框阴影
    .search .input {
      box-shadow: var(--shadow-card);
    }

    // 头像阴影
    .avatar img {
      box-shadow: var(--shadow-avatar);
    }
  }
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

  // 大屏时白色背景上文字用绿色
  @include up(md) {
    color: var(--color-primary);
  }
}
</style>