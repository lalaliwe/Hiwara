package com.plugin.mwebview.handlers

import android.app.Activity
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import com.plugin.mwebview.CreateWebviewArgs
import com.plugin.mwebview.InjectInitScriptArgs
import com.plugin.mwebview.InjectScriptArgs
import com.plugin.mwebview.UpdateWebviewBoundsArgs

class WebviewHandler(private val activity: Activity) {

    private var webView: WebView? = null
    // 页面加载前注入的脚本（CSS）
    private var pendingInitScript: String? = null
    // 页面加载后注入的脚本（token）
    private var pendingPostScript: String? = null
    private var pageLoaded = false

    fun ping(invoke: Invoke) {
        try {
            val response = JSObject()
            response.put("success", true)
            response.put("message", "MWebview plugin is alive on Android")
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Ping failed: ${e.message}")
        }
    }

    /**
     * 创建嵌入式原生 WebView
     *
     * 使用 addContentView 将 WebView 添加到 Activity 视图层级的最上层。
     * 通过 topMargin = y（topBar 高度）确保 WebView 从 topBar 下方开始显示。
     * Tauri WebView 的 topBar（Vue 渲染）保持在屏幕顶部，原生 WebView 在其下方。
     */
    fun createWebview(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(CreateWebviewArgs::class.java)
            val url = args.url ?: return invoke.reject("URL is required")
            val x = args.x ?: 0.0
            val y = args.y ?: 0.0
            val width = args.width ?: 0.0
            val height = args.height ?: 0.0
            val transparent = args.transparent ?: false

            android.util.Log.d("MWebview", "Creating WebView: url=$url, x=$x, y=$y, w=$width, h=$height")

            destroyExistingWebView()
            pageLoaded = false

            // 创建新的 WebView
            val webView = WebView(activity).apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = false
                    allowContentAccess = false
                    builtInZoomControls = false
                    displayZoomControls = false
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    setSupportZoom(false)
                    mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    // 确保 localStorage 可用
                    cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                }

                // 不透明背景（页面本身有背景色）
                setBackgroundColor(Color.WHITE)

                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false

