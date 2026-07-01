<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed, onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import { getDownloadCacheList, deleteDownloadCache, updateDownloadProgress, upsertDownloadCache } from '../core/database'
import { getImageIwara, buildAria2Filename } from '../core/api'
import iwaraSVG from '../assets/svg/iwara.svg'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { sep } from '@tauri-apps/api/path'
import { showShortToast } from '../core/toast'
import { ai } from '../core/store'
import loadingHuawu from '../component/loadingHuawu.vue'
import errorHuawu from '../component/errorHuawu.vue'

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
  url?: string;
}

const videoCache = ref<CacheItem[]>([]);
const page = ref(0);
const pageSize = 15;
const videoIsLoading = ref(false);
const videoHasFinished = ref(false);

// 加载更多失败标记
const videoLoadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const videoState = ref<ListState>('loading');

// 暂停状态映射（从 Rust 后端查询）
const pauseStates = ref<Map<string, boolean>>(new Map())
// 队列位置映射（0=不在队列，>0=在第N位等待）
const queuePositions = ref<Map<string, number>>(new Map())

// 从 Rust 后端同步所有下载的真实状态
async function syncDownloadStates() {
  try {
    // 1. 获取当前所有活跃下载
    const activeDownloads = await invoke<Array<{ download_id: string; paused: boolean; cancelled: boolean }>>('get_active_downloads')
    const activeIds = new Set(activeDownloads.map(d => d.download_id))

    // 2. 更新暂停状态
    const newPauseStates = new Map<string, boolean>()
    for (const d of activeDownloads) {
      newPauseStates.set(d.download_id, d.paused)
    }

    // 3. 检查每个 'downloading' 项的真实状态
    const newQueuePositions = new Map<string, number>()
    const updates: Promise<void>[] = []

    for (const item of videoCache.value) {
      // 'paused' 状态由前端管理，恢复其暂停标记后跳过
      if (item.status === 'paused') {
        newPauseStates.set(item.id, true)
        continue
      }
      if (item.status === 'downloading') {
        if (activeIds.has(item.id)) {
          // 活跃下载中，保留 downloading
          continue
        }
        // 不在活跃列表，检查是否在等待队列中
        try {
          const pos = await invoke<number>('get_queue_position', { downloadId: item.id })
          if (pos > 0) {
            newQueuePositions.set(item.id, pos)
          } else {
            // 既不在活跃也不在队列 — 可能是应用重启导致内存队列丢失
            // 清理不完整文件后重新下载（如果有 url）
            if (item.url) {
              const restoreId = item.id
              const restoreUrl = item.url
              const restorePath = item.filePath || restoreId
              // 1. 先清理可能存在的不完整文件
              invoke('remove_file', { filePath: restorePath }).catch(() => {})
              // 2. 再加入下载队列
              const setup = (await import('../core/store')).setupStore()
              const maxConcurrent = setup.maxConcurrentDownloads || 2
              invoke('download_video', {
                url: restoreUrl,
                filePath: restorePath,
                downloadId: restoreId,
                maxConcurrent,
              }).then((result: string) => {
                if (result === 'queued') {
                  // 已加入等待队列，查询位置
                  invoke<number>('get_queue_position', { downloadId: restoreId }).then(pos => {
                    if (pos > 0) {
                      queuePositions.value.set(restoreId, pos)
                      queuePositions.value = new Map(queuePositions.value)
                    }
                  })
                }
                // 重置进度到 0
                videoCache.value = videoCache.value.map(i =>
                  i.id === restoreId ? { ...i, progress: 0 } : i
                )
                updateDownloadProgress(restoreId, 0, 'downloading')
                console.log(`下载 ${restoreId} 已恢复: ${result}`)
              }).catch((e: any) => {
                console.error(`恢复下载 ${restoreId} 失败:`, e)
                videoCache.value = videoCache.value.map(i =>
                  i.id === restoreId ? { ...i, status: 'failed', progress: 0 } : i
                )
                updates.push(updateDownloadProgress(restoreId, 0, 'failed'))
              })
            } else {
              // 没有 url，无法恢复 → 标记为 failed
              console.warn(`下载 ${item.id} 无下载链接且不在队列中，标记为失败`)
              videoCache.value = videoCache.value.map(i =>
                i.id === item.id ? { ...i, status: 'failed', progress: 0 } : i
              )
              updates.push(updateDownloadProgress(item.id, 0, 'failed'))
            }
          }
        } catch {
          // 查询失败，保守处理
        }
      }
    }

    pauseStates.value = newPauseStates
    queuePositions.value = newQueuePositions
    await Promise.allSettled(updates)
  } catch (error) {
    console.error('同步下载状态失败:', error)
  }
}
// 封面图片 objectURL 缓存管理
const coverUrls = ref<Map<string, string>>(new Map())
const aiStore = ai()

