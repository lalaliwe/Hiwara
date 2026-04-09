// 添加类型扩展以 support __TAURI_INTERNALS__
declare global {
  interface Window {
    __TAURI_INTERNALS__: Record<string, unknown>;
  }
}

import { showNativeToast } from '../plugins/toastMobile';

/**
 * Toast 显示选项
 */
export interface ToastOptions {
  /**
   * Toast 显示的消息内容
   */
  message: string;
  
  /**
   * Toast 显示时长
   * - 'short': 短时间显示 (约2秒)
   * - 'long': 长时间显示 (约3.5秒)
   * @default 'short'
   */
  duration?: 'short' | 'long';
}

/**
 * 检查是否在 Tauri 环境中运行
 */
function isTauri(): boolean {
  return window.__TAURI_INTERNALS__ !== undefined;
}

/**
 * 检查是否在桌面环境中运行
 */
async function isDesktop(): Promise<boolean> {
  // 如果不在 Tauri 环境中，则认为是桌面环境（如浏览器）
  if (!isTauri()) {
    return true;
  }
  
  // 在 Tauri 环境中，使用 deviceInfo 插件检测平台
  try {
    const { getDeviceInfo } = await import('../plugins/deviceInfo');
    const deviceInfo = await getDeviceInfo();
    // 如果是 Android 或 iOS，则不是桌面端
    const osName = deviceInfo.osName.toLowerCase();
    return !(osName.includes('android') || osName.includes('ios'));
  } catch (error) {
    console.warn('Could not determine platform from device info, assuming desktop:', error);
    return true;
  }
}

/**
 * 获取 SnackBar 的持续时间（毫秒）
 * @param duration Toast 持续时间选项
 * @returns 对应的毫秒数
 */
function getSnackbarDuration(duration: 'short' | 'long'): number {
  return duration === 'long' ? 3500 : 2000;
}

/**
 * 在桌面端显示 Toast 消息（使用 Vuetify Snackbar）
 * @param message Toast 消息内容
 * @param duration Toast 显示时长
 */
async function showDesktopToast(message: string, duration: 'short' | 'long' = 'short'): Promise<void> {
  // 由于我们需要访问 Vuetify 的 Snackbar，这里需要一个全局方法来触发它
  // 我们可以通过全局事件总线或者创建一个全局函数来实现
  // 这里我们使用一个自定义事件来触发
  const snackbarEvent = new CustomEvent('show-snackbar', {
    detail: {
      message,
      timeout: getSnackbarDuration(duration),
    },
  });
  window.dispatchEvent(snackbarEvent);
}

/**
 * 在移动端显示 Toast 消息（使用原生插件）
 * @param options Toast 显示选项
 * @returns Promise<void>
 */
async function showNativeToastWrapper(options: ToastOptions): Promise<void> {
  await showNativeToast(options);
}

/**
 * 显示 Toast 消息
 * @param options Toast 显示选项
 * @returns Promise<void>
 */
export async function showToast(options: ToastOptions): Promise<void> {
  if (await isDesktop()) {
    // 在桌面端使用 Vuetify Snackbar
    await showDesktopToast(options.message, options.duration);
  } else {
    // 在移动端使用原生插件
    await showNativeToastWrapper(options);
  }
}

/**
 * 显示短时 Toast 消息
 * @param message Toast 消息内容
 */
export async function showShortToast(message: string): Promise<void> {
  await showToast({ message, duration: 'short' });
}

/**
 * 显示长时 Toast 消息
 * @param message Toast 消息内容
 */
export async function showLongToast(message: string): Promise<void> {
  await showToast({ message, duration: 'long' });
}