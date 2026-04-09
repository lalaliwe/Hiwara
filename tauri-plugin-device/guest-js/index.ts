import { invoke } from '@tauri-apps/api/core'

export interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceModel: string;
  deviceManufacturer: string;
}

export interface NetworkInfo {
  isConnected: boolean;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown';
}

export interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

export type BarStyle = 'light' | 'dark';

export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:device|ping', {
    payload: { value },
  }).then((r) => (r.value ? r.value : null));
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  return await invoke('plugin:device|get_device_info');
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  return await invoke('plugin:device|get_network_info');
}

export async function getBatteryInfo(): Promise<BatteryInfo> {
  return await invoke('plugin:device|get_battery_info');
}

export async function enterImmersive(): Promise<void> {
  await invoke('plugin:device|enter_immersive');
}

export async function exitImmersive(): Promise<void> {
  await invoke('plugin:device|exit_immersive');
}

/**
 * 设置顶部状态栏文字明暗主题
 * @param style - 'light' 白色文字（深色背景），'dark' 黑色文字（浅色背景）
 */
export async function setStatusBarTextStyle(style: BarStyle): Promise<void> {
  await invoke('plugin:device|set_status_bar_text_style', {
    payload: { style }
  });
}

/**
 * 设置底部导航栏按钮明暗主题
 * @param style - 'light' 白色按钮（深色背景），'dark' 黑色按钮（浅色背景）
 */
export async function setNavigationBarButtonStyle(style: BarStyle): Promise<void> {
  await invoke('plugin:device|set_navigation_bar_button_style', {
    payload: { style }
  });
}

/**
 * 设置顶部状态栏背景颜色
 * @param color - 十六进制颜色码，如 "#FF0000" 或 "FF0000"
 */
export async function setStatusBarBackgroundColor(color: string): Promise<void> {
  await invoke('plugin:device|set_status_bar_background_color', {
    payload: { color }
  });
}

/**
 * 设置底部导航栏背景颜色
 * @param color - 十六进制颜色码，如 "#FFFFFF" 或 "FFFFFF"
 */
export async function setNavigationBarBackgroundColor(color: string): Promise<void> {
  await invoke('plugin:device|set_navigation_bar_background_color', {
    payload: { color }
  });
}

export async function lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
  await invoke('plugin:device|lock_orientation', {
    payload: { orientation }
  });
}

export async function unlockOrientation(): Promise<void> {
  await invoke('plugin:device|unlock_orientation');
}

export interface MoveTaskToBackResponse {
  success: boolean;
}

export async function moveTaskToBack(): Promise<MoveTaskToBackResponse> {
  return await invoke('plugin:device|move_task_to_back');
}
