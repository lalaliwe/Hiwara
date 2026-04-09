<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const tab = ref<'follow' | 'fans' | 'friend'>('follow')

// 定义标签页数据
const tabs = [
  { value: 'follow', title: '关注' },
  { value: 'fans', title: '粉丝' },
  { value: 'friend', title: '好友' }
]

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

let followList: ListItem[] = []
let fansList: ListItem[] = []
let friendList: ListItem[] = []

// 生成模拟数据
for (let i = 0; i < 20; i++) {
  followList.push({
    uid: `follow-${i}`,
    username: `用户${i}`,
    avatar: `https://picsum.photos/id/${i}/200/200`,
    signature: `个性签名${i}`,
    videoNum: Math.floor(Math.random() * 100),
    imageNum: Math.floor(Math.random() * 100),
    followNum: Math.floor(Math.random() * 100),
    fansNum: Math.floor(Math.random() * 100),
    friendNum: Math.floor(Math.random() * 100),
    following: Math.random() > 0.5,
    fansing: Math.random() > 0.5,
    friending: Math.random() > 0.5,
    myFollowing: Math.random() > 0.5,
    myFansing: Math.random() > 0.5,
    myFriending: Math.random() > 0.5
  })
  fansList.push({
    uid: `fans-${i}`,
    username: `用户${i}`,
    avatar: `https://picsum.photos/id/${i}/200/200`,
    signature: `个性签名${i}`,
    videoNum: Math.floor(Math.random() * 100),
    imageNum: Math.floor(Math.random() * 100),
    followNum: Math.floor(Math.random() * 100),
    fansNum: Math.floor(Math.random() * 100),
    friendNum: Math.floor(Math.random() * 100),
    following: Math.random() > 0.5,
    fansing: Math.random() > 0.5,
    friending: Math.random() > 0.5,
    myFollowing: Math.random() > 0.5,
    myFansing: Math.random() > 0.5,
    myFriending: Math.random() > 0.5

  })
  friendList.push({
    uid: `fans-${i}`,
    username: `用户${i}`,
    avatar: `https://picsum.photos/id/${i}/200/200`,
    signature: `个性签名${i}`,
    videoNum: Math.floor(Math.random() * 100),
    imageNum: Math.floor(Math.random() * 100),
    followNum: Math.floor(Math.random() * 100),
    fansNum: Math.floor(Math.random() * 100),
    friendNum: Math.floor(Math.random() * 100),
    following: Math.random() > 0.5,
    fansing: Math.random() > 0.5,
    friending: Math.random() > 0.5,
    myFollowing: Math.random() > 0.5,
    myFansing: Math.random() > 0.5,
    myFriending: Math.random() > 0.5
  })
}

// 根据当前选项卡获取对应的列表数据
const getCurrentList = () => {
  switch (tab.value) {
    case 'follow': return followList
    case 'fans': return fansList
    case 'friend': return friendList
    default: return []
  }
}

// 处理关注操作
const toggleFollow = (item: ListItem) => {
  if (tab.value === 'follow') {
    // 在关注列表中，点击按钮是关注/取消关注目标用户
    item.myFollowing = !item.myFollowing;
  } else if (tab.value === 'fans') {
    // 在粉丝列表中，点击按钮是回关/取消回关目标用户（即让目标用户成为我的粉丝）
    item.myFansing = !item.myFansing;
  } else if (tab.value === 'friend') {
    // 在好友列表中，点击按钮是添加/取消好友
    item.myFriending = !item.myFriending;
  }
}

// 获取关注按钮文本和颜色
const getFollowButtonProps = (item: ListItem) => {
  if (tab.value === 'follow') {
    // 在关注列表中，显示"已关注"或"关注"
    return {
      text: item.myFollowing ? '已关注' : '关注',
      color: item.myFollowing ? '#E0E0E0' : '#00796B'
    };
  } else if (tab.value === 'fans') {
    // 在粉丝列表中，显示"已关注"或"回关"
    // 如果我已经关注了目标用户，且目标用户也关注了我，则显示"已互粉"，否则显示"回关"
    if (item.myFollowing && item.myFansing) {
      return {
        text: '已互粉',
        color: '#E0E0E0'
      };
    } else {
      return {
        text: '回关',
        color: '#00796B'
      };
    }
  } else if (tab.value === 'friend') {
    // 在好友列表中，显示"已是好友"或"好友请求"
    return {
      text: item.myFriending ? '已是好友' : '好友请求',
      color: item.myFriending ? '#E0E0E0' : '#00796B'
    };
  }
  return { text: '', color: '#00796B' }
}

// 返回上一页
const goBack = () => {
  router.back();
}
</script>

<template>
  <div id="friendsView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          {{tabs.find(t => t.value === tab)?.title}}
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact">
          <v-tab v-for="item in tabs" :key="item.value" :value="item.value">
            {{ item.title }}
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item v-for="item in tabs" :key="item.value" :value="item.value">
        <v-list lines="two" class="pa-0">
          <v-list-item v-for="(listItem, index) in getCurrentList()" :key="index" class="list-item">
            <!-- 左侧：头像 -->
            <template v-slot:prepend>
              <v-avatar size="48">
                <v-img :src="listItem.avatar" :alt="listItem.username"></v-img>
              </v-avatar>
            </template>
            <!-- 中间：昵称和签名 -->
            <div class="list-content">
              <div class="list-title">
                {{ listItem.username }}
              </div>
              <div class="list-subtitle">
                {{ listItem.signature }}
              </div>
              <div class="list-stats">
                {{ listItem.videoNum }}视频 {{ listItem.fansNum }}粉丝
              </div>
            </div>
            <!-- 右侧：关注/被关注/互粉/好友按钮 -->
            <template v-slot:append>
              <v-btn v-if="tab !== 'friend'" :text="getFollowButtonProps(listItem).text"
                :color="getFollowButtonProps(listItem).color" @click="toggleFollow(listItem)" class="btn"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#friendsView {
  display: flex;
  flex-direction: column;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
    padding-top: env(safe-area-inset-top, 0);
    height: 60px;
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
      font-size: 1.1rem;
      font-weight: 500;
    }
  }

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-tabs--density-compact {
      --v-tabs-height: 36px;
    }
  }
}

.tabs-window {
  padding-top: calc(60px + 36px + 1px + env(safe-area-inset-top, 0));
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    margin: calc(60px + 36px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(env(safe-area-inset-bottom, 0) + 4px) 0;
  }

  .list-item {
    border-bottom: 1px solid #eee;
    // padding: 16px;

    .list-content {
      flex: 1;
      // margin-left: 16px;
      min-width: 0; // 允许内容压缩

      .list-title {
        font-weight: 500;
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-subtitle {
        font-size: 0.8rem;
        color: #616161; // 更深的颜色，提高可读性
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-stats {
        font-size: 0.8rem;
        color: #616161;
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .btn {
      width: 80px;
    }
  }
}
</style>