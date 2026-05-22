<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setStatusBarTextStyle } from '../../plugins/navbarStyle';
import { createForumThread, getForumHome } from '../../core/api';
import { showShortToast } from '../../core/toast';
import ForumSyntaxGuide from '../../component/ForumSyntaxGuide.vue';

defineOptions({
  name: 'ForumPublish'
})

const { t } = useI18n();
const router = useRouter();

// ========== 表单数据 ==========
const title = ref('');
const body = ref('');
const selectedSection = ref('');
const sending = ref(false);
const showSyntaxDrawer = ref(false);
const showSectionPicker = ref(false);

// ========== 版块列表 ==========
interface ForumSection {
  id: string;
  group: string;
  locked: boolean;
  numPosts: number;
  numThreads: number;
}

interface ForumGroup {
  groupNameKey: string;
  sections: ForumSection[];
}

const sections = ref<ForumSection[]>([]);
const loadingSections = ref(true);

// 将 API 的 group 名称映射为 i18n key
const groupKeyMap: Record<string, string> = {
  'administration': 'home.forum.groups.admin',
  'global': 'home.forum.groups.moderator',
  'japanese': 'home.forum.groups.japanese',
  'chinese': 'home.forum.groups.chinese',
};

// 组的显示顺序
const groupOrder = ['administration', 'global', 'japanese', 'chinese'];

// 将 API 的 section id 映射为 i18n title key
const sectionKeyMap: Record<string, string> = {
  'announcements': 'forum.sections.announcements',
  'feedback': 'forum.sections.feedback',
  'general': 'forum.sections.general',
  'general-ja': 'forum.sections.general',
  'general-zh': 'forum.sections.general',
  'guides': 'forum.sections.guide',
  'questions': 'forum.sections.helpQuestion',
  'questions-ja': 'forum.sections.helpQuestion',
  'questions-zh': 'forum.sections.helpQuestion',
  'requests': 'forum.sections.request',
  'requests-ja': 'forum.sections.request',
  'requests-zh': 'forum.sections.request',
  'sharing': 'forum.sections.share',
  'support': 'forum.sections.help',
  'support-ja': 'forum.sections.help',
  'support-zh': 'forum.sections.help',
};

function getSectionLabel(sectionId: string): string {
  const key = sectionKeyMap[sectionId];
  return key ? t(key) : sectionId;
}

// 按组分组的版块列表
const groupedSections = computed<ForumGroup[]>(() => {
  const grouped: Record<string, ForumSection[]> = {};
  for (const section of sections.value) {
    const group = section.group || 'global';
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(section);
  }

  return groupOrder
    .filter(g => grouped[g])
    .map(g => ({
      groupNameKey: groupKeyMap[g] || g,
      sections: grouped[g],
    }));
});

// 当前选中的版块显示文本
const selectedSectionLabel = computed(() => {
  if (loadingSections.value) return t('home.video.loading');
  if (!selectedSection.value) return t('forum.publishSectionPlaceholder');
  return getSectionLabel(selectedSection.value);
});

async function fetchSections() {
  loadingSections.value = true;
  try {
    const res = await getForumHome();
    const data: ForumSection[] = res?.data || res || [];
    // 过滤掉 locked 的版块
    sections.value = data.filter((s: ForumSection) => !s.locked);
    // 默认选中第一个可用版块
    if (sections.value.length > 0 && !selectedSection.value) {
      selectedSection.value = sections.value[0].id;
    }
  } catch (error) {
    console.error('获取版块列表失败:', error);
    showShortToast('获取版块列表失败');
  } finally {
    loadingSections.value = false;
  }
}

function selectSection(sectionId: string) {
  selectedSection.value = sectionId;
  showSectionPicker.value = false;
}

// ========== 提交发帖 ==========
async function handlePublish() {
  if (!title.value.trim()) {
    showShortToast('请输入标题');
    return;
  }
  if (!body.value.trim()) {
    showShortToast('请输入内容');
    return;
  }
  if (!selectedSection.value) {
    showShortToast('请选择版块');
    return;
  }

  sending.value = true;
  try {
    const res = await createForumThread(selectedSection.value, title.value, body.value);
    if (res?.data?.id) {
      showShortToast('发帖成功');
      // 跳转到帖子详情页
      router.replace({
        path: '/forum/post',
        query: { id: res.data.id, sectionId: selectedSection.value }
      });
    } else {
      showShortToast('发帖失败，请稍后重试');
    }
  } catch (error) {
    console.error('发帖失败:', error);
    showShortToast('发帖失败');
  } finally {
    sending.value = false;
  }
}

function goBack() {
  router.back();
}

function handleSyntaxClick() {
  showSyntaxDrawer.value = true;
}

function handleDrawerClose() {
  showSyntaxDrawer.value = false;
}

// 应用页面设置
const applyPageSettings = () => {
  setStatusBarTextStyle('light');
}
applyPageSettings();

onMounted(() => {
  fetchSections();
});
</script>

