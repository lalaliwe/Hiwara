package com.plugin.device.handlers

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.webkit.WebView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class SetStyleArgs {
    var style: String? = null
    var target: String? = null
    var statusBarColor: String? = null
    var navigationBarColor: String? = null
}

class NavbarStyleHandler(private val activity: Activity) {
    
    private var insetsController: WindowInsetsControllerCompat? = null

    fun load(webView: WebView) {
        activity.window?.let { window ->
            insetsController = WindowCompat.getInsetsController(window, window.decorView)
        }
    }

    fun setBarStyle(invoke: Invoke) {
        val args = invoke.parseArgs(SetStyleArgs::class.java)
        val style = args.style ?: "dark"
        val target = args.target ?: "all"
        val statusBarColor = args.statusBarColor
        val navigationBarColor = args.navigationBarColor

        activity.runOnUiThread {
            try {
                activity.window?.let { window ->
                    val isLight = style == "dark"

                    if (target == "status" || target == "all") {
                        insetsController?.isAppearanceLightStatusBars = isLight
                        
                        if (statusBarColor != null) {
                            val color = parseColor(statusBarColor)
                            window.statusBarColor = color
                            
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                if (isDarkColor(color)) {
                                    insetsController?.isAppearanceLightStatusBars = false
                                } else {
                                    insetsController?.isAppearanceLightStatusBars = true
                                }
                            }
                        }
                    }
                    
                    if (target == "navigation" || target == "all") {
                        insetsController?.isAppearanceLightNavigationBars = isLight
                        
                        if (navigationBarColor != null) {
                            val color = parseColor(navigationBarColor)
                            window.navigationBarColor = color
                            
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
