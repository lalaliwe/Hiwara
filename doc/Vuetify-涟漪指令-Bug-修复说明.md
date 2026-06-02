# Vuetify v-ripple 指令 Bug 修复说明

## 概述

本项目自定义了 [`src/directives/ripple.ts`](../src/directives/ripple.ts) 指令并在 [`src/main.ts:67-68`](../src/main.ts) 注册覆盖 Vuetify 内置的 `v-ripple`，原因是 **Vuetify 3.12.5 的 `v-ripple` 存在导致涟漪残留的 Bug**。

## Bug 详情

### 影响版本

- Vuetify 3.12.5（当前项目使用的版本）
- 理论上影响所有 Vuetify 3.x 中以下代码逻辑未修复的版本

### 根因

**Vuetify 的 [`rippleHide`](https://github.com/vuetifyjs/vuetify/blob/v3.12.5/packages/vuetify/src/directives/ripple/index.ts) 函数在触摸事件的 `setTimeout` 回调中使用了已失效的 `e.currentTarget`。**

关键代码（Vuetify 源码第 159-174 行）：

```javascript
function rippleHide(e) {
  const element = e.currentTarget;       // ← 事件分发期间有效
  if (!element?._ripple) return;
  window.clearTimeout(element._ripple.showTimer);

  // 特殊路径：touchend 在 80ms 延迟前触发
  if (e.type === 'touchend' && element._ripple.showTimerCommit) {
    element._ripple.showTimerCommit();       // 立即显示涟漪
    element._ripple.showTimerCommit = null;

    element._ripple.showTimer = window.setTimeout(() => {
      rippleHide(e);   // ← Bug：此时 e.currentTarget === null！
    });
    return;
  }

  ripples.hide(element);  // ← 永远不会执行
}
```

**触发条件**：用户在移动端快速点击（触摸时间 < 80ms）。

**后果**：调用自定义指令覆盖前的状态——涟漪动画完成后不消失，元素永久变暗。

### 上游修复状态

| 来源 | 状态 | 说明 |
|------|------|------|
| Vuetify 3.12.5 | ❌ 未修复 | 当前版本仍存在 |
| Vuetify 最新版 | ❓ 未知 | 需升级后确认 |
| Vuetify Issue 跟踪 | - | 搜索关键词：`ripple hide e.currentTarget null` |

## 自定义指令说明

### 文件

[`src/directives/ripple.ts`](../src/directives/ripple.ts)

### 修复方式

两处最小化修改：

1. **`rippleHide` 函数签名增加可选的 `_el` 参数**：当 `setTimeout` 中 `e.currentTarget` 为 `null` 时，使用传入的已捕获元素引用作为回退。

2. **`setTimeout` 回调传入已捕获的 `element`**：在 `setTimeout` 前捕获 `element` 引用，在回调中传给 `rippleHide(e, element)`。

### 注册方式

在 [`src/main.ts:67-68`](../src/main.ts) 中，`app.use(vuetify)` 之后注册：

```typescript
import Ripple from './directives/ripple';
app.directive('ripple', Ripple);
```

这样自定义指令会覆盖 Vuetify 的同名 `v-ripple` 指令。

## 版本升级检查清单

当未来升级 `vuetify` 依赖时，请按以下步骤检查是否可以移除该 Workaround：

- [ ] 确认新版本 Vuetify 的 `v-ripple` 已修复此 Bug
- [ ] 在 `node_modules/vuetify/lib/directives/ripple/index.js` 中搜索 `rippleHide(e)`，确认 `setTimeout` 回调中是否传入了已捕获的 `element` 引用（例如 `rippleHide(e, element)`）
- [ ] 如果已修复，移除以下文件/代码：
  - 删除 [`src/directives/ripple.ts`](../src/directives/ripple.ts)
  - 删除 [`src/main.ts:67-68`](../src/main.ts) 中的注册代码（`import Ripple` 和 `app.directive('ripple', Ripple)`）
- [ ] 在 Android 真机上回归测试快速点击卡片时的涟漪行为
