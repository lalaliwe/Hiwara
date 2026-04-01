# Tauri Plugin navbar-style

一个用于自定义移动端状态栏和导航栏样式的 Tauri 插件。

## 功能特性

- ✅ 设置状态栏文字颜色（亮色/暗色）
- ✅ 设置导航栏文字颜色（亮色/暗色）
- ✅ 设置状态栏背景颜色
- ✅ 设置导航栏背景颜色
- ✅ 支持 Android 和 iOS 平台

## 使用方法

### 基本用法

```typescript
import { setBarStyle } from '../tauri-plugin-navbar-style/guest-js'

// 设置状态栏为白字黑底
await setBarStyle({
  style: 'light', // "light" = 白字, "dark" = 黑字
  target: 'status', // "status" = 状态栏, "navigation" = 导航栏, "all" = 全部
})

// 设置导航栏为黑字白底
await setBarStyle({
  style: 'dark',
  target: 'navigation',
})
```

### 设置背景颜色

```typescript
// 设置状态栏背景和文字颜色
await setBarStyle({
  style: 'light', // 白字
  target: 'status',
  statusBarColor: '#1a1a1a', // 深色背景
})

// 设置导航栏背景和文字颜色
await setBarStyle({
  style: 'dark', // 黑字
  target: 'navigation',
  navigationBarColor: '#ffffff', // 白色背景
})

// 同时设置状态栏和导航栏
await setBarStyle({
  style: 'light',
  target: 'all',
  statusBarColor: '#000000',
  navigationBarColor: '#f5f5f5',
})
```

## API 参数说明

### SetStyleOptions

```typescript
interface SetStyleOptions {
  /** "light" (白字) 或 "dark" (黑字) */
  style: string;
  
  /** "status" (顶部), "navigation" (底部) 或 "all" (默认) */
  target?: string;
  
  /** 状态栏背景颜色（可选），格式为十六进制颜色码，如 "#FF0000" */
  statusBarColor?: string;
  
  /** 导航栏背景颜色（可选），格式为十六进制颜色码，如 "#FFFFFF" */
  navigationBarColor?: string;
}
```

## 注意事项

### Android
- 状态栏背景颜色需要 Android 5.0+ (API 21)
- 状态栏文字颜色自动调整需要 Android 6.0+ (API 23)
- 导航栏文字颜色自动调整需要 Android 8.0+ (API 26)
- 当设置深色背景时，文字颜色会自动调整为浅色，反之亦然

### iOS
- 状态栏样式通过 `preferredStatusBarStyle` 控制
- 背景颜色通过在窗口中添加覆盖视图实现
- 导航栏颜色会影响 `UITabBar` 和 `UINavigationBar`

## 开发说明

本插件遵循 Tauri 插件开发规范，包含：
- Rust 核心逻辑 (`src/`)
- Android Kotlin 实现 (`android/src/main/java/`)
- iOS Swift 实现 (`ios/Sources/`)
- TypeScript 类型定义 (`guest-js/`)
- 权限配置 (`permissions/`)
