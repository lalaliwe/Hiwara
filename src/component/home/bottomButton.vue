<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Video as iconVideo,
  Pic as iconPic,
  Rss as iconRss,
  Comments as iconComments,
  User as iconUser
} from '@icon-park/vue-next';

// 定义emit事件
const emit = defineEmits<{
  (e: 'update:tab', value: string): void
}>()

const props = defineProps<{
  modelValue?: string
}>()

const value = ref(props.modelValue || "subscribe")
const btnFontSize = ref(24)

// 监听value变化并emit事件
watch(value, (newValue: string) => {
  emit('update:tab', newValue)
})

// 更改value
const changeValue = (newValue: string) => {
  value.value = newValue
}
</script>
<template>
  <div class="tabs">
    <div class="btn" :class="{ active: value === 'video' }" @click="changeValue('video')" v-ripple>
      <iconVideo theme="outline" :size="btnFontSize" :fill="value === 'video' ? '#00796B' : '#616161'" />
      <br>
      <span>视频</span>
    </div>
    <div class="btn" :class="{ active: value === 'image' }" @click="changeValue('image')" v-ripple>
      <iconPic theme="outline" :size="btnFontSize" :fill="value === 'image' ? '#00796B' : '#616161'" />
      <br>
      <span>插画</span>
    </div>
    <div class="btn" :class="{ active: value === 'subscribe' }" @click="changeValue('subscribe')" v-ripple>
      <iconRss theme="outline" :size="btnFontSize" :fill="value === 'subscribe' ? '#00796B' : '#616161'" />
      <br>
      <span>订阅</span>
    </div>
    <div class="btn" :class="{ active: value === 'forum' }" @click="changeValue('forum')" v-ripple>
      <iconComments theme="outline" :size="btnFontSize" :fill="value === 'forum' ? '#00796B' : '#616161'" />
      <br>
      <span>论坛</span>
    </div>
    <div class="btn" :class="{ active: value === 'my' }" @click="changeValue('my')" v-ripple>
      <iconUser theme="outline" :size="btnFontSize" :fill="value === 'my' ? '#00796B' : '#616161'" />
      <br>
      <span>我的</span>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.tabs {
  display: flex;
  background-color: #fafafa;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  padding-bottom: env(safe-area-inset-bottom, 0);

  .btn {
    flex: 1;
    cursor: pointer;
    user-select: none;
    text-align: center;
    font-size: 0.8rem;
    padding: 8px 0;
    transition: background-color 0.2s ease-in-out;

    &.active {
      background-color: #d6e9e7;
      color: #00796B;
    }
  }
}
</style>