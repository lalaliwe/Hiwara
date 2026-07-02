package com.plugin.device.handlers

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import java.io.File

class OpenFileArgs {
    var path: String? = null
}

class OpenFileHandler(private val activity: Activity) {

    fun openFile(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(OpenFileArgs::class.java)
            val filePath = args.path ?: ""

            if (filePath.isEmpty()) {
                invoke.reject("文件路径为空")
                return
            }

            val file = File(filePath)
            if (!file.exists()) {
                invoke.reject("文件不存在: $filePath")
                return
            }

            // 获取文件扩展名并确定 MIME 类型
            val mimeType = getMimeType(file.extension)

            // 使用主应用 AndroidManifest.xml 中声明的 FileProvider 生成 content:// URI
            // authority 格式: ${applicationId}.fileprovider
            val uri: Uri = try {
                FileProvider.getUriForFile(
                    activity,
                    "${activity.packageName}.fileprovider",
                    file
                )
            } catch (e: IllegalArgumentException) {
                // FileProvider 未配置或路径不匹配，回退到 file:// URI
                // （Android 7 以下可使用，7+ 可能抛出 FileUriExposedException）
                Uri.fromFile(file)
            }

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mimeType)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // 检查是否有 Activity 可以处理该 Intent
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
            } else {
                // 无应用可打开，尝试使用通用类型
                val fallbackIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "video/*")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(Intent.createChooser(fallbackIntent, "打开文件"))
            }

            val response = JSObject()
            response.put("success", true)
            invoke.resolve(response)
        } catch (e: Exception) {
            invoke.reject("打开文件失败: ${e.message}")
        }
    }

    private fun getMimeType(extension: String): String {
        return when (extension.lowercase()) {
            "mp4" -> "video/mp4"
            "webm" -> "video/webm"
            "mkv" -> "video/x-matroska"
            "avi" -> "video/x-msvideo"
            "mov" -> "video/quicktime"
            "flv" -> "video/x-flv"
            "3gp" -> "video/3gpp"
            "m4v" -> "video/x-m4v"
            "mpg", "mpeg" -> "video/mpeg"
            "ts" -> "video/mp2t"
            "wmv" -> "video/x-ms-wmv"
            "ogg" -> "video/ogg"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "gif" -> "image/gif"
            "webp" -> "image/webp"
            "bmp" -> "image/bmp"
            "mp3" -> "audio/mpeg"
            "wav" -> "audio/wav"
            "flac" -> "audio/flac"
            "aac" -> "audio/aac"
            "m4a" -> "audio/mp4"
            "wma" -> "audio/x-ms-wma"
            "pdf" -> "application/pdf"
            else -> "*/*"
        }
    }
}
