import { invoke } from '@tauri-apps/api/core'

export async function enterImmersive(): Promise<{ success: boolean }> {
  return await invoke('plugin:immersive|enter_immersive');
}

export async function exitImmersive(): Promise<{ success: boolean }> {
  return await invoke('plugin:immersive|exit_immersive');
}
