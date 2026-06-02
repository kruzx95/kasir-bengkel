#!/bin/bash
# ============================================
# SETUP VPS — Irian Motor (Fresh Ubuntu 22.04/24.04)
# ============================================
# Jalankan sebagai ROOT di VPS baru:
#   chmod +x setup-vps.sh && ./setup-vps.sh
# ============================================

set -e

echo "========================================"
echo "  IRIAN MOTOR — Setup VPS Production"
echo "========================================"

# --- Variabel (GANTI SESUAI KEBUTUHAN) ---
APP_USER="deploy"
APP_DIR="/var/www/irian-motor"
DB_NAME="irian_motor"
DB_USER="irianmotor"
DB_PASS="GANTI_PASSWORD_DATABASE_ANDA"
NODE_VERSION="22"

echo ""
echo "[1/7] Memperbarui sistem..."
apt update && apt upgrade -y

echo ""
echo "[2/7] Menginstall paket dasar..."
apt install -y curl git ufw fail2ban

echo ""
echo "[3/7] Menginstall Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ""
echo "[4/7] Menginstall MariaDB..."
apt install -y mariadb-server mariadb-client
systemctl enable mariadb
systemctl start mariadb

echo "Membuat database dan user..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "Database '${DB_NAME}' berhasil dibuat."

echo ""
echo "[5/7] Menginstall Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

echo ""
echo "[6/7] Menginstall PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo ""
echo "[7/7] Mengkonfigurasi Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall aktif. Port 22, 80, 443 terbuka."

# Buat user deploy (opsional)
if ! id "${APP_USER}" &>/dev/null; then
    adduser --disabled-password --gecos "" ${APP_USER}
    usermod -aG sudo ${APP_USER}
    echo "User '${APP_USER}' berhasil dibuat."
fi

# Buat direktori aplikasi
mkdir -p ${APP_DIR}
mkdir -p /var/log/irian-motor
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
chown -R ${APP_USER}:${APP_USER} /var/log/irian-motor

echo ""
echo "========================================"
echo "  ✅ SETUP VPS SELESAI!"
echo "========================================"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Upload kode ke ${APP_DIR}"
echo "  2. Buat file .env di ${APP_DIR}"
echo "  3. Jalankan: cd ${APP_DIR} && npm install && npm run build"
echo "  4. Jalankan: pm2 start ecosystem.config.js"
echo "  5. Pasang Nginx config dan SSL"
echo ""
echo "DATABASE_URL untuk .env:"
echo "  mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}"
echo ""
