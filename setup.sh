#!/usr/bin/env bash
# ==============================================================================
# Script: setup.sh (Run once on fresh Ubuntu/Debian server)
# Usage: sudo ./setup.sh
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✖ Error: This script must be run as root. Run: sudo ./setup.sh${NC}" >&2
   exit 1
fi

echo -e "${BLUE}======================================================"
echo -e " DINZIN: Predictive Distribution System - Server Setup"
echo -e "======================================================${NC}"

# 1. Update OS packages and install core utilities
echo -e "${BLUE}[1/5] Updating OS and installing dependencies...${NC}"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git ufw ca-certificates gnupg lsb-release htop fail2ban jq cron

# 2. Add 2GB Swap Memory (prevents OOM during Next.js/Fastify multi-stage builds)
if [ ! -f /swapfile ]; then
    echo -e "${BLUE}[2/5] Setting up 4GB swap space...${NC}"
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
    echo -e "${YELLOW}[2/5] Swap already configured. Skipping.${NC}"
fi

# 3. Install Docker Engine & Compose plugin
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}[3/5] Installing Docker Engine & Docker Compose...${NC}"
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
else
    echo -e "${YELLOW}[3/5] Docker is already installed ($(docker --version)). Skipping.${NC}"
fi

# 4. Limit Docker log sizes (prevents container logs from filling disk)
echo -e "${BLUE}[4/5] Configuring Docker log rotation limits...${NC}"
mkdir -p /etc/docker
cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
EOF
systemctl restart docker

# 5. Configure Firewall (ports 22, 80, 443)
echo -e "${BLUE}[5/5] Configuring UFW firewall (ports 22, 80, 443)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# 6. Add non-root user to docker group
TARGET_USER="${SUDO_USER:-}"
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
    TARGET_USER=$(ls -1 /home 2>/dev/null | head -n 1 || true)
fi
if [ -n "$TARGET_USER" ] && id "$TARGET_USER" &>/dev/null; then
    usermod -aG docker "$TARGET_USER"
    echo -e "${GREEN}✔ Added ${TARGET_USER} to the docker group.${NC}"
fi

echo -e "\n${GREEN}======================================================"
echo -e " ✔ Server provisioning complete!"
echo -e "======================================================${NC}"
echo -e "${BLUE}Next Step: Run ./deploy.sh to configure, build, and start the app.${NC}\n"

