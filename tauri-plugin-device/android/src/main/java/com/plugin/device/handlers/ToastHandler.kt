package com.plugin.device.handlers

import android.app.Activity
import android.widget.Toast
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class ToastArgs {
    var message: String? = null
    var duration: String? = null
}

class ToastHandler(private val activity: Activity) {

    fun showToast(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ToastArgs::class.java)
            val message = args.message ?: return invoke.reject("Message is required")
            val durationStr = args.duration ?: "short" 

            // Determine toast duration
            val duration = if (durationStr.lowercase() == "long") {
                Toast.LENGTH_LONG
            } else {
                Toast.LENGTH_SHORT
            }

            // Create and show the toast
            val toast = Toast.makeText(activity, message, duration)
            toast.show()

            // Return success response
            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }
}