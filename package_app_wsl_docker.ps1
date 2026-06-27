# ============================================================
# WSL Docker 打包脚本 (PowerShell)
# 通过 WSL 中的 Docker 构建 Linux 多架构包
# 底层调用 package_app_linux_docker.sh
# 输出目录: release/
# 输出文件: hiwara_{version}_linux_{arch}.{deb,rpm,AppImage}
# ============================================================

Write-Host "========================================"
Write-Host "WSL Docker 打包脚本"
Write-Host "通过 WSL 中的 Docker 构建 Linux 多架构包"
Write-Host "========================================"
Write-Host ""

# ============================================================
# 第一步：检查 WSL 是否可用
# ============================================================
Write-Host "检查 WSL 环境..."
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] WSL 不可用，请确保已安装 WSL"
        Write-Host "  安装命令: wsl --install"
        exit 1
    }
    Write-Host "[✓] WSL 可用"
} catch {
    Write-Host "[✗] WSL 未安装或无法访问"
    Write-Host "  请确保已安装 WSL: wsl --install"
    exit 1
}

# ============================================================
# 第二步：检查 WSL 中 Docker 是否可用
# ============================================================
Write-Host "检查 WSL 中 Docker..."
try {
    $dockerCheck = wsl docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] WSL 中 Docker 不可用"
        Write-Host "  请确保已在 WSL 中安装 Docker"
        Write-Host "  或在 Docker Desktop 中启用 WSL2 集成"
        exit 1
    }
    Write-Host "[✓] WSL 中 Docker 可用"
} catch {
    Write-Host "[✗] Docker 检查失败"
    exit 1
}

# ============================================================
# 第三步：转换 Windows 路径为 WSL 路径
# ============================================================
Write-Host "转换路径..."
$winPath = (Get-Location).Path  # 例如 C:\Users\Qisato\Desktop\Code\hiwara

# 尝试使用 wslpath 转换
$wslProjectPath = wsl wslpath "$winPath" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($wslProjectPath)) {
    # 手动转换：C:\Users\... → /mnt/c/Users/...
    $drive = $winPath.Substring(0, 1).ToLower()
    $rest = $winPath.Substring(3)  # 跳过 "C:\"
    $wslProjectPath = "/mnt/$drive/$rest" -replace '\\', '/'
}
$wslProjectPath = $wslProjectPath.Trim('"').Trim()

Write-Host "[i] Windows 路径: $winPath"
Write-Host "[i] WSL 路径:     $wslProjectPath"

# 验证 WSL 中路径是否存在
$pathCheck = wsl bash -c "test -d '$wslProjectPath' && echo 'OK' || echo 'NO'" 2>$null
if ($pathCheck -ne "OK") {
    Write-Host "[!] WSL 中路径不存在，尝试直接挂载..."
    # 直接使用 Windows 路径风格（WSL 可以直接访问 /mnt/c/...）
    $drive = $winPath.Substring(0, 1).ToLower()
    $rest = $winPath.Substring(3)
    $wslProjectPath = "/mnt/$drive/$rest" -replace '\\', '/'
    Write-Host "[i] 修正后 WSL 路径: $wslProjectPath"
}

# 确保 release 目录存在（WSL 内）
wsl bash -c "mkdir -p '$wslProjectPath/release'" 2>$null

# ============================================================
# 第四步：收集参数并传递给 shell 脚本
# ============================================================
$scriptArgs = ""
foreach ($arg in $MyInvocation.UnboundArguments) {
    $scriptArgs += "`"$arg`" "
}
$scriptArgs = $scriptArgs.Trim()

if ([string]::IsNullOrWhiteSpace($scriptArgs)) {
    Write-Host "[i] 无自定义参数，将构建所有架构 (x64 + arm64 + riscv64)"
} else {
    Write-Host "[i] 传递参数: $scriptArgs"
}

# ============================================================
# 第五步：在 WSL 中执行 package_app_linux_docker.sh
# ============================================================
Write-Host ""
Write-Host "========================================"
Write-Host "在 WSL 中启动 Docker 构建..."
Write-Host "========================================"
Write-Host ""

# 构建要执行的命令
$buildCommand = "cd '$wslProjectPath' && bash package_app_linux_docker.sh $scriptArgs"
Write-Host "[i] 执行: wsl bash -c '$buildCommand'"
Write-Host ""

# 捕获开始时间
$startTime = Get-Date

# 执行构建（实时输出）
wsl bash -c $buildCommand
$exitCode = $LASTEXITCODE

$elapsed = (Get-Date) - $startTime

Write-Host ""
Write-Host "========================================"
Write-Host "构建完成"
Write-Host "用时: $($elapsed.Hours)h $($elapsed.Minutes)m $($elapsed.Seconds)s"
Write-Host "========================================"

# ============================================================
# 第六步：列出 release/ 目录中的产物
# ============================================================
Write-Host ""
Write-Host "========================================"
Write-Host "产物列表 (release/)"
Write-Host "========================================"

$version = (Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).version

$releaseFiles = Get-ChildItem -Path "release" -Filter "hiwara_${version}_linux_*" -ErrorAction SilentlyContinue
if ($releaseFiles.Count -gt 0) {
    foreach ($file in $releaseFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "[✓] $($file.Name)  ($sizeMB MB)"
    }
} else {
    Write-Host "[!] release/ 中未找到产物"
    Write-Host "[i] 检查 WSL 中是否有产物..."
    wsl bash -c "ls -lah '$wslProjectPath/release/' 2>/dev/null || echo '(空)'"
}

Write-Host ""
Write-Host "========================================"
Write-Host "全部任务完成"
Write-Host "========================================"

if ($exitCode -ne 0) {
    Write-Host "[!] WSL 中构建返回非零退出码: $exitCode"
    exit $exitCode
}
