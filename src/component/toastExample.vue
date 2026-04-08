<template>
  <div class="toast-example">
    <h3>Toast 示例</h3>
    <div class="button-group">
      <button @click="showShort" class="btn btn-primary">显示短时 Toast</button>
      <button @click="showLong" class="btn btn-primary">显示长时 Toast</button>
      <button @click="showCustom" class="btn btn-secondary">显示自定义 Toast</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showShortToast, showLongToast, showToast } from '../plugins/toast';

const showShort = () => {
  showShortToast('这是一个短时 Toast');
};

const showLong = () => {
  showLongToast('这是一个长时 Toast，持续时间较长');
};

const showCustom = () => {
  showToast({
    message: '这是自定义 Toast',
    duration: 'long'
  });
};
</script>

<style scoped>
.toast-example {
  padding: 20px;
  text-align: center;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  font-size: 16px;
}

.btn-primary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary {
  background-color: #9E9E9E;
  color: white;
}
</style>