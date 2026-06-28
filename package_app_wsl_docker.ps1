# ============================================================
# WSL Docker 打包脚本 (PowerShell)
# 通过 WSL 中的 Docker 构建 Linux 多架构包
# 底层调用 package_app_linux_docker.sh
# 输出目录: release/
# 输出文件: hiwara_{version}_linux_{arch}.{deb,rpm,AppImage}
#
# 使用方式:
#   .\package_app_wsl_docker.ps1                                          # x64 + ARM64 + RISC-V 64, 全部格式
#   .\package_app_wsl_docker.ps1 -F                                       # 强制重建本地基础镜像
#   .\package_app_wsl_docker.ps1 -P                                       # 改为从 Docker Hub 拉取基础镜像
#   .\package_app_wsl_docker.ps1 -P -F                                    # 强制从 Docker Hub 重新拉取
#   .\package_app_wsl_docker.ps1 -A x64,arm64                             # 指定架构
#   .\package_app_wsl_docker.ps1 -A x64                                   # 仅 x64
#   .\package_app_wsl_docker.ps1 -A arm64                                 # 仅 ARM64
#   .\package_app_wsl_docker.ps1 -A riscv64                               # 仅 RISC-V 64
#   .\package_app_wsl_docker.ps1 -A x64,arm64,riscv64                     # 全部架构
#   .\package_app_wsl_docker.ps1 -B deb,rpm                               # 指定格式
#   .\package_app_wsl_docker.ps1 -B deb                                   # 仅 deb
#   .\package_app_wsl_docker.ps1 -B appimage                              # 仅 appimage
#   .\package_app_wsl_docker.ps1 -A x64,arm64 -B deb,rpm                  # 组合使用
#   .\package_app_wsl_docker.ps1 -Arch x64,arm64 -Bundle deb,rpm          # 全名参数
#   .\package_app_wsl_docker.ps1 -H                                       # 显示帮助
#
# 参数（不区分大小写，全名和短别名均可）:
#   -Arch / -A       指定目标架构 (x64, arm64, riscv64)，逗号分隔，默认全部
#   -Bundle / -B     指定打包格式 (deb, rpm, appimage)，逗号分隔，默认全部
#   -ForceAll / -F   强制重建/重新拉取基础镜像
#   -Pull / -P       从 Docker Hub 拉取基础镜像
#   -LocalBase / -L  使用本地 TUNA 镜像源构建（默认行为）
#   -Help / -H       显示帮助信息
# ============================================================

param(
    [Alias("A")]
    [Parameter(Mandatory = $false, HelpMessage = "指定目标架构，可用值: x64, arm64, riscv64。可传多个，用逗号分隔。默认全部构建")]
    [ValidateSet("x64", "arm64", "riscv64")]
    [string[]]$Arch,

    [Alias("B")]
    [Parameter(Mandatory = $false, HelpMessage = "指定打包格式，可用值: deb, rpm, appimage。可传多个，用逗号分隔。默认全部格式")]
    [ValidateSet("deb", "rpm", "appimage")]
    [string[]]$Bundle,

    [Alias("F")]
    [Parameter(Mandatory = $false, HelpMessage = "强制重建/重新拉取基础镜像（等价于 -F）")]
    [switch]$ForceAll,

    [Alias("P")]
    [Parameter(Mandatory = $false, HelpMessage = "从 Docker Hub 拉取基础镜像（默认从 TUNA 镜像源本地构建）")]
    [switch]$Pull,

    [Alias("L")]
    [Parameter(Mandatory = $false, HelpMessage = "使用本地 TUNA 镜像源构建基础镜像（默认行为）")]
    [switch]$LocalBase,

    [Alias("H")]
    [Parameter(Mandatory = $false, HelpMessage = "显示帮助信息")]
    [switch]$Help
)

# ============================================================
# 帮助信息
# ============================================================
if ($Help) {
    Write-Host "========================================"
    Write-Host "WSL Docker 打包脚本 - 帮助"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "通过 WSL 中的 Docker 构建 Linux 多架构包"
    Write-Host "底层调用 package_app_linux_docker.sh"
    Write-Host ""
    Write-Host "参数说明（不区分大小写，全名和短别名均可）:"
    Write-Host "  -Arch / -A       指定目标架构 (x64, arm64, riscv64)，多个用逗号分隔"
    Write-Host "                    默认: 全部构建"
    Write-Host "  -Bundle / -B     指定打包格式 (deb, rpm, appimage)，多个用逗号分隔"
    Write-Host "                    默认: 全部格式"
    Write-Host "  -ForceAll / -F   强制重建/重新拉取基础镜像"
    Write-Host "  -Pull / -P       从 Docker Hub 拉取基础镜像"
    Write-Host "  -LocalBase / -L  使用本地 TUNA 镜像源构建基础镜像（默认行为）"
    Write-Host "  -Help / -H       显示此帮助信息"
    Write-Host ""
    Write-Host "使用示例:"
    Write-Host "  .\package_app_wsl_docker.ps1                         # 全部构建"
    Write-Host "  .\package_app_wsl_docker.ps1 -A x64,arm64            # 指定架构（短别名）"
    Write-Host "  .\package_app_wsl_docker.ps1 -Arch x64 -Bundle deb   # 组合使用（全名）"
    Write-Host "  .\package_app_wsl_docker.ps1 -P -F                   # 强制从 Hub 拉取"
    Write-Host "========================================"
    exit 0
}

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
# 第四步：根据声明参数构建传递给 shell 脚本的参数
# ============================================================
$scriptArgs = @()

# 架构参数
if ($Arch -and $Arch.Count -gt 0) {
    $scriptArgs += "--arch"
    $scriptArgs += $Arch
}

# 格式参数
if ($Bundle -and $Bundle.Count -gt 0) {
    $scriptArgs += "--bundle"
    $scriptArgs += $Bundle
}

# 基础镜像来源
if ($Pull) {
    $scriptArgs += "--pull"
}
if ($LocalBase) {
    $scriptArgs += "--local-base"
}

# 强制重建
if ($ForceAll) {
    $scriptArgs += "-F"
}

$scriptArgsStr = [string]::Join(" ", ($scriptArgs | ForEach-Object {
    if ($_ -match "[\s""]") { "`"$_`"" } else { $_ }
}))

if ([string]::IsNullOrWhiteSpace($scriptArgsStr)) {
    Write-Host "[i] 无自定义参数，将构建所有架构 (x64 + arm64 + riscv64) 和所有格式 (deb + rpm + AppImage)"
} else {
    Write-Host "[i] 传递参数: $scriptArgsStr"
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
$buildCommand = "cd '$wslProjectPath' && bash package_app_linux_docker.sh $scriptArgsStr"
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
