import { invoke,isTauri } from '@tauri-apps/api/core';
/**
 * 应用控制响应接口
 */
export interface MoveTaskToBackResponse {
  success: boolean;
}

/**
 * 将应用最小化到后台（仅 Android 平台有效）
 * @returns Promise<MoveTaskToBackResponse> 操作结果
 * 
 * @example
 * ```typescript
 * import { moveTaskToBack } from '@/plugins/appControl'
 * 
 * // 在需要最小化应用的地方调用
 * const result = await moveTaskToBack()
 * if (result.success) {
 *   console.log('应用已最小化到后台')
 * }
 * ```
 * 
 * @remarks
 * - 仅在 Android 平台有效
 * - 桌面端和 iOS 端为空实现，会返回 success: true
 * - 应用进入后台后可以通过最近任务列表恢复
 * - 这是一个非破坏性操作，不会退出应用
 */
export async function moveTaskToBack(): Promise<MoveTaskToBackResponse> {
  if (!isTauri()) {
    console.warn('[AppControl] This function is only available in Tauri.', 'moveTaskToBack');
    return { success: false };
  }
  try {
    return await invoke('plugin:device|move_task_to_back');
  } catch (error) {
    console.error('[AppControl] Failed to move task to back:', error);
    // 优雅降级：返回失败状态
    return { success: false };
  }
}
