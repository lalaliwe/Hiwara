<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { getSearchHistoryList } from '../../core/database';

const emit = defineEmits<{
  search: [keyword: string];
}>();

// 内部维护搜索历史和推荐数据
const searchHistory = ref<string[]>([]);
const searchRecommend = ref<string[]>([]);

// 生成测试数据
// for (let i = 0; i < 100; i++) {
//   searchHistory.value.push(`搜索历史${i}`);
//   searchRecommend.value.push(`搜索推荐${i}`);
// }

// 折叠展开状态（完全内部管理）
const historyExpand = ref(false);
const recommendExpand = ref(false);

// 高度引用
const historyCollapseHeightRef = ref<HTMLElement | null>(null);
const historyExpandHeightRef = ref<HTMLElement | null>(null);
const recommendCollapseHeightRef = ref<HTMLElement | null>(null);
const recommendExpandHeightRef = ref<HTMLElement | null>(null);

// 高度缓存
const heights = ref({
  historyCollapse: 0,
  historyExpand: 0,
  recommendCollapse: 0,
  recommendExpand: 0,
});

// 计算高度
function calculateHeights() {
  heights.value.historyCollapse = historyCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.historyExpand = historyExpandHeightRef.value?.offsetHeight || 0;
  heights.value.recommendCollapse = recommendCollapseHeightRef.value?.offsetHeight || 0;
  heights.value.recommendExpand = recommendExpandHeightRef.value?.offsetHeight || 0;
}

// 历史标签容器高度
const historyContainerHeight = computed(() => {
  if (!heights.value.historyCollapse || !heights.value.historyExpand) return 'auto';
  if (historyExpand.value) {
    return `${heights.value.historyExpand}px`;
  } else {
    const linesNum = heights.value.historyExpand / heights.value.historyCollapse;
    if (linesNum < 4) {
      return `${heights.value.historyCollapse * linesNum}px`;
    } else {
      return `${heights.value.historyCollapse * 4}px`;
    }
  }
});

// 推荐标签容器高度
const recommendContainerHeight = computed(() => {
  if (!heights.value.recommendCollapse || !heights.value.recommendExpand) return 'auto';
  if (recommendExpand.value) {
    return `${heights.value.recommendExpand}px`;
  } else {
    const linesNum = heights.value.recommendExpand / heights.value.recommendCollapse;
    if (linesNum < 6) {
      return `${heights.value.recommendCollapse * linesNum}px`;
    } else {
      return `${heights.value.recommendCollapse * 6}px`;
    }
  }
});

onMounted(async () => {
  // 从数据库获取搜索历史（限制显示最近50条）
  try {
    const history = await getSearchHistoryList(50);
    searchHistory.value = history;
    console.log('搜索历史加载完成:', history.length, '条记录');
  } catch (error) {
    console.error('加载搜索历史失败:', error);
  }
  
  // 使用 nextTick 确保 DOM 已经渲染完成后再计算高度
  nextTick(() => {
    calculateHeights();
  });

  // 监听窗口大小改变事件
  window.addEventListener('resize', handleResize);
});

// 处理窗口大小改变
function handleResize() {
  nextTick(() => {
    calculateHeights();
  });
}

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 切换展开状态
function toggleHistoryExpand() {
  historyExpand.value = !historyExpand.value;
}

function toggleRecommendExpand() {
  recommendExpand.value = !recommendExpand.value;
}

// 点击标签触发搜索
function handleTagClick(keyword: string) {
  console.log('点击搜索标签:', keyword);
  emit('search', keyword);
}
</script>

<template>
  <div class="content">
    <div class="tagsContainer">
      <div class="label" @click="toggleHistoryExpand" v-if="searchHistory.length > 0">
        搜索历史
        <font-awesome-icon icon="fa-solid fa-angle-down" :class="{ expanded: historyExpand }" />
      </div>
      <div class="tags" :style="{ height: historyContainerHeight }">
        <v-chip v-for="tag in searchHistory" size="small" class="tag" @click="handleTagClick(tag)">
          {{ tag }}
        </v-chip>
      </div>
      <div class="label" @click="toggleRecommendExpand" v-if="searchRecommend.length > 0">
        搜索发现
        <font-awesome-icon icon="fa-solid fa-angle-down" :class="{ expanded: recommendExpand }" />
      </div>
      <div class="tags" :style="{ height: recommendContainerHeight }">
        <v-chip v-for="tag in searchRecommend" size="small" class="tag" @click="handleTagClick(tag)">
          {{ tag }}
        </v-chip>
      </div>

      <!-- 高度计算元素 - 放在.content内部以确保相同的宽度约束 -->
      <div class="calculateHeight">
        <div class="historyCollapseHeight" ref="historyCollapseHeightRef">
          <v-chip size="small" class="tag">{{ searchHistory[0] }}</v-chip>
        </div>
        <div class="historyExpandHeight" ref="historyExpandHeightRef">
          <v-chip v-for="tag in searchHistory" size="small" class="tag">
            {{ tag }}
          </v-chip>
        </div>
        <div class="recommendCollapseHeight" ref="recommendCollapseHeightRef">
          <v-chip size="small" class="tag">{{ searchRecommend[0] }}</v-chip>
        </div>
        <div class="recommendExpandHeight" ref="recommendExpandHeightRef">
          <v-chip v-for="tag in searchRecommend" size="small" class="tag">
            {{ tag }}
          </v-chip>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  flex: 1;
  overflow: auto !important;

  .tagsContainer {
    padding: calc(60px + 6px + env(safe-area-inset-top, 0)) 10px 12px 10px;

    .label {
      padding: 8px 0;
      font-size: 0.9rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;

      // 箭头旋转过渡动画
      :deep(svg) {
        transition: transform 0.3s ease-in-out;
        font-size: 0.8rem;
        color: #616161;
      }

      // 展开状态 - 箭头旋转 180 度向上
      &.expanded {
        :deep(svg) {
          transform: rotate(180deg);
        }
      }
    }

    .tags {
      overflow: hidden;
      transition: height 0.3s ease-in-out;
      margin: 4px 0 4px 0;

      .tag {
        margin: 2px 2px 2px 0;
        cursor: pointer;
        user-select: none;
      }
    }

    .calculateHeight {
      overflow: hidden;
      height: 0;

      .historyCollapseHeight,
      .historyExpandHeight,
      .recommendCollapseHeight,
      .recommendExpandHeight {
        overflow: hidden;
        transition: height 0.3s ease-in-out;
        margin: 4px 0 8px 0;

        .tag {
          margin: 2px 2px 2px 0;
          cursor: pointer;
          user-select: none;
        }
      }
    }
  }
}
</style>