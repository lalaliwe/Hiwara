package com.qisato.hiwara

import android.os.Bundle
import android.view.View
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // 禁用 WebView 硬件加速以解决模拟器 Mesa 驱动问题
    WebView.setWebContentsDebuggingEnabled(true)
    
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    
    // 设置 WebView 背景色，与启动画面背景色保持一致
    window.decorView.setBackgroundColor(getColor(R.color.bg_color))
  }
  
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    
    // 确保 WebView 背景色与启动画面一致，避免出现黑屏或白屏闪烁
    webView.setBackgroundColor(getColor(R.color.bg_color))
  }
}
