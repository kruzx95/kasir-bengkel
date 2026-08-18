'use client'

import { useState } from 'react'
import {
  BookOpen,
  Printer,
  Search,
  Key,
  Receipt,
  PackagePlus,
  Store,
  ClipboardList,
  Briefcase,
  BellRing,
  DollarSign,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Chapter {
  id: string
  number: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  summary: string
  steps: {
    title: string
    desc: string
    subPoints?: string[]
  }[]
  callout?: {
    type: 'tip' | 'warning' | 'info'
    title: string
    text: string
  }
}

const chapters: Chapter[] = [
  {
    id: 'login',
    number: '01',
    title: 'Login & Memulai Shift Kasir',
    icon: Key,
    badge: 'Shift Awal',
    summary: 'Cara masuk ke sistem kasir cabang dan mengamankan akun',
    steps: [
      {
        title: 'Buka Alamat Aplikasi Kasir di Browser',
        desc: 'Buka Google Chrome di komputer/tablet kasir, lalu ketik alamat https://mulyalestari.my.id/login',
        subPoints: [
          'Tekan Ctrl + D di keyboard untuk menyimpan halaman ke bookmark browser agar mudah dibuka setiap pagi.',
        ],
      },
      {
        title: 'Masukkan Email & Password Kasir Cabang',
        desc: 'Gunakan akun kasir resmi sesuai cabang penugasan Anda (misal: kasir@mjl.com untuk Majalengka, kasir@pku.com untuk Pekanbaru).',
      },
      {
        title: 'Klik "Masuk ke Sistem"',
        desc: 'Setelah berhasil masuk, Anda akan langsung berada di Dashboard Kasir yang menampilkan omzet dan stok kritis hari ini.',
      },
    ],
    callout: {
      type: 'tip',
      title: 'Tips Keamanan Akun',
      text: 'Jangan membagikan kata sandi kasir Anda kepada orang lain. Anda bisa mengubah kata sandi kapan saja melalui menu Profil di pojok kiri bawah.',
    },
  },
  {
    id: 'transaksi',
    number: '02',
    title: 'Transaksi Kasir POS & Cetak Nota Struk',
    icon: Receipt,
    badge: 'Menu Utama',
    summary: 'Alur lengkap melayani pengerjaan servis dan penjualan sparepart hingga cetak struk',
    steps: [
      {
        title: 'Buka Menu Transaksi -> Klik "+ Transaksi Baru"',
        desc: 'Pilih jenis transaksi: Jasa Servis Saja, Sparepart Saja, atau Campuran (Jasa + Sparepart).',
      },
      {
        title: 'Pilih / Daftarkan Data Pelanggan & Kendaraan',
        desc: 'Cari nomor plat (contoh: D 1234 ABC) atau nama pelanggan. Jika pelanggan baru, klik "+ Tambah Pelanggan Baru" dan isi nama, nomor WhatsApp aktif, merk kendaraan, dan kilometer odometer saat ini.',
      },
      {
        title: 'Pilih Mekanik yang Menangani',
        desc: 'Pilih nama mekanik yang mengerjakan kendaraan agar pembagian komisi kerja mekanik terhitung otomatis dan akurat oleh sistem.',
      },
      {
        title: 'Pilih Jasa Servis & Sparepart',
        desc: 'Ketik nama jasa atau sparepart pada kolom pencarian. Sistem menampilkan harga resmi dan stok toko yang tersedia. Ubah jumlah kuantitas (Qty) jika perlu.',
      },
      {
        title: 'Pilih Metode Pembayaran',
        desc: 'Pilih salah satu metode:',
        subPoints: [
          'Tunai (CASH): Masukkan jumlah uang yang diserahkan pelanggan. Sistem otomatis menghitung uang kembalian.',
          'Transfer Bank: Tunjukkan nomor rekening resmi bengkel dan pastikan bukti transfer berhasil.',
          'QRIS: Arahkan pelanggan men-scan barcode QRIS toko di meja kasir.',
          'Pelanggan Korporat: Pilih PENDING_CORPORATE jika kendaraan dinas instansi rekanan (masuk buku piutang tempo).',
        ],
      },
      {
        title: 'Klik "Simpan & Cetak Nota"',
        desc: 'Struk thermal kasir akan langsung dicetak. Sobek dan serahkan struk nota ke pelanggan dengan sopan beserta uang kembalian.',
      },
    ],
    callout: {
      type: 'info',
      title: 'Cetak Ulang Nota',
      text: 'Jika kertas printer macet atau pelanggan meminta salinan nota di kemudian hari, buka menu Transaksi -> cari nomor nota / plat kendaraan -> klik ikon printer 🖨️ untuk mencetak ulang kapan saja.',
    },
  },
  {
    id: 'restock',
    number: '03',
    title: 'Input Barang Masuk dari Supplier (Restock)',
    icon: PackagePlus,
    badge: 'Inventaris',
    summary: 'Mencatat faktur pengiriman barang baru dari sales/distributor supplier',
    steps: [
      {
        title: 'Buka Menu "Barang Masuk" -> Klik "+ Tambah Barang Masuk"',
        desc: 'Gunakan menu ini setiap kali ada sparepart baru yang diantar oleh supplier/distributor ke bengkel.',
      },
      {
        title: 'Isi Data Surat Jalan / Faktur Supplier',
        desc: 'Masukkan Nama Supplier (contoh: PT Astra Otoparts, CV Maju Motor), Tanggal Datang, dan No. Faktur supplier.',
      },
      {
        title: 'Tambahkan Daftar Sparepart yang Diterima',
        desc: 'Pilih nama sparepart, masukkan Jumlah Barang (Qty) yang diterima, dan Harga Beli Satuan (Modal) sesuai faktur kertas supplier.',
      },
      {
        title: 'Foto / Upload Nota Kertas Supplier',
        desc: 'Ambil foto bukti fisik faktur kertas supplier untuk diarsipkan secara digital di sistem.',
      },
      {
        title: 'Klik "Simpan Barang Masuk"',
        desc: 'Stok barang akan otomatis bertambah detik itu juga dan tercatat rapi di laporan mutasi.',
      },
    ],
    callout: {
      type: 'tip',
      title: 'Akurasi Modal Barang',
      text: 'Pastikan harga beli satuan yang diinput sesuai dengan harga setelah diskon supplier agar laporan laba kotor bengkel tetap akurat.',
    },
  },
  {
    id: 'stok',
    number: '04',
    title: 'Manajemen Stok Toko vs Gudang & Mutasi',
    icon: Store,
    badge: 'Stok Barang',
    summary: 'Pemisahan stok etalase depan kasir vs stok cadangan di gudang belakang',
    steps: [
      {
        title: 'Pahami Perbedaan Stok Toko vs Stok Gudang',
        desc: 'Stok Toko adalah barang yang dipajang di rak kasir (langsung berkurang saat kasir cetak nota). Stok Gudang adalah stok cadangan dus besar di ruang belakang (tidak berkurang saat kasir cetak nota).',
      },
      {
        title: 'Buka Menu "Stock Toko" / "Stock Transfer"',
        desc: 'Saat stok sparepart di etalase depan kasir mulai menipis, klik tombol "+ Transfer Stok".',
      },
      {
        title: 'Pilih Jenis: "Gudang ke Toko"',
        desc: 'Pilih nama sparepart dan masukkan jumlah pcs yang diambil dari gudang untuk dipajang di rak etalase kasir.',
      },
      {
        title: 'Klik "Konfirmasi Pindah Stok"',
        desc: 'Sistem akan otomatis memotong stok gudang dan menambahkan stok etalase toko secara instan.',
      },
    ],
    callout: {
      type: 'warning',
      title: 'Peringatan Stok 0',
      text: 'Jika di kasir stok barang tertulis 0 padahal barang fisiknya ada, kemungkinan barang tersebut masih tercatat di Stok Gudang. Segera lakukan Transfer Stok dari Gudang ke Toko.',
    },
  },
  {
    id: 'indent',
    number: '05',
    title: 'Barang Indent (Pre-Order & Uang Muka DP)',
    icon: ClipboardList,
    badge: 'Pre-Order',
    summary: 'Prosedur pemesanan khusus saat pelanggan membutuhkan sparepart langka',
    steps: [
      {
        title: 'Catat Pesanan Indent & Terima Uang DP',
        desc: 'Buka menu Barang Indent -> klik "+ Tambah Pesanan Indent". Masukkan data pelanggan, nama sparepart yang dipesan, estimasi harga, supplier tujuan, dan jumlah Uang Muka / DP yang diserahkan pelanggan. Cetak bukti tanda terima DP.',
      },
      {
        title: 'Saat Barang Tiba di Bengkel -> Klik "Terima Barang"',
        desc: 'Begitu pesanan dari supplier sampai di bengkel, buka menu Barang Indent -> cari pesanan pelanggan tersebut -> klik tombol "Terima Barang".',
      },
      {
        title: 'Hubungi Pelanggan & Lakukan Pelunasan',
        desc: 'Hubungi WhatsApp pelanggan bahwa barang sudah tiba. Saat pelanggan datang, buat transaksi kasir dan potong total tagihan dengan DP yang sudah dibayar sebelumnya.',
      },
    ],
  },
  {
    id: 'korporat',
    number: '06',
    title: 'Pelayanan Armada Korporat / Instansi (Tempo)',
    icon: Briefcase,
    badge: 'Rekanan Bisnis',
    summary: 'Melayani perawatan berkala kendaraan operasional kantor rekanan',
    steps: [
      {
        title: 'Pilih Nama Korporat saat Buat Transaksi',
        desc: 'Di form transaksi, pilih nama perusahaan rekanan (contoh: PT Telkom, J&T Express), masukkan plat kendaraan dinas dan nama driver.',
      },
      {
        title: 'Pilih Metode Pembayaran: PENDING_CORPORATE',
        desc: 'Driver tidak membayar di meja kasir. Transaksi ini otomatis tercatat sebagai Tagihan Korporat yang akan dibayar secara berkala oleh kantor rekanan.',
      },
      {
        title: 'Cetak Surat Jalan / Bukti Pengerjaan',
        desc: 'Minta driver perusahaan menandatangani lembar bukti pengerjaan bengkel sebagai bukti fisik servis.',
      },
      {
        title: 'Pencatatan Pembayaran Tagihan',
        desc: 'Saat bagian keuangan perusahaan mentransfer pembayaran, buka menu Korporat -> klik "Catat Pembayaran" -> masukkan nominal yang ditransfer.',
      },
    ],
  },
  {
    id: 'reminder',
    number: '07',
    title: 'Reminder Servis Berkala via WhatsApp',
    icon: BellRing,
    badge: 'Loyalitas',
    summary: 'Mengingatkan pelanggan setia untuk servis berkala dengan 1 klik',
    steps: [
      {
        title: 'Buka Menu "Reminder"',
        desc: 'Sistem secara otomatis menampilkan daftar pelanggan yang sudah 30, 60, atau 90 hari belum kembali servis sejak tanggal servis terakhirnya.',
      },
      {
        title: 'Klik Tombol Hijau "💬 Kirim WhatsApp"',
        desc: 'Browser akan otomatis membuka WhatsApp dengan template pesan ramah dan sopan yang sudah terisi otomatis (nama pelanggan, nomor plat, dan anjuran servis).',
      },
      {
        title: 'Tekan Tombol Kirim di WhatsApp',
        desc: 'Pesan langsung terkirim ke pelanggan tanpa perlu mengetik ulang secara manual.',
      },
    ],
    callout: {
      type: 'tip',
      title: 'Waktu Terbaik Kirim Reminder',
      text: 'Waktu terbaik untuk mengirim pesan reminder servis adalah pagi hari pukul 09.00 - 11.00 atau sore hari pukul 16.00 - 18.00 saat pelanggan sedang luang.',
    },
  },
  {
    id: 'closing',
    number: '08',
    title: 'Tutup Shift & Rekap Kas Harian (Closing)',
    icon: DollarSign,
    badge: 'Tutup Toko',
    summary: 'Prosedur pencocokan fisik uang laci dan serah terima kasir akhir hari',
    steps: [
      {
        title: 'Buka Menu "Laporan" & Pilih Tanggal Hari Ini',
        desc: 'Pastikan filter tanggal memilih Hari Ini untuk melihat seluruh transaksi yang terjadi selama shift Anda.',
      },
      {
        title: 'Hitung Uang Tunai Fisik di Laci Kasir',
        desc: 'Hitung seluruh uang lembaran kertas dan koin yang ada di dalam laci kasir. Jumlah uang fisik WAJIB SAMA PERSIS dengan nilai Total Kas Tunai (CASH) pada laporan sistem.',
      },
      {
        title: 'Cek Mutasi Transfer & QRIS',
        desc: 'Pastikan seluruh struk/mutasi non-tunai (Transfer Bank & QRIS) sudah sesuai dengan angka laporan sistem.',
      },
      {
        title: 'Serah Terima Kasir',
        desc: 'Serahkan uang kas fisik beserta ringkasan laporan harian kepada Kepala Cabang atau kasir shift berikutnya.',
      },
    ],
    callout: {
      type: 'warning',
      title: 'Pencegahan Selisih Kas',
      text: 'Jika terjadi selisih antara uang fisik di laci dengan sistem, periksa kembali apakah ada nota tunai yang belum terinput atau salah memberi uang kembalian.',
    },
  },
  {
    id: 'faq',
    number: '09',
    title: 'Tanya Jawab (FAQ) & Solusi Kendala Kasir',
    icon: HelpCircle,
    badge: 'Troubleshooting',
    summary: 'Jawaban cepat untuk pertanyaan dan kendala teknis yang sering ditemui',
    steps: [
      {
        title: 'Salah input barang dan nota sudah terlanjur disimpan?',
        desc: 'Hubungi Super Admin cabang Anda untuk melakukan pembatalan nota yang salah, kemudian buat transaksi baru yang sudah diperbaiki.',
      },
      {
        title: 'Printer thermal kasir tidak mencetak / macet?',
        desc: '1. Periksa sambungan kabel USB printer ke komputer.\n2. Pastikan kertas roll thermal terpasang benar dan tidak habis.\n3. Matikan printer 5 detik lalu nyalakan kembali.\n4. Buka menu Transaksi -> cari nota terkait -> klik ikon printer 🖨️ untuk cetak ulang.',
      },
      {
        title: 'Apakah kasir bisa melihat data transaksi cabang lain?',
        desc: 'Tidak bisa. Demi privasi dan keamanan operasional, akun kasir hanya dapat melihat data stok, pelanggan, dan transaksi di cabangnya sendiri.',
      },
    ],
  },
]

export default function PanduanClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')

  const filteredChapters = chapters.filter((ch) => {
    const matchesSearch =
      ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.steps.some(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchTerm.toLowerCase())
      )

    if (activeTab === 'all') return matchesSearch
    return ch.id === activeTab && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari panduan (contoh: qris, kembalian, restock, indent)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => window.print()}
            icon={Printer}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Panduan Resmi Kasir
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Buku Panduan Operasional Kasir Bengkel
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Panduan terstruktur dan praktis untuk kasir Mulya Lestari dalam menjalankan transaksi harian,
              pengelolaan stok toko & gudang, pemesanan indent, reminder pelanggan, dan penutupan kasir.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-40 flex-shrink-0">
            <p className="text-xs text-slate-300 font-medium">Standar Operasional</p>
            <p className="text-lg font-bold text-white mt-0.5">Versi 1.0 (2026)</p>
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Siap Operasional
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none print:hidden">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semua Bab ({chapters.length})
        </button>
        {chapters.map((ch) => {
          const Icon = ch.icon
          const isActive = activeTab === ch.id
          return (
            <button
              key={ch.id}
              onClick={() => setActiveTab(ch.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{ch.title}</span>
            </button>
          )
        })}
      </div>

      {/* Chapters Content */}
      <div className="space-y-6">
        {filteredChapters.map((ch) => {
          const Icon = ch.icon
          return (
            <div
              key={ch.id}
              id={ch.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 break-inside-avoid"
            >
              {/* Header Bab */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm">
                    {ch.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{ch.title}</h2>
                      <span className="hidden sm:inline-block text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
                        {ch.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{ch.summary}</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hidden sm:block">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Step Cards List */}
              <div className="grid grid-cols-1 gap-3.5">
                {ch.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {step.desc}
                      </p>
                      {step.subPoints && (
                        <ul className="mt-2 space-y-1.5 pl-4 list-disc text-xs text-slate-600">
                          {step.subPoints.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Callout Box (if available) */}
              {ch.callout && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                    ch.callout.type === 'tip'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : ch.callout.type === 'warning'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-blue-50/80 border-blue-200 text-blue-900'
                  }`}
                >
                  {ch.callout.type === 'tip' ? (
                    <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : ch.callout.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block mb-0.5">{ch.callout.title}</span>
                    <span>{ch.callout.text}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Banner */}
      <div className="bg-slate-900 text-slate-400 p-6 rounded-2xl text-center text-xs space-y-1 border border-slate-800">
        <p className="font-bold text-slate-200">Bengkel Mulya Lestari — Maju Bersama Pelayanan Terbaik</p>
        <p>Buku Panduan Operasional Kasir & POS Multi-Cabang © 2026</p>
      </div>
    </div>
  )
}
