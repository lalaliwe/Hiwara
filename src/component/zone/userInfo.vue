<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

// 定义 props
interface Props {
  nickname: string;
  userSignature: string;
  followNum: number;
  fansNum: number;
  myself: boolean;
  isMyFollow: boolean;
  isMyFans: boolean;
}

withDefaults(defineProps<Props>(), {
  nickname: '默认用户名',
  userSignature: '默认个性签名',
  followNum: 0,
  fansNum: 0,
  myself: false,
  isMyFollow: false,
  isMyFans: false
});

// 定义 emits
interface Emits {
  (event: 'navigateTo', path: string, query?: any): void;
}

const emit = defineEmits<Emits>();

// 展开状态
const expand = ref(false);
// 需要计算高度的元素
const usernameRef = ref<HTMLElement | null>(null);
const userSignatureRef = ref<HTMLElement | null>(null);
// 高度计算辅助元素
const usernameFoldHeightRef = ref<HTMLElement | null>(null);
const usernameExpandHeightRef = ref<HTMLElement | null>(null);
const userSignatureFoldHeightRef = ref<HTMLElement | null>(null);
const userSignatureExpandHeightRef = ref<HTMLElement | null>(null);
// 高度缓存对象
const heights = ref({
  usernameFoldHeight: 0,
  usernameExpandHeight: 0,
  userSignatureFoldHeight: 0,
  userSignatureExpandHeight: 0
});
// 高度计算
function calculateHeights() {
  heights.value.usernameFoldHeight = usernameFoldHeightRef.value?.offsetHeight || 0;
  heights.value.usernameExpandHeight = usernameExpandHeightRef.value?.offsetHeight || 0;
  heights.value.userSignatureFoldHeight = userSignatureFoldHeightRef.value?.offsetHeight || 0;
  heights.value.userSignatureExpandHeight = userSignatureExpandHeightRef.value?.offsetHeight || 0;
}

// 处理展开/收起逻辑
watch(expand, async (val) => {
  if (!usernameRef.value) return;
  if (!userSignatureRef.value) return;

  if (val) {
    // === 展开逻辑 ===
    usernameRef.value.style.whiteSpace = 'normal';
    userSignatureRef.value.style.whiteSpace = 'normal';
    usernameRef.value.style.height = heights.value.usernameExpandHeight + 'px';
    userSignatureRef.value.style.height = heights.value.userSignatureExpandHeight + 'px';
  } else {
    // === 折叠逻辑 ===
    usernameRef.value.style.height = heights.value.usernameFoldHeight + 'px';
    userSignatureRef.value.style.height = heights.value.userSignatureFoldHeight + 'px';
    // 等待一帧让浏览器应用 height 变化，然后设置 whiteSpace
    await nextTick();
    setTimeout(() => {
      if (!expand.value) {
        if (usernameRef.value)
          usernameRef.value.style.whiteSpace = 'nowrap';
        if (userSignatureRef.value)
          userSignatureRef.value.style.whiteSpace = 'nowrap';
      }
    }, 300); // 与 transition 时间匹配
  }
}, { immediate: true });

onMounted(() => {
  // 高度计算
  calculateHeights();
  // 高度初始值赋值
  if (usernameRef.value)
    usernameRef.value.style.height = heights.value.usernameFoldHeight + 'px';
  if (userSignatureRef.value)
    userSignatureRef.value.style.height = heights.value.userSignatureFoldHeight + 'px';
})
// 关注
function handleFollow(follow: boolean) {
  // emit('navigateTo', '/follow');
}
</script>
<template>
  <div class="userInfo">
    <div class="avatar">
      <v-img class="img" cover src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"></v-img>
    </div>
    <div class="userInfoBtn">
      <div class="numBtns">
        <div class="fill">
          <div class="btn" @click="$emit('navigateTo', '/friends', { type: 'follow' })">
            <div class="num">{{ followNum }}</div>
            <div class="label">关注</div>
          </div>
        </div>
        <div class="fill last">
          <div class="btn" @click="$emit('navigateTo', '/friends', { type: 'fans' })">
            <div class="num">{{ fansNum }}</div>
            <div class="label">粉丝</div>
          </div>
        </div>
      </div>
      <div>
        <span v-if="myself">
          <v-btn variant="outlined" color="#00796B" style="width: 100%;">编辑资料</v-btn>
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
    <div class="username" @click="expand = !expand">
      <div class="name fold" ref="usernameRef">{{
        nickname
        }}</div>
      <div class="detail">详情</div>
    </div>
    <div class="userSignature fold" ref="userSignatureRef">
      {{
        userSignature }}</div>
    <div class="calculateHeight">
      <div class="usernameHeigth fold" ref="usernameFoldHeightRef">{{ nickname }}</div>
      <div class="usernameHeigth" ref="usernameExpandHeightRef">{{ nickname }}</div>
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
        border-right: 1px solid #BDBDBD;
        display: flex;
        align-items: center;
        justify-content: center;

        .btn {
          display: inline-block;
          padding: 0 16px;

          .num {
            font-size: 1rem;
          }

          .label {
            font-size: 0.8rem;
            color: #616161;
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

  .username {
    padding: 10px 16px 8px 16px;
    position: relative;

    .name {
      font-size: 1.2rem;
      padding-right: 28px;
      transition: height 0.3s ease-in-out;
      overflow: hidden;
    }

    .detail {
      font-size: 0.8rem;
      color: #2196F3;
      position: absolute;
      top: 12px;
      right: 16px;
      user-select: none;
      cursor: pointer;
    }
  }

  .userSignature {
    font-size: 0.8rem;
    padding: 0 16px;
    color: #616161;
    transition: height 0.3s ease-in-out;
    overflow: hidden;
  }

  .calculateHeight {
    height: 0;
    overflow: hidden;

    .usernameHeigth {
      padding: 0 16px;
      font-size: 1.2rem;
      padding-right: 28px;
    }

    .userSignatureHeigth {
      padding: 0 16px;
      font-size: 0.8rem;
    }
  }
}
</style>