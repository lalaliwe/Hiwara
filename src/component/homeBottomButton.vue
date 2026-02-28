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
</script>
<template>
  <v-layout>
    <v-bottom-navigation grow class="bottomNavigation" v-model="value" color="#00796B" :absolute="true"
      :mandatory="true">
      <v-btn value="video">
        <iconVideo theme="outline" :size="btnFontSize" :fill="value === 'video' ? '#00796B' : '#616161'" />
        <span>视频</span>
      </v-btn>
      <v-btn value="image">
        <iconPic theme="outline" :size="btnFontSize" :fill="value === 'image' ? '#00796B' : '#616161'" />
        <span>插画</span>
      </v-btn>
      <v-btn value="subscribe">
        <iconRss theme="outline" :size="btnFontSize" :fill="value === 'subscribe' ? '#00796B' : '#616161'" />
        <span>订阅</span>
      </v-btn>
      <v-btn value="forum">
        <iconComments theme="outline" :size="btnFontSize" :fill="value === 'forum' ? '#00796B' : '#616161'" />
        <span>论坛</span>
      </v-btn>
      <v-btn value="my">
        <iconUser theme="outline" :size="btnFontSize" :fill="value === 'my' ? '#00796B' : '#616161'" />
        <span>我的</span>
      </v-btn>
    </v-bottom-navigation>
  </v-layout>
</template>
<style lang="scss" scoped>
.bottomNavigation {
  height: calc(60px + env(safe-area-inset-bottom, 0)) !important;
  padding: 0 env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
}

.v-btn {
  color: #424242;
}
</style>