<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({
  name: 'SetupAria2'
})

const router = useRouter()
// 返回上一页
const goBack = () => {
  router.back();
}
</script>

<template>
  <div id="setupAria2View">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        Aria2设置
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item1">
      <div class="label">启用Aria2</div>
      <div class="icon">
        <v-switch density="compact" color="#00796B"></v-switch>
      </div>
    </div>
    <div class="item2">
      <div class="label">Aria2 RPC地址</div>
      <v-text-field class="input" label="RPC地址 示例：http://127.0.0.1:6800/jsonrpc" color="#00796B" hide-details
        density="comfortable" variant="underlined"></v-text-field>
    </div>
    <div class="item2">
      <div class="label">Aria2 TOKEN</div>
      <v-text-field class="input" label="请输入TOKEN" color="#00796B" hide-details density="comfortable"
        variant="underlined"></v-text-field>
    </div>
    <div class="item2">
      <div class="label">Aria2 下载目录</div>
      <v-text-field class="input" label="下载目录 示例：~/Downloads/Iwara" color="#00796B" hide-details density="comfortable"
        variant="underlined"></v-text-field>
      <div class="tips">
        <font-awesome-icon icon="fa-solid fa-circle-exclamation" />
        提示：下载目录应为Aria2服务器目录而非本地目录。
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupAria2View {
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

.item1 {
  color: #212121;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  width: 100%;
  overflow: hidden;
  padding: 0 14px;

  .label {
    flex: 1;
    padding: 18px 0;
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

.item2 {
  color: #212121;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  width: 100%;
  overflow: hidden;

  .label {
    padding: 20px 14px 4px 14px;
  }

  .input {
    padding: 0 14px;
  }

  .tips {
    color: #757575;
    padding: 0 14px;
    margin-top: 4px;
    font-size: 0.8rem;
  }
}
</style>