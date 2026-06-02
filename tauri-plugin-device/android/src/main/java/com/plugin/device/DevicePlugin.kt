package com.plugin.device

import android.app.Activity
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import com.plugin.device.handlers.BrightnessHandler
import com.plugin.device.handlers.DeviceInfoHandler
import com.plugin.device.handlers.ImmersiveHandler
import com.plugin.device.handlers.NavbarStyleHandler
import com.plugin.device.handlers.OrientationHandler
import com.plugin.device.handlers.ToastHandler
import com.plugin.device.handlers.VolumeHandler

@InvokeArg
class PingArgs {
  var value: String? = null
}

@TauriPlugin
class DevicePlugin(private val activity: Activity): Plugin(activity) {
    private val deviceInfoHandler = DeviceInfoHandler(activity)
    private val immersiveHandler = ImmersiveHandler(activity)
    private val navbarStyleHandler = NavbarStyleHandler(activity)
    private val orientationHandler = OrientationHandler(activity)
    private val toastHandler = ToastHandler(activity)
    private val brightnessHandler = BrightnessHandler(activity)
    private val volumeHandler = VolumeHandler(activity)

    override fun load(webView: WebView) {
        super.load(webView)
        immersiveHandler.load(webView)
        navbarStyleHandler.load(webView)
    }

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)
        val ret = JSObject()
        ret.put("value", args.value ?: "default value")
        invoke.resolve(ret)
    }

    @Command
    fun getDeviceInfo(invoke: Invoke) {
        deviceInfoHandler.getDeviceInfo(invoke)
    }

    @Command
    fun getNetworkInfo(invoke: Invoke) {
        deviceInfoHandler.getNetworkInfo(invoke)
    }

    @Command
    fun getBatteryInfo(invoke: Invoke) {
        deviceInfoHandler.getBatteryInfo(invoke)
    }

    @Command
    fun enterImmersive(invoke: Invoke) {
        immersiveHandler.enterImmersive(invoke)
    }

    @Command
    fun exitImmersive(invoke: Invoke) {
        immersiveHandler.exitImmersive(invoke)
    }

    @Command
    fun setStatusBarTextStyle(invoke: Invoke) {
        navbarStyleHandler.setStatusBarTextStyle(invoke)
    }

    @Command
    fun setNavigationBarButtonStyle(invoke: Invoke) {
        navbarStyleHandler.setNavigationBarButtonStyle(invoke)
    }

    @Command
    fun setStatusBarBackgroundColor(invoke: Invoke) {
        navbarStyleHandler.setStatusBarBackgroundColor(invoke)
    }

    @Command
    fun setNavigationBarBackgroundColor(invoke: Invoke) {
        navbarStyleHandler.setNavigationBarBackgroundColor(invoke)
    }

    @Command
    fun lockOrientation(invoke: Invoke) {
        orientationHandler.lockOrientation(invoke)
    }

    @Command
    fun unlockOrientation(invoke: Invoke) {
        orientationHandler.unlockOrientation(invoke)
    }

    @Command
    fun showToast(invoke: Invoke) {
        toastHandler.showToast(invoke)
    }

    @Command
    fun moveTaskToBack(invoke: Invoke) {
        try {
            // Move the task to the background (minimize app)
            val result = activity.moveTaskToBack(true)
            
            val response = JSObject()
            response.put("success", result)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun setScreenBrightness(invoke: Invoke) {
        brightnessHandler.setScreenBrightness(invoke)
    }

    @Command
    fun getScreenBrightness(invoke: Invoke) {
        brightnessHandler.getScreenBrightness(invoke)
    }

    @Command
    fun setVolume(invoke: Invoke) {
        volumeHandler.setVolume(invoke)
    }

    @Command
    fun getVolume(invoke: Invoke) {
        volumeHandler.getVolume(invoke)
    }
}
