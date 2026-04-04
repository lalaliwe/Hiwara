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

    fun enterImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    WindowCompat.setDecorFitsSystemWindows(window, false)
                    insetsController?.hide(WindowInsetsCompat.Type.systemBars())
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

    fun exitImmersive(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
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
