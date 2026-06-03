# ============================================================
# Windows 打包脚本
# 支持架构: x86 (32-bit), x64, ARM64
# ============================================================

$architectures = @(
    "i686-pc-windows-msvc",       # x86 (32-bit)
    "x86_64-pc-windows-msvc",     # x64 (64-bit)
    "aarch64-pc-windows-msvc"     # ARM64
)

# ============================================================
# 第一步：自动安装缺失的 Rust target
# ============================================================
Write-Host "========================================"
Write-Host "检查并安装缺失的 Rust target..."
Write-Host "========================================"

$installed = rustup target list --installed
foreach ($arch in $architectures) {
    if ($installed -match "^$arch$") {
        Write-Host "[✓] $arch 已安装"
    } else {
        Write-Host "[ ] $arch 未安装，正在安装..."
        rustup target add $arch
        Write-Host "[✓] $arch 安装完成"
    }
}
Write-Host ""

# ============================================================
# 第二步：打包
# ============================================================

# Windows x86_64
npx tauri build --target x86_64-pc-windows-msvc

# Windows ARM64
npx tauri build --target aarch64-pc-windows-msvc

# Windows x86 (32-bit)
npx tauri build --target i686-pc-windows-msvc

# Android (APK, split per ABI)
npm run tauri android build -- --apk --split-per-abi
