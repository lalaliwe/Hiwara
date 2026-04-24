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
// 路由跳转
function routerGoTo(path: string) {
  router.push(path);
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
    <div class="item" style="border-top: solid 1px #BDBDBD;">
      <div class="label">自动播放</div>
      <div class="icon">
        <v-switch density="compact" color="#00796B"></v-switch>
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/definition')">
      <div class="label">默认清晰度</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/searchMode')">
      <div class="label">默认搜索模式</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/download')">
      <div class="label">下载设置</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/aria2')">
      <div class="label">Aria2设置</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="routerGoTo('/setup/language')">
      <div class="label">语言（Language）</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <!-- <div class="item">
      <div class="label">清理缓存</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div> -->
    <div class="item" @click="routerGoTo('/setup/about')">
      <div class="label">关于</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item">
      <div class="label">退出登录</div>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: #fafafa;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0) + 4px) 0 calc(env(safe-area-inset-bottom, 0) + 4px) 0;
  }
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
  display: flex;
  width: 100%;
  overflow: hidden;
  padding: 0 14px;
  height: 52px;

  .label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-self: start;
    overflow: hidden;
  }

  .icon {
    color: #9E9E9E;
    display: flex;
    align-items: center;
    justify-self: start;
  }

  .v-switch {
    transform: translateY(10px);
  }
}
</style>