// ============================================================
// Vuetify v-ripple 指令修复
// 
// 问题：Vuetify 3.12.5 的 rippleHide 函数在 touchend 事件
// 处理中，当 touchend 在 80ms 延迟前触发时，会通过 setTimeout
// 重新调用 rippleHide(e)。但在 setTimeout 回调中 e.currentTarget
// 已为 null（DOM 事件已完成调度），导致 rippleHide 提前返回，
// 涟漪不会被隐藏，永久停留在 --in 可见状态。
//
// 修复：在 setTimeout 中传入已捕获的 element 引用，而不是依赖
// e.currentTarget。
// ============================================================

// 导入 Vuetify 涟漪 CSS（复用现有样式）
import 'vuetify/lib/directives/ripple/VRipple.css'
import { isObject } from 'vuetify/lib/util/index.js'

const stopSymbol = Symbol('rippleStop')
const DELAY_RIPPLE = 80

function transform(el: HTMLElement, value: string) {
  el.style.transform = value
}

function isTouchEvent(e: Event): e is TouchEvent {
  return e.constructor.name === 'TouchEvent'
}

function isKeyboardEvent(e: Event): e is KeyboardEvent {
  return e.constructor.name === 'KeyboardEvent'
}

interface RippleValue {
  class?: string
  center?: boolean
}

const calculate = function (e: Event, el: HTMLElement, value: RippleValue = {}) {
  let localX = 0
  let localY = 0
  if (!isKeyboardEvent(e)) {
    const offset = el.getBoundingClientRect()
    const target = isTouchEvent(e) ? e.touches[e.touches.length - 1] : (e as MouseEvent)
    localX = target.clientX - offset.left
    localY = target.clientY - offset.top
  }
  let radius = 0
  let scale = 0.3
  if ((el as any)._ripple?.circle) {
    scale = 0.15
    radius = el.clientWidth / 2
    radius = value.center ? radius : radius + Math.sqrt((localX - radius) ** 2 + (localY - radius) ** 2) / 4
  } else {
    radius = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2) / 2
  }
  const centerX = `${(el.clientWidth - radius * 2) / 2}px`
  const centerY = `${(el.clientHeight - radius * 2) / 2}px`
  const x = value.center ? centerX : `${localX - radius}px`
  const y = value.center ? centerY : `${localY - radius}px`
  return { radius, scale, x, y, centerX, centerY }
}

const ripples = {
  show(e: Event, el: HTMLElement, value: RippleValue = {}) {
    if (!(el as any)._ripple?.enabled) return

    const container = document.createElement('span')
    const animation = document.createElement('span')
    container.appendChild(animation)
    container.className = 'v-ripple__container'
    if (value.class) {
      container.className += ` ${value.class}`
    }

    const { radius, scale, x, y, centerX, centerY } = calculate(e, el, value)
    const size = `${radius * 2}px`

    animation.className = 'v-ripple__animation'
    animation.style.width = size
    animation.style.height = size
    el.appendChild(container)

    const computed = window.getComputedStyle(el)
    if (computed && computed.position === 'static') {
      el.style.position = 'relative'
      el.dataset.previousPosition = 'static'
    }

    animation.classList.add('v-ripple__animation--enter')
    animation.classList.add('v-ripple__animation--visible')
    transform(animation, `translate(${x}, ${y}) scale3d(${scale},${scale},${scale})`)
    ;(animation as any).dataset.activated = String(performance.now())

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animation.classList.remove('v-ripple__animation--enter')
        animation.classList.add('v-ripple__animation--in')
        transform(animation, `translate(${centerX}, ${centerY}) scale3d(1,1,1)`)
      })
    })
  },

  hide(el: HTMLElement) {
    if (!(el as any)._ripple?.enabled) return

    const ripples = el.getElementsByClassName('v-ripple__animation')
    if (ripples.length === 0) return

    // 找到最后一个未隐藏的涟漪（向后遍历，替代 findLast）
    const animations = Array.from(ripples) as HTMLElement[]
    let animation: HTMLElement | undefined
    for (let i = animations.length - 1; i >= 0; i--) {
      if (!animations[i].dataset.isHiding) {
        animation = animations[i]
        break
      }
    }
    if (!animation) return

    animation.dataset.isHiding = 'true'
    const diff = performance.now() - Number(animation.dataset.activated)
    const delay = Math.max(250 - diff, 0)

    setTimeout(() => {
      animation.classList.remove('v-ripple__animation--in')
      animation.classList.add('v-ripple__animation--out')
      setTimeout(() => {
        const remaining = el.getElementsByClassName('v-ripple__animation')
        if (remaining.length === 1 && el.dataset.previousPosition) {
          el.style.position = el.dataset.previousPosition
          delete el.dataset.previousPosition
        }
        if (animation.parentNode?.parentNode === el) {
          el.removeChild(animation.parentNode)
        }
      }, 300)
    }, delay)
  },
}

