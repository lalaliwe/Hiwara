#!/bin/bash

# ============================================================
# Linux 打包脚本
# 支持格式: deb, rpm, appimage
# 支持架构: x64, arm64
# 注意: i686 (32-bit) 已放弃，因 Ubuntu 已停止提供 i386 GUI 库
#        targz 已移除，Tauri v2 CLI 不支持此格式
# ============================================================

# 架构列表
ARCHITECTURES=(
    "x86_64-unknown-linux-gnu"     # x64 (64-bit) - 本机构建
    "aarch64-unknown-linux-gnu"    # ARM64 - 交叉编译
)

# 打包格式列表（targz 已移除，Tauri v2 不支持）
BUNDLES=("deb" "rpm" "appimage")

# ============================================================
# 第一步：自动安装缺失的 Rust target
# ============================================================
echo "========================================"
echo "检查并安装缺失的 Rust target..."
echo "========================================"
for arch in "${ARCHITECTURES[@]}"; do
    if rustup target list --installed 2>/dev/null | grep -q "^$arch$"; then
        echo "[✓] $arch 已安装"
    else
        echo "[ ] $arch 未安装，正在安装..."
        rustup target add "$arch"
        echo "[✓] $arch 安装完成"
    fi
done
echo ""

# ============================================================
# 第二步：逐架构逐格式打包（一个出错不影响其他）
# ============================================================
for arch in "${ARCHITECTURES[@]}"; do
    for bundle in "${BUNDLES[@]}"; do
        echo "========================================"
        echo "Building: $arch  ->  $bundle"
        echo "========================================"

        if [[ "$arch" == "aarch64-unknown-linux-gnu" ]]; then
            # ARM64 交叉编译需要设置 pkg-config 环境变量
            # PKG_CONFIG_ALLOW_CROSS=1   -> 允许跨架构查找 .pc 文件
            # PKG_CONFIG_PATH             -> 指向 ARM64 的 .pc 文件目录
            PKG_CONFIG_ALLOW_CROSS=1 \
            PKG_CONFIG_PATH=/usr/lib/aarch64-linux-gnu/pkgconfig \
            npx tauri build --target "$arch" --bundles "$bundle" || \
              echo "[!] $arch / $bundle 打包失败，继续下一个..."
        else
            # x86_64 本机构建，无需额外配置
            npx tauri build --target "$arch" --bundles "$bundle" || \
              echo "[!] $arch / $bundle 打包失败，继续下一个..."
        fi
    done
done

# ============================================================
# 方式二：一次性打包所有格式（取消注释即可使用）
# ============================================================
# for arch in "${ARCHITECTURES[@]}"; do
#     if [[ "$arch" == "aarch64-unknown-linux-gnu" ]]; then
#         PKG_CONFIG_ALLOW_CROSS=1 \
#         PKG_CONFIG_PATH=/usr/lib/aarch64-linux-gnu/pkgconfig \
#         npx tauri build --target "$arch" --bundles "deb,rpm,appimage"
#     else
#         npx tauri build --target "$arch" --bundles "deb,rpm,appimage"
#     fi
# done
