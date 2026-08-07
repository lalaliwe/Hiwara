import { invoke,isTauri } from '@tauri-apps/api/core';

// 定义屏幕方向的类型，限制只能传入 'portrait' 或 'landscape'
type OrientationType = 'portrait' | 'landscape';

// 定义响应结构 (对应 Rust 的 LockResponse)
interface OrientationResponse {
  success: boolean;
}

/**
 * 锁定屏幕方向
 * @param orientation 方向类型：'portrait' (竖屏) 或 'landscape' (横屏)
 */
const lockOrientation = async (orientation: OrientationType): Promise<boolean> => {
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'lockOrientation');
    return false;
  }
  try {
    // 调用 Tauri 插件命令
    const result = await invoke<OrientationResponse>('plugin:device|lock_orientation', {
      payload: { orientation }
    });
    // console.log(`屏幕已锁定：${orientation}`, result);
    return result.success;
  } catch (error) {
    console.error('锁定屏幕方向失败:', error);
    return false;
  }
};

/**
 * 锁定竖屏
 */
export const lockPortrait = async (): Promise<boolean> => lockOrientation('portrait');

/**
 * 锁定横屏
 */
export const lockLandscape = async (): Promise<boolean> => lockOrientation('landscape');

/**
 * 解锁屏幕方向 (恢复自动旋转)
 */
export const unlockOrientation = async (): Promise<boolean> => {
  if (!isTauri()) {
    console.warn('[Device] This function is only available in Tauri.', 'unlockOrientation');
    return false;
  }
  try {
    const result = await invoke<OrientationResponse>('plugin:device|unlock_orientation');
    // console.log('屏幕已解锁', result);
    return result.success;
  } catch (error) {
    console.error('解锁屏幕方向失败:', error);
    return false;
  }
};

// 与 _mixins.scss 中 $breakpoints.md 保持一致的平板断点值
const TABLET_BREAKPOINT = 720;

/**
 * 判断当前设备是否为平板（短边 ≥ 720px）
 * 使用 min(宽,高) 避免手机横屏时（宽 ≥720）被误判为平板，
 * 否则退出全屏后手机无法重新锁定竖屏，界面会停留在平板/PC 布局。
 */
export const isTablet = (): boolean => {
  return Math.min(window.innerWidth, window.innerHeight) >= TABLET_BREAKPOINT;
};

/**
 * 仅在手机上锁定竖屏，平板（≥720px）则恢复自由旋转
 * 适用于主页等非全屏场景
 */
export const lockPortraitOnMobile = async (): Promise<boolean> => {
  if (isTablet()) {
    return unlockOrientation();
  }
  return lockPortrait();
};
