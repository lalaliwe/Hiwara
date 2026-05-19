<script setup lang="ts">
import { onActivated, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import { uid as muid } from '../core/store';
import following from '../component/friends/following.vue'
import fans from '../component/friends/fans.vue'
import friend from '../component/friends/friend.vue'

defineOptions({
  name: 'Friends'
})

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

const router = useRouter()
const route = useRoute()

const uid = ref<string>((route.params.uid as string) || (muid().value ?? ''))

// 判定是否是用户自己的好友列表
const isMyself = ref<boolean>(false)
if (uid.value === muid().value) {
  isMyself.value = true
}

const tab = ref<'follow' | 'fans' | 'friend'>()
tab.value = route.query.type as 'follow' | 'fans' | 'friend'

// 如果不是自己的好友列表，默认切换到'follow'标签
if (!isMyself.value && tab.value === 'friend') {
  tab.value = 'follow'
}

console.log('uid:', uid.value)
console.log('isMyself:', isMyself.value)

interface ListItem {
  uid: string,
  username: string,
  avatar: string,
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

// 好友列表数据（暂时为空）
const friendListData = ref<ListItem[]>([])

// 返回上一页
const goBack = () => {
  router.back();
}

// 滚动条位置
let followSrollTop = 0;
let fansSrollTop = 0;
let friendSrollTop = 0;

const followListRef = ref<InstanceType<typeof following>>()
const fansListRef = ref<InstanceType<typeof fans>>()
const friendListRef = ref<HTMLElement>()

onActivated(() => {
  // console.log('friends 页面激活')
  // 进入页面时，重新应用页面设置
  applyPageSettings()
  // 恢复滚动条位置
  if (followListRef.value && typeof followListRef.value.$el.querySelector === 'function') {
    const scrollElement = followListRef.value.$el.querySelector('.list')
    if (scrollElement) scrollElement.scrollTop = followSrollTop
  }
  if (fansListRef.value && typeof fansListRef.value.$el.querySelector === 'function') {
    const scrollElement = fansListRef.value.$el.querySelector('.list')
    if (scrollElement) scrollElement.scrollTop = fansSrollTop
  }
  if (friendListRef.value && typeof friendListRef.value.scrollTo === 'function')
    friendListRef.value.scrollTo({ top: friendSrollTop });
})
</script>

<template>
  <div id="friendsView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          {{ tab === 'follow' ? '关注' : tab === 'fans' ? '粉丝' : '好友' }}
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="follow">
            关注
          </v-tab>
          <v-tab value="fans">
            粉丝
          </v-tab>
          <v-tab v-if="isMyself" value="friend">
            好友
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item value="follow">
        <following ref="followListRef" :uid="uid" />
      </v-tabs-window-item>
      <v-tabs-window-item value="fans">
        <fans ref="fansListRef" :uid="uid" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="isMyself" value="friend">
        <friend ref="friendListRef" :uid="uid" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#friendsView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
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

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }
  }
}

.tabs-window {
  flex: 1;
  overflow: hidden;

  :deep(.v-window__container),
  :deep(.v-window-item) {
    height: 100%;
  }
}
</style>
