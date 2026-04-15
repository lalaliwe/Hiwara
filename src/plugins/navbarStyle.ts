import { invoke,isTauri } from '@tauri-apps/api/core';

export type BarStyle = 'light' | 'dark'; // light=白字，dark=黑字

/**
 * 设置顶部状态栏文字明暗主题
 * @param style - 'light' 白色文字（深色背景），'dark' 黑色文字（浅色背景）
 */
export async function setStatusBarTextStyle(style: BarStyle): Promise<void> {
  if (!isTauri()) {
    console.warn('[NavBarStyle] This function is only available in Tauri.', 'setStatusBarTextStyle');
    return;
  }
  try {
    await invoke('plugin:device|set_status_bar_text_style', {
      payload: { style }
    });
  } catch (error) {
    console.error('设置状态栏文字样式失败:', error);
    throw error;
  }
}

/**
 * 设置底部导航栏按钮明暗主题
 * @param style - 'light' 白色按钮（深色背景），'dark' 黑色按钮（浅色背景）
 */
export async function setNavigationBarButtonStyle(style: BarStyle): Promise<void> {
  if (!isTauri()) {
    console.warn('[NavBarStyle] This function is only available in Tauri.', 'setNavigationBarButtonStyle');
    return;
  }
  try {
    await invoke('plugin:device|set_navigation_bar_button_style', {
      payload: { style }
    });
  } catch (error) {
    console.error('设置导航栏按钮样式失败:', error);
    throw error;
  }
}

/**
 * 设置顶部状态栏背景颜色
 * @param color - 十六进制颜色码，如 "#FF0000" 或 "FF0000"
 */
export async function setStatusBarBackgroundColor(color: string): Promise<void> {
  if (!isTauri()) {
    console.warn('[NavBarStyle] This function is only available in Tauri.', 'setStatusBarBackgroundColor');
    return;
  }
  try {
    await invoke('plugin:device|set_status_bar_background_color', {
      payload: { color }
    });
  } catch (error) {
    console.error('设置状态栏背景色失败:', error);
    throw error;
  }
}

/**
 * 设置底部导航栏背景颜色
 * @param color - 十六进制颜色码，如 "#FFFFFF" 或 "FFFFFF"
 */
export async function setNavigationBarBackgroundColor(color: string): Promise<void> {
  if (!isTauri()) {
    console.warn('[NavBarStyle] This function is only available in Tauri.', 'setNavigationBarBackgroundColor');
    return;
  }
  try {
    await invoke('plugin:device|set_navigation_bar_background_color', {
      payload: { color }
    });
  } catch (error) {
    console.error('设置导航栏背景色失败:', error);
    throw error;
  }
}
