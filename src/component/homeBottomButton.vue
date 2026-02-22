<script setup lang="ts">
import { ref } from 'vue'
import {
  Video as iconVideo,
  Pic as iconPic,
  Rss as iconRss,
  Comments as iconComments,
  User as iconUser
} from '@icon-park/vue-next';
const value = ref("subscribe")
const btnFontSize = ref(24)
</script>
<template>
  <v-layout class="bottomView">
    <v-bottom-navigation grow class="bottomNavigation" v-model="value" color="#00796B" :mandatory="true">
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
  padding-bottom: env(safe-area-inset-bottom, 0);
  height: 75px !important;
}

.v-btn {
  letter-spacing: 0;
  color: #424242;
}
</style>