<template>
  <div id="forumPublishView">
    <!-- 顶部栏 -->
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label1">{{ t('forum.publish') }}</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 语法说明抽屉遮罩 -->
    <Transition name="overlay">
      <div v-if="showSyntaxDrawer" class="drawer-overlay" @click="handleDrawerClose"></div>
    </Transition>

    <!-- 语法说明抽屉 -->
    <Transition name="drawer">
      <ForumSyntaxGuide v-if="showSyntaxDrawer" @close="handleDrawerClose" />
    </Transition>

    <!-- 版块选择器遮罩 -->
    <Transition name="overlay">
      <div v-if="showSectionPicker" class="picker-overlay" @click="showSectionPicker = false"></div>
    </Transition>

    <!-- 版块选择器抽屉 -->
    <Transition name="drawer">
      <div v-if="showSectionPicker" class="section-picker">
        <div class="picker-header">
          <span>{{ t('forum.publishSection') }}</span>
          <font-awesome-icon icon="fa-solid fa-xmark" @click="showSectionPicker = false" />
        </div>
        <div class="picker-body">
          <div v-if="loadingSections" class="picker-loading">
            {{ t('home.video.loading') }}
          </div>
          <template v-else>
            <div v-for="(group, groupIndex) in groupedSections" :key="groupIndex">
              <div class="picker-group-title">{{ t(group.groupNameKey) }}</div>
              <div
                v-for="section in group.sections"
                :key="section.id"
                class="picker-item"
                :class="{ active: selectedSection === section.id }"
                @click="selectSection(section.id)"
              >
                {{ getSectionLabel(section.id) }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- 表单内容 -->
    <div class="content">
      <!-- 版块选择 -->
      <div class="form-group">
        <label class="form-label">{{ t('forum.publishSection') }}</label>
        <div class="section-select-trigger" @click="showSectionPicker = true">
          <span :class="{ placeholder: !selectedSection }">{{ selectedSectionLabel }}</span>
          <font-awesome-icon icon="fa-solid fa-chevron-down" />
        </div>
      </div>

      <!-- 标题 -->
      <div class="form-group">
        <label class="form-label">{{ t('forum.publishTitle') }}</label>
        <v-text-field
          v-model="title"
          variant="outlined"
          density="compact"
          color="#00796B"
          hide-details
          :placeholder="t('forum.publishTitlePlaceholder')"
          maxlength="200"
          counter
        ></v-text-field>
      </div>

      <!-- 内容 -->
      <div class="form-group">
        <label class="form-label">{{ t('forum.publishBody') }}</label>
        <v-textarea
          v-model="body"
          variant="outlined"
          density="compact"
          color="#00796B"
          hide-details
          :placeholder="t('forum.publishBodyPlaceholder')"
          rows="12"
          no-resize
        ></v-textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <font-awesome-icon
          class="btn syntax-btn"
          icon="fa-solid fa-circle-question"
          @click="handleSyntaxClick"
        />
        <v-btn
          class="btn publish-btn"
          color="#00796B"
          :loading="sending"
          :disabled="sending || !title.trim() || !body.trim() || !selectedSection"
          @click="handlePublish"
        >
          {{ t('forum.publishSubmit') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#forumPublishView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  height: 100%;
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

    .label1 {
      font-size: 1.2rem;
      font-weight: 500;
    }

    .right-placeholder {
      flex: 1;
    }
  }
}

// 遮罩
.drawer-overlay,
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

.overlay-enter-active {
  transition: opacity 0.25s ease;
}
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

// 抽屉过渡
.drawer-enter-active {
  transition: transform 0.3s ease;
}
.drawer-leave-active {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}

// 版块选择器抽屉
.section-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 60vh;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 1.1rem;
    font-weight: 500;
    color: #333;

    svg {
      font-size: 1.4rem;
      color: #757575;
      cursor: pointer;
      padding: 4px;

      &:active {
        opacity: 0.7;
      }
    }
  }

  .picker-body {
    flex: 1;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .picker-loading {
    text-align: center;
    padding: 24px;
    color: #757575;
  }

  .picker-group-title {
    padding: 10px 20px 6px 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #00796B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .picker-item {
    padding: 12px 20px;
    cursor: pointer;
    user-select: none;
    font-size: 0.95rem;
    color: #333;
    transition: background-color 0.15s;

    &:active {
      background-color: #e0f2f1;
    }

    &.active {
      color: #00796B;
      font-weight: 500;
      background-color: #e0f2f1;
    }
  }
}

.content {
  flex: 1;
  margin-top: calc(env(safe-area-inset-top, 0) + 60px);
  overflow-y: auto;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
}

.form-group {
  margin-bottom: 20px;

  .form-label {
    display: block;
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  }

  .section-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background-color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.23);
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
    font-size: 0.95rem;
    color: #333;
    transition: border-color 0.2s;

    &:hover {
      border-color: #00796B;
    }

    &:active {
      border-color: #00796B;
    }

    .placeholder {
      color: #999;
    }

    svg {
      font-size: 0.85rem;
      color: #757575;
    }
  }
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;

  .btn {
    cursor: pointer;
    user-select: none;
  }

  .syntax-btn {
    font-size: 1.4rem;
    color: #757575;

    &:hover {
      color: #00796B;
    }
  }

  .publish-btn {
    min-width: 100px;
  }
}
</style>