function isRippleEnabled(value: any): boolean {
  return typeof value === 'undefined' || !!value
}

function rippleShow(e: Event) {
  const value: RippleValue = {}
  const element = e.currentTarget as HTMLElement | null
  if (!(element as any)?._ripple || (element as any)._ripple.touched || (e as any)[stopSymbol]) return

  // Don't allow the event to trigger ripples on any other elements
  ;(e as any)[stopSymbol] = true

  if (isTouchEvent(e)) {
    ;(element as any)._ripple.touched = true
    ;(element as any)._ripple.isTouch = true
  } else {
    if ((element as any)._ripple.isTouch) return
  }

  value.center = (element as any)._ripple.centered || isKeyboardEvent(e)
  if ((element as any)._ripple.class) {
    value.class = (element as any)._ripple.class
  }

  if (isTouchEvent(e)) {
    if ((element as any)._ripple.showTimerCommit) return
    ;(element as any)._ripple.showTimerCommit = () => {
      ripples.show(e, element, value)
    }
    ;(element as any)._ripple.showTimer = window.setTimeout(() => {
      if ((element as any)?._ripple?.showTimerCommit) {
        ;(element as any)._ripple.showTimerCommit()
        ;(element as any)._ripple.showTimerCommit = null
      }
    }, DELAY_RIPPLE)
  } else {
    ripples.show(e, element, value)
  }
}

function rippleStop(e: Event) {
  ;(e as any)[stopSymbol] = true
}

// ============================================================
// 修复的核心：修复了 Vuetify 的 rippleHide 在 setTimeout 中
// e.currentTarget 为 null 的 bug
// 修改点：
//   1. rippleHide 增加可选的 _el 参数作为 element 回退
//   2. 第 3 步的 setTimeout 中传入已捕获的 element 引用
// ============================================================
function rippleHide(e: Event, _el?: HTMLElement) {
  // 【修复】使用传入的 _el 作为回退，因为 setTimeout 中 e.currentTarget 为 null
  const element = _el || (e.currentTarget as HTMLElement | null)
  if (!(element as any)?._ripple) return

  window.clearTimeout((element as any)._ripple.showTimer)

  // The touch interaction occurs before the show timer is triggered.
  // We still want to show ripple effect.
  if (e.type === 'touchend' && (element as any)._ripple.showTimerCommit) {
    ;(element as any)._ripple.showTimerCommit()
    ;(element as any)._ripple.showTimerCommit = null

    // re-queue ripple hiding
    // 【修复】传入已捕获的 element，避免 setTimeout 中 e.currentTarget 为 null
    ;(element as any)._ripple.showTimer = window.setTimeout(() => {
      rippleHide(e, element)
    })
    return
  }

  window.setTimeout(() => {
    if ((element as any)._ripple) {
      ;(element as any)._ripple.touched = false
    }
  })

  ripples.hide(element)
}

