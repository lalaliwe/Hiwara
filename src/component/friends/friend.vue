<script setup lang="ts">
import userListItem from './userListItem.vue'

interface ListItem {
  uid: string,
  username: string,
  avatar: string,  // 原始头像URL或空字符串，由子组件处理加载
  signature: string,
  videoNum: number,
  imageNum: number,
  followNum: number,
  fansNum: number,
  friendNum: number,
  following: boolean,
  fansing: boolean,
  friending: boolean,
  myFollowing: boolean,
  myFansing: boolean,
  myFriending: boolean,
}

const props = defineProps<{
  listItems: ListItem[]
}>()
</script>

<template>
  <div class="list">
    <user-list-item 
      v-for="(listItem, index) in listItems" 
      :key="index" 
      :item="listItem"
    />
  </div>
</template>

<style lang="scss" scoped>
.list {
  height: 100%;
  padding: calc(60px + 40px + 1px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  overflow: auto;

  &::-webkit-scrollbar-track {
    margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 env(safe-area-inset-bottom, 0) 0;
  }
}
</style>
