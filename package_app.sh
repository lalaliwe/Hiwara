#!/bin/bash

# ============================================================
# Linux 打包脚本
# 支持格式: deb, rpm, appimage, targz (.tar.gz)
# 支持架构: x86, x64, armv7, arm64
# ============================================================

set -e  # 遇到错误立即退出

# 架构列表
ARCHITECTURES=(
    "i686-unknown-linux-gnu"       # x86 (32-bit)
    "x86_64-unknown-linux-gnu"     # x64 (64-bit)
    "armv7-unknown-linux-gnueabihf" # ARMv7
    "aarch64-unknown-linux-gnu"    # ARM64
)

# 打包格式列表
BUNDLES=("deb" "rpm" "appimage" "targz")

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
# 第二步：逐架构逐格式打包（推荐，方便排查构建问题）
# ============================================================
for arch in "${ARCHITECTURES[@]}"; do
    for bundle in "${BUNDLES[@]}"; do
        echo "========================================"
        echo "Building: $arch  ->  $bundle"
        echo "========================================"
        npx tauri build --target "$arch" --bundles "$bundle"
    done
done

# ============================================================
# 方式二：一次性打包所有格式（取消注释即可使用）
# ============================================================
# for arch in "${ARCHITECTURES[@]}"; do
#     npx tauri build --target "$arch" --bundles deb,rpm,appimage,targz
# done