                // WebViewClient
                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        android.util.Log.d("MWebview", "Page started: $url")
                        pageLoaded = false
                        // 注入初始化脚本（CSS）
                        pendingInitScript?.let { script ->
                            view?.evaluateJavascript(script, null)
                            android.util.Log.d("MWebview", "Init script injected on page start")
                        }
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        android.util.Log.d("MWebview", "Page finished: $url")
                        pageLoaded = true
                        // 页面加载完成后注入 token 脚本
                        pendingPostScript?.let { script ->
                            view?.evaluateJavascript(script, null)
                            android.util.Log.d("MWebview", "Post-load script injected on page finished")
                        }
                    }
                }

                webChromeClient = WebChromeClient()

                // 加载 URL
                loadUrl(url)
                android.util.Log.d("MWebview", "Loading URL: $url")
            }

            // 布局参数：从 topBar 下方开始
            // 注意：前端 getBoundingClientRect() 返回的是 CSS 像素，
            // 需要乘以 density 转换为 Android 物理像素
            val density = activity.resources.displayMetrics.density

            // 获取状态栏高度（Tauri 沉浸式模式下，内容绘制在状态栏后方）
            val statusBarResId = activity.resources.getIdentifier("status_bar_height", "dimen", "android")
            val statusBarPx = if (statusBarResId > 0) {
                activity.resources.getDimensionPixelSize(statusBarResId)
            } else {
                0
            }
            android.util.Log.d("MWebview", "Status bar height: $statusBarPx px, density: $density")

            val realW = if (width > 0) (width * density).toInt() else ViewGroup.LayoutParams.MATCH_PARENT
            val realH = if (height > 0) (height * density).toInt() else ViewGroup.LayoutParams.MATCH_PARENT
            val realX = (x * density).toInt()
            // Y 坐标 = CSS Y 转换 + 状态栏高度（Tauri 沉浸式模式下需要补偿）
            val realY = (y * density).toInt() + statusBarPx
            android.util.Log.d("MWebview", "CSS->PX: density=$density, ${width}x${height} -> ${realW}x${realH}, offset=(${realX},${realY}), statusBar=${statusBarPx}")

            val layoutParams = FrameLayout.LayoutParams(realW, realH).apply {
                leftMargin = realX
                topMargin = realY
            }

            // 使用 addContentView 添加到视图层级最上层
            // topMargin = y 确保 WebView 从 topBar 下方开始
            // topBar（Vue）保持在屏幕顶部，两者不重叠
            activity.addContentView(webView, layoutParams)
            android.util.Log.d("MWebview", "WebView added via addContentView (top layer)")

            this.webView = webView

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            android.util.Log.e("MWebview", "Failed to create webview", e)
            invoke.reject("Failed to create webview: ${e.message}")
        }
    }

    /**
     * 更新 WebView 边界（位置和尺寸）
     */
    fun updateWebviewBounds(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(UpdateWebviewBoundsArgs::class.java)
            val x = args.x ?: 0.0
            val y = args.y ?: 0.0
            val width = args.width ?: 0.0
            val height = args.height ?: 0.0

            webView?.let { wv ->
                val layoutParams = wv.layoutParams as? FrameLayout.LayoutParams
                if (layoutParams != null) {
                    val density = activity.resources.displayMetrics.density
                    val statusBarResId = activity.resources.getIdentifier("status_bar_height", "dimen", "android")
                    val statusBarPx = if (statusBarResId > 0) {
                        activity.resources.getDimensionPixelSize(statusBarResId)
                    } else {
                        0
                    }
                    layoutParams.leftMargin = (x * density).toInt()
                    layoutParams.topMargin = (y * density).toInt() + statusBarPx
                    if (width > 0) layoutParams.width = (width * density).toInt()
                    if (height > 0) layoutParams.height = (height * density).toInt()
                    wv.layoutParams = layoutParams
                    android.util.Log.d("MWebview", "Bounds updated: x=$x, y=$y, w=$width, h=$height")
                }
            }

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to update bounds: ${e.message}")
        }
    }

    fun destroyWebview(invoke: Invoke) {
        try {
            destroyExistingWebView()
            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to destroy webview: ${e.message}")
        }
    }

    /**
     * 注入 JavaScript 脚本（页面加载后执行）
     * 脚本会暂存，在 onPageFinished 时自动注入
     * 如果页面已加载完成，立即执行
     */
    fun injectScript(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(InjectScriptArgs::class.java)
            val script = args.script ?: return invoke.reject("Script is required")

            // 暂存脚本，等待页面加载完成时注入
            pendingPostScript = script

            if (pageLoaded) {
                webView?.evaluateJavascript(script, null)
                android.util.Log.d("MWebview", "Script injected immediately (page already loaded)")
            } else {
                android.util.Log.d("MWebview", "Script saved, will inject on page finished")
            }

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to inject script: ${e.message}")
        }
    }

    /**
     * 注入初始化脚本（页面加载前执行）
     */
    fun injectInitScript(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(InjectInitScriptArgs::class.java)
            val cssRules = args.cssRules ?: return invoke.reject("cssRules is required")

            val script = """
                (function() {
                    var style = document.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = `${cssRules.replace("`", "\\`")}`;
                    document.head.appendChild(style);
                    console.log('[MWebview] Initialization CSS injected');
                })();
            """.trimIndent()

            pendingInitScript = script

            // 如果 WebView 已加载页面，立即执行
            webView?.evaluateJavascript(script, null)
            android.util.Log.d("MWebview", "Init script saved")

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to inject init script: ${e.message}")
        }
    }

    fun webviewGoBack(invoke: Invoke) {
        try {
            webView?.let { wv ->
                if (wv.canGoBack()) {
                    wv.goBack()
                }
            }
            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to go back: ${e.message}")
        }
    }

    fun webviewCanGoBack(invoke: Invoke) {
        try {
            val canGoBack = webView?.canGoBack() ?: false
            val response = JSObject()
            response.put("canGoBack", canGoBack)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("Failed to check canGoBack: ${e.message}")
        }
    }

    private fun destroyExistingWebView() {
        webView?.let { wv ->
            try {
                val parent = wv.parent
                if (parent is ViewGroup) {
                    parent.removeView(wv)
                    android.util.Log.d("MWebview", "WebView removed from parent")
                }
                wv.stopLoading()
                wv.removeAllViews()
                wv.destroy()
                android.util.Log.d("MWebview", "WebView destroyed")
            } catch (e: Exception) {
                android.util.Log.e("MWebview", "Error destroying WebView", e)
            }
        }
        webView = null
        pendingInitScript = null
        pendingPostScript = null
        pageLoaded = false
    }
}
