import { invoke,isTauri } from '@tauri-apps/api/core';

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceModel: string;
  deviceManufacturer: string;
  webkitType: string;
  kernelVersion: string;
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'getDeviceInfo()');
    return {
      osName: 'unknown',
      osVersion: 'unknown',
      deviceModel: 'unknown',
      deviceManufacturer: 'unknown',
      webkitType: 'unknown',
      kernelVersion: 'unknown',
    };
  }
  try {
    const rawDeviceInfo = await invoke('plugin:device|get_device_info');
    // 确保 rawDeviceInfo 是对象类型
    const deviceInfo = typeof rawDeviceInfo === 'object' && rawDeviceInfo !== null
      ? rawDeviceInfo as Record<string, any>
      : {};

    // 添加 WebKit 类型和内核版本的检测（基于浏览器环境）
    const userAgent = navigator.userAgent;
    let webkitType = 'unknown';
    let kernelVersion = 'unknown';

    // 检测 WebKit 类型
    if (userAgent.includes('WebKit')) {
      if (userAgent.includes('Chrome') || userAgent.includes('CriOS')) {
        webkitType = 'Blink'; // Chrome 使用 Blink 引擎（基于 WebKit）
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        webkitType = 'WebKit';
      } else {
        webkitType = 'WebKit';
      }
    } else if (userAgent.includes('Gecko')) {
      webkitType = 'Gecko';
    } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
      webkitType = 'Trident';
    }

    // 提取内核版本
    const versionMatch = userAgent.match(/(?:AppleWebKit|Gecko|Trident|Edge)\/([\d.]+)/);
    if (versionMatch) {
      kernelVersion = versionMatch[1];
    } else {
      // 尝试其他方式提取版本
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
      if (chromeMatch) {
        kernelVersion = chromeMatch[1];
      } else {
        const safariMatch = userAgent.match(/Version\/([\d.]+)/);
        if (safariMatch) {
          kernelVersion = safariMatch[1];
        }
      }
    }

    return {
      osName: deviceInfo.osName || 'unknown',
      osVersion: deviceInfo.osVersion || 'unknown',
      deviceModel: deviceInfo.deviceModel || 'unknown',
      deviceManufacturer: deviceInfo.deviceManufacturer || 'unknown',
      webkitType,
      kernelVersion,
    };
  } catch (error) {
    console.error('[Device] Failed to get device info:', error);
    // 优雅降级：返回默认值
    return {
      osName: 'unknown',
      osVersion: 'unknown',
      deviceModel: 'unknown',
      deviceManufacturer: 'unknown',
      webkitType: 'unknown',
      kernelVersion: 'unknown',
    };
  }
}

/**
 * 获取网络信息
 * @returns Promise<NetworkInfo> 网络信息对象
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'getNetworkInfo()');
    return {
      isConnected: false,
      networkType: 'unknown',
    };
  }
  try {
    return await invoke('plugin:device|get_network_info');
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'getBatteryInfo()');
    return {
      level: 100,
      isCharging: false,
    };
  }
  try {
    return await invoke('plugin:device|get_battery_info');
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'isWifiConnected()');
    return false;
  }
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'isCellularNetwork()');
    return false;
  }
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'isConnected()');
    return false;
  }
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'getBatteryLevel()');
    return 100; // 默认返回 100%
  }
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
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'isCharging()');
    return false; // 默认返回未充电
  }
  try {
    const batteryInfo = await getBatteryInfo();
    return batteryInfo.isCharging;
  } catch (error) {
    console.error('[Device] Failed to check charging status:', error);
    return false; // 默认返回未充电
  }
}