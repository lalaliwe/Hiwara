# ============================================================
# Android 打包脚本
# 生成 split-per-abi APK
# 输出目录: release/
# 输出文件: hiwara_{version}_android_{arch}.apk
# ============================================================

Write-Host "========================================"
Write-Host "开始打包 Android APK (split per ABI)..."
Write-Host "========================================"

# 输出目录
$releaseDir = "release"

# 从 tauri.conf.json 读取版本号
$version = (Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).version

# 确保输出目录存在
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# Android (APK, split per ABI)
npm run tauri android build -- --apk --split-per-abi

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Android 构建失败"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "重命名 APK 文件到 $releaseDir/ ..."
Write-Host "========================================"

# ABI → 简称映射
$abiMap = @{
    "arm64-v8a"    = "arm64"
    "armeabi-v7a"  = "arm32"
    "x86_64"       = "x64"
    "x86"          = "x86"
}

$apkDir = "src-tauri/gen/android/app/build/outputs/apk"

# 查找所有 split APK
$apks = Get-ChildItem -Path $apkDir -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue

$successCount = 0
foreach ($apk in $apks) {
    foreach ($abi in $abiMap.Keys) {
        if ($apk.FullName -match $abi) {
            $shortArch = $abiMap[$abi]
            $outputPath = "$releaseDir/hiwara_${version}_android_${shortArch}.apk"
            Copy-Item $apk.FullName $outputPath -Force
            Write-Host "[✓] $outputPath ($([math]::Round((Get-Item $outputPath).Length / 1MB, 2)) MB)"
            $successCount++
            break
        }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Android 打包完成"
Write-Host "输出目录: $releaseDir/"
Write-Host "共重命名 $successCount 个 APK"
Write-Host "========================================"
