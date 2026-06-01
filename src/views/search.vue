<script setup lang="ts">
import { onActivated, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import topBarView from '../component/search/topBar.vue';
import emptyView from '../component/search/empty.vue';
import resultView from '../component/search/result.vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

defineOptions({
  name: 'Search'
})

const router = useRouter();
const searching = ref<'empty' | 'result'>('empty');
const searchKeyword = ref('');

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

// 处理返回操作（左上角按钮）
function handleBack() {
  console.log('handleBack 被调用，当前状态:', searching.value);
  
  if (searching.value === 'result') {
    // 在 result 状态时，回到 empty 状态
    console.log('从 result 切换回 empty');
    searching.value = 'empty';
    searchKeyword.value = '';
  } else {
    // 在 empty 状态时，真正返回上一页
    console.log('执行 router.back()');
    router.back();
  }
}

// 处理搜索事件
function handleSearch(keyword: string) {
  console.log('接收到搜索关键词:', keyword);
  searchKeyword.value = keyword;
  searching.value = 'result';
}

// 处理来自 App.vue 的安卓返回键事件
const handleSearchBackPressed = () => {
  console.log('搜索页面收到 search-back-pressed 事件，当前状态:', searching.value);
  
  if (searching.value === 'result') {
    // 在 result 状态时，回到 empty 状态
    console.log('从 result 切换回 empty');
    searching.value = 'empty';
    searchKeyword.value = '';
  } else {
    // 在 empty 状态时，真正返回上一页
    console.log('执行 router.back()');
    router.back();
  }
};

onActivated(() => {
  // 进入页面时，重新应用页面设置
  applyPageSettings()
})

onMounted(() => {
  // 监听来自 App.vue 的返回键事件
  window.addEventListener('search-back-pressed', handleSearchBackPressed);
  console.log('已注册 search-back-pressed 事件监听');
})

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('search-back-pressed', handleSearchBackPressed);
  console.log('已移除 search-back-pressed 事件监听');
})
</script>
<template>
  <div id="searchView">
    <topBarView class="topBar" :keyword="searchKeyword" @back="handleBack" @search="handleSearch" />
    <emptyView v-if="searching === 'empty'" @search="handleSearch" />
    <resultView v-else :keyword="searchKeyword" />
  </div>
</template>
<style lang="scss" scoped>
#searchView {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-card);
  height: 100vh;
}

.topBar {
  position: fixed;
  top: 0;
  z-index: 500;
}
</style>