package com.plugin.device.handlers

import android.app.Activity
import android.content.pm.ActivityInfo
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class LockRequest {
    var orientation: String? = null
}

class OrientationHandler(private val activity: Activity) {

    fun lockOrientation(invoke: Invoke) {
        val args = invoke.parseArgs(LockRequest::class.java)

        val orientationConstant = when (args.orientation?.lowercase()) {
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            else -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }

        activity.requestedOrientation = orientationConstant

        val ret = JSObject()
        ret.put("success", true)
        invoke.resolve(ret)
    }

    fun unlockOrientation(invoke: Invoke) {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR

        val ret = JSObject()
        ret.put("success", true)
        invoke.resolve(ret)
    }
}
