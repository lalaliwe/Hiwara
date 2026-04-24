<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDeviceInfo } from '../../plugins/deviceInfo'

defineOptions({
  name: 'SetupAbout'
})

const router = useRouter()

// 响应式数据
const version = ref('0.1.0')
const buildTime = ref('加载中...')
const deviceType = ref('加载中...')
const osName = ref('加载中...')
const osVersion = ref('加载中...')
const webViewName = ref('加载中...')
const webViewVersion = ref('')

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
    deviceType.value = isMobile ? '移动端' : '桌面端'
    
    // OS 信息
    osName.value = info.osName || '未知'
    osVersion.value = info.osVersion || '未知'
    
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
      webViewName.value = '未知'
      webViewVersion.value = ''
    }
  } catch (error) {
    console.error('获取设备信息失败:', error)
    deviceType.value = '未知'
    osName.value = '未知'
    osVersion.value = '未知'
    webViewName.value = '未知'
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
        关于
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
      <div class="label">版本号</div>
      <div class="value">{{ version }}</div>
    </div>
    <div class="item">
      <div class="label">版本类型</div>
      <div class="value">测试版</div>
    </div>
    <div class="item">
      <div class="label">构建时间</div>
      <div class="value">{{ buildTime }}</div>
    </div>
    <div class="item">
      <div class="label">设备类型</div>
      <div class="value">
        <font-awesome-icon :icon="deviceType === '桌面端' ? 'fa-solid fa-desktop' : 'fa-solid fa-mobile-screen'" />
        &nbsp;
        {{ deviceType }}
      </div>
    </div>
    <div class="item">
      <div class="label">OS名称</div>
      <div class="value">
        <font-awesome-icon :icon="getOsIcon()" />
        &nbsp;
        {{ osName }}
      </div>
    </div>
    <div class="item">
      <div class="label">OS版本</div>
      <div class="value">{{ osVersion }}</div>
    </div>
    <div class="item">
      <div class="label">WebView</div>
      <div class="value">{{ webViewName }}</div>
    </div>
    <div class="item" v-if="webViewVersion">
      <div class="label">WebView版本</div>
      <div class="value">{{ webViewVersion }}</div>
    </div>
    <div class="item">
      <div class="label">检查更新</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
    <div class="item">
      <div class="label">开源许可</div>
      <div class="value">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupAboutView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: #fafafa;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0) + 4px) 0 calc(env(safe-area-inset-bottom, 0) + 4px) 0;
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
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
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
    color: #414141;
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
  border-bottom: solid 1px #BDBDBD;
  color: #212121;
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
    color: #9E9E9E;
    display: flex;
    align-items: center;
    justify-self: start;
  }
}
</style>