import { onActivated, onDeactivated, onUnmounted, ref, watch, type Ref, type WatchStopHandle } from 'vue'
import { isTauri } from '@tauri-apps/api/core'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'

export type BarStyle = 'light' | 'dark'

interface UseAutoStatusBarOptions {
  /**
   * CSS 变量名，如 '--color-primary-90'。
   * 读取 document.documentElement 上该变量的计算值。
   */
  cssVar?: string

  /**
   * CSS 选择器，如 '.top'。
   * 读取匹配元素的 computed background-color。
   */
  selector?: string

  /**
   * 直接颜色值或响应式 ref。
   * 支持 hex (#RRGGBB)、rgb/rgba 格式。
   */
  color?: string | Ref<string>

  /**
   * 节流间隔（毫秒），默认 100ms
   */
  throttle?: number
}

/**
 * 解析 hex/rgb/rgba 颜色字符串为 RGB 分量
 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return null
  }

  // hex: #RRGGBB 或 #RGB
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    }
  }

  // hex: #RGB 简写
  const hexShortMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)
  if (hexShortMatch) {
    return {
      r: parseInt(hexShortMatch[1] + hexShortMatch[1], 16),
      g: parseInt(hexShortMatch[2] + hexShortMatch[2], 16),
      b: parseInt(hexShortMatch[3] + hexShortMatch[3], 16),
    }
  }

  // rgb/rgba: rgb(r, g, b) 或 rgba(r, g, b, a)
  const rgbMatch = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/
  )
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/**
 * 计算 WCAG Relative Luminance (相对亮度)
 * 阈值 0.75：仅当背景极亮（如纯白）时才使用深色文字 (dark)
 * 其余情况均使用浅色文字 (light)，因为用户偏好白色状态栏文字
 */
function calculateLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

/**
 * 根据颜色值确定状态栏文字样式
 */
function getBarStyleFromColor(color: string): BarStyle | null {
  const rgb = parseColorToRgb(color)
  if (!rgb) return null

  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b)
  // 阈值 0.75：仅纯白/接近纯白的背景才使用深色文字，其余一律白色文字
  return luminance > 0.75 ? 'dark' : 'light'
}

/**
 * 解析 CSS 变量名获取实际颜色值
 * 支持 --color-primary-90 或直接传入 var(--color-primary-90)
 */
function resolveCSSVar(cssVar: string): string {
  const varName = cssVar.replace(/^var\(/, '').replace(/\)$/, '').trim()
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

/**
 * 获取元素的计算背景色
 */
function resolveSelector(selector: string): string {
  const el = document.querySelector(selector)
  if (!el) return 'transparent'
  return getComputedStyle(el).backgroundColor
}

/**
 * 自动状态栏文字颜色自适应组合式函数
 *
 * 根据页面顶部背景色的亮度，自动设置 Android 状态栏文字颜色。
 *
 * @example
 * // 通过 CSS 变量
 * useAutoStatusBar({ cssVar: '--color-primary-90' })
 *
 * @example
 * // 通过选择器
 * useAutoStatusBar({ selector: '.top-bar' })
 *
 * @example
 * // 通过响应式颜色 ref（动态更新）
 * const bgColor = ref('#fafafa')
 * useAutoStatusBar({ color: bgColor })
 *
 * @example
 * // 通过静态颜色值
 * useAutoStatusBar({ color: '#00796B' })
 */
export function useAutoStatusBar(options: UseAutoStatusBarOptions): {
  currentStyle: Ref<BarStyle | null>
  forceUpdate: () => void
} {
  const currentStyle = ref<BarStyle | null>(null)
  let watchStop: WatchStopHandle | null = null
  let lastCallTime = 0
  const throttleMs = options.throttle ?? 100

  // 非 Tauri 环境不执行
  if (!isTauri()) {
    return { currentStyle, forceUpdate: () => {} }
  }

  /**
   * 获取当前颜色值
   */
  function getCurrentColor(): string | null {
    if (options.cssVar) {
      return resolveCSSVar(options.cssVar)
    }
    if (options.selector) {
      return resolveSelector(options.selector)
    }
    if (options.color) {
      return typeof options.color === 'string' ? options.color : options.color.value
    }
    return null
  }

  /**
   * 执行状态栏样式更新（带节流）
   */
  function updateWithThrottle() {
    const now = Date.now()
    if (now - lastCallTime < throttleMs) return
    lastCallTime = now

    const color = getCurrentColor()
    if (!color) return

    const style = getBarStyleFromColor(color)
    if (style && style !== currentStyle.value) {
      currentStyle.value = style
      setStatusBarTextStyle(style)
    }
  }

  /**
   * 强制更新（无视节流）
   */
  function forceUpdate() {
    lastCallTime = 0
    updateWithThrottle()
  }

  // 如果传入了响应式 color ref，建立 watch
  if (options.color && typeof options.color !== 'string') {
    watchStop = watch(
      options.color as Ref<string>,
      () => {
        updateWithThrottle()
      },
      { immediate: true }
    )
  } else if (options.cssVar) {
    // CSS 变量方式：初始读取一次
    forceUpdate()

    // 如果 CSS 变量名以 '--color-' 开头，说明是主题色变量
    // 主题色变化时自动更新（通过 CSS 类变化，如 .dark-theme）
    if (options.cssVar.startsWith('--color-')) {
      const observer = new MutationObserver(() => {
        updateWithThrottle()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      })

      onUnmounted(() => {
        observer.disconnect()
      })
    }
  } else if (options.selector) {
    // 选择器方式：初始读取一次
    forceUpdate()
  } else {
    // 静态颜色值：只设置一次
    forceUpdate()
  }

  // 页面从 keep-alive 缓存激活时重新应用
  onActivated(() => {
    forceUpdate()
  })

  onUnmounted(() => {
    watchStop?.()
  })

  return { currentStyle, forceUpdate }
}

// 导出辅助函数，方便直接使用
export { calculateLuminance, parseColorToRgb, getBarStyleFromColor }
