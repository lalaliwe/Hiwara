/**
 * 外部链接安全工具。
 *
 * 安全背景（V-01 漏洞修复）：
 * 应用内 WebView 会把登录 token 写入子页面的 localStorage.token。
 * 若将任意不受信任的外部链接放进该 WebView，则攻击者控制的 origin 可以
 * 读取并窃取该 token。因此必须：
 *   1. 仅允许「受信任的 Hiwara/Iwara 控制 HTTPS origin」在应用内 WebView 打开；
 *   2. 其它外部链接一律通过系统浏览器打开，绝不进入注入 token 的 WebView。
 */

/**
 * 受信任的 Hiwara/Iwara 控制的 HTTPS origin 白名单（顶级域名）。
 * 匹配规则：hostname 等于该域名或其任意子域（如 www.iwara.tv、ecchi.iwara.tv）。
 */
const TRUSTED_WEBVIEW_HOSTS = ['iwara.tv', 'iwara.ai'];

/** 判断 hostname 是否属于受信任 host（含其任意子域） */
function isTrustedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  return TRUSTED_WEBVIEW_HOSTS.some((t) => h === t || h.endsWith(`.${t}`));
}

/**
 * 判断 URL 是否允许在应用内 WebView 打开并注入登录 token。
 * 要求：必须是 https 协议，且 hostname 属于受信任的 Hiwara/Iwara origin。
 */
export function isTrustedWebviewUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && isTrustedHost(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * 在系统浏览器中打开外部链接。
 * Tauri 环境使用 plugin-opener；非 Tauri 环境回退到 window.open。
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('无法在系统浏览器中打开链接:', url, error);
    }
  }
}
