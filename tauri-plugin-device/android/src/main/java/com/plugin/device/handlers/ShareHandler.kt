package com.plugin.device.handlers

import android.app.Activity
import android.content.Intent
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class ShareArgs {
    var title: String? = null
    var text: String? = null
    var url: String? = null
}

class ShareHandler(private val activity: Activity) {

    fun share(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ShareArgs::class.java)
            val title = args.title ?: ""
            val text = args.text ?: ""
            val url = args.url ?: ""

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, text)
            }

            val chooser = Intent.createChooser(shareIntent, title.ifEmpty { null })
            activity.startActivity(chooser)

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }
}
