#!/bin/bash
# ============================================
# DEPLOY SCRIPT — Irian Motor
# ============================================
# Jalankan di VPS setiap kali ingin deploy update:
#   chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

APP_DIR="/var/www/irian-motor"
REPO_URL="GANTI_DENGAN_URL_REPO_GIT_ANDA"
BRANCH="main"

echo "========================================"
echo "  🚀 Deploying Irian Motor..."
echo "========================================"
echo "  Waktu: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

cd ${APP_DIR}

# Jika belum ada repo, clone dulu
if [ ! -d ".git" ]; then
    echo "[1/5] Cloning repository..."
    git clone ${REPO_URL} .
else
    echo "[1/5] Pulling latest changes..."
    git fetch origin
    git reset --hard origin/${BRANCH}
fi

echo ""
echo "[2/5] Installing dependencies..."
npm ci --production=false

echo ""
echo "[3/5] Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy

echo ""
echo "[4/5] Building application..."
npm run build

echo ""
echo "[5/5] Restarting PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================"
echo "  ✅ DEPLOY BERHASIL!"
echo "========================================"
echo "  Status: $(pm2 info irian-motor 2>/dev/null | grep status || echo 'running')"
echo "  URL: http://$(hostname -I | awk '{print $1}'):3000"
echo "========================================"
