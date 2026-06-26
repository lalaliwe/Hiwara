<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ai } from '../../core/store';
import { getImageIwara, followUser, unfollowUser } from '../../core/api'
import { showShortToast } from '../../core/toast'

const aiStore = ai();
const { t } = useI18n();
import defaultAvatarImg from '../../static/img/avatar-default.jpg';
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png';
import avatarErrorImg from '../../static/img/avatar-error.png';

// 定义 props
interface Props {
  username: string;
  nickname: string;
  userSignature: string;
  avatar: string;
  followNum: number;
  fansNum: number;
  isMyself: boolean;
  isMyFollow: boolean;
  isMyFans: boolean;
  uid: string;
}

const props = defineProps<Props>();

// 定义 emits
interface Emits {
  (event: 'navigateTo', path: string, query?: any): void;
  (event: 'follow', isFollowed: boolean): void;
}

const emit = defineEmits<Emits>();

const router = useRouter();

// 展开状态
const expand = ref(false);
// 需要计算高度的元素
const nicknameRef = ref<HTMLElement | null>(null);
const userSignatureRef = ref<HTMLElement | null>(null);
// 高度计算辅助元素
const nicknameFoldHeightRef = ref<HTMLElement | null>(null);
const nicknameExpandHeightRef = ref<HTMLElement | null>(null);
const usernameHeightRef = ref<HTMLElement | null>(null);
const userSignatureFoldHeightRef = ref<HTMLElement | null>(null);
const userSignatureExpandHeightRef = ref<HTMLElement | null>(null);
// 高度缓存对象
const heights = ref({
  nicknameFoldHeight: 0,
  nicknameExpandHeight: 0,
  usernameHeight: 0,
  userSignatureFoldHeight: 0,
  userSignatureExpandHeight: 0
});
// 关注操作进行中状态
const isFollowing = ref(false);

// 高度计算
function calculateHeights() {
  heights.value.nicknameFoldHeight = nicknameFoldHeightRef.value?.offsetHeight || 0;
  heights.value.nicknameExpandHeight = nicknameExpandHeightRef.value?.offsetHeight || 0;
  heights.value.usernameHeight = usernameHeightRef.value?.offsetHeight || 0;
  heights.value.userSignatureFoldHeight = userSignatureFoldHeightRef.value?.offsetHeight || 0;
  heights.value.userSignatureExpandHeight = userSignatureExpandHeightRef.value?.offsetHeight || 0;
}

// 处理展开/收起逻辑
watch(expand, async (val) => {
  if (!nicknameRef.value) return;
  if (!userSignatureRef.value) return;

  if (val) {
    // === 展开逻辑 ===
    nicknameRef.value.style.whiteSpace = 'normal';
    userSignatureRef.value.style.whiteSpace = 'normal';
    nicknameRef.value.style.height = heights.value.nicknameExpandHeight + 'px';
    userSignatureRef.value.style.height = heights.value.userSignatureExpandHeight + 'px';
  } else {
    // === 折叠逻辑 ===
    nicknameRef.value.style.height = heights.value.nicknameFoldHeight + 'px';
    userSignatureRef.value.style.height = heights.value.userSignatureFoldHeight + 'px';
    // 等待一帧让浏览器应用 height 变化，然后设置 whiteSpace
    await nextTick();
    setTimeout(() => {
      if (!expand.value) {
        if (nicknameRef.value)
          nicknameRef.value.style.whiteSpace = 'nowrap';
        if (userSignatureRef.value)
          userSignatureRef.value.style.whiteSpace = 'nowrap';
      }
    }, 300); // 与 transition 时间匹配
  }
}, { immediate: true });

// 头像 URL（响应式）
const avatarUrl = ref<string>('');

