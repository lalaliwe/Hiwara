<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
interface Props {
  modelValue?: string | undefined; // 当前筛选的时间参数
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void;
  (e: 'confirm', value: string | undefined): void;
}>();

// 抽屉显示状态
const drawerVisible = ref(false);

// 选择器状态
const selectedYear = ref<string | number>('all'); // 'all' 表示全部年份
const selectedMonth = ref<number>(0); // 0 表示全年，1-12表示具体月份

// 生成年份列表（全部年份 + 2014-今年）
const yearList = computed<{ title: string; value: string | number }[]>(() => {
  const currentYear = new Date().getFullYear();
  const years: { title: string; value: string | number }[] = [
    { title: t('home.dateFilter.allYears'), value: 'all' }
  ];
  for (let year = currentYear; year >= 2014; year--) {
    years.push({ title: String(year), value: year });
  }
  return years;
});

// 月份列表
const monthList = computed<{ title: string; value: number }[]>(() => {
  const months: { title: string; value: number }[] = [
    { title: t('home.dateFilter.fullYear'), value: 0 }
  ];
  
  // 从i18n获取月份名称数组
  for (let i = 1; i <= 12; i++) {
    months.push({ 
      title: t(`home.dateFilter.months.${i}`), 
      value: i 
    });
  }
  return months;
});

// 判断月份是否禁用
const isMonthDisabled = computed(() => {
  return selectedYear.value === 'all';
});

// 打开抽屉时，根据当前筛选条件恢复选择器状态
function openDrawer() {
  if (props.modelValue) {
    const parts = props.modelValue.split('-');
    selectedYear.value = parseInt(parts[0]);
    selectedMonth.value = parts.length > 1 ? parseInt(parts[1]) : 0;
  } else {
    selectedYear.value = 'all';
    selectedMonth.value = 0;
  }
  drawerVisible.value = true;
}

// 生成时间参数字符串
function generateDateParam(): string | undefined {
  // 1. 全部年份：不发送date
  if (selectedYear.value === 'all') {
    return undefined;
  }
  
  // 2. 指定某年全部月份：发送示例2024
  if (selectedMonth.value === 0) {
    return String(selectedYear.value);
  }
  
  // 3. 指定年月：发送示例2024-1
  return `${selectedYear.value}-${selectedMonth.value}`;
}

// 确认选择
function confirmSelection() {
  const dateParam = generateDateParam();
  console.log('时间选择器 - 确认选择:', dateParam);
  
  // 如果时间没有变化，不触发事件
  if (dateParam === props.modelValue) {
    console.log('时间未变化，不触发事件');
    drawerVisible.value = false;
    return;
  }
  
  // 更新 v-model
  emit('update:modelValue', dateParam);
  // 触发确认事件
  emit('confirm', dateParam);
  // 关闭抽屉
  drawerVisible.value = false;
}

// 重置选择
function resetSelection() {
  console.log('时间选择器 - 重置');
  selectedYear.value = 'all';
  selectedMonth.value = 0;
}

// 暴露方法给父组件
defineExpose({
  openDrawer
});
</script>

<template>
  <!-- 底部抽屉 - 年月选择器 -->
  <v-bottom-sheet v-model="drawerVisible" inset>
    <v-sheet class="pa-4">
      <div class="drawer-header">
        <h3 class="drawer-title">{{ t('home.dateFilter.selectTime') }}</h3>
        <v-btn icon variant="text" size="small" @click="drawerVisible = false">
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </v-btn>
      </div>
      
      <v-divider class="mb-4"></v-divider>
      
      <div class="selector-container">
        <!-- 年份选择器 -->
        <div class="selector-item">
          <label class="selector-label">{{ t('home.dateFilter.year') }}</label>
          <v-select
            v-model="selectedYear"
            :items="yearList"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            class="year-select"
          ></v-select>
        </div>
        
        <!-- 月份选择器 -->
        <div class="selector-item">
          <label class="selector-label">{{ t('home.dateFilter.monthLabel') }}</label>
          <v-select
            v-model="selectedMonth"
            :items="monthList"
            :disabled="isMonthDisabled"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            class="month-select"
          ></v-select>
        </div>
      </div>
      
      <div class="button-group">
        <v-btn
          block
          color="grey"
          variant="tonal"
          class="mb-2 reset-btn"
          size="large"
          @click="resetSelection"
        >
          {{ t('home.dateFilter.reset') }}
        </v-btn>
        <v-btn
          block
          color="#00796B"
          size="large"
          @click="confirmSelection"
        >
          {{ t('home.dateFilter.confirm') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-bottom-sheet>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  .drawer-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
}

.selector-container {
  display: flex;
  gap: 16px;
  
  .selector-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .selector-label {
      font-size: 0.9rem;
      color: var(--color-text-placeholder);
      font-weight: 500;
    }
    
    .year-select,
    .month-select {
      :deep(.v-field) {
        background-color: var(--color-bg-section);
      }

      :deep(.v-label) {
        color: var(--color-text-placeholder) !important;
      }

      :deep(.v-select__selection) {
        color: var(--color-text-primary) !important;
      }

      :deep(.v-field__input) {
        color: var(--color-text-primary) !important;
      }
    }
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  
  .reset-btn {
    :deep(.v-btn__content) {
      color: var(--color-text-muted) !important;
    }
  }
}
</style>
