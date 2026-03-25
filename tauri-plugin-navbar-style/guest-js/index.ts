import { invoke } from '@tauri-apps/api/core'

export interface SetStyleOptions {
  /** "light" (白字) 或 "dark" (黑字) */
  style: string;
  /** "status" (顶部), "navigation" (底部) 或 "all" (默认) */
  target?: string;
  /** 状态栏背景颜色（可选），格式为十六进制颜色码，如 "#FF0000" */
  statusBarColor?: string;
  /** 导航栏背景颜色（可选），格式为十六进制颜色码，如 "#FFFFFF" */
  navigationBarColor?: string;
}

export async function setBarStyle(options: SetStyleOptions): Promise<{ success: boolean }> {
  return await invoke('plugin:navbar-style|set_bar_style', {
    payload: options,
  });
}
