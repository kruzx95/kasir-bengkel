#!/bin/bash
# ============================================
# SETUP VPS — Irian Motor (Staging & Production)
# Ubuntu 22.04 / 24.04 LTS
# ============================================
# Jalankan sebagai ROOT di VPS baru:
#   chmod +x setup-vps.sh && ./setup-vps.sh
# ============================================

set -e

echo "========================================"
echo "  IRIAN MOTOR — Setup VPS Staging & Prod"
echo "========================================"

# --- Variabel (GANTI SESUAI KEBUTUHAN) ---
APP_USER="deploy"
DIR_PROD="/var/www/irian-motor-prod"
DIR_STAGING="/var/www/irian-motor-staging"
DB_PROD="irian_motor_prod"
DB_STAGING="irian_motor_staging"
DB_USER="irianmotor"
DB_PASS="GANTI_PASSWORD_DATABASE_ANDA"
NODE_VERSION="22"

echo ""
echo "[1/7] Memperbarui sistem & menginstall paket dasar..."
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban certbot python3-certbot-nginx

echo ""
echo "[2/7] Menginstall Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
echo "Node.js: $(node -v) | NPM: $(npm -v)"

echo ""
echo "[3/7] Menginstall MariaDB Server..."
apt install -y mariadb-server mariadb-client
systemctl enable mariadb
systemctl start mariadb

echo "Membuat database Staging & Production..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_PROD} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_STAGING} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_PROD}.* TO '${DB_USER}'@'localhost';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_STAGING}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "Database '${DB_PROD}' & '${DB_STAGING}' berhasil dibuat."

echo ""
echo "[4/7] Menginstall Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

echo ""
echo "[5/7] Menginstall PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo ""
echo "[6/7] Mengkonfigurasi Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall aktif. Port SSH (22), HTTP (80), HTTPS (443) terbuka."

echo ""
echo "[7/7] Membuat direktori aplikasi..."
mkdir -p ${DIR_PROD}
mkdir -p ${DIR_STAGING}
mkdir -p /var/log/irian-motor

echo ""
echo "========================================"
echo "  ✅ SETUP VPS SELESAI!"
echo "========================================"
echo ""
echo "Database Staging URL:"
echo "  mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_STAGING}"
echo ""
echo "Database Production URL:"
echo "  mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_PROD}"
echo ""

