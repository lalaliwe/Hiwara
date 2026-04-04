import { invoke } from '@tauri-apps/api/core';

/**
 * 进入沉浸模式 (隐藏状态栏和导航栏)
 * @returns Promise<void>
 */
export async function enterImmersive(): Promise<void> {
  try {
    await invoke('plugin:device|enter_immersive');
    // console.log('[Immersive] Entered immersive mode');
  } catch (error) {
    console.error('[Immersive] Failed to enter immersive mode:', error);
    throw error; // 继续抛出错误，以便调用者可以处理
  }
}

/**
 * 退出沉浸模式 (显示状态栏和导航栏)
 * @returns Promise<void>
 */
export async function exitImmersive(): Promise<void> {
  try {
    await invoke('plugin:device|exit_immersive');
    // console.log('[Immersive] Exited immersive mode');
  } catch (error) {
    console.error('[Immersive] Failed to exit immersive mode:', error);
    throw error;
  }
}

/**
 * 切换沉浸模式
 * @param immersive 是否进入沉浸模式
 * @returns Promise<void>
 */
export async function toggleImmersive(immersive: boolean): Promise<void> {
  if (immersive) {
    return enterImmersive();
  } else {
    return exitImmersive();
  }
}
