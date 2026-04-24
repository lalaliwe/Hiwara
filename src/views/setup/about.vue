<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({
  name: 'SetupAbout'
})

const router = useRouter()
// 返回上一页
const goBack = () => {
  router.back();
}
</script>

<template>
  <div id="setupAboutView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        关于
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="brand">
      <div>
        <div class="logo">
          <img class="img" src="/logo-square_2.0.svg" alt="" />
        </div>
        <div class="label">Hiwara</div>
      </div>
    </div>
    <div class="item">
      <div class="label">版本号</div>
      <div class="value">v1.0.00</div>
    </div>
    <div class="item">
      <div class="label">版本类型</div>
      <div class="value">测试版</div>
    </div>
    <div class="item">
      <div class="label">构建时间</div>
      <div class="value">2023-10-01 12:00</div>
    </div>
    <div class="item">
      <div class="label">设备类型</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-desktop" />
        &nbsp;
        桌面端
      </div>
    </div>
    <div class="item">
      <div class="label">OS名称</div>
      <div class="value">
        <font-awesome-icon icon="fa-brands fa-windows" />
        &nbsp;
        Windows 10
      </div>
    </div>
    <div class="item">
      <div class="label">OS版本</div>
      <div class="value">19045.6466</div>
    </div>
    <div class="item">
      <div class="label">WebView</div>
      <div class="value">WebView2</div>
    </div>
    <div class="item">
      <div class="label">WebView版本</div>
      <div class="value">10.0.19044</div>
    </div>
        <div class="item">
      <div class="label">检查更新</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item">
      <div class="label">开源许可</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupAboutView {
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

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;

  .logo {
    width: 150px;
    height: 150px;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    .img {
      width: calc(100% + 40px);
      height: calc(100% + 40px);
    }
  }

  .label {
    font-family: 'riwenlogo';
    font-size: 1.8rem;
    line-height: 3.8rem;
    color: #414141;
    text-align: center;
  }

  @font-face {
    font-family: 'riwenlogo';
    /* 优先使用相对路径（Android assets目录） */
    src: url('/fonts/riwenlogo.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
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

  .value {
    color: #9E9E9E;
    display: flex;
    align-items: center;
    justify-self: start;
  }
}
</style>