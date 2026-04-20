<script setup lang="ts">
import {
  Moon as iconMoon,
  Theme as iconTheme
} from '@icon-park/vue-next';
import { useRouter } from 'vue-router'
const router = useRouter()
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
</script>
<template>
  <div>
    <div class="top">
      <div class="topBtns">
        <span class="btn">
          <iconTheme theme="outline" size="22" fill="#ffffff" />
        </span>
        <span class="btn">
          <iconMoon theme="outline" size="22" fill="#ffffff" />
        </span>
      </div>
      <div class="user" @click="routerGoTo('/zone', { myself: true })">
        <div class="avatar">
          <v-img class="img" cover src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"></v-img>
        </div>
        <div class="info">
          <div class="nickname">测试用户名</div>
          <div class="username">@abcde</div>
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
            <div class="num">100</div>
            <div class="label">关注</div>
          </div>
        </div>
        <div class="fill last">
          <div class="btn" @click="routerGoTo('/friends', { type: 'fans' })">
            <div class="num">100</div>
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
        <div class="history">
          <div class="videoListCard" v-for="i in 10">
            <div class="preview">
              <v-img class="img" cover src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"></v-img>
            </div>
            <div class="title">
              {{ `测试标题-${i}` }}
            </div>
          </div>
          <div class="all-btn" @click="routerGoTo('/history')">查看全部</div>
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
          <div class="btn">
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
          <div class="btn">
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
          <div class="btn">
            <div class="icon" style="color: #ff62cd;">
              <font-awesome-icon icon="fa-solid fa-star" />
            </div>
            <div class="text">高级会员</div>
          </div>
          <div class="btn">
            <div class="icon" style="color: #dda82b;">
              <font-awesome-icon icon="fa-solid fa-coins" />
            </div>
            <div class="text">Wura</div>
          </div>
          <div class="btn">
            <div class="icon">
              <font-awesome-icon icon="fa-solid fa-circle-question" />
            </div>
            <div class="text">常见问题</div>
          </div>
          <div class="btn">
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
      }

      .username {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
  flex: 1;
  position: relative;
  padding: calc(215px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;

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
      margin: 6px 12px 10px 12px;
      display: flex;
      flex-wrap: nowrap;

      .videoListCard {
        margin-right: 6px;

        .preview {
          .img {
            width: 100px;
            aspect-ratio: 16 / 9;
          }
        }

        .title {
          white-space: nowrap;
          font-size: 0.9rem;
          width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .all-btn {
        font-size: 0.9rem;
        color: #616161;
        width: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0; // 防止在flex容器中被压缩
        min-width: fit-content; // 确保内容能完全显示
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
    position: absolute;
    bottom: calc(60px + env(safe-area-inset-bottom, 0));
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