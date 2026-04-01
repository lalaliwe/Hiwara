import { invoke } from '@tauri-apps/api/core'

export interface LockOrientationOptions {
  /** 'portrait' 或 'landscape' */
  orientation?: string;
}

export async function lockOrientation(options?: LockOrientationOptions): Promise<{ success: boolean }> {
  return await invoke('plugin:orientation|lock_orientation', {
    payload: options || {},
  });
}

export async function unlockOrientation(): Promise<{ success: boolean }> {
  return await invoke('plugin:orientation|unlock_orientation');
}
