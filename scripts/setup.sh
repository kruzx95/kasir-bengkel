#!/bin/bash
# ============================================
# Quick Setup — Irian Motor
# ============================================
# Jalankan di komputer baru (Linux/macOS):
#   curl -sSL https://raw.githubusercontent.com/kruzx95/irian-motor/main/scripts/setup.sh | bash
#
# Atau download manual:
#   chmod +x setup.sh && ./setup.sh
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🏍️  Irian Motor — Quick Setup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- Helper Functions ---
check_command() {
    if ! command -v "$1" &>/dev/null; then
        echo -e "${RED}✗${NC} $2 tidak terinstall. Install terlebih dahulu."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $2 terdeteksi"
}

ask() {
    read -p "$1 [y/N]: " response
    echo "$response" | grep -qi "y"
}

# --- Step 1: Check Prerequisites ---
echo -e "${YELLOW}[1/7]${NC} Mengecek dependencies..."
check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "git" "Git"

# --- Step 2: Check Database ---
echo ""
echo -e "${YELLOW}[2/7]${NC} Konfigurasi database"

if command -v mysql &>/dev/null || command -v mariadb &>/dev/null; then
    echo -e "${GREEN}✓${NC} Database server terdeteksi"
    DB_AVAILABLE=true
else
    echo -e "${YELLOW}!${NC} Database server tidak terdeteksi"
    echo "  Opsi: (1) Database lokal  (2) Remote DB  (3) Skip (nanti)"
    read -p "Pilih opsi [1/2/3]: " db_choice
    
    case "$db_choice" in
        2)
            echo "  Masukkan HOST database remote:"
            read -p "  Host: " DB_HOST
            read -p "  Port: " DB_PORT
            read -p "  User: " DB_USER
            read -p "  Password: " DB_PASS
            read -p "  Database name: " DB_NAME
            DB_AVAILABLE=false
            ;;
        3)
            echo -e "${YELLOW}!${NC} Setup database dilewati. Jalankan manual."
            DB_AVAILABLE=false
            ;;
        *)
            echo ""
            echo "  Buat database dengan menjalankan:"
            echo "    mysql -u root -p -e \"CREATE DATABASE irian_motor;\""
            echo "    mysql -u root -p -e \"CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'password';\""
            echo "    mysql -u root -p -e \"GRANT ALL ON irian_motor.* TO 'irianmotor'@'localhost';\""
            echo ""
            echo "  Masukkan detail database Anda:"
            read -p "  Host [localhost]: " DB_HOST; DB_HOST="${DB_HOST:-localhost}"
            read -p "  Port [3306]: " DB_PORT; DB_PORT="${DB_PORT:-3306}"
            read -p "  User: " DB_USER
            read -p "  Password: " DB_PASS
            read -p "  Database name [irian_motor]: " DB_NAME; DB_NAME="${DB_NAME:-irian_motor}"
            ;;
    esac
fi

# --- Step 3: Clone or Enter Project ---
echo ""
echo -e "${YELLOW}[3/7]${NC} Setup project"

if [ -d "irian-motor" ]; then
    echo -e "${YELLOW}!${NC} Folder irian-motor sudah ada"
    ask "Update repository yang ada? " && {
        cd irian-motor
        git pull origin main 2>/dev/null || true
    }
else
    echo "  Clone repository..."
    git clone https://github.com/kruzx95/irian-motor.git
    cd irian-motor
fi

# --- Step 4: Environment Variables ---
echo ""
echo -e "${YELLOW}[4/7]${NC} Mengkonfigurasi environment variables"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} File .env sudah ada"
    ask "Overwrite .env? "
    overwrite_env=$?
else
    overwrite_env=1
fi

if [ $overwrite_env -eq 0 ]; then
    # Generate session secret
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Set database URL
    if [ "$DB_AVAILABLE" = true ]; then
        read -p "Database user: " DB_USER
        read -p "Database password: " DB_PASS
        DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/irian_motor"
    elif [ -n "$DB_HOST" ]; then
        DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT:-3306}/${DB_NAME}"
    else
        read -p "DATABASE_URL (mysql://user:pass@host:port/db): " DATABASE_URL
    fi
    
    cat > .env << EOF
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET}"
NODE_ENV="development"
PORT=3000
EOF
    echo -e "${GREEN}✓${NC} .env dibuat"
fi

# --- Step 5: Install Dependencies ---
echo ""
echo -e "${YELLOW}[5/7]${NC} Menginstall dependencies..."
npm install

# --- Step 6: Database Migration ---
echo ""
echo -e "${YELLOW}[6/7]${NC} Menjalankan database migration..."
npx prisma migrate deploy

# --- Step 7: Seed Data ---
echo ""
echo -e "${YELLOW}[7/7]${NC} Menjalankan seed data..."
npx tsx prisma/seed.ts

# --- Done ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ SETUP SELESAI!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Untuk menjalankan aplikasi:"
echo "    cd irian-motor"
echo "    npm run dev"
echo ""
echo "  Akses di: http://localhost:3000"
echo ""