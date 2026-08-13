<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getDeviceInfo } from '../../plugins/deviceInfo'
import { showShortToast } from '../../core/toast'
import { getSendRequest } from '../../core/api'

defineOptions({
  name: 'SetupAbout'
})

const { t } = useI18n()
const router = useRouter()

// 响应式数据
const version = ref(__APP_VERSION__ || '0.1.0')
const buildTime = ref(t('setup.aboutPage.loading'))
const deviceType = ref(t('setup.aboutPage.loading'))
const osName = ref(t('setup.aboutPage.loading'))
const osVersion = ref(t('setup.aboutPage.loading'))
const webViewName = ref(t('setup.aboutPage.loading'))
const webViewVersion = ref('')

// 检查更新相关
const showUpdateDialog = ref(false)
const latestVersion = ref('')
const isCheckingUpdate = ref(false)

// 版本号比较
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number)
  const parts2 = v2.replace(/^v/, '').split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }
  return 0
}

// 打开外部链接
async function openExternalUrl(url: string) {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } catch {
    // 非 Tauri 环境使用 window.open
    window.open(url, '_blank')
  }
}

// 检查更新
async function checkForUpdate() {
  if (isCheckingUpdate.value) return
  
  isCheckingUpdate.value = true
  try {
    const response = await getSendRequest('https://api.github.com/repos/shanmaomaoymmm/hiwara/releases/latest')
    if (!response.ok) {
      showShortToast(t('setup.aboutPage.updateCheckFailed'))
      return
    }
    
    const remoteVersion = response.data?.tag_name || ''
    latestVersion.value = remoteVersion
    
    const compare = compareVersions(version.value, remoteVersion)
    
    if (compare < 0) {
      // 当前版本低于远程版本
      showUpdateDialog.value = true
    } else if (compare === 0) {
      // 版本相同
      showShortToast(t('setup.aboutPage.alreadyLatest'))
    } else {
      // 当前版本高于远程版本（开发版）
      showShortToast(t('setup.aboutPage.devVersion', { latest: remoteVersion }))
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    showShortToast(t('setup.aboutPage.updateCheckFailed'))
  } finally {
    isCheckingUpdate.value = false
  }
}

// 打开开源许可页面（GitHub 为外部链接，直接用系统浏览器打开，不进入应用内 WebView）
const openLicense = () => {
  openExternalUrl('https://github.com/shanmaomaoymmm/hiwara/blob/master/LICENSE')
}

// 确认下载更新
const confirmDownload = async () => {
  showUpdateDialog.value = false
  await openExternalUrl('https://github.com/shanmaomaoymmm/hiwara/releases/latest')
}

// 返回上一页
const goBack = () => {
  router.back();
}

// 获取操作系统图标
const getOsIcon = () => {
  const name = osName.value.toLowerCase()
  
  if (name.includes('windows')) return 'fa-brands fa-windows'
  if (name.includes('mac') || name.includes('os x')) return 'fa-brands fa-apple'
  if (name.includes('android')) return 'fa-brands fa-android'
  if (name.includes('ubuntu')) return 'fa-brands fa-ubuntu'
  if (name.includes('debian')) return 'fa-brands fa-debian'
  if (name.includes('fedora')) return 'fa-brands fa-fedora'
  if (name.includes('arch')) return 'fa-brands fa-arch-linux'
  if (name.includes('opensuse') || name.includes('suse')) return 'fa-brands fa-suse'
  if (name.includes('linux')) return 'fa-brands fa-linux'
  
  return 'fa-solid fa-laptop'
}

// 获取设备信息
const loadDeviceInfo = async () => {
  try {
    const info = await getDeviceInfo()
    
    // 判断设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    deviceType.value = isMobile ? t('setup.aboutPage.mobile') : t('setup.aboutPage.desktop')
    
    // OS 信息
    osName.value = info.osName || t('setup.aboutPage.unknown')
    osVersion.value = info.osVersion || t('setup.aboutPage.unknown')
    
    // WebView 信息 - 从 userAgent 中解析真实的 WebView 引擎和版本
    const userAgent = navigator.userAgent
    
    if (info.osName === 'Android') {
      // Android: 从 userAgent 中提取 WebView 版本
      // Tauri Android 使用 Android System WebView, userAgent 中包含 Chrome 版本
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/)
      webViewName.value = 'Android System WebView'
      webViewVersion.value = chromeMatch ? chromeMatch[1] : ''
    } else if (info.osName.toLowerCase().includes('windows')) {
      // Windows: Tauri v2 使用 WebView2 (Edge Chromium)
      const edgeMatch = userAgent.match(/Edg\/([\d.]+)/)
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/)
      
      if (edgeMatch) {
        webViewName.value = 'Microsoft Edge WebView2'
        webViewVersion.value = edgeMatch[1]
      } else if (chromeMatch) {
        webViewName.value = 'Chromium WebView'
        webViewVersion.value = chromeMatch[1]
      } else {
        webViewName.value = 'Microsoft Edge WebView2'
        webViewVersion.value = ''
      }
    } else if (info.osName.toLowerCase().includes('mac')) {
      // macOS: Tauri 使用 WKWebView (WebKit)
      const safariMatch = userAgent.match(/Version\/([\d.]+)/)
      const webkitMatch = userAgent.match(/AppleWebKit\/([\d.]+)/)
      
      if (safariMatch) {
        webViewName.value = 'WebKit (WKWebView)'
        webViewVersion.value = safariMatch[1]
      } else if (webkitMatch) {
        webViewName.value = 'WebKit (WKWebView)'
        webViewVersion.value = webkitMatch[1]
      } else {
        webViewName.value = 'WebKit (WKWebView)'
        webViewVersion.value = ''
      }
    } else if (info.osName.toLowerCase().includes('linux')) {
      // Linux: Tauri 使用 WebKitGTK
      const webkitMatch = userAgent.match(/AppleWebKit\/([\d.]+)/)
      
      if (webkitMatch) {
        webViewName.value = 'WebKitGTK'
        webViewVersion.value = webkitMatch[1]
      } else {
        webViewName.value = 'WebKitGTK'
        webViewVersion.value = ''
      }
    } else {
      webViewName.value = t('setup.aboutPage.unknown')
      webViewVersion.value = ''
    }
  } catch (error) {
    console.error('获取设备信息失败:', error)
    deviceType.value = t('setup.aboutPage.unknown')
    osName.value = t('setup.aboutPage.unknown')
    osVersion.value = t('setup.aboutPage.unknown')
    webViewName.value = t('setup.aboutPage.unknown')
    webViewVersion.value = ''
  }
}

