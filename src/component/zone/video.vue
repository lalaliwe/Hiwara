<script setup lang="ts">
import cardButton from '../../component/cardButton.vue';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getVideoList as api_getVideoList } from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { showShortToast } from '../../core/toast';

const { t } = useI18n();

defineOptions({
  name: 'VideoList'
})

const props = defineProps(['uid'])

interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: number;
  likeNum: number;
  longNum: number;
  isR18: boolean;
}

const videoList = ref<ListItem[]>([]);
let videoListPage = 0;
const videoListMore = ref(false); // 视频加载到底
const videoLoadMoreFailed = ref(false); // 视频加载失败

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const videoState = ref<ListState>('loading');

// 监听 uid 变化，重新加载数据
watch(() => props.uid, () => {
  refreshData();
}, { immediate: true });

// 刷新数据
function refreshData() {
  // 清空视频列表数据
  videoList.value = [];
  videoListPage = 0;
  videoListMore.value = false;
  videoLoadMoreFailed.value = false;
  videoState.value = 'loading';
  // 获取视频列表数据
  getVideoList().then((res) => {
    if (res.length > 0)
      videoState.value = 'success';
    else
      videoState.value = 'empty';
  }).catch(() => {
    videoState.value = 'failed';
  });
}

// 点击错误图片刷新数据
function handleVideoErrorClick() {
  refreshData();
}

// 下滑列表到底追加数据
async function videoListHandleScrollToEnd({ done }: any) {
  getVideoList().then((res) => {
    if (res.length > 0) done('ok');
    else {
      videoListMore.value = true;
      done('empty');
    }
  }).catch(() => {
    videoLoadMoreFailed.value = true;
    done('error');
  });
}

// 获取视频列表
async function getVideoList(): Promise<any> {
  try {
    const res = await api_getVideoList(videoListPage, 'date', undefined, props.uid);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    if (res.data.results && res.data.results.length > 0) {
      const newVideos = res.data.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.file ? `https://i.iwara.tv/image/thumbnail/${item.file.id}/thumbnail-${String(item.thumbnail).padStart(2, '0')}.jpg` : 'file-loss',
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.file?.duration ?? 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      videoList.value = [...videoList.value, ...newVideos];
      videoListPage++;
      // 返回数据
      return newVideos;
    } else {
      // 返回空数组
      return [];
    }
  } catch (error) {
    console.error(`获取视频列表失败:`, error);
    showShortToast(t('common.fetchVideoListFailed'));
    throw error;
  }
}
</script>

<template>
  <div class="list-content">
    <div v-if="videoState === 'failed'" class="loading" @click="handleVideoErrorClick">
      <errorHuawu>视频列表加载失败了喵~</errorHuawu>
    </div>
    <div v-else-if="videoState === 'empty'" class="loading" @click="handleVideoErrorClick">
      <errorHuawu>暂无视频内容</errorHuawu>
    </div>
    <div v-else-if="videoState === 'loading'" class="loading">
      <loadingHuawu>数据加载中</loadingHuawu>
    </div>
    <v-infinite-scroll v-else color="#00796B" @load="videoListHandleScrollToEnd" :disabled="videoListMore"
      class="list-view">
      <div class="grid">
        <template v-for="item in videoList" :key="item.id">
          <cardButton type="video" :data="{
            id: item.id,
            title: item.title,
            img: item.img,
            author: item.author,
            time: item.time,
            viewNum: item.viewNum,
            likeNum: item.likeNum,
            longNum: item.longNum,
            isR18: item.isR18
          }" />
        </template>
      </div>
      <template v-slot:error="{ props }">
        <div class="load-more-failed">
          <span>加载失败，</span>
          <span class="retry-btn" v-bind=props>点击重试</span>
        </div>
      </template>
      <template v-slot:empty>
        <div class="listEnd">
          已经到底了
        </div>
      </template>
    </v-infinite-scroll>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/mixins' as *;

.list-view {
  height: 100%;
  overflow-y: auto;
  padding-top: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;

  @include up(md) {
    grid-template-columns: repeat(4, 1fr);
  }

  @include up(xl) {
    grid-template-columns: repeat(6, 1fr);
  }

  @include up(xxl) {
    grid-template-columns: repeat(8, 1fr);
  }

  >* {
    content-visibility: auto;
    contain-intrinsic-size: 0 180px;
  }
}

.loading {
  padding: 9vh 0;
}

.listEnd {
  color: var(--color-text-muted-light);
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: var(--color-text-muted-light);
  font-size: 0.9rem;

  .retry-btn {
    color: var(--color-primary);
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>