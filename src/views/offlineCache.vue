<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onActivated, onDeactivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import { getDownloadCacheList, deleteDownloadCache, updateDownloadProgress } from '../core/database'
import { listen } from '@tauri-apps/api/event'
import { showShortToast } from '../core/toast'

const { t } = useI18n();

defineOptions({
  name: 'OfflineCache'
})

const router = useRouter();

// 自动状态栏文字颜色自适应（根据 --color-primary-90 亮度判断）
useAutoStatusBar({ cssVar: '--color-primary-90' })

const goBack = () => {
  router.back();
}

// 定义列表项接口
interface CacheItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
  ai: boolean;
  progress: number;
  status: string;
  cacheDate: string;
  filePath: string;
}

const videoCache = ref<CacheItem[]>([]);
const page = ref(0);
const pageSize = 15;
const isLoading = ref(false);
const hasFinished = ref(false);

// 从数据库加载缓存列表
const loadCacheList = async (pageNum: number) => {
  if (isLoading.value || hasFinished.value) return
  isLoading.value = true

  try {
    const res = await getDownloadCacheList(pageNum, pageSize)
    if (pageNum === 0) {
      videoCache.value = res
    } else {
      videoCache.value = [...videoCache.value, ...res]
    }
    if (res.length < pageSize) {
      hasFinished.value = true
    }
    page.value = pageNum
  } catch (error) {
    console.error('加载缓存列表失败:', error)
    showShortToast(t('offlineCache.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

// 加载更多数据
const loadMoreData = async () => {
  return loadCacheList(page.value + 1)
}

// 删除缓存
const removeCache = async (id: string) => {
  try {
    await deleteDownloadCache(id)
    videoCache.value = videoCache.value.filter(item => item.id !== id)
    showShortToast(t('offlineCache.deleteSuccess'))
  } catch (error) {
    console.error('删除缓存失败:', error)
    showShortToast(t('offlineCache.deleteFailed'))
  }
}

// 播放缓存视频
const playCacheVideo = (item: CacheItem) => {
  router.push(`/player/${item.id}`)
}

// 按日期分组数据
const groupByDate = (items: CacheItem[]) => {
  const grouped: Record<string, CacheItem[]> = {}
  const today = new Date().toISOString().split('T')[0]

  items.forEach(item => {
    const date = item.cacheDate || today
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  return grouped
}

const videoListView = ref()
let videoScrollTop = 0
let unlistenProgress: (() => void) | null = null

function handleVideoScroll(event: Event): void {
  videoScrollTop = (event.target as HTMLElement).scrollTop
}

// 监听下载进度，实时更新列表
async function setupProgressListener() {
  unlistenProgress = await listen<{ downloaded: number; total: number; percentage: number }>(
    'download-progress',
    (event) => {
      videoCache.value = videoCache.value.map(item => {
        // 正在下载的项更新进度
        if (item.status === 'downloading') {
          return { ...item, progress: event.payload.percentage }
        }
        return item
      })
      // 每10%同步一次数据库（避免频繁写入）
      if (event.payload.percentage % 10 === 0 || event.payload.percentage === 100) {
        // 找到第一个正在下载的项
        const downloading = videoCache.value.find(item => item.status === 'downloading')
        if (downloading) {
          updateDownloadProgress(
            downloading.id,
            event.payload.percentage,
            event.payload.percentage >= 100 ? 'completed' : 'downloading'
          )
        }
      }
    }
  )
}

onActivated(() => {
  // 每次激活时重新加载
  page.value = 0
  hasFinished.value = false
  setupProgressListener()
  loadCacheList(0)
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop })
  }
})

onDeactivated(() => {
  if (unlistenProgress) {
    unlistenProgress()
    unlistenProgress = null
  }
})
</script>

<template>
  <div id="offlineCacheView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          {{ t('offlineCache.title') }}
        </div>
      </div>
    </div>
    <div class="list" ref="videoListView" @scroll="handleVideoScroll">
      <template v-if="videoCache.length > 0">
        <v-infinite-scroll color="#00796B" :on-load="loadMoreData" :has-more="!hasFinished">
          <div v-for="(groupItems, date) in groupByDate(videoCache)" :key="date" class="date-group">
            <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? t('offlineCache.today') : date }}</div>
            <v-list lines="two" class="pa-0">
              <v-list-item v-for="item in groupItems" :key="item.id" class="list-item" @click="playCacheVideo(item)">
                <template v-slot:prepend>
                  <v-img :src="item.img || ''" :alt="item.title" aspect-ratio="4/3" width="106.7" height="80" cover
                    class="rounded"></v-img>
                </template>
                <div class="list-content">
                  <div class="list-title">{{ item.title }}</div>
                  <div class="list-subtitle">{{ item.author }}</div>
                  <div class="list-stats">
                    {{ item.viewNum }}{{ t('offlineCache.views') }} •
                    {{ item.likeNum }}{{ t('offlineCache.likes') }} •
                    {{ item.longNum }}
                  </div>
                  <div class="cache-progress-container">
                    <v-progress-linear
                      :model-value="item.status === 'completed' ? 100 : item.progress"
                      :color="item.status === 'failed' ? '#FF3D00' : '#00796B'"
                      height="4"
                      rounded
                    ></v-progress-linear>
                    <div class="cache-progress-text">
                      <template v-if="item.status === 'completed'">
                        <span class="status-completed">{{ t('offlineCache.cacheComplete') }}</span>
                        <span class="delete-btn" @click.stop="removeCache(item.id)">
                          <font-awesome-icon icon="fa-solid fa-trash-can" />
                        </span>
                      </template>
                      <template v-else-if="item.status === 'failed'">
                        <span class="status-failed">{{ t('offlineCache.cacheFailed') }}</span>
                      </template>
                      <template v-else>
                        {{ item.progress }}%
                      </template>
                    </div>
                  </div>
                </div>
              </v-list-item>
            </v-list>
          </div>
        </v-infinite-scroll>
      </template>
      <template v-else>
        <div class="empty-state">
          <font-awesome-icon icon="fa-solid fa-download" class="empty-icon" />
          <div class="empty-text">{{ t('offlineCache.noCache') }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#offlineCacheView {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
  height: 100%;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
    padding-top: env(safe-area-inset-top, 0);
    height: calc(env(safe-area-inset-top, 0) + 60px);
    background-color: var(--color-primary-90);
    color: var(--color-text-on-primary);
    display: flex;
    align-items: center;
    user-select: none;

    .goback {
      padding: 0 16px;
      height: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;

      svg {
        font-size: 1.5rem;
        color: white;
      }

      &:active {
        opacity: 0.7;
      }
    }

    .label {
      font-size: 1.2rem;
      font-weight: 500;
    }
  }
}

.list {
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  overflow: auto;

  .date-header {
    padding: 12px 16px 8px;
    background-color: var(--color-bg-section-alt);
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .list-item {
    border-bottom: 1px solid var(--color-border-light);
    padding: 8px 16px;
    background-color: var(--color-bg-card);
    cursor: pointer;

    .list-content {
      flex: 1;
      min-width: 0;
      margin: 0 16px;

      .list-title {
        font-weight: 500;
        font-size: 1rem;
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-subtitle {
        font-size: 0.8rem;
        color: var(--color-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 4px;
      }

      .list-stats {
        font-size: 0.75rem;
        color: var(--color-text-muted-lighter);
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cache-progress-container {
        margin-top: 8px;

        .cache-progress-text {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          text-align: right;
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .status-completed {
            color: #00796B;
          }

          .status-failed {
            color: #FF3D00;
          }

          .delete-btn {
            cursor: pointer;
            padding: 2px 6px;
            color: var(--color-text-muted-light);

            &:hover {
              color: #FF3D00;
            }
          }
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--color-text-muted-light);

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-text {
    font-size: 0.9rem;
  }
}
</style>
