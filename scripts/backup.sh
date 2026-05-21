#!/bin/bash
# ============================================
# Script Backup Irian Motor
# Jalankan manual: bash scripts/backup.sh
# Atau jadwalkan via cron (lihat instruksi di bawah)
# ============================================

# Konfigurasi database (sesuaikan jika berbeda)
DB_USER="irianmotor"
DB_PASS="irianmotor123"
DB_NAME="irian_motor"
DB_HOST="127.0.0.1"

# Direktori backup — ganti sesuai keinginan
BACKUP_DIR="$HOME/backup-irian-motor"
DATE=$(date +"%Y-%m-%d_%H-%M")

# Buat folder backup jika belum ada
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/uploads"

echo "🔄 Memulai backup Irian Motor — $DATE"

# ============================================
# 1. Backup Database
# ============================================
DB_FILE="$BACKUP_DIR/database/irian_motor_$DATE.sql"
mysqldump -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" > "$DB_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  # Kompres file SQL
  gzip "$DB_FILE"
  echo "✅ Database backup: irian_motor_$DATE.sql.gz"
else
  echo "❌ Gagal backup database"
fi

# ============================================
# 2. Backup Foto Nota (uploads/)
# ============================================
UPLOADS_SRC="$(dirname "$0")/../uploads"
UPLOADS_FILE="$BACKUP_DIR/uploads/uploads_$DATE.tar.gz"

if [ -d "$UPLOADS_SRC" ]; then
  tar -czf "$UPLOADS_FILE" -C "$(dirname "$UPLOADS_SRC")" uploads 2>/dev/null
  echo "✅ Uploads backup: uploads_$DATE.tar.gz"
else
  echo "⚠️  Folder uploads tidak ditemukan, dilewati"
fi

# ============================================
# 3. Hapus backup lama (simpan 30 hari terakhir)
# ============================================
find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +30 -delete

echo ""
echo "✅ Backup selesai → $BACKUP_DIR"
echo "   Database : $(ls -lh $BACKUP_DIR/database/irian_motor_$DATE.sql.gz 2>/dev/null | awk '{print $5}')"
echo ""

# ============================================
# CARA JADWALKAN OTOMATIS (cron):
# Jalankan: crontab -e
# Tambahkan salah satu baris berikut:
#
# Setiap hari jam 02:00 pagi:
# 0 2 * * * bash /path/to/project/scripts/backup.sh >> /tmp/backup-irian.log 2>&1
#
# Setiap minggu (Minggu jam 01:00):
# 0 1 * * 0 bash /path/to/project/scripts/backup.sh >> /tmp/backup-irian.log 2>&1
# ============================================
