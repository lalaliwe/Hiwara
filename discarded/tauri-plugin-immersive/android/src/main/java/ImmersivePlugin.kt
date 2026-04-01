package com.plugin.immersive

import android.app.Activity
import android.webkit.WebView  // 添加这个导入
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@TauriPlugin
class ImmersivePlugin(private val activity: Activity): Plugin(activity) {
    private var insetsController: WindowInsetsControllerCompat? = null

    // 注意：参数类型是 WebView，不是 View
    override fun load(webView: WebView) {
        super.load(webView)
        activity.window?.let { window ->
            insetsController = WindowCompat.getInsetsController(window, window.decorView)
        }
    }

    @Command
    fun enterImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    // 1. 允许内容延伸到系统栏下方
                    WindowCompat.setDecorFitsSystemWindows(window, false)
                    
                    // 2. 隐藏状态栏和导航栏
                    insetsController?.hide(WindowInsetsCompat.Type.systemBars())
                    
                    // 3. 设置行为：滑动边缘时临时显示系统栏
                    insetsController?.systemBarsBehavior =
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
                
                val ret = JSObject()
                ret.put("success", true)
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }

    @Command
    fun exitImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    // 恢复系统栏显示
                    WindowCompat.setDecorFitsSystemWindows(window, true)
                    insetsController?.show(WindowInsetsCompat.Type.systemBars())
                }
                
                val ret = JSObject()
                ret.put("success", true)
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }
}
