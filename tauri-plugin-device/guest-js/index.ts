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
export type BarTarget = 'status' | 'navigation' | 'all';

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

export interface SetStyleOptions {
  style: BarStyle;
  target?: BarTarget;
  statusBarColor?: string;
  navigationBarColor?: string;
}

export async function setBarStyle(options: SetStyleOptions): Promise<void> {
  await invoke('plugin:device|set_bar_style', {
    payload: {
      style: options.style,
      target: options.target || 'all',
      statusBarColor: options.statusBarColor,
      navigationBarColor: options.navigationBarColor,
    }
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
