<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'SetupSearchMode'
})

const router = useRouter()
const setup = setupStore()
const { searchMode } = storeToRefs(setup)

// 返回上一页
const goBack = () => {
  router.back();
}

// 设置搜索模式
const setSearchMode = async (mode: number) => {
  await setup.updateSetting('searchMode', mode);
  router.back();
}
</script>

<template>
  <div id="setupSearchModeView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        默认搜索模式
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item" @click="setSearchMode(0)">
      <div class="label">关键字搜索</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-check" v-if="searchMode === 0" />
      </div>
    </div>
    <div class="item" @click="setSearchMode(1)">
      <div class="label">标签搜索</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-check" v-if="searchMode === 1" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupSearchModeView {
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

  .value {
    color: #9E9E9E;
    display: flex;
    align-items: center;
    justify-self: start;
  }
}
</style>