// 格式化速度
function formatSpeed(speed: number): string {
  if (speed === 0) return ''
  if (speed > 1024 * 1024) return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
  if (speed > 1024) return `${(speed / 1024).toFixed(0)} KB/s`
  return `${speed} B/s`
}

// 切换暂停/恢复（按下载ID）
async function togglePause(downloadId: string) {
  try {
    const inQueue = await invoke<boolean>('is_in_queue', { downloadId })
    const isActivePaused = await invoke<boolean>('is_paused', { downloadId })
    // 从 DB 获取当前项的信息（用于恢复）
    const cacheItem = videoCache.value.find(i => i.id === downloadId)

    if (inQueue || cacheItem?.status === 'paused') {
      // 在等待队列中或已暂停 → 恢复下载
      const setup = (await import('../core/store')).setupStore()
      const maxConcurrent = setup.maxConcurrentDownloads || 2
      let result: string
      if (inQueue) {
        result = await invoke<string>('resume_download', {
          url: cacheItem?.url || '',
          filePath: cacheItem?.filePath || downloadId,
          downloadId,
          maxConcurrent,
        })
      } else {
        // status === 'paused'（不在队列中，由前端管理）
        result = await invoke<string>('download_video', {
          url: cacheItem?.url || '',
          filePath: cacheItem?.filePath || downloadId,
          downloadId,
          maxConcurrent,
        })
      }
      pauseStates.value.set(downloadId, false)
      if (result === 'queued') {
        // 加入等待队列，标记为等待状态
        queuePositions.value.set(downloadId, 1)
        showShortToast(t('player.cacheQueued'))
      } else {
        queuePositions.value.delete(downloadId)
      }
      // 更新前端状态为 downloading
      videoCache.value = videoCache.value.map(item =>
        item.id === downloadId ? { ...item, status: 'downloading', progress: 0 } : item
      )
    } else if (isActivePaused) {
      // 已暂停但下载循环尚未让出 → 直接取消暂停信号
      await invoke('unpause_download', { downloadId })
      pauseStates.value.set(downloadId, false)
    } else {
      // 活跃下载中 → 暂停下载
      await invoke('pause_download', { downloadId })
      // 乐观更新：立即显示暂停状态
      pauseStates.value.set(downloadId, true)
    }
    pauseStates.value = new Map(pauseStates.value)
    queuePositions.value = new Map(queuePositions.value)
  } catch (e) {
    console.error('切换暂停状态失败:', e)
  }
}

// 加载封面图片（通过 getImageIwara 二进制代理）
async function loadCover(item: CacheItem) {
  if (!item.img || coverUrls.value.has(item.id)) return
  try {
    const url = await getImageIwara(item.img, item.ai)
    coverUrls.value.set(item.id, url)
    coverUrls.value = new Map(coverUrls.value)
  } catch {
    coverUrls.value.set(item.id, '')
    coverUrls.value = new Map(coverUrls.value)
  }
}

// 批量加载封面
function loadCovers(items: CacheItem[]) {
  items.forEach(item => loadCover(item))
}

// 对话框状态
const deleteDialog = ref(false);
const deleteTargetId = ref<string | null>(null);
const stopDialog = ref(false);
const stopTargetId = ref<string | null>(null);

