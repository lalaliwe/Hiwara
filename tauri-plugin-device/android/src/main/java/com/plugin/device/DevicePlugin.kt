package com.plugin.device

import android.app.Activity
import android.net.Uri
import android.provider.DocumentsContract
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.plugin.device.handlers.*

@TauriPlugin
class DevicePlugin(activity: Activity) : Plugin(activity) {

    private val deviceInfoHandler = DeviceInfoHandler(activity)
    private val immersiveHandler = ImmersiveHandler(activity)
    private val navbarStyleHandler = NavbarStyleHandler(activity)
    private val orientationHandler = OrientationHandler(activity)
    private val toastHandler = ToastHandler(activity)
    private val brightnessHandler = BrightnessHandler(activity)
    private val volumeHandler = VolumeHandler(activity)
    private val shareHandler = ShareHandler(activity)
    private val openFileHandler = OpenFileHandler(activity)

    // ===== 目录选择器 =====
    private var pendingInvoke: Invoke? = null
    private val compatActivity = activity as AppCompatActivity

    private val directoryPickerLauncher = compatActivity.activityResultRegistry.register(
        "device_plugin_directory_picker",
        ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        val invoke = pendingInvoke
        pendingInvoke = null

        if (uri == null) {
            invoke?.reject("User cancelled")
            return@register
        }

        try {
            activity.contentResolver.takePersistableUriPermission(
                uri,
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or
                        android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )

            val path = getPathFromUri(uri)
            val result = JSObject().apply {
                put("path", path ?: uri.toString())
            }
            invoke?.resolve(result)
        } catch (e: Exception) {
            invoke?.reject("Failed to process directory: ${e.message}")
        }
    }

    // 从文件路径转换为 SAF document URI（用于 EXTRA_INITIAL_URI）
    // /storage/emulated/0/Movies/iwara → content://com.android.externalstorage.documents/document/primary%3AMovies%2Fiwara
    private fun pathToInitialUri(path: String?): Uri? {
        if (path == null) return null
        return try {
            val relativePath = path.removePrefix("/storage/emulated/0/")
                .removePrefix("/storage/")
            if (relativePath.isBlank()) return null
            DocumentsContract.buildDocumentUri(
                "com.android.externalstorage.documents",
                "primary:$relativePath"
            )
        } catch (e: Exception) {
            null
        }
    }

    class PickFolderArgs {
        var initialPath: String? = null
    }

    @Command
    fun pickFolder(invoke: Invoke) {
        val args = invoke.parseArgs(PickFolderArgs::class.java)
        val initialUri = pathToInitialUri(args.initialPath)

        pendingInvoke = invoke
        try {
            directoryPickerLauncher.launch(initialUri)
        } catch (e: Exception) {
            pendingInvoke = null
            invoke.reject("Failed to open directory picker: ${e.message}")
        }
    }

    private fun getPathFromUri(uri: Uri): String? {
        return try {
            val docId = DocumentsContract.getTreeDocumentId(uri)
            val parts = docId.split(":")
            if (parts.size >= 2) {
                val type = parts[0]
                val path = parts.drop(1).joinToString(":")
                if (type.equals("primary", ignoreCase = true)) {
                    "/storage/emulated/0/$path"
                } else {
                    "/storage/$type/$path"
                }
            } else {
                uri.path
            }
        } catch (e: Exception) {
            uri.path
        }
    }

    // ===== Ping =====
    @Command
    fun ping(invoke: Invoke) {
        val ret = JSObject()
        ret.put("value", "pong")
        invoke.resolve(ret)
    }

    // ===== Device Info =====
    @Command
    fun getDeviceInfo(invoke: Invoke) = deviceInfoHandler.getDeviceInfo(invoke)

    @Command
    fun getNetworkInfo(invoke: Invoke) = deviceInfoHandler.getNetworkInfo(invoke)

    @Command
    fun getBatteryInfo(invoke: Invoke) = deviceInfoHandler.getBatteryInfo(invoke)

    // ===== Immersive =====
    fun loadWebView(webView: WebView) {
        immersiveHandler.load(webView)
        navbarStyleHandler.load(webView)
    }

    @Command
    fun enterImmersive(invoke: Invoke) = immersiveHandler.enterImmersive(invoke)

    @Command
    fun exitImmersive(invoke: Invoke) = immersiveHandler.exitImmersive(invoke)

    // ===== Navbar Style =====
    @Command
    fun setStatusBarTextStyle(invoke: Invoke) = navbarStyleHandler.setStatusBarTextStyle(invoke)

    @Command
    fun setNavigationBarButtonStyle(invoke: Invoke) = navbarStyleHandler.setNavigationBarButtonStyle(invoke)

    @Command
    fun setStatusBarBackgroundColor(invoke: Invoke) = navbarStyleHandler.setStatusBarBackgroundColor(invoke)

    @Command
    fun setNavigationBarBackgroundColor(invoke: Invoke) = navbarStyleHandler.setNavigationBarBackgroundColor(invoke)

    // ===== Orientation =====
    @Command
    fun lockOrientation(invoke: Invoke) = orientationHandler.lockOrientation(invoke)

    @Command
    fun unlockOrientation(invoke: Invoke) = orientationHandler.unlockOrientation(invoke)

    // ===== Toast =====
    @Command
    fun showToast(invoke: Invoke) = toastHandler.showToast(invoke)

    // ===== Brightness =====
    @Command
    fun setScreenBrightness(invoke: Invoke) = brightnessHandler.setScreenBrightness(invoke)

    @Command
    fun getScreenBrightness(invoke: Invoke) = brightnessHandler.getScreenBrightness(invoke)

    // ===== Volume =====
    @Command
    fun setVolume(invoke: Invoke) = volumeHandler.setVolume(invoke)

    @Command
    fun getVolume(invoke: Invoke) = volumeHandler.getVolume(invoke)

    // ===== Share =====
    @Command
    fun share(invoke: Invoke) = shareHandler.share(invoke)

    // ===== Open File =====
    @Command
    fun openFile(invoke: Invoke) = openFileHandler.openFile(invoke)
}
