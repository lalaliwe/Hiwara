<script setup lang="ts">
import { ref, computed } from 'vue';

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
const selectedYear = ref<string | number>('全部年份');
const selectedMonth = ref<string>('全年');

// 生成年份列表（全部年份 + 2014-今年）
const yearList = computed<(string | number)[]>(() => {
  const currentYear = new Date().getFullYear();
  const years: (string | number)[] = ['全部年份'];
  for (let year = currentYear; year >= 2014; year--) {
    years.push(year);
  }
  return years;
});

// 月份列表
const monthList = ['全年', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 判断月份是否禁用
const isMonthDisabled = computed(() => {
  return selectedYear.value === '全部年份';
});

// 打开抽屉时，根据当前筛选条件恢复选择器状态
function openDrawer() {
  if (props.modelValue) {
    const parts = props.modelValue.split('-');
    selectedYear.value = parseInt(parts[0]);
    selectedMonth.value = parts.length > 1 ? `${parts[1]}月` : '全年';
  } else {
    selectedYear.value = '全部年份';
    selectedMonth.value = '全年';
  }
  drawerVisible.value = true;
}

// 生成时间参数字符串
function generateDateParam(): string | undefined {
  if (selectedYear.value === '全部年份') {
    return undefined;
  }
  
  if (selectedMonth.value === '全年') {
    return String(selectedYear.value);
  } else {
    const monthNum = selectedMonth.value.replace('月', '');
    return `${selectedYear.value}-${monthNum}`;
  }
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
  selectedYear.value = '全部年份';
  selectedMonth.value = '全年';
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
        <h3 class="drawer-title">选择时间</h3>
        <v-btn icon variant="text" size="small" @click="drawerVisible = false">
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </v-btn>
      </div>
      
      <v-divider class="mb-4"></v-divider>
      
      <div class="selector-container">
        <!-- 年份选择器 -->
        <div class="selector-item">
          <label class="selector-label">年份</label>
          <v-select
            v-model="selectedYear"
            :items="yearList"
            variant="outlined"
            density="comfortable"
            hide-details
            class="year-select"
          ></v-select>
        </div>
        
        <!-- 月份选择器 -->
        <div class="selector-item">
          <label class="selector-label">月份</label>
          <v-select
            v-model="selectedMonth"
            :items="monthList"
            :disabled="isMonthDisabled"
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
          重置
        </v-btn>
        <v-btn
          block
          color="#00796B"
          size="large"
          @click="confirmSelection"
        >
          确认
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
    color: #333;
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
      color: #666;
      font-weight: 500;
    }
    
    .year-select,
    .month-select {
      :deep(.v-field) {
        background-color: #f5f5f5;
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
      color: #000 !important;
    }
  }
}
</style>