// 加载更多数据
const loadMoreData = async ({ done }: any = { done: () => {} }) => {
  if (videoIsLoading.value || videoHasFinished.value) return

  videoIsLoading.value = true

  try {
    const res = await getDownloadCacheList(page.value, pageSize)
    if (res.length > 0) {
      if (page.value === 0 && videoState.value === 'loading') {
        videoState.value = 'success'
      }
      videoCache.value = [...videoCache.value, ...res]
      loadCovers(res)
      page.value++
      done('ok')
    } else {
      videoHasFinished.value = true
      if (page.value === 0 && videoState.value === 'loading') {
        videoState.value = 'empty'
      }
      done('empty')
    }
  } catch (error) {
    console.error('加载缓存列表失败:', error)
    showShortToast(t('offlineCache.loadFailed'))
    if (page.value === 0 && videoState.value === 'loading') {
      videoState.value = 'failed'
    } else {
      videoLoadMoreFailed.value = true
    }
    done('error')
  } finally {
    videoIsLoading.value = false
  }
}

// 暂停下载
async function pauseDownload() {
  await invoke('pause_download')
}

// 恢复下载
async function resumeDownload() {
  await invoke('resume_download')
}

// 弹出停止确认（按下载ID）
const confirmStop = (id: string) => {
  stopTargetId.value = id
  stopDialog.value = true
}

// 取消停止
const cancelStop = () => {
  stopDialog.value = false
  stopTargetId.value = null
}

// 执行停止下载（按下载ID）
async function confirmStopDownload() {
  if (!stopTargetId.value) return
  try {
    await invoke('cancel_download', { downloadId: stopTargetId.value })
  } catch (e) {
    console.error('取消下载命令失败:', e)
  }
  try {
    await updateDownloadProgress(stopTargetId.value, 0, 'cancelled')
  } catch (e) {
    console.error('更新数据库状态失败:', e)
  }
  // 同步更新内存状态（无论 DB 是否成功）
  videoCache.value = videoCache.value.map(item =>
    item.id === stopTargetId.value ? { ...item, status: 'cancelled', progress: 0 } : item
  )
  showShortToast(t('player.cacheCancelled'))
  stopDialog.value = false
  stopTargetId.value = null
}

// 重试下载（直接重新下载）
async function retryDownload(id: string) {
  const item = videoCache.value.find(i => i.id === id)
  if (!item || !item.url) return
  // 立即更新内存状态
  videoCache.value = videoCache.value.map(i =>
    i.id === id ? { ...i, status: 'downloading', progress: 0 } : i
  )
  try {
    await upsertDownloadCache(item.id, item.title, item.author, item.img, 0, 0, 0, false, item.ai, item.url)
    const setup = (await import('../core/store')).setupStore()
    const result = await invoke<string>('download_video', {
      url: item.url,
      filePath: item.filePath || item.id,
      downloadId: id,
      maxConcurrent: setup.maxConcurrentDownloads,
    })
    if (result === 'queued') {
      // 加入等待队列，由 progress 事件监听器更新状态
      showShortToast(t('player.cacheQueued'))
    } else {
      // 'downloading' — execute_download 已完成，直接标记完成
      videoCache.value = videoCache.value.map(i =>
        i.id === id ? { ...i, status: 'completed', progress: 100 } : i
      )
      await updateDownloadProgress(item.id, 100, 'completed', item.filePath)
    }
  } catch (e) {
    console.error('重试下载失败:', e)
    // 失败时同步更新内存和数据库
    videoCache.value = videoCache.value.map(i =>
      i.id === id ? { ...i, status: 'failed', progress: 0 } : i
    )
    await updateDownloadProgress(item.id, 0, 'failed')
    showShortToast(t('player.cacheFailed'))
  }
}