// 加载头像
async function loadAvatar() {
  if (!props.avatar || props.avatar.trim() === '') {
    // avatar 为空，使用默认头像
    avatarUrl.value = defaultAvatarImg;
  } else {
    try {
      // avatar 不为空，通过 API 获取
      avatarUrl.value = await getImageIwara(props.avatar, aiStore.value);
    } catch (error) {
      console.error('Failed to load avatar:', error);
      // 加载失败时使用错误头像
      avatarUrl.value = avatarErrorImg;
    }
  }
}

// 监听 avatar prop 变化，立即执行
watch(() => props.avatar, () => {
  loadAvatar();
}, { immediate: true });

onMounted(() => {
  // 高度计算
  calculateHeights();
  // 高度初始值赋值
  if (nicknameRef.value)
    nicknameRef.value.style.height = heights.value.nicknameFoldHeight + 'px';
  if (userSignatureRef.value)
    userSignatureRef.value.style.height = heights.value.userSignatureFoldHeight + 'px';
})

// 关注
async function handleFollow(follow: boolean) {
  // 如果正在执行关注操作，直接返回
  if (isFollowing.value) return;

  isFollowing.value = true;

  try {
    if (follow) {
      // 关注用户
      emit('follow', true);
      const res = await followUser(props.uid, aiStore.value);
      if (res.ok && res.status === 201) {
        console.log('关注成功');
        showShortToast(t('common.followed'));
      } else {
        console.log('关注失败');
        showShortToast(t('common.followFailed'));
        emit('follow', false);
      }
    } else {
      // 取消关注
      emit('follow', false);
      const res = await unfollowUser(props.uid, aiStore.value);
      if (res.ok && res.status === 204) {
        console.log('取消关注成功');
        showShortToast(t('common.unfollowed'));
      } else {
        console.log('取消关注失败');
        showShortToast(t('common.unfollowFailed'));
        emit('follow', true);
      }
    }
  } catch (error) {
    console.error('关注请求失败:', error);
    showShortToast(follow ? t('common.followFailed') : t('common.unfollowFailed'));
    emit('follow', !follow);
  } finally {
    isFollowing.value = false;
  }
}

