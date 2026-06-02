package com.plugin.device.handlers

import android.app.Activity
import android.view.WindowManager
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class BrightnessHandler(private val activity: Activity) {

    fun setScreenBrightness(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                val args = invoke.parseArgs(SetBrightnessArgs::class.java)
                val brightness = args.brightness.toFloat().coerceIn(-1f, 1f)

                val layout = activity.window.attributes
                layout.screenBrightness = brightness
                activity.window.attributes = layout

                val ret = JSObject()
                ret.put("success", true)
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "设置亮度失败")
            }
        }
    }

    fun getScreenBrightness(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                val currentBrightness = activity.window.attributes.screenBrightness
                val ret = JSObject()
                ret.put("brightness", currentBrightness.toDouble())
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "获取亮度失败")
            }
        }
    }
}

class SetBrightnessArgs {
    var brightness: Double = 1.0
}
