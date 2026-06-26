<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import { ai } from '../../core/store';
import { getFriendsList } from '../../core/api/user'
import loadingHuawu from '../loadingHuawu.vue'
import errorHuawu from '../errorHuawu.vue'
import userListItem from './userListItem.vue'

interface ListItem {
  uid: string,
  username: string,
  nickname: string,
  avatar: string,  // 原始头像URL或空字符串，由子组件处理加载
  signature: string,
  videoNum: number,
  imageNum: number,
  followNum: number,
  fansNum: number,
  friendNum: number,
  following: boolean,
  fansing: boolean,
  friending: boolean
}

const props = defineProps<{
  uid: string
}>()

console.log('friend组件接收到的uid:', props.uid)

type ListState = 'failed' | 'empty' | 'loading' | 'success'
const listState = ref<ListState>('loading')
const listItems = ref<ListItem[]>([])
const listMore = ref(false)

let page = 0
let scrollPosition = 0 // 记录滚动位置

async function getList(): Promise<any> {
  try {
    // 防御性检查：uid 为空时直接报错，避免发送无效请求
    if (!props.uid) {
      throw new Error('用户 ID 为空，无法获取好友列表')
    }
    // console.log('获取好友列表，uid:', props.uid, 'page:', page)
    const res = await getFriendsList(props.uid, page, aiStore.value)

    if (!res.ok) {
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`)
    }

    if (res.data.results && res.data.results.length > 0) {
      // console.log(res.data.results)
      const newItems = res.data.results.map((item: any) => {
        // 好友列表的results直接是用户对象，不需要.item.user或item.follower
        const user = item

        // 构造头像URL，与following.vue的模式一致
        const avatarUrl = user?.avatar
          ? `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`
          : 'no-avatar'

        return {
          uid: user.id || '',
          username: user.username || 'Unknown',
          nickname: user.name || 'Unknown',
          avatar: avatarUrl,
          signature: '',
          videoNum: 0,
          imageNum: 0,
          followNum: 0,
          fansNum: 0,
          friendNum: 0,
          following: user.following || false,
          fansing: user.followedBy || false,
          friending: user.friend || false,
        }
      })

      listItems.value = [...listItems.value, ...newItems]
      page++

      return newItems
    } else {
      listMore.value = true
      return []
    }
  } catch (error) {
    console.error('获取好友列表失败:', error)
    throw error
  }
}

async function handleScroll(e: Event): Promise<void> {
  scrollPosition = (e.target as HTMLElement).scrollTop;
}

async function handleScrollToEnd({ done }: any) {
  try {
    const res = await getList()
    if (res.length > 0) {
      done('ok')
    } else {
      listMore.value = true
      done('empty')
    }
  } catch (error) {
    done('error')
  }
}

onMounted(async () => {
  try {
    const res = await getList()
    if (res.length > 0) {
      listState.value = 'success'
      listMore.value = false
    } else {
      listState.value = 'empty'
      listMore.value = true
    }
  } catch (error) {
    listState.value = 'failed'
  }
})

// 组件激活时恢复滚动位置
onActivated(() => {
  const infiniteScroll = document.querySelector('.list');
  if (infiniteScroll) {
    (infiniteScroll as HTMLElement).scrollTop = scrollPosition;
  }
});

defineExpose({
  listItems,
  listMore,
  handleScrollToEnd
})
</script>

<template>
  <div v-if="listState === 'failed'" class="loading">
    <errorHuawu>好友列表加载失败了喵~</errorHuawu>
  </div>
  <div v-else-if="listState === 'empty'" class="loading">
    <errorHuawu>暂无好友内容</errorHuawu>
  </div>
  <div v-else-if="listState === 'loading'" class="loading">
    <loadingHuawu>数据加载中</loadingHuawu>
  </div>
  <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="listMore" class="list"
    @scroll="handleScroll">
    <div class="list-container">
      <user-list-item v-for="(listItem, index) in listItems" :key="index" :item="listItem" />
    </div>
    <template v-slot:error="{ props }">
      <div class="load-more-failed">
        <span>加载失败，</span>
        <span class="retry-btn" v-bind="props">点击重试</span>
      </div>
    </template>
    <template v-slot:empty>
      <div class="listEnd">
        已经到底了
      </div>
    </template>
  </v-infinite-scroll>
</template>

<style lang="scss" scoped>
.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.list {
  height: 100%;
  padding: calc(60px + 40px + 1px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  overflow: auto;

  &::-webkit-scrollbar-track {
    margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 env(safe-area-inset-bottom, 0) 0;
  }

  .list-container {
    // 包裹容器
  }
}

.listEnd {
  color: var(--color-text-muted-light);
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: var(--color-text-muted-light);
  font-size: 0.9rem;

  .retry-btn {
    color: var(--color-primary);
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>
