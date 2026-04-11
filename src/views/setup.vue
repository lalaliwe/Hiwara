<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'Setup'
})

/** 
 * 不会返回此页面，无需onActivated
 */
setStatusBarTextStyle('light')

const router = useRouter()
// 返回上一页
const goBack = () => {
  router.back();
}
</script>

<template>
  <div id="setupView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        设置
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item autoplay" style="border-top: solid 1px #BDBDBD;">
      <div class="label">
        自动播放
      </div>
      <div class="switch">
        <v-switch class="btn" color="#00796B"></v-switch>
      </div>
    </div>
    <div class="item">
      默认清晰度
    </div>
    <div class="item">
      默认搜索模式
    </div>
    <div class="item">
      下载目录
    </div>
    <div class="item">
      Aria设置
    </div>
    <div class="item">
      语言（Language）
    </div>
    <div class="item">
      清理缓存
    </div>
    <div class="item">
      关于
    </div>
    <div class="item">
      退出登录
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: #fafafa;
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  padding-top: env(safe-area-inset-top, 0);
  height: calc(env(safe-area-inset-top, 0) + 60px);
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  user-select: none;

  .goback {
    padding: 0 16px;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      font-size: 1.5rem;
      color: white;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.item {
  border-bottom: solid 1px #BDBDBD;
  color: #212121;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  height: 52px;
  padding: 0 14px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-self: start;
}

.autoplay {
  .label {
    flex: 1;
  }

  .switch {
    .btn {
      transform: translateY(10px);
    }
  }
}
</style>