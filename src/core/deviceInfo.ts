import { invoke } from '@tauri-apps/api/core';

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceModel: string;
  deviceManufacturer: string;
}

/**
 * 网络类型枚举
 * - wifi: WiFi 网络
 * - cellular: 蜂窝网络（2G/3G/4G/5G/6G 等所有移动网络）
 * - ethernet: 以太网
 * - other: 其他网络类型
 * - none: 无网络连接
 * - unknown: 未知网络类型
 */
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown';

/**
 * 网络信息接口
 */
export interface NetworkInfo {
  isConnected: boolean;
  networkType: NetworkType;
}

/**
 * 电池信息接口
 */
export interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

/**
 * 获取设备信息
 * @returns Promise<DeviceInfo> 设备信息对象
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    return await invoke('plugin:device-info|getDeviceInfo');
  } catch (error) {
    console.error('[Device] Failed to get device info:', error);
    throw error; // 继续抛出错误，以便调用者可以处理
  }
}

/**
 * 获取网络信息
 * @returns Promise<NetworkInfo> 网络信息对象
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  try {
    return await invoke('plugin:device-info|getNetworkInfo');
  } catch (error) {
    console.error('[Device] Failed to get network info:', error);
    // 优雅降级：返回默认值
    return {
      isConnected: false,
      networkType: 'unknown',
    };
  }
}

/**
 * 获取电池信息
 * @returns Promise<BatteryInfo> 电池信息对象
 */
export async function getBatteryInfo(): Promise<BatteryInfo> {
  try {
    return await invoke('plugin:device-info|getBatteryInfo');
  } catch (error) {
    console.error('[Device] Failed to get battery info:', error);
    // 优雅降级：返回默认值
    return {
      level: 100,
      isCharging: false,
    };
  }
}

/**
 * 检查是否连接到 WiFi
 * @returns Promise<boolean> 是否连接到 WiFi
 */
export async function isWifiConnected(): Promise<boolean> {
  try {
    const networkInfo = await getNetworkInfo();
    return networkInfo.isConnected && networkInfo.networkType === 'wifi';
  } catch (error) {
    console.error('[Device] Failed to check WiFi connection:', error);
    return false;
  }
}

/**
 * 检查是否使用蜂窝网络
 * @returns Promise<boolean> 是否使用蜂窝网络
 */
export async function isCellularNetwork(): Promise<boolean> {
  try {
    const networkInfo = await getNetworkInfo();
    return networkInfo.isConnected && networkInfo.networkType === 'cellular';
  } catch (error) {
    console.error('[Device] Failed to check cellular network:', error);
    return false;
  }
}

/**
 * 检查是否有网络连接
 * @returns Promise<boolean> 是否有网络连接
 */
export async function isConnected(): Promise<boolean> {
  try {
    const networkInfo = await getNetworkInfo();
    return networkInfo.isConnected;
  } catch (error) {
    console.error('[Device] Failed to check network connection:', error);
    return false;
  }
}

/**
 * 获取电池电量百分比
 * @returns Promise<number> 电池电量百分比 (0-100)
 */
export async function getBatteryLevel(): Promise<number> {
  try {
    const batteryInfo = await getBatteryInfo();
    return batteryInfo.level;
  } catch (error) {
    console.error('[Device] Failed to get battery level:', error);
    return 100; // 默认返回 100%
  }
}

/**
 * 检查是否在充电
 * @returns Promise<boolean> 是否在充电
 */
export async function isCharging(): Promise<boolean> {
  try {
    const batteryInfo = await getBatteryInfo();
    return batteryInfo.isCharging;
  } catch (error) {
    console.error('[Device] Failed to check charging status:', error);
    return false; // 默认返回未充电
  }
}
