import { invoke } from '@tauri-apps/api/core';

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
 * 显示 Toast 消息
 * @param options Toast 显示选项
 * @returns Promise<void>
 */
export async function showToast(options: ToastOptions): Promise<void> {
  try {
    const payload = {
      message: options.message,
      duration: options.duration || 'short',
    };
    
    await invoke('plugin:device|show_toast', { payload });
  } catch (error) {
    console.error('[Device] Failed to show toast:', error);
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