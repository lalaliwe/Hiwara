package com.qisato.hiwara

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowInsetsControllerCompat
import android.webkit.WebView
import android.graphics.Color

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // 禁用 WebView 硬件加速以解决模拟器 Mesa 驱动问题
    WebView.setWebContentsDebuggingEnabled(true)
    
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    
    // 设置 WebView 背景色与启动图保持一致（青绿色）
    window.decorView.setBackgroundColor(getColor(R.color.initial_color))
    
    // 设置导航栏颜色为
    window.navigationBarColor = getColor(R.color.initial_color)
    
    // 设置导航栏和状态栏图标颜色为白色（因为背景是深色）
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.isAppearanceLightNavigationBars = false
    controller.isAppearanceLightStatusBars = false
  }
  
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    // 确保 WebView 初始背景色为青绿色
    webView.setBackgroundColor(getColor(R.color.initial_color))
  }
}