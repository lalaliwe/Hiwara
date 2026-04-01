package com.plugin.navbar_style

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.webkit.WebView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class SetStyleArgs {
    var style: String? = null // "light" or "dark"
    var target: String? = null // "status", "navigation", "all"
    var statusBarColor: String? = null // Hex color code like "#FF0000"
    var navigationBarColor: String? = null // Hex color code like "#FFFFFF"
}

@TauriPlugin
class NavbarStylePlugin(private val activity: Activity): Plugin(activity) {
    
    private var insetsController: WindowInsetsControllerCompat? = null

    override fun load(webView: WebView) {
        super.load(webView)
        activity.window?.let { window ->
            insetsController = WindowCompat.getInsetsController(window, window.decorView)
        }
    }

    @Command
    fun setBarStyle(invoke: Invoke) {
        val args = invoke.parseArgs(SetStyleArgs::class.java)
        val style = args.style ?: "dark"
        val target = args.target ?: "all"
        val statusBarColor = args.statusBarColor
        val navigationBarColor = args.navigationBarColor

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    // "dark" style means we want dark text, which corresponds to Light Appearance (true)
                    // "light" style means we want light text, which corresponds to Dark Appearance (false)
                    val isLight = style == "dark"

                    // Set Status Bar
                    if (target == "status" || target == "all") {
                        insetsController?.isAppearanceLightStatusBars = isLight
                        
                        // Set status bar background color if provided
                        if (statusBarColor != null) {
                            val color = parseColor(statusBarColor)
                            window.statusBarColor = color
                            
                            // Android 6.0+ 可以控制状态栏文字颜色
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                // 如果设置了深色背景，自动调整为浅色文字
                                if (isDarkColor(color)) {
                                    insetsController?.isAppearanceLightStatusBars = false
                                } else {
                                    insetsController?.isAppearanceLightStatusBars = true
                                }
                            }
                        }
                    }
                    
                    // Set Navigation Bar
                    if (target == "navigation" || target == "all") {
                        insetsController?.isAppearanceLightNavigationBars = isLight
                        
                        // Set navigation bar background color if provided
                        if (navigationBarColor != null) {
                            val color = parseColor(navigationBarColor)
                            window.navigationBarColor = color
                            
                            // Android 8.0+ 可以控制导航栏文字颜色
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                // 如果设置了深色背景，自动调整为浅色文字
                                if (isDarkColor(color)) {
                                    insetsController?.isAppearanceLightNavigationBars = false
                                } else {
                                    insetsController?.isAppearanceLightNavigationBars = true
                                }
                            }
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
    
    /**
     * 解析十六进制颜色码
     */
    private fun parseColor(hexColor: String): Int {
        return try {
            val hex = hexColor.trimStart('#')
            when {
                hex.length == 6 -> Color.parseColor("#FF$hex") // 添加不透明度
                hex.length == 8 -> Color.parseColor("#$hex")
                else -> Color.BLACK
            }
        } catch (e: Exception) {
            Color.BLACK
        }
    }
    
    /**
     * 判断颜色是否为深色（用于自动调整文字颜色）
     * 返回 true 表示深色背景，需要浅色文字
     */
    private fun isDarkColor(color: Int): Boolean {
        val r = Color.red(color)
        val g = Color.green(color)
        val b = Color.blue(color)
        // 计算亮度：(R*299 + G*587 + B*114) / 1000
        val brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness < 128 // 亮度低于 128 认为是深色
    }
}
