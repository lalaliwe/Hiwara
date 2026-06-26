#!/bin/bash

# ============================================================
# Linux ARM64 打包脚本
# 支持格式: deb, rpm, appimage (appimage 在 WSL 中可能失败)
# 架构: aarch64 (ARM64) - 交叉编译
# 注意: libwebkit2gtk-4.1-dev / libxdo-dev / libayatana-appindicator3-dev
#       在 amd64 和 arm64 之间有 Conflicts 声明，无法共存。
#       运行此脚本前请先移除 x86_64 的冲突包：
#       sudo apt remove -y libwebkit2gtk-4.1-dev libxdo-dev libayatana-appindicator3-dev
# ============================================================

ARCH="aarch64-unknown-linux-gnu"
BUNDLES=("deb" "rpm" "appimage")

# 交叉编译环境变量
CC_ENV="aarch64-linux-gnu-gcc"
PKG_CONFIG_PATH_ARM64="/usr/lib/aarch64-linux-gnu/pkgconfig"

# ============================================================
# 第一步：检查并安装 Rust target
# ============================================================
echo "========================================"
echo "检查 Rust target: $ARCH"
echo "========================================"
if rustup target list --installed 2>/dev/null | grep -q "^$ARCH$"; then
    echo "[✓] $ARCH 已安装"
else
    echo "[ ] $ARCH 未安装，正在安装..."
    rustup target add "$ARCH"
    echo "[✓] $ARCH 安装完成"
fi
echo ""

# ============================================================
# 第二步：检查并安装 ARM64 交叉编译依赖
# ============================================================
if ! dpkg -l libwebkit2gtk-4.1-dev:arm64 2>/dev/null | grep -q "^ii"; then
    echo "安装 ARM64 交叉编译依赖..."
    sudo dpkg --add-architecture arm64
    sudo apt update
    sudo apt -o DPkg::options::="--force-overwrite" install -y \
      gcc-aarch64-linux-gnu g++-aarch64-linux-gnu \
      libwebkit2gtk-4.1-dev:arm64 \
      libxdo-dev:arm64 \
      libssl-dev:arm64 \
      libayatana-appindicator3-dev:arm64 \
      librsvg2-dev:arm64 || echo "[!] 部分依赖可能缺失，继续尝试打包..."
fi

# ============================================================
# 第三步：逐格式打包
# ============================================================
for bundle in "${BUNDLES[@]}"; do
    echo "========================================"
    echo "Building: $ARCH  ->  $bundle"
    echo "========================================"

    # ARM64 交叉编译需要设置环境变量
    CC_aarch64_unknown_linux_gnu="$CC_ENV" \
    CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER="$CC_ENV" \
    PKG_CONFIG_ALLOW_CROSS=1 \
    PKG_CONFIG_PATH="$PKG_CONFIG_PATH_ARM64" \
    npx tauri build --target "$ARCH" --bundles "$bundle" || \
      echo "[!] $ARCH / $bundle 打包失败，继续下一个..."
done
