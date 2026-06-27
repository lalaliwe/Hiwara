<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ai } from '../../core/store';
import { getImageIwara, followUser, unfollowUser } from '../../core/api'
import iwaraSVG from '../../assets/svg/iwara.svg'
import defaultAvatarImg from '../../static/img/avatar-default.jpg'
import { showShortToast } from '../../core/toast'
import { useRouter } from 'vue-router';

const aiStore = ai();
const router = useRouter();

interface ListItem {
  uid: string,
  username: string,
  nickname: string,
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
}

const props = defineProps<{
  item: ListItem
}>()

// 显示用的头像URL（响应式）
// 与cardButton.vue的模式一致：有URL则初始化为空字符串显示placeholder，否则显示默认头像
const displayAvatar = ref(props.item.avatar && props.item.avatar !== 'no-avatar'
  ? ''  // 有头像URL → 初始为空，等待API加载，显示placeholder
  : defaultAvatarImg)  // 无头像或错误标记 → 直接显示默认头像

// 加载头像
async function loadAvatar() {
  if (!props.item.avatar || props.item.avatar === 'no-avatar') {
    // 没有头像信息，已经初始化为默认头像，无需再加载
    return
  }

  try {
    const realAvatarUrl = await getImageIwara(props.item.avatar, aiStore.value)
    displayAvatar.value = realAvatarUrl
  } catch (error) {
    console.error('Failed to load avatar:', error)
    // 加载失败时使用默认头像
    displayAvatar.value = defaultAvatarImg
  }
}

onMounted(() => {
  loadAvatar()
})

// 关注按钮的处理逻辑
async function toggleFollow() {
  const shouldFollow = !props.item.following
  props.item.following = shouldFollow

  try {
    if (shouldFollow) {
      const res = await followUser(props.item.uid)
      if (res.ok && res.status === 201) {
        console.log('关注成功')
        showShortToast('已关注')
      } else {
        console.log('关注失败')
        showShortToast('关注失败')
        props.item.following = !shouldFollow
      }
    } else {
      const res = await unfollowUser(props.item.uid)
      if (res.ok && res.status === 204) {
        console.log('取消关注成功')
        showShortToast('已取消关注')
      } else {
        console.log('取消关注失败')
        showShortToast('取消关注失败')
        props.item.following = !shouldFollow
      }
    }
  } catch (error) {
    console.error('关注请求失败:', error)
    showShortToast(shouldFollow ? '关注失败' : '取消关注失败')
    props.item.following = !shouldFollow
  }
}

function getButtonText(): string {
  // 根据不同场景显示不同的按钮文本
  if (props.item.following && props.item.fansing) {
    return '已互粉'
  } else if (props.item.following) {
    return '已关注'
  } else if (props.item.friending) {
    return '好友'
  } else {
    // 默认根据myFollowing判断
    return props.item.following ? '已关注' : '关注'
  }
}

function getButtonVariant(): 'flat' | 'outlined' | 'text' | 'plain' | 'tonal' | undefined {
  // 已关注/已互粉/好友状态使用outlined样式
  if (props.item.following || props.item.friending) {
    return 'outlined'
  }
  return 'flat'
}

function toZone() {
  router.push({
    path: `/zone/${props.item.username}`,
  });
}
</script>

<template>
  <div class="list-item">
    <div class="list-avatar" @click="toZone">
      <v-img :src="displayAvatar" cover transition="fade-transition" aspect-ratio="1">
        <template v-slot:placeholder>
          <div class="placeholder">
            <img :src="iwaraSVG" class="img" />
          </div>
        </template>
        <template v-slot:error>
          <img :src="defaultAvatarImg" class="error-img" />
        </template>
      </v-img>
    </div>
    <div class="list-content" @click="toZone">
      <div class="list-title">
        {{ item.nickname }}
      </div>
    </div>
    <div class="list-action" v-if="false">
      <v-btn :text="getButtonText()" color="#00796B" :variant="getButtonVariant()" @click="toggleFollow" class="btn"
        size="small">
      </v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  gap: 12px;

  .list-avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    user-select: none;

    .placeholder {
      width: 100%;
      height: 100%;
      background-color: var(--color-bg-placeholder);
      display: flex;
      justify-content: center;
      align-items: center;

      .img {
        width: 60%;
        height: 60%;
        object-fit: contain;
      }
    }

    .error-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .list-content {
    flex: 1;
    // min-width: 0;
    height: 48px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: start;

    .list-title {
      font-weight: 500;
      font-size: 1rem;
      color: var(--color-text-primary);
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
</style>