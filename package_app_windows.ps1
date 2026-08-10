# ============================================================
# Windows 打包脚本
# 支持架构: x86 (32-bit), x64, ARM64
# 支持格式: nsis (.exe), msi (.msi)
# 输出目录: release/
# 输出文件: hiwara_{version}_win_{arch}.exe / .msi
#
# 使用方式:
#   .\package_app_windows.ps1                              # 全部架构 + 全部格式
#   .\package_app_windows.ps1 --arch x64                   # 仅 x64
#   .\package_app_windows.ps1 --arch x64 arm64             # x64 + ARM64
#   .\package_app_windows.ps1 --bundle nsis                # 仅 NSIS (.exe)
#   .\package_app_windows.ps1 --arch x64 --bundle nsis msi # 组合
# ============================================================

# ============================================================
# 参数解析
# ============================================================
$BUILD_X86 = $false
$BUILD_X64 = $false
$BUILD_ARM64 = $false
$BUNDLES = @()

# 解析命名参数
$i = 0
while ($i -lt $args.Length) {
    switch ($args[$i]) {
        "--arch" {
            $i++
            while ($i -lt $args.Length -and $args[$i] -notlike "--*") {
                switch ($args[$i]) {
                    "x86"   { $BUILD_X86 = $true }
                    "x64"   { $BUILD_X64 = $true }
                    "arm64" { $BUILD_ARM64 = $true }
                    default { Write-Host "[!] 不支持的架构: $($args[$i]) (可用: x86, x64, arm64)"; exit 1 }
                }
                $i++
            }
        }
        "--bundle" {
            $i++
            while ($i -lt $args.Length -and $args[$i] -notlike "--*") {
                switch ($args[$i]) {
                    "nsis" { $BUNDLES += "nsis" }
                    "msi"  { $BUNDLES += "msi" }
                    default { Write-Host "[!] 不支持的格式: $($args[$i]) (可用: nsis, msi)"; exit 1 }
                }
                $i++
            }
        }
        "-h" {
            Write-Host "使用方式: .\package_app_windows.ps1 [选项]"
            Write-Host "  --arch x86|x64|arm64    指定架构（可多个，默认全部）"
            Write-Host "  --bundle nsis|msi       指定格式（可多个，默认全部）"
            Write-Host "  -h                      显示此帮助"
            exit 0
        }
        default {
            Write-Host "[!] 未知参数: $($args[$i]) (使用 --arch, --bundle, 或 -h)"
            exit 1
        }
    }
}

# 默认值（未指定架构时构建全部）
if (-not $BUILD_X86 -and -not $BUILD_X64 -and -not $BUILD_ARM64) {
    $BUILD_X86 = $true
    $BUILD_X64 = $true
    $BUILD_ARM64 = $true
}
if ($BUNDLES.Count -eq 0) {
    $BUNDLES = @("nsis", "msi")
}

$architectures = @()
if ($BUILD_X86)    { $architectures += "i686-pc-windows-msvc" }
if ($BUILD_X64)    { $architectures += "x86_64-pc-windows-msvc" }
if ($BUILD_ARM64)  { $architectures += "aarch64-pc-windows-msvc" }

# 输出目录
$releaseDir = "release"

# 从 tauri.conf.json 读取版本号
$version = (Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).version

# 确保输出目录存在
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# 架构简称映射
$archMap = @{
    "i686-pc-windows-msvc"        = "x86"
    "x86_64-pc-windows-msvc"      = "x64"
    "aarch64-pc-windows-msvc"     = "arm64"
}

# 架构→Tauri 输出中的架构标记映射
$nsisArchMap = @{
    "i686-pc-windows-msvc"        = "x86"
    "x86_64-pc-windows-msvc"      = "x64"
    "aarch64-pc-windows-msvc"     = "arm64"
}

Write-Host "[i] 架构: $([string]::Join(' ', $architectures))"
Write-Host "[i] 格式: $($BUNDLES -join ' ')"
Write-Host "[i] 版本: $version"
Write-Host ""

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
# 第二步：打包 + 重命名到 release/
# ============================================================

$successCount = 0
$failCount = 0

foreach ($arch in $architectures) {
    $shortArch = $archMap[$arch]
    $nsisTag = $nsisArchMap[$arch]

    Write-Host "========================================"
    Write-Host "构建: $arch  →  win_${shortArch}"
    if ($BUNDLES -contains "nsis") { Write-Host "  → release/hiwara_${version}_win_${shortArch}.exe" }
    if ($BUNDLES -contains "msi")  { Write-Host "  → release/hiwara_${version}_win_${shortArch}.msi" }
    Write-Host "========================================"

    # 打包
    npx tauri build --target $arch

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] $arch 打包失败"
        $failCount++
        continue
    }

    $archSuccess = $false

    # ── NSIS .exe ──
    if ($BUNDLES -contains "nsis") {
        $exePath = "$releaseDir/hiwara_${version}_win_${shortArch}.exe"
        $nsisExe = "src-tauri/target/$arch/release/bundle/nsis/Hiwara_${version}_${nsisTag}-setup.exe"
        if (Test-Path $nsisExe) {
            Copy-Item $nsisExe $exePath -Force
            Write-Host "[✓] $exePath ($([math]::Round((Get-Item $exePath).Length / 1MB, 2)) MB)"
            $archSuccess = $true
        } else {
            $altExe = Get-ChildItem "src-tauri/target/$arch/release/bundle/nsis/*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($altExe) {
                Copy-Item $altExe.FullName $exePath -Force
                Write-Host "[✓] $exePath (备选) ($([math]::Round((Get-Item $exePath).Length / 1MB, 2)) MB)"
                $archSuccess = $true
            } else {
                Write-Host "[!] NSIS .exe 未找到"
            }
        }
    }

    # ── MSI ──
    if ($BUNDLES -contains "msi") {
        $msiPath = "$releaseDir/hiwara_${version}_win_${shortArch}.msi"
        $msiFile = "src-tauri/target/$arch/release/bundle/msi/Hiwara_${version}_${nsisTag}_en-US.msi"
        if (Test-Path $msiFile) {
            Copy-Item $msiFile $msiPath -Force
            Write-Host "[✓] $msiPath ($([math]::Round((Get-Item $msiPath).Length / 1MB, 2)) MB)"
            $archSuccess = $true
        } else {
            $altMsi = Get-ChildItem "src-tauri/target/$arch/release/bundle/msi/*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($altMsi) {
                Copy-Item $altMsi.FullName $msiPath -Force
                Write-Host "[✓] $msiPath (备选) ($([math]::Round((Get-Item $msiPath).Length / 1MB, 2)) MB)"
                $archSuccess = $true
            } else {
                Write-Host "[!] MSI 未找到"
            }
        }
    }

    if ($archSuccess) { $successCount++ } else { $failCount++ }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Windows 打包完成"
Write-Host "输出目录: $releaseDir/"
Write-Host "成功: $successCount | 失败: $failCount"
Write-Host "========================================"
if ($failCount -gt 0) { exit 1 }
