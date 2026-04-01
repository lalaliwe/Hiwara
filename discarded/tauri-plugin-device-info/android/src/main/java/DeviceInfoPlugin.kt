package com.plugin.device_info

import android.app.Activity
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

@InvokeArg
class PingArgs {
  var value: String? = null
}

@TauriPlugin
class DeviceInfoPlugin(private val activity: Activity): Plugin(activity) {
    
    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)
        val ret = JSObject()
        ret.put("value", args.value ?: "default value")
        invoke.resolve(ret)
    }
    
    @Command
    fun getDeviceInfo(invoke: Invoke) {
        val ret = JSObject()
        ret.put("osName", "Android")
        ret.put("osVersion", Build.VERSION.RELEASE)
        ret.put("deviceModel", Build.MODEL)
        ret.put("deviceManufacturer", Build.MANUFACTURER)
        invoke.resolve(ret)
    }
    
    @Command
    fun getNetworkInfo(invoke: Invoke) {
        val ret = JSObject()
        
        val connectivityManager = activity.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        
        if (network == null) {
            ret.put("isConnected", false)
            ret.put("networkType", "none")
            invoke.resolve(ret)
            return
        }
        
        ret.put("isConnected", true)
        
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        val networkType = when {
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "wifi"
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "ethernet"
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "cellular"
            else -> "unknown"
        }
        
        ret.put("networkType", networkType)
        invoke.resolve(ret)
    }
    
    @Command
    fun getBatteryInfo(invoke: Invoke) {
        val ret = JSObject()
        
        val batteryManager = activity.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val isCharging = batteryManager.isCharging
        
        ret.put("level", batteryLevel)
        ret.put("isCharging", isCharging)
        
        invoke.resolve(ret)
    }
}
