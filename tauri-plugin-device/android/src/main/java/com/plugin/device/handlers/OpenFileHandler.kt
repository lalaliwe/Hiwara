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

            // 对 URI 进行二次编码处理，确保文件名中的特殊字符（【】！　〇[]! 等）
            // 被正确 percent-encoded，避免外部播放器解析崩溃
            val safeUri = ensureUriEncoded(uri, file.name)

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(safeUri, mimeType)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // 检查是否有默认 Activity 可以处理该 Intent
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
            } else {
                // 无应用可打开，尝试使用通用类型
                val fallbackIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(safeUri, "video/*")
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

    /**
     * 确保 content:// URI 的路径部分被正确 percent-encoded。
     * FileProvider 在某些 Android 版本上可能未对 CJK 特殊字符（如【】〇！　等）
     * 完全编码，导致外部播放器收到含非法字符的 URI 而崩溃。
     */
    private fun ensureUriEncoded(uri: Uri, fileName: String): Uri {
        if (uri.scheme != "content") {
            return uri // file:// URI 不做处理
        }
        return try {
            val originalPath = uri.encodedPath ?: return uri
            // 对文件名部分进行独立编码，确保所有特殊字符被转义
            val encodedFileName = Uri.encode(fileName)
            // 用编码后的文件名替换原路径中的文件名部分
            val safePath = originalPath.replace(fileName, encodedFileName)
            // 重建 URI
            Uri.Builder()
                .scheme(uri.scheme)
                .authority(uri.authority ?: "")
                .encodedPath(safePath)
                .build()
        } catch (e: Exception) {
            uri // 出错时返回原始 URI
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
