package com.plugin.mwebview

import android.app.Activity
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import com.plugin.mwebview.handlers.WebviewHandler

@InvokeArg
class PingArgs {
    var value: String? = null
}

@InvokeArg
class CreateWebviewArgs {
    var url: String? = null
    var x: Double? = null
    var y: Double? = null
    var width: Double? = null
    var height: Double? = null
    var transparent: Boolean? = null
}

@InvokeArg
class UpdateWebviewBoundsArgs {
    var x: Double? = null
    var y: Double? = null
    var width: Double? = null
    var height: Double? = null
}

@InvokeArg
class InjectScriptArgs {
    var script: String? = null
}

@InvokeArg
class InjectInitScriptArgs {
    var cssRules: String? = null
}

@TauriPlugin
class MWebviewPlugin(private val activity: Activity) : Plugin(activity) {
    private val webviewHandler = WebviewHandler(activity)

    @Command
    fun ping(invoke: Invoke) {
        webviewHandler.ping(invoke)
    }

    @Command
    fun createWebview(invoke: Invoke) {
        webviewHandler.createWebview(invoke)
    }

    @Command
    fun updateWebviewBounds(invoke: Invoke) {
        webviewHandler.updateWebviewBounds(invoke)
    }

    @Command
    fun destroyWebview(invoke: Invoke) {
        webviewHandler.destroyWebview(invoke)
    }

    @Command
    fun injectScript(invoke: Invoke) {
        webviewHandler.injectScript(invoke)
    }

    @Command
    fun injectInitScript(invoke: Invoke) {
        webviewHandler.injectInitScript(invoke)
    }

    @Command
    fun webviewGoBack(invoke: Invoke) {
        webviewHandler.webviewGoBack(invoke)
    }

    @Command
    fun webviewCanGoBack(invoke: Invoke) {
        webviewHandler.webviewCanGoBack(invoke)
    }
}
