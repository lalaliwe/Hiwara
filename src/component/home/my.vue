<script setup lang="ts">
import {
  Moon as iconMoon,
  Theme as iconTheme
} from '@icon-park/vue-next';
import { useRouter } from 'vue-router'
import { ref, onMounted, onActivated, inject, watch, type Ref } from 'vue';
import {
  getImageIwara,
  getMyselfInfo,
  getUserFollowers,
  getUserFans
} from '../../core/api'
import { getVideoHistoryList } from '../../core/database'
import { showShortToast } from '../../core/toast';
import HistoryItem from './HistoryItem.vue';

const router = useRouter()

const nickname = ref<string>('');
const username = ref<string>('');
const avatar = ref<string>('');
const followNum = ref<number>(0);
const fansNum = ref<number>(0);
const historyList = ref<any[]>([]);
const historyContainer = ref<HTMLElement | null>(null);

// 注入父组件提供的isTab响应式引用
const isTab = inject<Ref<string>>('isTab');

function routerGoTo(path: string, query?: any) {
  if (query) {
    router.push({
      path: path,
      query: query
    });
  } else {
    router.push(path);
  }
}
// 获取用户个人信息
// 移除立即调用,改为在生命周期钩子中调用
// getUserInfo();
// getHistoryList();

onMounted(() => {
  getUserInfo();
  getHistoryList();
});

onActivated(() => {
  // 当组件被激活(从缓存中恢复)时重新获取历史记录
  getHistoryList();
});

// 监听isTab变化,当切换到my时重新获取数据
if (isTab) {
  watch(isTab, (newVal) => {
    if (newVal === 'my') {
      console.log('切换到my选项卡,重新获取历史记录');
      getHistoryList();
    }
  });
}

async function getUserInfo() {
  try {
    const userInfoRes = await getMyselfInfo();
    if (!userInfoRes.ok)
      throw new Error(userInfoRes.message);
    nickname.value = userInfoRes.data.user.name;
    username.value = userInfoRes.data.user.username;
    avatar.value = userInfoRes.data.user.avatar;
    const uid = userInfoRes.data.user.id;
    await Promise.allSettled([
      getFollowersNum(uid),
      getFansNum(uid)
    ])
  } catch (err) {
    console.error(err);
    showShortToast('获取用户信息失败');
  }
  async function getFollowersNum(uid: string) {
    try {
      const res = await getUserFollowers(uid);
      if (!res.ok)
        throw new Error(res.message);
      followNum.value = res.data.count;
    } catch (err) {
      console.error(err);
    }
  }
  async function getFansNum(uid: string) {
    try {
      const res = await getUserFans(uid);
      if (!res.ok)
        throw new Error(res.message);
      fansNum.value = res.data.count;
    } catch (err) {
      console.error(err);
    }
  }
}

async function getHistoryList() {
  try {
    const res = await getVideoHistoryList(0, 6);
    console.log('获取历史记录:', res);
    historyList.value = res;
  } catch (err) {
    console.error(err);
    showShortToast('获取历史记录失败');
  }
}

// 处理鼠标滚轮横向滚动
function handleWheelScroll(event: WheelEvent) {
  if (historyContainer.value) {
    event.preventDefault();
    historyContainer.value.scrollLeft += event.deltaY;
  }
}
</script>
<template>
  <div class="container">
    <div class="top">
      <div class="topBtns">
        <span class="btn">
          <iconTheme theme="outline" size="22" fill="#ffffff" />
        </span>
        <span class="btn">
          <iconMoon theme="outline" size="22" fill="#ffffff" />
        </span>
      </div>
      <div class="user" @click="routerGoTo(`/zone`)">
        <div class="avatar">
          <v-img class="img" cover src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"></v-img>
        </div>
        <div class="info">
          <div class="nickname">{{ nickname }}</div>
          <div class="username">@{{ username }}</div>
        </div>
        <div class="right">
          <div class="btn">
            空间
            <font-awesome-icon icon="fa-solid fa-angle-right" />
          </div>
        </div>
      </div>
      <div class="friendsNum">
        <div class="fill">
          <div class="btn" @click="routerGoTo('/friends', { type: 'follow' })">
            <div class="num">{{ followNum }}</div>
            <div class="label">关注</div>
          </div>
        </div>
        <div class="fill last">
          <div class="btn" @click="routerGoTo('/friends', { type: 'fans' })">
            <div class="num">{{ fansNum }}</div>
            <div class="label">粉丝</div>
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="card">
        <div class="label">
          <div class="left">历史记录</div>
          <div class="right" @click="routerGoTo('/history')">查看全部</div>
        </div>
        <div class="history" ref="historyContainer" @wheel="handleWheelScroll">
          <template v-if="historyList.length > 0">
            <HistoryItem v-for="item in historyList" :key="item.id" :item="item" />
            <div class="all-btn" @click="routerGoTo('/history')">查看全部</div>
          </template>
          <template v-else>
            <div class="empty-text">暂无历史记录</div>
          </template>
        </div>
      </div>
      <div class="card">
        <div class="usserFunction">
          <div class="btn" @click="routerGoTo('/favorites', { type: 'video' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-film" />
            </div>
            <div class="text">视频收藏</div>
          </div>
          <div class="btn" @click="routerGoTo('/favorites', { type: 'image' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-images" />
            </div>
            <div class="text">插画收藏</div>
          </div>
          <div class="btn">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-forward-fast" />
            </div>
            <div class="text">播放列表</div>
          </div>
          <div class="btn" @click="routerGoTo('/offline-cache')">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-download" />
            </div>
            <div class="text">离线缓存</div>
          </div>
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/notifications', title: '通知' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-bell" />
            </div>
            <div class="text">通知</div>
          </div>
          <div class="btn" @click="routerGoTo('/friends', { type: 'friend' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-user-group" />
            </div>
            <div class="text">好友</div>
          </div>
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/messages', title: '私信' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-envelope" />
            </div>
            <div class="text">私信</div>
          </div>
          <div class="btn" @click="routerGoTo('/setup')">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-gear" />
            </div>
            <div class="text">设置</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="label">
          <div class="left">Iwara服务</div>
        </div>
        <div class="usserFunction">
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/account/premium', title: '高级会员' })">
            <div class="icon" style="color: #ff62cd;">
              <font-awesome-icon icon="fa-solid fa-star" />
            </div>
            <div class="text">高级会员</div>
          </div>
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/dashboard', title: 'Wura' })">
            <div class="icon" style="color: #dda82b;">
              <font-awesome-icon icon="fa-solid fa-coins" />
            </div>
            <div class="text">Wura</div>
          </div>
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/page/faq', title: '常见问题' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-circle-question" />
            </div>
            <div class="text">常见问题</div>
          </div>
          <div class="btn" @click="routerGoTo('/webview', { url: 'https://www.iwara.tv/page/links', title: '相关链接' })">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-share-nodes" />
            </div>
            <div class="text">相关链接</div>
          </div>
        </div>
      </div>
      <div class="about">
        <span class="logo">Hiwara</span>
        <br>
        本应用遵循MPL-2.0开源协议，请勿用于任何商业用途。
        <br>
        ©2023-2026 Hiwara Team
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  flex: 1;
  position: relative;
  padding: calc(215px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
}

