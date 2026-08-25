'use client'

import { useState, useRef } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X, Warehouse } from 'lucide-react'
import { exportTemplateExcel } from '@/lib/exportExcel'

interface Branch {
  id: string
  name: string
}

interface ImportWarehouseStockModalProps {
  open: boolean
  onClose: () => void
  branches?: Branch[]
}

export default function ImportWarehouseStockModal({ open, onClose, branches = [] }: ImportWarehouseStockModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [branchMode, setBranchMode] = useState('all')
  const effectiveBranchMode = branches.length === 1 ? branches[0].id : branchMode
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownloadTemplate = async () => {
    await exportTemplateExcel({
      shopName:  'IRIAN MOTOR',
      title:     'TEMPLATE IMPORT STOK GUDANG',
      filename:  'template_import_stock_gudang.xlsx',
      sheetName: 'Stok Gudang',
      columns: [
        { header: 'nama',              key: 'nama',              width: 32, required: true,  note: 'Nama lengkap sparepart di gudang' },
        { header: 'sku',               key: 'sku',               width: 18, required: false, note: 'Kode SKU / Barcode (opsional)' },
        { header: 'stok_gudang',       key: 'stok_gudang',       width: 14, required: true,  note: 'Jumlah fisik stok gudang saat ini', align: 'right' },
        { header: 'min_stok_gudang',   key: 'min_stok_gudang',   width: 16, required: false, note: 'Batas minimum peringatan stok', align: 'right' },
        { header: 'lokasi_rak',        key: 'lokasi_rak',        width: 16, required: false, note: 'Rak / Bin / Penempatan di Gudang' },
        { header: 'harga_beli',        key: 'harga_beli',        width: 16, required: false, note: 'Harga modal beli (Rp)', numFmt: '#,##0', align: 'right' },
        { header: 'harga_jual',        key: 'harga_jual',        width: 16, required: false, note: 'Harga jual standar (Rp)', numFmt: '#,##0', align: 'right' },
        { header: 'jenis',             key: 'jenis',             width: 16, required: false, note: 'Contoh: Oli, Busi, Ban, Bearing' },
        { header: 'merk',              key: 'merk',              width: 16, required: false, note: 'Merek produk suku cadang' },
        { header: 'ukuran',            key: 'ukuran',            width: 14, required: false, note: 'Ukuran/spesifikasi' },
        { header: 'satuan',            key: 'satuan',            width: 12, required: false, note: 'pcs / botol / set / dus' },
      ],
      exampleRows: [
        { nama: 'Oli Mesin AHM 20W-50 0.8L', sku: 'OLI-AHM-20W50', stok_gudang: 48, min_stok_gudang: 12, lokasi_rak: 'Gudang Rak A-1', harga_beli: 38000, harga_jual: 50000, jenis: 'Oli Mesin', merk: 'AHM', ukuran: '0.8L', satuan: 'botol' },
        { nama: 'Busi NGK CR7HSA', sku: 'BUSI-NGK-CR7', stok_gudang: 100, min_stok_gudang: 20, lokasi_rak: 'Gudang Rak B-2', harga_beli: 17500, harga_jual: 25000, jenis: 'Busi', merk: 'NGK', ukuran: 'CR7HSA', satuan: 'pcs' },
        { nama: 'Kampas Rem Depan Vario 125/150', sku: 'KAMPAS-VAR-DPN', stok_gudang: 30, min_stok_gudang: 5, lokasi_rak: 'Gudang Rak C-1', harga_beli: 35000, harga_jual: 55000, jenis: 'Kampas Rem', merk: 'Honda', ukuran: 'Standar', satuan: 'set' },
      ],
    })
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('branchMode', effectiveBranchMode)

    try {
      const res = await fetch('/api/import/warehouse-stock', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Gagal mengimpor data stok gudang', details: data.details })
      } else {
        setResult({ success: true, message: data.message })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan jaringan saat mengirim data' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setBranchMode('all')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Stok Gudang dari Excel">
      <div className="p-6 space-y-5">

        {/* Step 1: Download Template */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Warehouse className="w-4 h-4 text-purple-700" />
            <p className="text-sm font-bold text-purple-950">Langkah 1 — Unduh Template Stok Gudang</p>
          </div>
          <p className="text-xs text-purple-800 mb-3">
            Gunakan template resmi khusus gudang ini. Nilai pada kolom <strong>stok_gudang</strong> akan memperbarui jumlah stok di gudang tanpa mengubah stok toko.
          </p>
          <Button
            size="sm"
            variant="outline"
            icon={Download}
            onClick={handleDownloadTemplate}
            className="border-purple-300 text-purple-900 hover:bg-purple-100"
          >
            Unduh Template Excel (Stok Gudang)
          </Button>
        </div>

        {/* Kolom yang didukung */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Struktur Kolom Excel</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { col: 'nama', req: true, desc: 'Nama sparepart' },
              { col: 'stok_gudang', req: true, desc: 'Kuantitas gudang' },
              { col: 'sku', req: false, desc: 'Kode SKU/Barcode' },
              { col: 'min_stok_gudang', req: false, desc: 'Batas minim gudang' },
              { col: 'lokasi_rak', req: false, desc: 'Rak / Bin Gudang' },
              { col: 'harga_beli', req: false, desc: 'Harga modal' },
              { col: 'harga_jual', req: false, desc: 'Harga jual' },
              { col: 'jenis', req: false, desc: 'Kategori' },
              { col: 'merk', req: false, desc: 'Merk' },
              { col: 'satuan', req: false, desc: 'pcs/botol/set' },
            ].map(({ col, req, desc }) => (
              <div key={col} className="bg-white p-2 rounded-lg border border-slate-200/60">
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span>{col}</span>
                  {req && <span className="text-red-500 font-bold">*</span>}
                </div>
                <span className="text-[10px] text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">* Kolom wajib diisi minimal</p>
        </div>

        {/* Cabang Target (hanya jika ada banyak cabang) */}
        {branches.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Terapkan ke Cabang
            </label>
            <Select
              value={branchMode}
              onChange={(e) => setBranchMode(e.target.value)}
              options={[
                { value: 'all', label: 'Semua Cabang Aktif' },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
        )}

        {/* Step 2: Upload File */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Langkah 2 — Unggah File Excel (.xlsx / .xls)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-warehouse-file-input"
          />

          {!file ? (
            <label
              htmlFor="excel-warehouse-file-input"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-colors"
            >
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Klik untuk memilih file Excel</p>
              <p className="text-xs text-slate-400 mt-0.5">Format .xlsx atau .xls (Maks. 10MB)</p>
            </label>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-6 h-6 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Result Alerts */}
        {result && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{result.message}</p>
              {result.details && result.details.length > 0 && (
                <ul className="text-xs list-disc list-inside space-y-0.5 text-red-700 max-h-36 overflow-y-auto font-mono">
                  {result.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon={Upload}
            onClick={handleImport}
            disabled={!file || loading}
            loading={loading}
          >
            Mulai Import Stok Gudang
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
