<script setup lang="ts">
import cardButton from '../../component/cardButton.vue';
import { ref, watch } from 'vue';
import { getImageList as api_getImageList } from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { showShortToast } from '../../core/toast';

defineOptions({
  name: 'ImageList'
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

const imageList = ref<ListItem[]>([]);
let imageListPage = 0;
const imageListMore = ref(false); // 插画加载到底
const imageLoadMoreFailed = ref(false); // 插画加载失败

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const imageState = ref<ListState>('loading');

// 监听 uid 变化，重新加载数据
watch(() => props.uid, () => {
  refreshData();
}, { immediate: true });

// 刷新数据
function refreshData() {
  // 清空插画列表数据
  imageList.value = [];
  imageListPage = 0;
  imageListMore.value = false;
  imageLoadMoreFailed.value = false;
  imageState.value = 'loading';
  // 获取插画列表数据
  getImageList().then((res) => {
    if (res.length > 0)
      imageState.value = 'success';
    else
      imageState.value = 'empty';
  }).catch(() => {
    imageState.value = 'failed';
  });
}

// 点击错误图片刷新数据
function handleImageErrorClick() {
  refreshData();
}

// 下滑列表到底追加数据
async function imageListHandleScrollToEnd({ done }: any) {
  getImageList().then((res) => {
    if (res.length > 0) done('ok');
    else {
      imageListMore.value = true;
      done('empty');
    }
  }).catch(() => {
    imageLoadMoreFailed.value = true;
    done('error');
  });
}

// 获取插画列表
async function getImageList(): Promise<any> {
  try {
    const res = await api_getImageList(imageListPage, 'date', undefined, props.uid);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    if (res.data.results && res.data.results.length > 0) {
      const newImages = res.data.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : 'file-loss',
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.numImages || 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      imageList.value = [...imageList.value, ...newImages];
      imageListPage++;
      // 返回数据
      return newImages;
    } else {
      // 返回空数组
      return [];
    }
  } catch (error) {
    console.error(`获取插画列表失败:`, error);
    showShortToast('获取插画列表失败');
    throw error;
  }
}
</script>

<template>
  <div class="list-content">
    <div v-if="imageState === 'failed'" class="loading" @click="handleImageErrorClick">
      <errorHuawu>插画列表加载失败了喵~</errorHuawu>
    </div>
    <div v-else-if="imageState === 'empty'" class="loading" @click="handleImageErrorClick">
      <errorHuawu>暂无插画内容</errorHuawu>
    </div>
    <div v-else-if="imageState === 'loading'" class="loading">
      <loadingHuawu>数据加载中</loadingHuawu>
    </div>
    <v-infinite-scroll v-else color="#00796B" @load="imageListHandleScrollToEnd" :disabled="imageListMore"
      class="list-view">
      <div class="grid">
        <template v-for="item in imageList" :key="item.id">
          <cardButton type="image" :data="{
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
.list-content {}

.list-view {
  overflow-y: auto;
  padding-top: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}

.loading {
  padding: 9vh 0;
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: #757575;
  font-size: 0.9rem;

  .retry-btn {
    color: #00796B;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>