<script setup lang="ts">
import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';
import topBarView from '../component/search/topBar.vue';
import emptyView from '../component/search/empty.vue';
import loadingView from '../component/search/loading.vue';
import resultView from '../component/search/result.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'Search'
})

const router = useRouter();
const searching = ref<'empty' | 'loading' | 'result'>('result');

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

// 返回
function goBack() {
  router.back();
}

onActivated(() => {
  // 进入页面时，重新应用页面设置
  applyPageSettings()
})
</script>
<template>
  <div id="searchView">
    <topBarView class="topBar" @back="goBack" />
    <emptyView v-if="searching === 'empty'" />
    <loadingView v-else-if="searching === 'loading'" />
    <resultView v-else-if="searching === 'result'" />
  </div>
</template>
<style lang="scss" scoped>
#searchView {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 1
}

.topBar {
  position: absolute;
  top: 0;
  z-index: 500;
}
</style>
