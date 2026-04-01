package com.plugin.orientation // 注意：请保留你文件原本第一行的 package 名，不要改这里！

import android.app.Activity
import android.content.pm.ActivityInfo
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

// 定义请求参数结构，对应 Rust 的 LockRequest
@InvokeArg
class LockRequest {
    var orientation: String? = null
}

@TauriPlugin
class OrientationPlugin(private val activity: Activity) : Plugin(activity) {

    @Command
    fun lockOrientation(invoke: Invoke) {
        val args = invoke.parseArgs(LockRequest::class.java)

        // 根据前端传入的字符串，匹配 Android 的屏幕方向常量
        val orientationConstant = when (args.orientation?.lowercase()) {
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            else -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT // 默认竖屏
        }

        // 核心逻辑：设置 Activity 的方向
        activity.requestedOrientation = orientationConstant

        // 返回成功结果给前端
        val ret = JSObject()
        ret.put("success", true)
        invoke.resolve(ret)
    }

    @Command
    fun unlockOrientation(invoke: Invoke) {
        // 解锁：设置为自动旋转
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR

        // 返回成功结果给前端
        val ret = JSObject()
        ret.put("success", true)
        invoke.resolve(ret)
    }
}
