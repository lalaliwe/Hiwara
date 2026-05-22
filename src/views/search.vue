<script setup lang="ts">
import { onActivated, onDeactivated, ref, watch } from 'vue';
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
  
  // 进入 result 状态时，推入一条历史记录用于捕获返回键
  history.pushState({ searchResult: true }, '');
  console.log('已推入历史记录');
}

// 监听 searching 状态变化，模拟 fullscreenchange 事件
watch(searching, (newValue, oldValue) => {
  console.log(`searching 状态变化: ${oldValue} -> ${newValue}`);
  
  // 如果从 result 切换到 empty，且历史栈里有我们推入的状态，则将其弹出
  // 这样可以防止用户按返回键切换状态后，还需要点两次返回键才能退出页面
  if (oldValue === 'result' && newValue === 'empty' && history.state?.searchResult) {
    console.log('检测到从 result 切换到 empty，清理历史记录');
    history.back();
  }
});

// 处理安卓返回键的 popstate 回调
const handlePopState = () => {
  console.log('搜索页面收到 popstate 事件，当前状态:', searching.value);
  
  if (searching.value === 'result') {
    // 在 result 状态时，回到 empty 状态（这会触发 watch 监听器）
    console.log('从 result 切换回 empty');
    searching.value = 'empty';
    searchKeyword.value = '';
  }
  // 如果已经是 empty 状态，不做任何处理，让浏览器默认行为执行 router.back()
};

onActivated(() => {
  // 进入页面时，重新应用页面设置
  applyPageSettings()
  
  // 注册 popstate 事件监听
  window.addEventListener('popstate', handlePopState);
  console.log('已注册 popstate 事件监听');
})

onDeactivated(() => {
  // 移除 popstate 事件监听
  window.removeEventListener('popstate', handlePopState);
  console.log('已移除 popstate 事件监听');
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