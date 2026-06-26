#!/bin/bash

# ============================================================
# Linux x64 打包脚本
# 支持格式: deb, rpm, appimage
# 架构: x86_64 (64-bit) - 本机构建
# ============================================================

ARCH="x86_64-unknown-linux-gnu"
BUNDLES=("deb" "rpm" "appimage")

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
# 第二步：安装系统依赖（如果缺失）
# ============================================================
if ! dpkg -l libwebkit2gtk-4.1-dev 2>/dev/null | grep -q "^ii"; then
    echo "安装 x86_64 系统依赖..."
    sudo apt update
    sudo apt install -y libwebkit2gtk-4.1-dev \
      build-essential curl wget file \
      libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
fi

# ============================================================
# 第三步：逐格式打包
# ============================================================
for bundle in "${BUNDLES[@]}"; do
    echo "========================================"
    echo "Building: $ARCH  ->  $bundle"
    echo "========================================"
    npx tauri build --target "$ARCH" --bundles "$bundle" || \
      echo "[!] $ARCH / $bundle 打包失败，继续下一个..."
done
