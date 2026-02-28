package com.qisato.hiwara

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    
    // 设置导航栏颜色为 #00796B
    window.navigationBarColor = getColor(R.color.navigation_bar_color)
    
    // 设置导航栏图标颜色为白色（因为背景是深色）
    WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightNavigationBars = false
  }
}