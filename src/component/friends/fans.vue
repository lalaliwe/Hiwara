<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserFans } from '../../core/api'
import loadingHuawu from '../loadingHuawu.vue'
import errorHuawu from '../errorHuawu.vue'
import userListItem from './userListItem.vue'

interface ListItem {
  uid: string,
  username: string,
  avatar: string,  // 完整头像URL或'no-avatar'标记，由父组件构造
  signature: string,
  videoNum: number,
  imageNum: number,
  followNum: number,
  fansNum: number,
  friendNum: number,
  following: boolean,
  fansing: boolean,
  friending: boolean,
  myFollowing: boolean,
  myFansing: boolean,
  myFriending: boolean,
}

const props = defineProps<{
  uid: string
}>()

type ListState = 'failed' | 'empty' | 'loading' | 'success'
const listState = ref<ListState>('loading')
const listItems = ref<ListItem[]>([])
const listMore = ref(false)

let page = 0

async function getList(): Promise<any> {
  try {
    console.log('获取粉丝列表，uid:', props.uid, 'page:', page)
    const res = await getUserFans(props.uid, page)
    
    if (!res.ok) {
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`)
    }
    
    if (res.data.results && res.data.results.length > 0) {
      const newItems = res.data.results.map((item: any) => {
        const user = item.follower
        
        // 构造头像URL，与cardButton.vue的模式一致
        const avatarUrl = user?.avatar 
          ? `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`
          : 'no-avatar'
        
        return {
          uid: user?.id || '',
          username: user?.name || user?.username || 'Unknown',
          avatar: avatarUrl,  // 传递完整URL或错误标记
          signature: '',
          videoNum: 0,
          imageNum: 0,
          followNum: 0,
          fansNum: 0,
          friendNum: 0,
          following: user?.following || false,
          fansing: user?.followedBy || false,
          friending: user?.friend || false,
          myFollowing: user?.following || false,
          myFansing: true,
          myFriending: user?.friend || false,
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
    console.error('获取粉丝列表失败:', error)
    throw error
  }
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

defineExpose({
  listItems,
  listMore,
  handleScrollToEnd
})
</script>

<template>
  <div v-if="listState === 'failed'" class="loading">
    <errorHuawu>粉丝列表加载失败了喵~</errorHuawu>
  </div>
  <div v-else-if="listState === 'empty'" class="loading">
    <errorHuawu>暂无粉丝内容</errorHuawu>
  </div>
  <div v-else-if="listState === 'loading'" class="loading">
    <loadingHuawu>数据加载中</loadingHuawu>
  </div>
  <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="listMore" class="list">
    <div class="list-container">
      <user-list-item 
        v-for="(listItem, index) in listItems" 
        :key="index" 
        :item="listItem"
      />
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

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  gap: 12px;

  .list-avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;

    .placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;

      .img {
        width: 60%;
        height: 60%;
        object-fit: contain;
      }
    }
  }

  .list-content {
    flex: 1;
    min-width: 0;

    .list-title {
      font-weight: 500;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .list-action {
    flex-shrink: 0;
  }

  .btn {
    width: 80px;
  }
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: #757575;
  font-size: 0.9rem;

  .retry-btn {
    color: #00796B;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>