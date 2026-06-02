package com.plugin.device.handlers

import android.app.Activity
import android.content.Context
import android.media.AudioManager
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

class VolumeHandler(private val activity: Activity) {
    private val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun setVolume(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(SetVolumeArgs::class.java)
            val volume = args.volume.toFloat().coerceIn(0f, 1f)
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val targetVolume = Math.round(volume * maxVolume)

            audioManager.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                targetVolume,
                0 // 不显示系统音量 UI，由应用自身的手势提示替代
            )

            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "设置音量失败")
        }
    }

    fun getVolume(invoke: Invoke) {
        try {
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val normalizedVolume = if (maxVolume > 0) currentVolume.toDouble() / maxVolume else 0.0

            val ret = JSObject()
            ret.put("volume", normalizedVolume)
            ret.put("maxVolume", maxVolume.toDouble())
            invoke.resolve(ret)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "获取音量失败")
        }
    }
}

class SetVolumeArgs {
    var volume: Double = 0.5
}
