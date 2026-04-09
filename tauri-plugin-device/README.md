# Tauri Plugin device

一个 Tauri v2 插件，提供设备相关的功能，包括设备信息获取、沉浸式模式、导航栏样式控制、屏幕方向锁定和 Toast 提示等。

## 功能特性

- 📱 **设备信息**: 获取操作系统、设备型号、制造商等信息
- 🌐 **网络信息**: 检测网络连接状态和类型
- 🔋 **电池信息**: 获取电池电量和充电状态
- 🎨 **沉浸式模式**: 控制 Android 沉浸式显示
- 🎯 **导航栏样式**: 设置状态栏和导航栏样式（亮色/暗色）
- 🔄 **屏幕方向**: 锁定或解锁屏幕方向（横屏/竖屏）
- 💬 **Toast 提示**: 显示原生 Toast 消息
- ⬇️ **最小化应用**: 将应用最小化到后台（Android）

## 安装

在 `src-tauri/Cargo.toml` 中添加依赖：

```toml
[dependencies]
tauri-plugin-device = { path = "../tauri-plugin-device" }
```

## 使用方法

### Rust 端初始化

在 `src-tauri/src/lib.rs` 中：

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_device::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### TypeScript/JavaScript 调用

```typescript
import { 
  getDeviceInfo, 
  getNetworkInfo, 
  getBatteryInfo,
  enterImmersive,
  exitImmersive,
  setBarStyle,
  lockOrientation,
  unlockOrientation,
  showToast,
  moveTaskToBack
} from 'tauri-plugin-device'

// 获取设备信息
const deviceInfo = await getDeviceInfo()
console.log(deviceInfo) // { osName: "Android", osVersion: "13", ... }

// 获取网络信息
const networkInfo = await getNetworkInfo()
console.log(networkInfo) // { isConnected: true, networkType: "wifi" }

// 获取电池信息
const batteryInfo = await getBatteryInfo()
console.log(batteryInfo) // { level: 85, isCharging: false }

// 进入沉浸式模式
await enterImmersive()

// 退出沉浸式模式
await exitImmersive()

// 设置导航栏样式
await setBarStyle({
  style: 'dark',
  target: 'all',
  statusBarColor: '#FFFFFF',
  navigationBarColor: '#000000'
})

// 锁定屏幕方向为竖屏
await lockOrientation('portrait')

// 解锁屏幕方向
await unlockOrientation()

// 显示 Toast 提示
await showToast({
  message: '操作成功',
  duration: 'short' // 或 'long'
})

// 将应用最小化到后台（仅 Android）
const result = await moveTaskToBack()
console.log(result) // { success: true }
```

## API 参考

### 设备信息

#### `getDeviceInfo(): Promise<DeviceInfo>`
获取设备基本信息。

**返回:**
```typescript
interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceModel: string;
  deviceManufacturer: string;
}
```

#### `getNetworkInfo(): Promise<NetworkInfo>`
获取网络连接信息。

**返回:**
```typescript
interface NetworkInfo {
  isConnected: boolean;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown';
}
```

#### `getBatteryInfo(): Promise<BatteryInfo>`
获取电池信息。

**返回:**
```typescript
interface BatteryInfo {
  level: number;      // 0-100
  isCharging: boolean;
}
```

### 沉浸式模式

#### `enterImmersive(): Promise<void>`
进入沉浸式模式（隐藏系统 UI）。

#### `exitImmersive(): Promise<void>`
退出沉浸式模式。

### 导航栏样式

#### `setBarStyle(options: SetStyleOptions): Promise<void>`
设置状态栏和导航栏样式。

**参数:**
```typescript
interface SetStyleOptions {
  style: 'light' | 'dark';
  target?: 'status' | 'navigation' | 'all';  // 默认 'all'
  statusBarColor?: string;                    // 十六进制颜色，如 '#FFFFFF'
  navigationBarColor?: string;                // 十六进制颜色，如 '#000000'
}
```

### 屏幕方向

#### `lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void>`
锁定屏幕方向。

**参数:**
- `orientation`: `'portrait'` (竖屏) 或 `'landscape'` (横屏)

#### `unlockOrientation(): Promise<void>`
解锁屏幕方向，允许自动旋转。

### Toast 提示

#### `showToast(options: ShowToastOptions): Promise<void>`
显示原生 Toast 消息。

**参数:**
```typescript
interface ShowToastOptions {
  message: string;
  duration?: 'short' | 'long';  // 默认 'short'
}
```

### 最小化应用

#### `moveTaskToBack(): Promise<MoveTaskToBackResponse>`
将应用最小化到后台（仅 Android 平台有效）。

**返回:**
```typescript
interface MoveTaskToBackResponse {
  success: boolean;
}
```

**注意:**
- 仅在 Android 平台有效
- 桌面端和 iOS 端为空实现
- 应用进入后台后可以通过最近任务列表恢复

## 权限配置

在 `src-tauri/capabilities/default.json` 中确保包含所需权限：

```json
{
  "permissions": [
    "device:allow-get-device-info",
    "device:allow-get-network-info",
    "device:allow-get-battery-info",
    "device:allow-enter-immersive",
    "device:allow-exit-immersive",
    "device:allow-set-bar-style",
    "device:allow-lock-orientation",
    "device:allow-unlock-orientation",
    "device:allow-show-toast",
    "device:allow-move-task-to-back"
  ]
}
```

## 平台支持

| 功能 | Android | iOS | Windows | macOS | Linux |
|------|---------|-----|---------|-------|-------|
| 设备信息 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 网络信息 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 电池信息 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 沉浸式模式 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 导航栏样式 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 屏幕方向锁定 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Toast 提示 | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| 最小化应用 | ✅ | ❌ | ❌ | ❌ | ❌ |

✅ 完全支持  
⚠️ 有限支持  
❌ 不支持

## 许可证

MIT