.top {
  padding-top: env(safe-area-inset-top, 0);
  background-color: rgba(0, 121, 107, 0.9);
  backdrop-filter: blur(10px);
  color: #fff;
  position: absolute;
  width: 100%;
  top: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 400;

  .topBtns {
    text-align: right;
    padding-bottom: 10px;

    .btn {
      height: 40px;
      width: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  .user {
    padding: 0 14px;
    display: flex;
    height: 90px;

    .avatar {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;

      .img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: #fff 2px solid;
      }
    }

    .info {
      flex: 1;
      padding: 0 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .nickname {
        font-size: 1.1rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
        cursor: pointer;
        user-select: none;
      }

      .username {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
      }
    }

    .right {
      display: flex;
      align-items: center;

      .btn {
        display: flex;
        align-items: center;
        height: 48px;
        font-size: 0.9rem;
        cursor: pointer;
        user-select: none;
      }
    }
  }

  .friendsNum {
    display: flex;
    padding: 10px;

    .fill {
      flex: 1;
      text-align: center;
      border-right: 1px solid rgba(255, 255, 255, 0.8);
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;

      .btn {
        cursor: pointer;
        user-select: none;
        display: inline-block;
        padding: 4px 16px;

        .num {
          font-size: 1.1rem;
        }

        .label {
          font-size: 0.8rem;
        }
      }

    }

    .fill.last {
      border-right: none;
    }
  }
}

.content {
  z-index: 1;
  overflow-y: auto;
  height: 100%;
  padding-bottom: calc(60px + env(safe-area-inset-bottom));

  &::-webkit-scrollbar-track {
    margin: 4px 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px) 0;
  }

  .card {
    margin: 10px;
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    overflow: hidden;
    padding: 6px 0;

    .label {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .left {
        padding: 4px 12px;
        color: #212121;
        cursor: pointer;
        user-select: none;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .right {
        padding: 4px 12px;
        color: #757575;
        cursor: pointer;
        user-select: none;
        font-size: 0.8rem;
      }
    }

    .history {
      overflow-x: auto;
      margin: 8px 12px 10px 12px;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;

      .empty-text {
        font-size: 0.9rem;
        color: #757575;
        padding: 20px 0;
        text-align: center;
        flex: 1;
      }

      .all-btn {
        font-size: 0.9rem;
        color: #616161;
        width: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-width: fit-content;
        cursor: pointer;
        user-select: none;
      }
    }

    .usserFunction {
      display: grid;
      grid-template-columns: repeat(4, 1fr);

      gap: 10px;

      .btn {
        text-align: center;
        color: #424242;
        padding: 10px 0;
        user-select: none;
        cursor: pointer;

        .icon {
          font-size: 1.2rem;
        }

        .text {
          font-size: 0.8rem;
          line-height: 1rem;
        }
      }
    }
  }

  .about {
    width: 100%;
    color: #757575;
    font-size: 0.7rem;
    text-align: center;
    padding: 0 10px 10px 10px;

    @font-face {
      font-family: 'riwenlogo';
      /* 优先使用相对路径（Android assets目录） */
      src: url('/fonts/riwenlogo.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    .logo {
      font-family: 'riwenlogo';
      font-size: 0.8rem;
    }
  }
}
</style>