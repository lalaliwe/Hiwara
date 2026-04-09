package com.plugin.device.handlers

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.webkit.WebView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class SetStatusBarTextStyleArgs {
    var style: String? = null
}

class SetNavigationBarButtonStyleArgs {
    var style: String? = null
}

class SetStatusBarBackgroundColorArgs {
    var color: String? = null
}

class SetNavigationBarBackgroundColorArgs {
    var color: String? = null
}

class NavbarStyleHandler(private val activity: Activity) {
    
    private var insetsController: WindowInsetsControllerCompat? = null

    fun load(webView: WebView) {
        activity.window?.let { window ->
            insetsController = WindowCompat.getInsetsController(window, window.decorView)
        }
    }

    fun setStatusBarTextStyle(invoke: Invoke) {
        val args = invoke.parseArgs(SetStatusBarTextStyleArgs::class.java)
        val style = args.style ?: "dark"

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    val isLight = style == "dark"
                    insetsController?.isAppearanceLightStatusBars = isLight

                    val ret = JSObject()
                    ret.put("success", true)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }

    fun setNavigationBarButtonStyle(invoke: Invoke) {
        val args = invoke.parseArgs(SetNavigationBarButtonStyleArgs::class.java)
        val style = args.style ?: "dark"

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    val isLight = style == "dark"
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        insetsController?.isAppearanceLightNavigationBars = isLight
                    }

                    val ret = JSObject()
                    ret.put("success", true)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }

    fun setStatusBarBackgroundColor(invoke: Invoke) {
        val args = invoke.parseArgs(SetStatusBarBackgroundColorArgs::class.java)
        val colorHex = args.color

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    if (colorHex != null) {
                        val color = parseColor(colorHex)
                        window.statusBarColor = color
                        
                        // 根据背景色亮度自动调整文字颜色
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            val isDark = isDarkColor(color)
                            insetsController?.isAppearanceLightStatusBars = !isDark
                        }
                    }

                    val ret = JSObject()
                    ret.put("success", true)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }

    fun setNavigationBarBackgroundColor(invoke: Invoke) {
        val args = invoke.parseArgs(SetNavigationBarBackgroundColorArgs::class.java)
        val colorHex = args.color

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    if (colorHex != null) {
                        val color = parseColor(colorHex)
                        window.navigationBarColor = color
                        
                        // 根据背景色亮度自动调整按钮颜色
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            val isDark = isDarkColor(color)
                            insetsController?.isAppearanceLightNavigationBars = !isDark
                        }
                    }

                    val ret = JSObject()
                    ret.put("success", true)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Unknown error")
            }
        }
    }
    
    private fun parseColor(hexColor: String): Int {
        return try {
            val hex = hexColor.trimStart('#')
            when {
                hex.length == 6 -> Color.parseColor("#FF$hex")
                hex.length == 8 -> Color.parseColor("#$hex")
                else -> Color.BLACK
            }
        } catch (e: Exception) {
            Color.BLACK
        }
    }
    
    private fun isDarkColor(color: Int): Boolean {
        val r = Color.red(color)
        val g = Color.green(color)
        val b = Color.blue(color)
        val brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness < 128
    }
}
