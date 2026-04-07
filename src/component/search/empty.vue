<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

// 接收 props（只用于数据，不用于状态）
const props = defineProps({
  searchHistory: {
    type: Array as () => string[],
    required: true
  },
  searchRecommend: {
    type: Array as () => string[],
    required: true
  }
});

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

onMounted(() => {
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
</script>

<template>
  <div class="content">
    <div class="empty">
      <div class="label" @click="toggleHistoryExpand">
        搜索历史
        <font-awesome-icon icon="fa-solid fa-angle-down" :class="{ expanded: historyExpand }" />
      </div>
      <div class="tags" :style="{ height: historyContainerHeight }">
        <v-chip v-for="tag in searchHistory" size="small" class="tag">
          {{ tag }}
        </v-chip>
      </div>
      <div class="label" @click="toggleRecommendExpand">
        搜索发现
        <font-awesome-icon icon="fa-solid fa-angle-down" :class="{ expanded: recommendExpand }" />
      </div>
      <div class="tags" :style="{ height: recommendContainerHeight }">
        <v-chip v-for="tag in searchRecommend" size="small" class="tag">
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

  .empty {
    padding: 6px 10px 12px 10px;

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