<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import { getDownloadCacheList, deleteDownloadCache, updateDownloadProgress } from '../core/database'
import { getImageIwara } from '../core/api'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { showShortToast } from '../core/toast'
import { ai } from '../core/store'

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

// 封面图片 objectURL 缓存管理
const coverUrls = ref<Map<string, string>>(new Map())
const aiStore = ai()

// 加载封面图片（通过 getImageIwara 二进制代理）
async function loadCover(item: CacheItem) {
  if (!item.img || coverUrls.value.has(item.id)) return
  try {
    const url = await getImageIwara(item.img, item.ai)
    coverUrls.value.set(item.id, url)
    // 触发响应式更新
    coverUrls.value = new Map(coverUrls.value)
  } catch {
    // 封面加载失败时使用占位图
    coverUrls.value.set(item.id, '')
    coverUrls.value = new Map(coverUrls.value)
  }
}

// 批量加载封面
function loadCovers(items: CacheItem[]) {
  items.forEach(item => loadCover(item))
}

// 删除确认对话框
const deleteDialog = ref(false);
const deleteTargetId = ref<string | null>(null);

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
    // 触发封面加载
    loadCovers(res)
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

// 取消下载
async function cancelDownload(id: string) {
  await invoke('cancel_download')
  await updateDownloadProgress(id, 0, 'failed')
  showShortToast(t('player.cacheCancelled'))
}

// 重试下载（跳转到播放页重新发起）
function retryDownload(id: string) {
  router.push(`/player/${id}`)
}

// 删除缓存（含清理封面URL）
const removeCache = async () => {
  if (!deleteTargetId.value) return
  try {
    // 清理封面 objectURL
    const url = coverUrls.value.get(deleteTargetId.value)
    if (url) URL.revokeObjectURL(url)
    coverUrls.value.delete(deleteTargetId.value)
    coverUrls.value = new Map(coverUrls.value)

    await deleteDownloadCache(deleteTargetId.value)
    videoCache.value = videoCache.value.filter(item => item.id !== deleteTargetId.value)
    showShortToast(t('offlineCache.deleteSuccess'))
  } catch (error) {
    console.error('删除缓存失败:', error)
    showShortToast(t('offlineCache.deleteFailed'))
  } finally {
    deleteDialog.value = false
    deleteTargetId.value = null
  }
}

// 清理所有封面 objectURL（组件卸载时）
onUnmounted(() => {
  coverUrls.value.forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
  coverUrls.value.clear()
})

// 加载更多数据（适配 v-infinite-scroll @load 事件签名）
const loadMoreData = async ({ done }: { done: (type: 'ok' | 'empty' | 'error') => void }) => {
  try {
    await loadCacheList(page.value + 1)
    done('ok')
  } catch {
    done('error')
  }
}

// 弹出删除确认
const confirmRemove = (id: string) => {
  deleteTargetId.value = id
  deleteDialog.value = true
}

// 取消删除
const cancelDelete = () => {
  deleteDialog.value = false
  deleteTargetId.value = null
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

// 加载数据的统一函数
function loadData() {
  page.value = 0
  hasFinished.value = false
  setupProgressListener()
  loadCacheList(0)
}

onMounted(() => {
  // 首次挂载时加载数据（兜底：keep-alive 可能未及时缓存）
  loadData()
})

onActivated(() => {
  // 每次从 keep-alive 缓存激活时重新加载
  loadData()
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
        <v-infinite-scroll color="#00796B" @load="loadMoreData" :has-more="!hasFinished">
          <div v-for="(groupItems, date) in groupByDate(videoCache)" :key="date" class="date-group">
            <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? t('offlineCache.today') : date }}</div>
            <v-list lines="two" class="pa-0">
              <v-list-item v-for="item in groupItems" :key="item.id" class="list-item" @click="playCacheVideo(item)">
                <template v-slot:prepend>
                  <v-img :src="coverUrls.get(item.id) || item.img || ''" :alt="item.title" aspect-ratio="4/3" width="106.7" height="80" cover
                    class="rounded">
                    <template v-slot:placeholder>
                      <div class="cover-placeholder">
                        <font-awesome-icon icon="fa-solid fa-image" />
                      </div>
                    </template>
                  </v-img>
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
                        <span class="delete-btn" @click.stop="confirmRemove(item.id)">
                          <font-awesome-icon icon="fa-solid fa-trash-can" />
                        </span>
                      </template>
                      <template v-else-if="item.status === 'failed'">
                        <span class="status-failed">{{ t('offlineCache.cacheFailed') }}</span>
                        <span class="action-btn retry-btn" @click.stop="retryDownload(item.id)">
                          <font-awesome-icon icon="fa-solid fa-rotate" />
                        </span>
                        <span class="delete-btn" @click.stop="confirmRemove(item.id)">
                          <font-awesome-icon icon="fa-solid fa-trash-can" />
                        </span>
                      </template>
                      <template v-else>
                        <span>{{ item.progress }}%</span>
                        <span class="action-btn cancel-btn" @click.stop="cancelDownload(item.id)">
                          <font-awesome-icon icon="fa-solid fa-stop" />
                        </span>
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

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="320">
      <v-card>
        <v-card-title class="text-center">{{ t('offlineCache.deleteTitle') }}</v-card-title>
        <v-card-text class="text-center">{{ t('offlineCache.deleteConfirm') }}</v-card-text>
        <v-card-actions class="justify-center">
          <v-btn variant="text" color="grey" @click="cancelDelete">{{ t('offlineCache.cancel') }}</v-btn>
          <v-btn variant="flat" color="#FF3D00" @click="removeCache">{{ t('offlineCache.confirmDelete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/mixins' as *;

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

          .action-btn {
            cursor: pointer;
            padding: 2px 6px;
            font-size: 0.8rem;
          }

          .retry-btn {
            color: #00796B;

            &:hover {
              opacity: 0.7;
            }
          }

          .cancel-btn {
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

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-section-alt);
  color: var(--color-text-muted-light);
  font-size: 1.2rem;
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
