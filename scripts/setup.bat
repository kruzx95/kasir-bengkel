@echo off
setlocal enabledelayedexpansion
REM ============================================
REM Quick Setup — Irian Motor (Windows)
REM ============================================
REM Jalankan di Command Prompt:
REM   setup.bat
REM
REM Atau dari PowerShell:
REM   .\scripts\setup.bat
REM ============================================

color 07
echo ==============================
echo  ^🏍️^  Irian Motor - Quick Setup
echo ==============================
echo.

REM --- Step 1: Check Prerequisites ---
echo [1/6] Mengecek dependencies...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js tidak terinstall. Install dari https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [^+^] Node.js !NODE_VER^ found

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] NPM tidak terinstall
    pause
    exit /b 1
)
echo [^+^] NPM ditemukan

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Git tidak terinstall. Install dari https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [^+^] Git ditemukan

REM --- Step 2: Database Configuration ---
echo.
echo [2/6] Konfigurasi database
echo.
echo Database server terdeteksi?
set /p DB_EXISTS="  Sudah install MySQL/MariaDB? (y/n): "

if /i "%DB_EXISTS%"=="y" (
    echo.
    set /p DB_USER="  Database user [irianmotor]: "
    if "!DB_USER!"=="" set DB_USER=irianmotor
    set /p DB_PASS="  Database password: "
    set /p DB_NAME="  Database name [irian_motor]: "
    if "!DB_NAME!"=="" set DB_NAME=irian_motor
    set DB_URL=mysql://!DB_USER!:%DB_PASS%@localhost:3306/!DB_NAME!
) else (
    echo.
    echo Opsi database:
    echo   1. Install MySQL/MariaDB lokal
    echo   2. Gunakan database remote
    echo   3. Skip (setup manual nanti)
    echo.
    set /p DB_CHOICE="  Pilih [1/2/3]: "
    
    if "!DB_CHOICE!"=="1" (
        echo.
        echo Buka https://dev.mysql.com/downloads/installer/ untuk download MySQL Installer
        echo Atau https://mariadb.org/download/ untuk MariaDB
        echo.
        set /p DB_USER="  Database user [irianmotor]: "
        if "!DB_USER!"=="" set DB_USER=irianmotor
        set /p DB_PASS="  Database password: "
        set /p DB_NAME="  Database name [irian_motor]: "
        if "!DB_NAME!"=="" set DB_NAME=irian_motor
        set DB_URL=mysql://!DB_USER!:%DB_PASS%@localhost:3306/!DB_NAME!
    ) else if "!DB_CHOICE!"=="2" (
        echo.
        set /p DB_HOST="  Remote host: "
        set /p DB_PORT="  Remote port [3306]: "
        if "!DB_PORT!"=="" set DB_PORT=3306
        set /p DB_USER="  User: "
        set /p DB_PASS="  Password: "
        set /p DB_NAME="  Database name: "
        set DB_URL=mysql://!DB_USER!:%DB_PASS%@!DB_HOST!:!DB_PORT!/!DB_NAME!
    ) else (
        echo.
        echo Setup database dilompati. Jalankan manual.
        set DB_URL=
    )
)

REM --- Step 3: Clone or Enter Project ---
echo.
echo [3/6] Setup project
if exist "irian-motor" (
    echo [!] Folder irian-motor sudah ada
    set /p UPDATE="  Update repository? (y/n): "
    if /i "!UPDATE!"=="y" (
        cd irian-motor
        git pull origin main 2>nul || echo [!] Pull gagal, lanjutkan...
    )
) else (
    echo  Cloning repository...
    git clone https://github.com/kruzx95/irian-motor.git
    cd irian-motor
)

REM --- Step 4: Environment Variables ---
echo.
echo [4/6] Mengkonfigurasi environment variables
if exist ".env" (
    echo [^+^] File .env sudah ada
    set /p OVERWRITE="  Overwrite? (y/n): "
) else (
    set OVERWRITE=y
)

if /i "!OVERWRITE!"=="y" (
    if not "!DB_URL!"=="" (
        for /f "delims=" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set SECRET=%%i
        (
            echo DATABASE_URL=!DB_URL!
            echo SESSION_SECRET=!SECRET!
            echo NODE_ENV=development
            echo PORT=3000
        ) > .env
        echo [^+^] .env dibuat
    ) else (
        echo [!] Database URL belum diatur. Buat .env manual.
        echo    Lihat .env.example untuk contoh.
    )
)

REM --- Step 5: Install Dependencies ---
echo.
echo [5/6] Menginstall dependencies...
call npm install

REM --- Step 6: Database Migration & Seed ---
echo.
echo [6/6] Menjalankan migration dan seed...
if not "!DB_URL!"=="" (
    npx prisma migrate deploy
    npx tsx prisma/seed.ts
) else (
    echo [!] Database belum dikonfigurasi. Jalankan manual:
    echo    npx prisma migrate deploy
    echo    npx tsx prisma/seed.ts
)

REM --- Done ---
echo.
echo ==============================
echo  ^✅^  SETUP SELESAI!
echo ==============================
echo.
echo  Untuk menjalankan:
echo    cd irian-motor
echo    npm run dev
echo.
echo  Akses di: http://localhost:3000
echo.
pause