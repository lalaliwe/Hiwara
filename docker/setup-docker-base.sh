#!/bin/bash
# ============================================================
# setup-docker-base.sh - 从 Debian 源构建本地 Docker 基础镜像
# 完全绕过 Docker Hub，使用清华 TUNA 镜像源
# ============================================================
set -e

ROOTFS_DIR="/tmp/debian-trixie-rootfs"
IMAGE_TAG="debian:trixie-slim"
MIRROR="https://mirrors.tuna.tsinghua.edu.cn/debian"

echo "========================================"
echo "构建本地 Docker 基础镜像: $IMAGE_TAG"
echo "源: $MIRROR"
echo "========================================"

# 1. 检查并安装 debootstrap
if ! command -v debootstrap &>/dev/null; then
    echo "[i] 安装 debootstrap..."
    sudo apt update && sudo apt install -y debootstrap
fi

# 2. 清理旧的 rootfs
if [ -d "$ROOTFS_DIR" ]; then
    echo "[i] 清理旧的 rootfs..."
    sudo rm -rf "$ROOTFS_DIR"
fi

# 3. 用 debootstrap 创建 Debian Trixie rootfs
echo "[i] 正在从 $MIRROR 下载并构建 rootfs..."
sudo debootstrap --variant=minbase --include=ca-certificates \
    trixie "$ROOTFS_DIR" "$MIRROR"

# 4. 配置 APT 源（写入容器内的 sources）
echo "[i] 配置容器内 APT 源..."
sudo tee "$ROOTFS_DIR/etc/apt/sources.list.d/debian.sources" <<-'EOF'
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/debian
Suites: trixie trixie-updates trixie-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: https://security.debian.org/debian-security
Suites: trixie-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF

# 5. 导入为 Docker 镜像
echo "[i] 导入为 Docker 镜像: $IMAGE_TAG"
sudo tar -C "$ROOTFS_DIR" -c . | docker import - "$IMAGE_TAG"

# 6. 验证
echo "[i] 验证镜像:"
docker images | grep -E "REPOSITORY|debian"

# 7. 清理
echo "[i] 清理临时 rootfs..."
sudo rm -rf "$ROOTFS_DIR"

echo ""
echo "========================================"
echo "[✓] 完成！本地镜像 $IMAGE_TAG 已就绪"
echo "    运行 docker build 不会再从 Docker Hub 拉取"
echo "========================================"