// 跳转到粉丝/关注列表
function navigateToFriends(type: 'follow' | 'fans') {
  router.push({
    path: `/friends/${props.uid}`,
    query: { type }
  });
}
// 编辑资料
function editProfile() {
  router.push({
    path: '/webview',
    query: {
      url: 'https://www.iwara.tv/account/profile',
      title: '编辑资料'
    }
  });
}
</script>
<template>
  <div class="userInfo">
    <div class="avatar">
      <v-img class="img" cover :src="avatarUrl">
        <template v-slot:placeholder>
          <v-img height="100%" :src="avatarPlaceholderImg" cover></v-img>
        </template>
      </v-img>
    </div>
    <div class="userInfoBtn">
      <div class="numBtns">
        <div class="fill">
          <div class="btn" @click="navigateToFriends('follow')">
            <div class="num">{{ followNum }}</div>
            <div class="label">关注</div>
          </div>
        </div>
        <div class="fill last">
          <div class="btn" @click="navigateToFriends('fans')">
            <div class="num">{{ fansNum }}</div>
            <div class="label">粉丝</div>
          </div>
        </div>
      </div>
      <div>
        <span v-if="isMyself">
          <v-btn variant="outlined" color="#00796B" style="width: 100%;" @click="editProfile">
            编辑资料
          </v-btn>
        </span>
        <span v-else>
          <!-- 未关注时显示关注按钮 -->
          <v-btn v-if="!isMyFollow && !isMyFans" variant="flat" color="#00796B" style="width: 100%;"
            @click="handleFollow(true)">
            <font-awesome-icon icon="fa-solid fa-plus" />
            关注
          </v-btn>
          <!-- 已关注但未互粉时显示已关注按钮 -->
          <v-btn v-else-if="isMyFollow && !isMyFans" variant="outlined" color="#00796B" style="width: 100%;"
            @click="handleFollow(false)">
            <font-awesome-icon icon="fa-solid fa-bars" />
            已关注
          </v-btn>
          <!-- 已互粉时显示互粉按钮 -->
          <v-btn v-else-if="isMyFollow && isMyFans" variant="outlined" color="#00796B" style="width: 100%;"
            @click="handleFollow(false)">
            <font-awesome-icon icon="fa-solid fa-bars" />
            已互粉
          </v-btn>
          <!-- 是粉丝但未关注时显示回关按钮 -->
          <v-btn v-else-if="!isMyFollow && isMyFans" variant="flat" color="#00796B" style="width: 100%;"
            @click="handleFollow(true)">
            <font-awesome-icon icon="fa-solid fa-plus" />
            回关
          </v-btn>
        </span>
      </div>
    </div>
    <div class="nickname" @click="expand = !expand">
      <div class="name fold" ref="nicknameRef">{{ nickname }}</div>
      <div class="detail">详情</div>
    </div>
    <div class="username" :style="{ height: expand ? `${heights.usernameHeight}px` : '0' }">
      @{{ username }}
    </div>
    <div class="userSignature fold" ref="userSignatureRef">
      {{ userSignature }}</div>
    <div class="calculateHeight">
      <div class="nicknameHeigth fold" ref="nicknameFoldHeightRef">{{ nickname }}</div>
      <div class="nicknameHeigth" ref="nicknameExpandHeightRef">{{ nickname }}</div>
      <div class="usernameHeigth" ref="usernameHeightRef">@{{ username }}</div>
      <div class="userSignatureHeigth fold" ref="userSignatureFoldHeightRef">{{ userSignature }}</div>
      <div class="userSignatureHeigth" ref="userSignatureExpandHeightRef">{{ userSignature }}</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.userInfo {
  position: relative;
  $avatar-size: 86px;

  .avatar {
    position: absolute;
    top: -16px;
    left: 16px;

    .img {
      width: $avatar-size;
      height: $avatar-size;
      border-radius: 50%;
      border: #fff 3px solid;
    }
  }

  .userInfoBtn {
    padding: 0 16px 0 calc(16px + $avatar-size + 6px + 16px);

    .numBtns {
      display: flex;
      padding: 10px;

      .fill {
        flex: 1;
        text-align: center;
        border-right: 1px solid var(--color-border-setting);
        display: flex;
        align-items: center;
        justify-content: center;

        .btn {
          display: inline-block;
          padding: 0 16px;
          cursor: pointer;
          user-select: none;

          .num {
            font-size: 1rem;
            color: var(--color-text-primary);
          }

          .label {
            font-size: 0.8rem;
            color: var(--color-text-muted);
          }
        }
      }

      .fill.last {
        border-right: none;
      }
    }
  }

  .fold {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nickname {
    padding: 10px 16px 0px 16px;
    position: relative;

    .name {
      font-size: 1.2rem;
      padding-right: 28px;
      transition: height 0.3s ease-in-out;
      overflow: hidden;
      color: var(--color-text-primary);
    }

    .detail {
      font-size: 0.8rem;
      color: var(--color-blue);
      position: absolute;
      top: 12px;
      right: 16px;
      user-select: none;
      cursor: pointer;
    }
  }

  .username {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    padding: 0 16px;
    transition: height 0.3s ease-in-out;
    overflow: hidden;
  }

  .userSignature {
    font-size: 0.8rem;
    padding: 0 16px;
    color: var(--color-text-muted);
    transition: height 0.3s ease-in-out;
    overflow: hidden;
  }

  .calculateHeight {
    height: 0;
    overflow: hidden;

    .nicknameHeigth {
      padding: 0 16px;
      font-size: 1.2rem;
      padding-right: 28px;
    }

    .usernameHeigth {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      padding: 0 16px 6px 16px;
    }

    .userSignatureHeigth {
      padding: 0 16px;
      font-size: 0.8rem;
    }
  }
}
</style>