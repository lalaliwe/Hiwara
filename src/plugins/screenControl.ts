import { invoke, isTauri } from '@tauri-apps/api/core';

/**
 * 设置屏幕亮度（仅当前 Activity 有效，离开页面自动恢复）
 * @param brightness 0.0 ~ 1.0；传 -1.0 恢复系统默认
 */
export async function setScreenBrightness(brightness: number): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('plugin:device|set_screen_brightness', {
      payload: { brightness }
    });
  } catch (error) {
    console.error('[ScreenControl] 设置亮度失败:', error);
  }
}

/**
 * 获取当前屏幕亮度
 * @returns -1.0 表示系统默认，0.0~1.0 表示具体亮度值
 */
export async function getScreenBrightness(): Promise<number> {
  if (!isTauri()) return -1;
  try {
    const result = await invoke<{ brightness: number }>('plugin:device|get_screen_brightness');
    return result.brightness;
  } catch (error) {
    console.error('[ScreenControl] 获取亮度失败:', error);
    return -1;
  }
}

/**
 * 设置媒体音量
 * @param volume 0.0 ~ 1.0
 */
export async function setVolume(volume: number): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('plugin:device|set_volume', {
      payload: { volume }
    });
  } catch (error) {
    console.error('[ScreenControl] 设置音量失败:', error);
  }
}

/**
 * 获取当前媒体音量（归一化到 0.0~1.0）
 */
export async function getVolume(): Promise<number> {
  if (!isTauri()) return 1;
  try {
    const result = await invoke<{ volume: number }>('plugin:device|get_volume');
    return result.volume;
  } catch (error) {
    console.error('[ScreenControl] 获取音量失败:', error);
    return 1;
  }
}