// 组件挂载时加载信息
onMounted(() => {
  loadDeviceInfo()

  // 设置构建时间
  buildTime.value = __BUILD_TIME__ || '2023-10-01 12:00'
})
</script>

<template>
  <div id="setupAboutView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        {{ t('setup.aboutPage.title') }}
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="brand">
      <div>
        <div class="logo">
          <img class="img" src="/logo-square_2.0.svg" alt="" />
        </div>
        <div class="label">Hiwara</div>
      </div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.version') }}</div>
      <div class="value">{{ version }}</div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.versionType') }}</div>
      <div class="value">{{ t('setup.aboutPage.beta') }}</div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.buildTime') }}</div>
      <div class="value">{{ buildTime }}</div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.deviceType') }}</div>
      <div class="value">
        <font-awesome-icon :icon="deviceType === t('setup.aboutPage.desktop') ? 'fa-solid fa-desktop' : 'fa-solid fa-mobile-screen'" />
        &nbsp;
        {{ deviceType }}
      </div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.osName') }}</div>
      <div class="value">
        <font-awesome-icon :icon="getOsIcon()" />
        &nbsp;
        {{ osName }}
      </div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.osVersion') }}</div>
      <div class="value">{{ osVersion }}</div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.aboutPage.webview') }}</div>
      <div class="value">{{ webViewName }}</div>
    </div>
    <div class="item" v-if="webViewVersion">
      <div class="label">{{ t('setup.aboutPage.webviewVersion') }}</div>
      <div class="value">{{ webViewVersion }}</div>
    </div>
    <div class="item" @click="checkForUpdate">
      <div class="label">{{ t('setup.aboutPage.checkUpdate') }}</div>
      <div class="value">
        <font-awesome-icon v-if="isCheckingUpdate" icon="fa-solid fa-spinner" spin />
        <font-awesome-icon v-else icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item" @click="openLicense">
      <div class="label">{{ t('setup.aboutPage.openSourceLicense') }}</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>

    <!-- 更新确认弹窗 -->
    <v-dialog v-model="showUpdateDialog" max-width="320" scrim="transparent">
      <v-card>
        <v-card-title>
          {{ t('setup.aboutPage.updateDialog.title') }}
        </v-card-title>
        <v-card-text>
          {{ t('setup.aboutPage.updateDialog.message', { version: latestVersion }) }}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showUpdateDialog = false">
            {{ t('setup.aboutPage.updateDialog.cancel') }}
          </v-btn>
          <v-btn variant="text" color="#00796B" @click="confirmDownload">
            {{ t('setup.aboutPage.updateDialog.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
#setupAboutView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: var(--color-bg-page);

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  }
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
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

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;

  .logo {
    width: 150px;
    height: 150px;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    .img {
      width: calc(100% + 40px);
      height: calc(100% + 40px);
    }
  }

  .label {
    font-family: 'riwenlogo';
    font-size: 1.8rem;
    line-height: 3.8rem;
    color: var(--color-text-body-alt);
    text-align: center;
  }

  @font-face {
    font-family: 'riwenlogo';
    /* 优先使用相对路径（Android assets目录） */
    src: url('/fonts/riwenlogo.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
}

.item {
  border-bottom: solid 1px var(--color-border-setting);
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  width: 100%;
  overflow: hidden;
  padding: 0 14px;
  height: 52px;

  .label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-self: start;
    overflow: hidden;
  }

  .value {
    color: var(--color-text-hint);
    display: flex;
    align-items: center;
    justify-self: start;
  }
}
</style>
