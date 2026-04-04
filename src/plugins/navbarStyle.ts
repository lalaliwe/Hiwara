// src/utils/navbar.ts
import { invoke } from '@tauri-apps/api/core';

export type BarStyle = 'light' | 'dark'; // light=白字，dark=黑字
export type BarTarget = 'status' | 'navigation' | 'all';

interface SetStyleOptions {
  style: BarStyle;
  target?: BarTarget; // 默认为 'all'
  /** 状态栏背景颜色（可选），格式为十六进制颜色码，如 "#FF0000" */
  statusBarColor?: string;
  /** 导航栏背景颜色（可选），格式为十六进制颜色码，如 "#FFFFFF" */
  navigationBarColor?: string;
}

/**
 * 动态设置系统栏文字颜色和背景颜色
 */
export async function setNavBarStyle(options: SetStyleOptions): Promise<void> {
  try {
    await invoke('plugin:device|set_bar_style', {
      payload: {
        style: options.style,
        target: options.target || 'all',
        statusBarColor: options.statusBarColor,
        navigationBarColor: options.navigationBarColor,
      }
    });
  } catch (error) {
    console.error('设置导航栏样式失败:', error);
    throw error;
  }
}

/**
 * 快捷方法：设置深色主题（白字深色背景）
 */
export async function setDarkTheme(
  target: BarTarget = 'all',
  statusBarColor?: string,
  navigationBarColor?: string
): Promise<void> {
  return setNavBarStyle({
    style: 'light',
    target,
    statusBarColor: statusBarColor || '#000000',
    navigationBarColor: navigationBarColor || '#000000',
  });
}

/**
 * 快捷方法：设置浅色主题（黑字浅色背景）
 */
export async function setLightTheme(
  target: BarTarget = 'all',
  statusBarColor?: string,
  navigationBarColor?: string
): Promise<void> {
  return setNavBarStyle({
    style: 'dark',
    target,
    statusBarColor: statusBarColor || '#FFFFFF',
    navigationBarColor: navigationBarColor || '#FFFFFF',
  });
}
