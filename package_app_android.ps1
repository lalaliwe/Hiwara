# ============================================================
# Android 打包脚本
# 生成 split-per-abi APK
# ============================================================

Write-Host "========================================"
Write-Host "开始打包 Android APK (split per ABI)..."
Write-Host "========================================"

# Android (APK, split per ABI)
npm run tauri android build -- --apk --split-per-abi

Write-Host ""
Write-Host "========================================"
Write-Host "Android 打包完成"
Write-Host "========================================"
