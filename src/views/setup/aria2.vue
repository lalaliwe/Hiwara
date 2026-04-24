<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'SetupAria2'
})

const router = useRouter()
const setup = setupStore()
const { aria2Switch, aria2Rpc, aria2Token, aria2Download } = storeToRefs(setup)

// 返回上一页
const goBack = () => {
  router.back();
}

// 切换Aria2开关
const toggleAria2Switch = async (value: boolean | null) => {
  await setup.updateSetting('aria2Switch', Boolean(value));
}

// 更新Aria2 RPC地址
const updateAria2Rpc = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setup.updateSetting('aria2Rpc', target.value);
}

// 更新Aria2 Token
const updateAria2Token = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setup.updateSetting('aria2Token', target.value);
}

// 更新Aria2下载目录
const updateAria2Download = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setup.updateSetting('aria2Download', target.value);
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
        <v-switch 
          v-model="aria2Switch" 
          @update:model-value="toggleAria2Switch"
          density="compact" 
          color="#00796B"
        ></v-switch>
      </div>
    </div>
    <div class="item2">
      <div class="label">Aria2 RPC地址</div>
      <v-text-field 
        class="input" 
        label="RPC地址 示例：http://127.0.0.1:6800/jsonrpc" 
        color="#00796B" 
        hide-details
        density="comfortable" 
        variant="underlined"
        :model-value="aria2Rpc"
        @change="updateAria2Rpc"
      ></v-text-field>
    </div>
    <div class="item2">
      <div class="label">Aria2 TOKEN</div>
      <v-text-field 
        class="input" 
        label="请输入TOKEN" 
        color="#00796B" 
        hide-details 
        density="comfortable"
        variant="underlined"
        :model-value="aria2Token"
        @change="updateAria2Token"
      ></v-text-field>
    </div>
    <div class="item2">
      <div class="label">Aria2 下载目录</div>
      <v-text-field 
        class="input" 
        label="下载目录 示例：~/Downloads/Iwara" 
        color="#00796B" 
        hide-details 
        density="comfortable"
        variant="underlined"
        :model-value="aria2Download"
        @change="updateAria2Download"
      ></v-text-field>
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

.item1, .item2 {
  color: #212121;
  font-size: 1rem;
  user-select: none;
  display: flex;
  width: 100%;
  overflow: hidden;
  padding: 0 14px;
  height: 52px;
  align-items: center;
}

.item1 {
  justify-content: space-between;
}

.item2 {
  flex-direction: column;
  align-items: flex-start;
  height: auto;
  padding-top: 16px;
  padding-bottom: 16px;

  .input {
    width: 100%;
    margin-top: 8px;
  }
}

.tips {
  display: flex;
  align-items: center;
  color: #9E9E9E;
  font-size: 0.8rem;
  margin-top: 8px;

  svg {
    margin-right: 4px;
    font-size: 0.8rem;
  }
}

.label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-self: start;
  overflow: hidden;
}

.icon {
  display: flex;
  align-items: center;
  justify-self: start;
}
</style>