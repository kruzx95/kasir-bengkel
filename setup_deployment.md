bantu buatkan script deployment dan konfigurasi production (PM2, Nginx, SSL) untuk VPS? dan step by step nya

### Planner Response

Saya buatkan script deployment lengkap + panduan step-by-step:

_Viewed [.env.example](file:///home/kruza/Documents/irian-motor/irian-motor/.env.example) _

_Viewed [package.json](file:///home/kruza/Documents/irian-motor/irian-motor/package.json) _

### Planner Response

Sekarang saya buat semua file deployment:

_Edited relevant file_

_Edited relevant file_

_Edited relevant file_

_Edited relevant file_

### Planner Response

Sekarang buat panduan step-by-step lengkap:

_Edited relevant file_

### Planner Response

Semua file sudah dibuat. Berikut ringkasan yang dihasilkan:

## File yang Dibuat

| File                                                                                                   | Fungsi                                                    |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [ecosystem.config.js](file:///home/kruza/Documents/irian-motor/irian-motor/ecosystem.config.js)        | Konfigurasi PM2 (auto-restart, log, memory limit)         |
| [setup-vps.sh](file:///home/kruza/Documents/irian-motor/irian-motor/deploy/setup-vps.sh)               | Script setup VPS baru (Node, MariaDB, Nginx, PM2, UFW)    |
| [deploy.sh](file:///home/kruza/Documents/irian-motor/irian-motor/deploy/deploy.sh)                     | Script deploy update (git pull → build → restart)         |
| [irian-motor.conf](file:///home/kruza/Documents/irian-motor/irian-motor/deploy/nginx/irian-motor.conf) | Config Nginx (reverse proxy, SSL, gzip, security headers) |

Panduan lengkap step-by-step ada di artifact **deployment_guide.md** — silakan review. Yang perlu Anda siapkan:

1. **VPS** (sewa dulu)
2. **Domain** (arahkan DNS A record ke IP VPS)
3. **Push repo ke GitHub** supaya bisa clone di VPS
