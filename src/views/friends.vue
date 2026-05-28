<script setup lang="ts">
import { onActivated, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import { uid as muid } from '../core/store';
import { getMyselfInfo } from '../core/api';
import following from '../component/friends/following.vue'
import fans from '../component/friends/fans.vue'
import friend from '../component/friends/friend.vue'
import loadingHuawu from '../component/loadingHuawu.vue'

const { t } = useI18n();

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

const uid = ref<string>('')
const isUidReady = ref(false)

// 异步初始化 uid：route params → store → API
async function initUid() {
  // 1. 优先从路由参数获取
  const routeUid = route.params.uid as string
  if (routeUid) {
    uid.value = routeUid
    isUidReady.value = true
    return
  }

  // 2. 从 Pinia store 获取
  const storeUid = muid().value
  if (storeUid) {
    uid.value = storeUid
    isUidReady.value = true
    return
  }

  // 3. 从 API 获取当前用户信息
  try {
    const res = await getMyselfInfo()
    if (res.ok && res.data?.user?.id) {
      uid.value = res.data.user.id
      // 同步更新 store，避免后续重复请求
      muid().set(res.data.user.id)
    } else {
      console.error('获取用户信息失败，无法解析 uid')
    }
  } catch (error) {
    console.error('无法获取用户信息:', error)
  }

  isUidReady.value = true
}

// 判定是否是用户自己的好友列表
const isMyself = ref<boolean>(false)

const tab = ref<'follow' | 'fans' | 'friend'>()
tab.value = route.query.type as 'follow' | 'fans' | 'friend'

// 等待 uid 初始化完成后计算 isMyself 并修正 tab
watch(isUidReady, (ready) => {
  if (ready) {
    isMyself.value = uid.value === muid().value
    // 如果不是自己的好友列表，默认切换到'follow'标签
    if (!isMyself.value && tab.value === 'friend') {
      tab.value = 'follow'
    }
  }
})

// 在组件挂载时初始化 uid
onMounted(() => {
  initUid()
})

// 当 uid 准备好后输出日志
watch(uid, (newUid) => {
  if (newUid) {
    console.log('uid:', newUid)
    console.log('isMyself:', isMyself.value)
  }
})

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
          {{ tab === 'follow' ? t('friends.followTab') : tab === 'fans' ? t('friends.fansTab') : t('friends.friendTab') }}
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="follow">
            {{ t('friends.followTab') }}
          </v-tab>
          <v-tab value="fans">
            {{ t('friends.fansTab') }}
          </v-tab>
          <v-tab v-if="isMyself" value="friend">
            {{ t('friends.friendTab') }}
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <!-- uid 未就绪时显示加载状态，避免子组件因空 uid 发起 API 请求 -->
    <div v-if="!isUidReady" class="loading-init">
      <loadingHuawu>{{ t('friends.loading') }}</loadingHuawu>
    </div>
    <v-tabs-window v-else v-model="tab" class="tabs-window">
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
  background-color: var(--color-bg-page);
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
    background-color: var(--color-primary-90);
    color: var(--color-text-on-primary);
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
    background-color: var(--color-white-80);
    box-shadow: var(--shadow-tab-bar);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }

    :deep(.v-tab) {
      color: var(--color-text-muted);

      &.v-tab--selected {
        color: var(--color-primary);
      }
    }

    /* Vuetify divider 颜色适配暗色模式 */
    :deep(.v-divider) {
      border-color: var(--color-border-divider) !important;
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

.loading-init {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