// 点击列表项
function handleItemClick(item: CacheItem) {
  if (item.status === 'completed') {
    // 已完成 → 系统默认播放器打开
    if (item.filePath) {
      // 统一路径分隔符为平台原生格式
      const normalizedPath = item.filePath.replace(/[/\\]/g, sep)
      console.log('打开文件:', normalizedPath)
      openPath(normalizedPath).catch((err) => {
        console.error('打开文件失败:', normalizedPath, err)
        showShortToast(t('offlineCache.openFailed'))
      })
    } else {
      console.warn('文件路径为空，无法打开')
    }
  } else if (item.status === 'failed' || item.status === 'cancelled') {
    // 失败/已停止 → 重新下载
    retryDownload(item.id)
  }
  // 下载中 → 无反应
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

// 执行删除（含清理封面URL）
const removeCache = async () => {
  if (!deleteTargetId.value) return
  try {
    const url = coverUrls.value.get(deleteTargetId.value)
    if (url) URL.revokeObjectURL(url)
    coverUrls.value.delete(deleteTargetId.value)
    coverUrls.value = new Map(coverUrls.value)

    await deleteDownloadCache(deleteTargetId.value)
    videoCache.value = videoCache.value.filter(item => item.id !== deleteTargetId.value)
    // 删除后列表为空 → 切换到空状态
    if (videoCache.value.length === 0) {
      videoState.value = 'empty'
      videoHasFinished.value = true
    }
    showShortToast(t('offlineCache.deleteSuccess'))
  } catch (error) {
    console.error('删除缓存失败:', error)
    showShortToast(t('offlineCache.deleteFailed'))
  } finally {
    deleteDialog.value = false
    deleteTargetId.value = null
  }
}

// 播放缓存视频
const playCacheVideo = (item: CacheItem) => {
  router.push(`/player/${item.id}`)
}

// 按日期分组数据
const groupedVideoCache = computed(() => {
  const grouped: Record<string, CacheItem[]> = {}
  const today = new Date().toISOString().split('T')[0]

  videoCache.value.forEach(item => {
    const date = item.cacheDate || today
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  return grouped
})

const videoListView = ref()
let videoScrollTop = 0
let unlistenProgress: (() => void) | null = null

function handleVideoScroll(event: Event): void {
  videoScrollTop = (event.target as HTMLElement).scrollTop
}

// 监听下载进度和完成/失败/排队事件
async function setupProgressListener() {
  // 下载进度
  const unlisten1 = await listen<{ download_id: string; downloaded: number; total: number; percentage: number; file_path?: string }>(
    'download-progress',
    (event) => {
      const { download_id, percentage, file_path } = event.payload
      const isComplete = percentage >= 100
      // 收到进度 → 不在暂停状态
      pauseStates.value.set(download_id, false)
      pauseStates.value = new Map(pauseStates.value)
      // 收到进度 → 不在等待队列中
      queuePositions.value.delete(download_id)
      queuePositions.value = new Map(queuePositions.value)
      // 按 download_id 精确匹配
      videoCache.value = videoCache.value.map(item => {
        if (item.id === download_id) {
          return {
            ...item,
            progress: percentage,
            status: item.status === 'downloading' ? (isComplete ? 'completed' : 'downloading') : item.status,
            filePath: isComplete && file_path ? file_path : item.filePath
          }
        }
        return item
      })
      // 每次收到进度都同步到数据库，确保页面重入时进度准确
      // 完成时必定保存一次（含 file_path）
      if (isComplete) {
        const target = videoCache.value.find(item => item.id === download_id)
        if (target) {
          updateDownloadProgress(target.id, percentage, 'completed', target.filePath)
        }
      } else {
        // 非完成：节流保存（每 2% 写一次 DB，避免过于频繁）
        videoCache.value.forEach(item => {
          if (item.id === download_id && item.progress % 2 < 1) {
            // 使用 setTimeout 避免阻塞事件处理
            setTimeout(() => updateDownloadProgress(download_id, item.progress, 'downloading', item.filePath), 0)
          }
        })
      }
    }
  )

  // 下载失败事件（Rust 端在 download_video 出错时发射）
  const unlisten2 = await listen<{ download_id: string; error: string; status: string }>(
    'download-failed',
    (event) => {
      const { download_id, status: newStatus } = event.payload
      const resolvedStatus = newStatus || 'failed'
      videoCache.value = videoCache.value.map(item => {
        if (item.id === download_id) {
          // cancelled 是主动停止，无条件接受（可能覆盖 'downloading' 竞态）
          if (resolvedStatus === 'cancelled') {
            return { ...item, status: 'cancelled', progress: 0 }
          }
          // failed 只覆盖仍在 'downloading' 的项
          if (item.status === 'downloading') {
            return { ...item, status: 'failed', progress: 0 }
          }
        }
        return item
      })
      queuePositions.value.delete(download_id)
      queuePositions.value = new Map(queuePositions.value)
    }
  )

  // 下载排队事件（首次加入等待队列时）
  const unlisten3 = await listen<{ download_id: string }>(
    'download-queued',
    (event) => {
      const { download_id } = event.payload
      queuePositions.value.set(download_id, 1)
      queuePositions.value = new Map(queuePositions.value)
    }
  )

  // 下载暂停事件（暂停让出槽位）
  const unlisten4 = await listen<{ download_id: string }>(
    'download-paused',
    (event) => {
      const { download_id } = event.payload
      // 检查是否已被用户取消暂停（竞态保护）
      if (!pauseStates.value.get(download_id)) return
      pauseStates.value.set(download_id, true)
      pauseStates.value = new Map(pauseStates.value)
      // 保存暂停状态到数据库
      const item = videoCache.value.find(i => i.id === download_id)
      if (item) {
        updateDownloadProgress(download_id, item.progress, 'paused', item.filePath)
        videoCache.value = videoCache.value.map(i =>
          i.id === download_id ? { ...i, status: 'paused' } : i
        )
      }
    }
  )

  // 合并清理函数
  unlistenProgress = () => {
    unlisten1()
    unlisten2()
    unlisten3()
    unlisten4()
  }
}

// 刷新数据
const refreshData = async () => {
  videoCache.value = []
  page.value = 0
  videoHasFinished.value = false
  videoLoadMoreFailed.value = false
  videoState.value = 'loading'
  await loadMoreData()
  await syncDownloadStates()
}

// 点击错误状态刷新
const handleErrorClick = () => {
  refreshData()
}

// 清理所有封面 objectURL（组件卸载时）
onUnmounted(() => {
  coverUrls.value.forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
  coverUrls.value.clear()
})

// 从数据库重新加载数据（先确保监听器就绪，再加载数据）
async function reloadFromDB() {
  videoCache.value = []
  page.value = 0
  videoHasFinished.value = false
  videoState.value = 'loading'
  // 先等待监听器就绪，避免进度事件丢失
  await setupProgressListener()
  await loadMoreData()
  // 从 Rust 后端同步真实下载状态（活跃列表 + 队列位置）
  await syncDownloadStates()
}

onMounted(() => {
  reloadFromDB()
})

onActivated(() => {
  // 重新加载数据 + 监听（onDeactivated 会清理监听器）
  reloadFromDB()
  if (videoListView.value && videoListView.value.$el) {
    videoListView.value.$el.scrollTop = videoScrollTop
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

    <!-- 加载状态 -->
    <div v-if="videoState === 'loading'" class="loading">
      <loadingHuawu>{{ t('offlineCache.loading') }}</loadingHuawu>
    </div>

    <!-- 加载失败状态 -->
    <div v-else-if="videoState === 'failed'" class="loading" @click="handleErrorClick">
      <errorHuawu>{{ t('offlineCache.loadFailed') }}</errorHuawu>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="videoState === 'empty'" class="loading" @click="handleErrorClick">
      <errorHuawu>{{ t('offlineCache.noCache') }}</errorHuawu>
    </div>

    <!-- 成功加载状态 -->
    <v-infinite-scroll v-else ref="videoListView" color="#00796B" @load="loadMoreData" :disabled="videoHasFinished"
      @scroll="handleVideoScroll" class="list-view">
      <div v-for="(groupItems, date) in groupedVideoCache" :key="date" class="date-group">
        <div class="date-header">{{ date === new Date().toISOString().split('T')[0] ? t('offlineCache.today') : date }}</div>
        <v-list lines="two" class="pa-0">
          <v-list-item v-for="item in groupItems" :key="item.id" class="list-item" @click="handleItemClick(item)">
            <template v-slot:prepend>
              <v-img :src="coverUrls.get(item.id) || item.img || ''" :alt="item.title" aspect-ratio="4/3" width="106.7" height="80" cover
                class="rounded">
                <template v-slot:placeholder>
                  <div class="cover-placeholder">
                    <img :src="iwaraSVG" class="placeholder-img" />
                  </div>
                </template>
              </v-img>
            </template>
            <div class="list-content">
              <div class="list-title">{{ item.title }}</div>
              <div class="list-subtitle">{{ item.author }}</div>
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
                    <div class="downloading-info">
                      <span class="status-failed">{{ t('offlineCache.cacheFailed') }}</span>
                    </div>
                    <div class="downloading-actions">
                      <span class="action-btn retry-btn" @click.stop="retryDownload(item.id)">
                        <font-awesome-icon icon="fa-solid fa-rotate" />
                      </span>
                      <span class="delete-btn" @click.stop="confirmRemove(item.id)">
                        <font-awesome-icon icon="fa-solid fa-trash-can" />
                      </span>
                    </div>
                  </template>
                  <template v-else-if="item.status === 'cancelled'">
                    <div class="downloading-info">
                      <span class="status-cancelled">{{ t('offlineCache.cacheCancelled') }}</span>
                    </div>
                    <div class="downloading-actions">
                      <span class="action-btn retry-btn" @click.stop="retryDownload(item.id)">
                        <font-awesome-icon icon="fa-solid fa-rotate" />
                      </span>
                      <span class="delete-btn" @click.stop="confirmRemove(item.id)">
                        <font-awesome-icon icon="fa-solid fa-trash-can" />
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="downloading-info">
                      <span class="progress-text">{{ item.progress }}%</span>
                      <span v-if="pauseStates.get(item.id)" class="paused-text">{{ t('offlineCache.cachePaused') }}</span>
                      <span v-else-if="queuePositions.get(item.id)" class="queued-text">{{ t('offlineCache.cacheQueued') }}</span>
                    </div>
                    <div class="downloading-actions">
                      <span class="action-btn pause-btn" @click.stop="togglePause(item.id)">
                        <font-awesome-icon :icon="(pauseStates.get(item.id) || queuePositions.get(item.id) || item.status === 'paused') ? 'fa-solid fa-play' : 'fa-solid fa-pause'" />
                      </span>
                      <span class="action-btn cancel-btn" @click.stop="confirmStop(item.id)">
                        <font-awesome-icon icon="fa-solid fa-stop" />
                      </span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </v-list-item>
        </v-list>
      </div>
    </v-infinite-scroll>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="320" scrim="transparent">
      <v-card>
        <v-card-title>
          {{ t('offlineCache.deleteTitle') }}
        </v-card-title>
        <v-card-text>
          {{ t('offlineCache.deleteConfirm') }}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelDelete">
            {{ t('offlineCache.cancel') }}
          </v-btn>
          <v-btn variant="text" color="#00796B" @click="removeCache">
            {{ t('offlineCache.confirmDelete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 停止下载确认对话框 -->
    <v-dialog v-model="stopDialog" max-width="320" scrim="transparent">
      <v-card>
        <v-card-title>
          {{ t('offlineCache.stopTitle') }}
        </v-card-title>
        <v-card-text>
          {{ t('offlineCache.stopConfirm') }}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelStop">
            {{ t('offlineCache.cancel') }}
          </v-btn>
          <v-btn variant="text" color="#00796B" @click="confirmStopDownload">
            {{ t('offlineCache.confirmStop') }}
          </v-btn>
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

.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.list-view {
  $top: calc(env(safe-area-inset-top, 0) + 60px);
  $bottom: calc(env(safe-area-inset-bottom, 0));
  height: 100vh;
  padding-top: $top;
  padding-bottom: $bottom;
  overflow: auto;

  // 隐藏 Vuetify 内建的 "No more" 提示
  :deep(.v-infinite-scroll__side) {
    display: none;
  }

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

          .status-completed { color: var(--color-primary); }
          .status-failed { color: var(--color-like-active); }

          .delete-btn {
            cursor: pointer;
            padding: 2px 6px;
            color: var(--color-text-muted-light);
            &:hover { color: var(--color-primary); }
          }

          .action-btn {
            cursor: pointer;
            padding: 2px 6px;
            font-size: 0.8rem;
          }

          .retry-btn {
            color: var(--color-retry-btn);
            &:hover { opacity: 0.7; }
          }

          .pause-btn {
            color: var(--color-text-muted-light);
            &:hover { color: var(--color-primary); }
          }

          .cancel-btn {
            color: var(--color-text-muted-light);
            &:hover { color: var(--color-primary); }
          }

          .downloading-info {
            display: flex;
            align-items: center;
            gap: 8px;
            .progress-text { font-weight: 500; }
            .paused-text { color: var(--color-text-muted); font-size: 0.7rem; margin-left: 4px; }
            .queued-text { color: var(--color-primary); font-size: 0.7rem; margin-left: 4px; }
          }

          .downloading-actions {
            display: flex;
            align-items: center;
            gap: 2px;
          }
        }
      }
    }
  }

}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-bg-placeholder);
  display: flex;
  justify-content: center;
  align-items: center;

  .placeholder-img {
    width: 40px;
  }
}
</style>
