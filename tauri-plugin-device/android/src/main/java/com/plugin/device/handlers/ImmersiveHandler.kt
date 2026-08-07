package com.plugin.device.handlers

import android.app.Activity
import android.webkit.WebView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

class ImmersiveHandler(private val activity: Activity) {
    private var insetsController: WindowInsetsControllerCompat? = null

    fun load(webView: WebView) {
        activity.window?.let { window ->
            insetsController = WindowCompat.getInsetsController(window, window.decorView)
        }
    }

    // 惰性获取系统栏 InsetsController：即使 load() 未被调用也能正常隐藏/显示系统栏，
    // 否则 insetsController 为 null 时 hide()/show() 会静默失效，导致全屏播放状态栏无法隐藏。
    private fun getInsetsController(): WindowInsetsControllerCompat? {
        insetsController?.let { return it }
        return activity.window?.let { window ->
            WindowCompat.getInsetsController(window, window.decorView).also {
                insetsController = it
            }
        }
    }

    fun enterImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    WindowCompat.setDecorFitsSystemWindows(window, false)
                    getInsetsController()?.hide(WindowInsetsCompat.Type.systemBars())
                    getInsetsController()?.systemBarsBehavior =
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

    fun exitImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    WindowCompat.setDecorFitsSystemWindows(window, true)
                    getInsetsController()?.show(WindowInsetsCompat.Type.systemBars())
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
