<template>
  <div class="toast-example">
    <h2>Toast 示例</h2>
    <div class="buttons">
      <v-btn @click="showShort">短时 Toast</v-btn>
      <v-btn @click="showLong">长时 Toast</v-btn>
      <v-btn @click="showCustom">自定义 Toast</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showShortToast, showLongToast, showToast } from '../core/toast';

const showShort = () => {
  showShortToast('这是一个短时 Toast');
};

const showLong = () => {
  showLongToast('这是一个长时 Toast，持续时间较长');
};

const showCustom = () => {
  showToast({
    message: '这是自定义 Toast，持续时间较长',
    duration: 'long',
  });
};
</script>

<style scoped>
.toast-example {
  padding: 20px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.v-btn {
  margin: 5px;
}
</style>