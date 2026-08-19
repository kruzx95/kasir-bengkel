#!/bin/bash
# ============================================
# DEPLOY SCRIPT — Irian Motor (STAGING)
# ============================================
# Jalankan di VPS setiap kali ingin update Staging:
#   chmod +x deploy-staging.sh && ./deploy-staging.sh
# ============================================

set -e

APP_DIR="/var/www/irian-motor-staging"
BRANCH="staging"

echo "========================================"
echo "  🚀 Deploying Irian Motor [STAGING]..."
echo "========================================"
echo "  Waktu: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

cd ${APP_DIR}

echo "[1/5] Pulling latest changes from branch '${BRANCH}'..."
git fetch origin
git reset --hard origin/${BRANCH}

echo ""
echo "[2/5] Installing dependencies..."
npm ci --production=false

echo ""
echo "[3/5] Running Prisma schema sync..."
npx prisma generate
npx prisma db push --accept-data-loss=false || npx prisma migrate deploy

echo ""
echo "[4/5] Building Next.js application..."
npm run build

echo ""
echo "[5/5] Restarting PM2 process 'irian-motor-staging'..."
pm2 reload irian-motor-staging --update-env || pm2 start /var/www/ecosystem.config.js --only irian-motor-staging
pm2 save

echo ""
echo "========================================"
echo "  ✅ DEPLOY STAGING BERHASIL!"
echo "========================================"
echo "  Port: 3001"
echo "========================================"
