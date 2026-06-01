import { invoke } from '@tauri-apps/api/core';

/**
 * 清理文件名中的非法字符（Windows 和 Linux）
 * Windows 非法字符: \ / : * ? " < > |
 * Linux 非法字符: / \0
 * 全部替换为 _
 */
export function sanitizeFilename(filename: string): string {
  // 匹配所有非法字符: \ / : * ? " < > |
  return filename.replace(/[\\/:*?"<>|]/g, '_');
}

/**
 * 构建 aria2 下载文件名: 标题[id]username.扩展名
 */
export function buildAria2Filename(
  title: string,
  id: string,
  username: string,
  extension: string
): string {
  const raw = `${title}[${id}]${username}${extension}`;
  return sanitizeFilename(raw);
}

/**
 * 向 aria2 RPC 服务器发送添加下载任务的请求
 * @param rpcUrl - aria2 RPC 地址 (如 http://localhost:6800/jsonrpc)
 * @param token - aria2 RPC 密钥 (可选)
 * @param downloadUrl - 视频下载直链
 * @param dir - 下载保存目录
 * @param filename - 下载文件名
 */
export async function addAria2Download(
  rpcUrl: string,
  token: string | null,
  downloadUrl: string,
  dir: string,
  filename: string
): Promise<{ ok: boolean; error?: string; result?: string }> {
  try {
    const params: any[] = [];

    // 如果有 token，添加 token 参数
    if (token && token.trim() !== '') {
      params.push(`token:${token}`);
    }

    // URI 列表
    params.push([downloadUrl]);

    // 选项: 下载目录和文件名
    params.push({
      dir: dir,
      out: filename,
    });

    const body = {
      jsonrpc: '2.0',
      id: `hiwara-${Date.now()}`,
      method: 'aria2.addUri',
      params: params,
    };

    const response: { status: number; headers: Record<string, string>; data: string } = await invoke('post_https_request', {
      url: rpcUrl,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = JSON.parse(response.data);

    if (data.error) {
      return {
        ok: false,
        error: data.error.message || `Aria2 错误: ${JSON.stringify(data.error)}`,
      };
    }

    return { ok: true, result: data.result };
  } catch (error) {
    return { ok: false, error: `连接 aria2 失败: ${String(error)}` };
  }
}
