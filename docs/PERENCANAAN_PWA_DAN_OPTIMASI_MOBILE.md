# Perencanaan Implementasi PWA & Optimasi Mobile (Tablet/HP)
**Aplikasi Manajemen & Kasir Bengkel — Irian Motor**

---

## 📌 1. Eksekutif Ringkasan (Latar Belakang)

Dokumen ini disusun sebagai panduan teknis dan operasional untuk memastikan kelangsungan transaksi bengkel saat terjadi **gangguan listrik padam (mati lampu)** di lapangan.

Dengan asumsi **aplikasi sudah di-deploy di VPS (Cloud Server) 24/7**, sistem utama database dan backend tidak terpengaruh oleh mati listrik di lokasi bengkel. Tantangan utama saat listrik padam adalah **komputer kasir (PC Desktop) yang ikut mati**.

Solusi terbaik untuk menjaga operasional bengkel tetap berjalan 100% tanpa hambatan adalah memanfaatkan **HP atau Tablet** staff/kasir yang didukung oleh teknologi **Progressive Web App (PWA)**.

---

## 📊 2. Evaluasi Kelayakan Perangkat Mobile

| Fitur / Parameter | HP / Smartphone (5 - 6.7 inci) | Tablet (Android / iPad 8 - 11 inci) |
| :--- | :--- | :--- |
| **Kelayakan Modul Kasir (POS)** | ⚠️ *Cukup (Perlu scroll di tabel item)* | ⭐⭐⭐⭐⭐ **Sangat Ideal (Rekomendasi Utama)** |
| **Manajemen Stok & Pelanggan** | ⭐⭐⭐⭐ *Sangat Baik* | ⭐⭐⭐⭐⭐ *Sangat Baik* |
| **Laporan & Dashboard** | ⭐⭐⭐⭐ *Sangat Baik* | ⭐⭐⭐⭐⭐ *Sangat Baik* |
| **Daya Tahan Baterai Saat Mati Lampu** | 4 - 6 Jam | 7 - 10 Jam |
| **Ergonomi Kasir (Kecepatan Input)** | Sedang | Tinggi (Tombol sentuh besar & lega) |

> **Rekomendasi Operasional Bengkel:**  
> Sediakan minimal **1 unit Tablet Android atau iPad** di meja kasir sebagai perangkat *backup* utama saat PC mati. HP staff/kasir dapat digunakan sebagai *backup* sekunder.

---

## 🚀 3. Mengapa PWA (Progressive Web App) Adalah Solusinya?

PWA mengubah website Next.js yang ada menjadi aplikasi yang **bisa di-install di Android, iOS, dan iPadOS** tanpa melalui Google Play Store atau Apple App Store.

### Keuntungan PWA Bagi Pemilik Bengkel (Client):
1. **Bisa Di-install Langsung:** Cukup buka browser HP/Tablet, tekan tombol *"Tambahkan ke Layar Utama"*, dan ikon **Irian Motor** langsung muncul di layar perangkat.
2. **Mode Layar Penuh (Standalone):** Menghilangkan address bar browser sehingga area layar 100% fokus untuk transaksi kasir (serupa aplikasi native).
3. **Resiliensi Jaringan (Instant Load):** Memori HP/Tablet meng-cache aset tampilan dasar. Jika koneksi seluler sempat tidak stabil saat listrik mati, halaman aplikasi tetap terbuka dengan cepat tanpa *blank/error*.
4. **Dukungan Hardware Portable:** Sangat mudah dihubungkan dengan **Printer Struk Thermal Bluetooth (Baterai)** untuk cetak nota/struk saat mati lampu.
5. **Efisiensi Biaya:** Tidak perlu membangun ulang aplikasi native Android/iOS terpisah yang memakan biaya dan waktu pengembangan besar.

---

## 🛠️ 4. Roadmap Rencana Implementasi Teknis

```mermaid
flowchart LR
    A[Tahap 1: Web App Manifest] --> B[Tahap 2: Service Worker & Cache]
    B --> C[Tahap 3: Optimasi UI Mobile Kasir]
    C --> D[Tahap 4: Testing & Simulasi]
```

### Tahap 1: Setup Web App Manifest & Metadata App
- Membuat konfigurasi manifest PWA (`name`, `short_name`, `theme_color`, `background_color`, `display: standalone`).
- Menyediakan aset icon beresolusi tinggi (`icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png`).
- Memasang viewport tag yang mencegah peningkatan zoom tidak sengaja saat kasir mengetik di tablet/HP.

### Tahap 2: Setup Service Worker & Offline Caching
- Mengintegrasikan Service Worker untuk meng-cache aset static (CSS, JS, Fonts, Icons).
- Mengatur strategi caching (Network First / Stale-While-Revalidate) untuk memastikan data transaksi selalu *real-time* ke VPS, tetapi tampilan web tetap dapat dibuka saat offline/koneksi lemah.

### Tahap 3: Optimasi Layar Kasir / POS di Mobile (Touch Friendly)
- Mengoptimalkan tabel item transaksi agar dapat di-scroll dengan mulus di layar HP kecil.
- Memperbesar area tombol aksi (misal: *Tambah Item*, *Pilih Pelanggan*, *Proses Bayar*) agar nyaman ditekan dengan jari pada layar sentuh.

### Tahap 4: Pengujian (Audit & Testing Lapangan)
- Pengujian menggunakan **Google Chrome Lighthouse Audit PWA**.
- Testing penginstalan PWA pada Android (Chrome) dan iOS/iPadOS (Safari).
- Pengujian cetak struk via Bluetooth thermal printer dari tablet.

---

## 🛒 5. Rekomendasi Kebutuhan Hardware Bengkel (Cadangan Mati Lampu)

Untuk memastikan kelancaran 100% di bengkel, disarankan menyediakan perlengkapan cadangan berikut:

1. **Tablet Kasir Cadangan:** Android Tablet (misal: Samsung Galaxy Tab A series / Xiaomi Pad) atau iPad 10th Gen.
2. **Modem WiFi Portable (MiFi) / Paket Data Seluler:** Sebagai cadangan internet jika WiFi router bengkel ikut mati (tidak dihubungkan ke UPS).
3. **Printer Thermal Bluetooth Portable:** Printer struk ukuran 58mm / 80mm yang menggunakan baterai cas (rechargeable).

---

## 📋 6. Kesimpulan & Langkah Selanjutnya

Implementasi PWA adalah **solusi paling efisien, modern, dan hemat biaya** untuk menjamin operasional bengkel Irian Motor tidak pernah terhenti akibat listrik padam.

**Tindakan Selanjutnya:**
1. Persentasekan dokumen perencanaan ini kepada Client untuk persetujuan.
2. Setelah disetujui, pengembang dapat langsung mengeksekusi Tahap 1 & 2 dalam waktu relatif singkat.

---
*Dokumen ini dibuat otomatis sebagai bahan diskusi dan konsultasi client.*  
*Tanggal: 4 Agustus 2026*
