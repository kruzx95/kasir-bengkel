'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileJson,
  RefreshCw,
  Info,
} from 'lucide-react'
import { exportDatabaseBackup, restoreDatabase, cleanDatabase } from '@/actions/database'

export default function DatabaseManagementClient() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Backup State
  const [downloading, setDownloading] = useState(false)
  const [backupSummary, setBackupSummary] = useState<Record<string, number> | null>(null)

  // Restore State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreJsonContent, setRestoreJsonContent] = useState<string>('')
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreConfirmText, setRestoreConfirmText] = useState('')
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // Clean / Reset State
  const [cleanModalOpen, setCleanModalOpen] = useState(false)
  const [cleanMode, setCleanMode] = useState<'TRANSACTIONS_ONLY' | 'CATALOG_ONLY' | 'FULL_RESET'>('CATALOG_ONLY')
  const [cleanPassword, setCleanPassword] = useState('')
  const [cleanConfirmText, setCleanConfirmText] = useState('')
  const [cleanError, setCleanError] = useState<string | null>(null)

  // Handle Export Backup
  const handleExport = async () => {
    setMessage(null)
    setDownloading(true)
    try {
      const res = await exportDatabaseBackup()
      if (res.success && res.jsonString && res.filename) {
        // Trigger browser download
        const blob = new Blob([res.jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        if (res.summary) {
          setBackupSummary(res.summary)
        }
        setMessage({ type: 'success', text: `File backup ${res.filename} berhasil diunduh!` })
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal mengekspor backup' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengunduh file backup.' })
    } finally {
      setDownloading(false)
    }
  }

  // Handle File Selection for Restore
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestoreFile(file)
    setRestoreError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRestoreJsonContent(content)
      setRestoreModalOpen(true)
    }
    reader.onerror = () => {
      setRestoreError('Gagal membaca file JSON.')
    }
    reader.readAsText(file)
  }

  // Submit Restore
  const handleConfirmRestore = () => {
    if (!restoreJsonContent) {
      setRestoreError('File backup tidak valid.')
      return
    }
    if (!restorePassword) {
      setRestoreError('Masukkan password Admin Anda.')
      return
    }
    if (restoreConfirmText.trim().toUpperCase() !== 'RESTORE DATABASE') {
      setRestoreError('Ketik "RESTORE DATABASE" untuk mengonfirmasi.')
      return
    }

    setRestoreError(null)
    startTransition(async () => {
      const res = await restoreDatabase(restoreJsonContent, restorePassword)
      if (res.success) {
        setRestoreModalOpen(false)
        setRestoreFile(null)
        setRestoreJsonContent('')
        setRestorePassword('')
        setRestoreConfirmText('')
        setMessage({ type: 'success', text: res.message })
      } else {
        setRestoreError(res.message || 'Gagal memulihkan database.')
      }
    })
  }

  // Submit Clean / Reset
  const handleConfirmClean = () => {
    if (!cleanPassword) {
      setCleanError('Masukkan password Admin Anda.')
      return
    }
    const expectedConfirmText =
      cleanMode === 'TRANSACTIONS_ONLY'
        ? 'RESET TRANSAKSI'
        : cleanMode === 'CATALOG_ONLY'
        ? 'RESET KATALOG'
        : 'RESET TOTAL'

    if (cleanConfirmText.trim().toUpperCase() !== expectedConfirmText) {
      setCleanError(`Ketik "${expectedConfirmText}" untuk mengonfirmasi.`)
      return
    }

    setCleanError(null)
    startTransition(async () => {
      const res = await cleanDatabase(cleanMode, cleanPassword)
      if (res.success) {
        setCleanModalOpen(false)
        setCleanPassword('')
        setCleanConfirmText('')
        setMessage({ type: 'success', text: res.message })
      } else {
        setCleanError(res.message || 'Gagal melakukan pembersihan database.')
      }
    })
  }

  const getExpectedConfirmText = () => {
    if (cleanMode === 'TRANSACTIONS_ONLY') return 'RESET TRANSAKSI'
    if (cleanMode === 'CATALOG_ONLY') return 'RESET KATALOG'
    return 'RESET TOTAL'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alert Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-semibold opacity-70 hover:opacity-100">
            Tutup
          </button>
        </div>
      )}

      {/* Main Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Database className="w-3.5 h-3.5" /> Core System Tool
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Manajemen & Pemulihan Database</h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Unduh snapshot cadangan database, pulihkan dari file backup, atau bersihkan data uji coba (testing) secara aman tanpa mengganggu akun login Admin & Kasir.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 p-4 rounded-2xl text-center min-w-36">
            <p className="text-xs text-slate-300">Format Backup</p>
            <p className="text-lg font-bold text-white mt-0.5">JSON Snapshot</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Backup Database */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Backup Database</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ekspor seluruh data akun, cabang, katalog sparepart, jasa, dan riwayat transaksi ke dalam file cadangan.
              </p>
            </div>

            {backupSummary && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                <p className="font-semibold text-slate-800 border-b border-slate-200 pb-1">Terakhir Di-backup:</p>
                <div className="flex justify-between"><span>Cabang:</span> <b>{backupSummary.branches}</b></div>
                <div className="flex justify-between"><span>User:</span> <b>{backupSummary.users}</b></div>
                <div className="flex justify-between"><span>Sparepart:</span> <b>{backupSummary.spareparts}</b></div>
                <div className="flex justify-between"><span>Jasa Servis:</span> <b>{backupSummary.services}</b></div>
                <div className="flex justify-between"><span>Transaksi:</span> <b>{backupSummary.transactions}</b></div>
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            loading={downloading}
            icon={FileJson}
            className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            {downloading ? 'Mengunduh...' : 'Unduh Backup (.json)'}
          </Button>
        </div>

        {/* Card 2: Restore Database */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Restore Database</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pulihkan seluruh database dari file snapshot `.json` hasil backup sebelumnya.
              </p>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 text-xs text-emerald-800 flex gap-2">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Memulihkan data akan menimpa data yang ada saat ini dengan isi file backup.</span>
            </div>
          </div>

          <label className="block w-full">
            <span className="sr-only">Upload File Backup</span>
            <div className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm transition-all shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{restoreFile ? restoreFile.name : 'Pilih File Backup (.json)'}</span>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Card 3: Pembersihan & Reset Data */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Clean & Reset Data</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih bagian data mana yang ingin dikosongkan untuk persiapan input data asli bengkel.
              </p>
            </div>

            {/* Mode selection radio */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="cleanMode"
                  value="CATALOG_ONLY"
                  checked={cleanMode === 'CATALOG_ONLY'}
                  onChange={() => setCleanMode('CATALOG_ONLY')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-bold text-indigo-900">Kosongkan Sparepart & Jasa (Persiapan Data Asli)</p>
                  <p className="text-[11px] text-slate-500">
                    Menghapus seluruh katalog Sparepart & Jasa Servis. <b>AKUN LOGIN ADMIN & KASIR 100% AMAN</b>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="cleanMode"
                  value="TRANSACTIONS_ONLY"
                  checked={cleanMode === 'TRANSACTIONS_ONLY'}
                  onChange={() => setCleanMode('TRANSACTIONS_ONLY')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Reset Transaksi Saja</p>
                  <p className="text-[11px] text-slate-500">
                    Menghapus nota kasir & transaksi testing. Katalog & Seluruh Akun Login <b>TETAP UTUH</b>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="cleanMode"
                  value="FULL_RESET"
                  checked={cleanMode === 'FULL_RESET'}
                  onChange={() => setCleanMode('FULL_RESET')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="text-xs font-bold text-rose-700">Factory Reset Total</p>
                  <p className="text-[11px] text-slate-500">
                    Mengosongkan seluruh database (Kecuali 1 Akun Admin utama & Cabang utama).
                  </p>
                </div>
              </label>
            </div>
          </div>

          <Button
            onClick={() => {
              setCleanError(null)
              setCleanPassword('')
              setCleanConfirmText('')
              setCleanModalOpen(true)
            }}
            variant="outline"
            icon={Trash2}
            className="w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            Proses Pembersihan Data
          </Button>
        </div>
      </div>

      {/* MODAL: RESTORE DATABASE */}
      <Modal
        open={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        title="Konfirmasi Restore Database"
        description="Apakah Anda yakin ingin memulihkan seluruh data dari file backup ini?"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Peringatan Penting!</span>
            </div>
            <p>
              Proses restore akan menghapus seluruh data yang ada saat ini dan menggantinya secara total dengan data yang tersimpan di dalam file backup JSON ini.
            </p>
          </div>

          {restoreError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {restoreError}
            </div>
          )}

          <div className="space-y-3">
            <Input
              type="password"
              label="Masukkan Password Admin Anda"
              placeholder="Konfirmasi kata sandi"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ketik teks konfirmasi: <span className="font-bold text-slate-900 select-none">RESTORE DATABASE</span>
              </label>
              <Input
                type="text"
                placeholder="RESTORE DATABASE"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setRestoreModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmRestore}
              loading={isPending}
              icon={RefreshCw}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ya, Mulai Restore Database
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CLEAN / RESET DATABASE */}
      <Modal
        open={cleanModalOpen}
        onClose={() => setCleanModalOpen(false)}
        title={
          cleanMode === 'CATALOG_ONLY'
            ? 'Konfirmasi Reset Katalog Sparepart & Jasa Servis'
            : cleanMode === 'TRANSACTIONS_ONLY'
            ? 'Konfirmasi Reset Data Transaksi'
            : 'Konfirmasi Factory Reset Total'
        }
        description="Tindakan ini memerlukan verifikasi keamanan Admin."
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Perhatian Risiko Data!</span>
            </div>
            {cleanMode === 'CATALOG_ONLY' ? (
              <p>
                Daftar <b>Sparepart</b> dan <b>Jasa Servis</b> akan dikosongkan untuk persiapan input data asli bengkel. <b>SELURUH AKUN LOGIN (ADMIN & KASIR) DAN CABANG TERJAGA 100% AMAN</b>.
              </p>
            ) : cleanMode === 'TRANSACTIONS_ONLY' ? (
              <p>
                Seluruh nota transaksi kasir, indent, restock supplier, dan mutasi stok uji coba akan dihapus secara permanen. User login, Cabang, dan Katalog Sparepart akan <b>tetap utuh</b>.
              </p>
            ) : (
              <p>
                <b>FACTORY RESET</b> akan mengosongkan seluruh database (Sparepart, Jasa, Transaksi, Pelanggan, User Kasir) kecuali akun Admin utama Anda dan Cabang utama.
              </p>
            )}
          </div>

          {cleanError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {cleanError}
            </div>
          )}

          <div className="space-y-3">
            <Input
              type="password"
              label="Masukkan Password Admin Anda"
              placeholder="Konfirmasi kata sandi"
              value={cleanPassword}
              onChange={(e) => setCleanPassword(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ketik teks konfirmasi: <span className="font-bold text-rose-700 select-none">{getExpectedConfirmText()}</span>
              </label>
              <Input
                type="text"
                placeholder={getExpectedConfirmText()}
                value={cleanConfirmText}
                onChange={(e) => setCleanConfirmText(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setCleanModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmClean}
              loading={isPending}
              icon={Trash2}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Konfirmasi Pembersihan Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
