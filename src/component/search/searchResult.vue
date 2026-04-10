<script setup lang="ts">
import { ref, onActivated, watch } from 'vue';
import cardButton from '../cardButton.vue';

interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
}

const props = defineProps<{
  videoResult: ListItem[];
  imageResult: ListItem[];
}>();

const emit = defineEmits<{
  (e: 'update:tab', value: string): void;
}>();

const tab = ref('video');
const videoListView = ref();
const imageListView = ref();
let videoScrollTop = 0;
let imageScrollTop = 0;

// 监听tab变化并触发emit
watch(tab, (newTab: string) => {
  emit('update:tab', newTab);
});

onActivated(() => {
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
    imageListView.value.scrollTo({ top: imageScrollTop });
  }
});

function handleVideoScroll(event: any): void {
  videoScrollTop = event.target.scrollTop;
}

function handleImageScroll(event: any): void {
  imageScrollTop = event.target.scrollTop;
}
</script>

<template>
  <div class="content result">
    <div class="tabs">
      <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
        <v-tab value="video">视频</v-tab>
        <v-tab value="image">插画</v-tab>
      </v-tabs>
      <v-divider></v-divider>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item value="video">
        <div class="list-view" ref="videoListView" @scroll="handleVideoScroll">
          <v-infinite-scroll color="#00796B">
            <div class="grid">
              <template v-for="item in videoResult" :key="item.id">
                <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
          </v-infinite-scroll>
        </div>
      </v-tabs-window-item>
      <v-tabs-window-item value="image">
        <div class="list-view" ref="imageListView" @scroll="handleImageScroll">
          <v-infinite-scroll color="#00796B">
            <div class="grid">
              <template v-for="item in imageResult" :key="item.id">
                <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
          </v-infinite-scroll>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {
  position: absolute;
  top: calc(60px + env(safe-area-inset-top, 0));
  z-index: 400;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  .v-tabs--density-compact {
    --v-tabs-height: 36px;
  }
}

.tabs-window {
  z-index: 1;
  flex: 1;

  :deep(.v-window__container) {
    height: 100%;
  }

  .v-window-item {
    height: 100%;
    overflow: hidden;
  }

  .list-view {
    height: 100%;
    overflow: auto;
    // 确保列表视图占据完整高度，无额外margin
    margin: 0;
    padding: 0;

    .v-infinite-scroll {
      padding: calc(60px + 36px + 1px + 10px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}
</style>