function rippleCancelShow(e: Event) {
  const element = e.currentTarget as HTMLElement | null
  if (!(element as any)?._ripple) return
  if ((element as any)._ripple.showTimerCommit) {
    ;(element as any)._ripple.showTimerCommit = null
  }
  window.clearTimeout((element as any)._ripple.showTimer)
}

let keyboardRipple = false

function keyboardRippleShow(e: Event, keys: string[]) {
  if (!keyboardRipple && keys.includes((e as KeyboardEvent).key)) {
    keyboardRipple = true
    rippleShow(e)
  }
}

function keyboardRippleHide(e: Event) {
  keyboardRipple = false
  rippleHide(e)
}

function focusRippleHide(e: Event) {
  if (keyboardRipple) {
    keyboardRipple = false
    rippleHide(e)
  }
}

function updateRipple(el: HTMLElement, binding: any, wasEnabled: boolean) {
  const { value, modifiers } = binding
  const enabled = isRippleEnabled(value)

  if (!enabled) {
    ripples.hide(el)
  }

  ;(el as any)._ripple = (el as any)._ripple ?? {}
  ;(el as any)._ripple.enabled = enabled
  ;(el as any)._ripple.centered = modifiers.center
  ;(el as any)._ripple.circle = modifiers.circle

  const bindingValue = isObject(value) ? value : {}
  if (bindingValue.class) {
    ;(el as any)._ripple.class = bindingValue.class
  }

  const allowedKeys: string[] = bindingValue.keys ?? ['Enter', 'Space']
  ;(el as any)._ripple.keyDownHandler = (e: Event) => keyboardRippleShow(e, allowedKeys)

  if (enabled && !wasEnabled) {
    if (modifiers.stop) {
      el.addEventListener('touchstart', rippleStop, { passive: true })
      el.addEventListener('mousedown', rippleStop)
      return
    }

    el.addEventListener('touchstart', rippleShow, { passive: true })
    el.addEventListener('touchend', rippleHide, { passive: true })
    el.addEventListener('touchmove', rippleCancelShow, { passive: true })
    el.addEventListener('touchcancel', rippleHide)
    el.addEventListener('mousedown', rippleShow)
    el.addEventListener('mouseup', rippleHide)
    el.addEventListener('mouseleave', rippleHide)
    el.addEventListener('keydown', (el as any)._ripple.keyDownHandler)
    el.addEventListener('keyup', keyboardRippleHide)
    el.addEventListener('blur', focusRippleHide)
    el.addEventListener('dragstart', rippleHide, { passive: true })
  } else if (!enabled && wasEnabled) {
    removeListeners(el)
  }
}

function removeListeners(el: HTMLElement) {
  el.removeEventListener('touchstart', rippleStop)
  el.removeEventListener('mousedown', rippleStop)
  el.removeEventListener('touchstart', rippleShow)
  el.removeEventListener('touchend', rippleHide)
  el.removeEventListener('touchmove', rippleCancelShow)
  el.removeEventListener('touchcancel', rippleHide)
  el.removeEventListener('mousedown', rippleShow)
  el.removeEventListener('mouseup', rippleHide)
  el.removeEventListener('mouseleave', rippleHide)
  if ((el as any)._ripple?.keyDownHandler) {
    el.removeEventListener('keydown', (el as any)._ripple.keyDownHandler)
  }
  el.removeEventListener('keyup', keyboardRippleHide)
  el.removeEventListener('blur', focusRippleHide)
  el.removeEventListener('dragstart', rippleHide)
}

function mounted(el: HTMLElement, binding: any) {
  updateRipple(el, binding, false)
}

function unmounted(el: HTMLElement) {
  removeListeners(el)
  delete (el as any)._ripple
}

function updated(el: HTMLElement, binding: any) {
  if (binding.value === binding.oldValue) return
  const wasEnabled = isRippleEnabled(binding.oldValue)
  updateRipple(el, binding, wasEnabled)
}

export const Ripple = {
  mounted,
  unmounted,
  updated,
}

export default Ripple
