<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface ForumSection {
  title: string;
  description: string;
  posts: number;
  topics: number;
  latestTitle: string;
  latestContent: string;
  author: string;
  date: string;
}

interface ForumGroup {
  groupName: string;
  sections: ForumSection[];
}

const forumData: ForumGroup[] = [
  {
    groupName: "站长",
    sections: [
      {
        title: "公告",
        description: "重要信息",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "测试文本测试文本测试文本",
        author: "测试作者",
        date: "2025-01-01 12:00"
      },
      {
        title: "反馈",
        description: "想法、建议和顾虑",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "测试文本测试文本测试文本",
        author: "测试作者",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助",
        description: "帮助解决网站相关问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "测试文本测试文本测试文本",
        author: "测试作者",
        date: "2025-01-01 12:00"
      }
    ]
  },
  {
    groupName: "版主",
    sections: [
      {
        title: "普通",
        description: "其他一切",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "测试文本测试文本テストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "指南",
        description: "有用的信息或者 \"如何\" 指南",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助/问题",
        description: "与网站无关的问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "请求",
        description: "帮助寻找或创造",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "分享",
        description: "分享模型，動作或者其他アクセサリー",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      }
    ]
  },
  {
    groupName: "日语区",
    sections: [
      {
        title: "普通",
        description: "其他一切",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助/问题",
        description: "与网站无关的问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "请求",
        description: "帮助寻找或创造",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助",
        description: "帮助解决网站相关问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      }
    ]
  },
  {
    groupName: "中文区",
    sections: [
      {
        title: "普通",
        description: "其他一切",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助/问题",
        description: "与网站无关的问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "请求",
        description: "帮助寻找或创造",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      },
      {
        title: "帮助",
        description: "帮助解决网站相关问题",
        posts: 100,
        topics: 1000,
        latestTitle: "最新发布",
        latestContent: "テストテキストテストテキストテストテキスト",
        author: "テストユーザー",
        date: "2025-01-01 12:00"
      }
    ]
  }
];
</script>

<template>
  <div class="container">
    <div class="topBar">
      <div class="label">
        {{ t('home.navigation.forum') }}
      </div>
    </div>
    <div class="content">
      <div v-for="(group, groupIndex) in forumData" :key="groupIndex">
        <div class="hr">
          {{ group.groupName }}
        </div>
        <div v-for="(section, sectionIndex) in group.sections" :key="`${groupIndex}-${sectionIndex}`" class="btn">
          <div class="block">
            <div class="left">
              <div class="bar"></div>
            </div>
            <div class="middle">
              <div class="label1">{{ section.title }}</div>
              <div class="label2">{{ section.description }}</div>
            </div>
            <div class="right">
              <div>
                <div>{{ t('forum.posts') }}：<span class="gray">{{ section.posts }}</span></div>
                <div>{{ t('forum.topics') }}：<span class="gray">{{ section.topics }}</span></div>
              </div>
            </div>
          </div>
          <div class="new-title">
            {{ section.latestTitle }}
          </div>
          <div class="new-content">
            {{ section.latestContent }}
          </div>
          <div class="user">
            <span class="gray">{{ section.author }}</span>
            &nbsp;
            <span>{{ t('forum.repliedAt') }}</span>
            &nbsp;
            <span class="gray">{{ section.date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  flex: 1;
}

.topBar {
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 400;
  padding: env(safe-area-inset-top, 0) 16px 0 16px;
  height: calc(60px + env(safe-area-inset-top, 0));
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  .label {
    font-size: 1.2rem;
    font-weight: bold;
  }
}

.content {
  height: 100%;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0)) 0;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px) 0;
  }
}

.hr {
  padding: 6px 10px;
  font-size: 1.2rem;
  font-weight: 500;
  background-color: rgba(0, 121, 107, 0.6);
  color: #fff;
}

.btn {
  .block {
    display: flex;

    .left {
      padding: 10px;

      .bar {
        width: 4px;
        height: 100%;
        background: #00796B;
        border-radius: 4px;
      }
    }

    .middle {
      flex: 1;
      padding: 12px 0;

      .label1 {
        font-size: 1.2rem;
        font-weight: 500;
      }

      .label2 {
        font-size: 0.9rem;
        color: #616161;
      }
    }

    .right {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 12px;
      width: 120px;
    }
  }

  .new-title {
    font-size: 0.9rem;
    padding: 0 10px;
  }

  .new-content {
    font-size: 0.9rem;
    padding: 10px;
    color: #616161;
  }

  .user {
    font-size: 0.9rem;
    padding: 0 10px 10px 10px;
    border-bottom: 1px solid #e0e0e0;
    text-align: right;
  }

  .gray {
    color: #616161;
  }
}
</style>