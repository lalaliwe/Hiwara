import { invoke } from '@tauri-apps/api/core'

export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:device-info|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

/// 设备信息接口
export interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceModel: string;
  deviceManufacturer: string;
}

/// 网络类型 - 支持未来扩展
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown';

/// 网络信息接口 - 简化版
export interface NetworkInfo {
  isConnected: boolean;
  networkType: NetworkType;
}

/// 电池信息接口 - 只保留电量和充电状态
export interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

/**
 * 获取设备信息
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  return await invoke('plugin:device-info|getDeviceInfo');
}

/**
 * 获取网络信息
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  return await invoke('plugin:device-info|getNetworkInfo');
}

/**
 * 获取电池信息
 */
export async function getBatteryInfo(): Promise<BatteryInfo> {
  return await invoke('plugin:device-info|getBatteryInfo');
}
