'use client'

import { useState, useRef } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { exportTemplateExcel } from '@/lib/exportExcel'

interface Branch {
  id: string
  name: string
}

interface ImportSparepartModalProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
}

export default function ImportSparepartModal({ open, onClose, branches }: ImportSparepartModalProps) {
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
      shopName:  'Irian Motor',
      title:     'TEMPLATE IMPORT SPAREPART',
      filename:  'template_import_sparepart.xlsx',
      sheetName: 'Sparepart',
      columns: [
        { header: 'nama',        key: 'nama',        width: 32, required: true,  note: 'Nama lengkap sparepart' },
        { header: 'sku',         key: 'sku',         width: 18, required: false, note: 'Kode SKU (opsional)' },
        { header: 'jenis',       key: 'jenis',       width: 16, required: false, note: 'Contoh: Oli, Busi, Rem' },
        { header: 'merk',        key: 'merk',        width: 16, required: false, note: 'Merek produk' },
        { header: 'ukuran',      key: 'ukuran',      width: 14, required: false, note: 'Ukuran/tipe' },
        { header: 'harga_beli',  key: 'harga_beli',  width: 16, required: true,  note: 'Angka saja (Rp)', numFmt: '#,##0', align: 'right' },
        { header: 'harga_jual',  key: 'harga_jual',  width: 16, required: true,  note: 'Angka saja (Rp)', numFmt: '#,##0', align: 'right' },
        { header: 'stok',        key: 'stok',        width: 10, required: false, note: 'Jumlah stok awal', align: 'right' },
        { header: 'satuan',      key: 'satuan',      width: 12, required: false, note: 'pcs / botol / set / dll' },
      ],
      exampleRows: [
        { nama: 'Oli Mesin AHM 20W-50', sku: 'OLI-AHM-20W50', jenis: 'Oli', merk: 'AHM', ukuran: '20W-50', harga_beli: 35000, harga_jual: 45000, stok: 20, satuan: 'botol' },
        { nama: 'Busi NGK CR7HSA', sku: 'BUSI-NGK-CR7', jenis: 'Busi', merk: 'NGK', ukuran: 'CR7HSA', harga_beli: 18000, harga_jual: 25000, stok: 15, satuan: 'pcs' },
        { nama: 'Kampas Rem Depan Vario', sku: '', jenis: 'Kampas Rem', merk: 'Honda', ukuran: '', harga_beli: 40000, harga_jual: 55000, stok: 10, satuan: 'set' },
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
      const res = await fetch('/api/import/spareparts', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Gagal mengimpor', details: data.details })
      } else {
        setResult({ success: true, message: data.message })
        // Reload page after short delay to show updated list
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan jaringan' })
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
    <Modal open={open} onClose={handleClose} title="Import Sparepart dari Excel">
      <div className="p-6 space-y-5">

        {/* Step 1: Download Template */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Langkah 1 — Unduh Template</p>
          <p className="text-xs text-blue-700 mb-3">
            Gunakan template ini agar format kolom sesuai. Isi data sparepart di baris berikutnya.
          </p>
          <Button
            size="sm"
            variant="outline"
            icon={Download}
            onClick={handleDownloadTemplate}
          >
            Unduh Template Excel
          </Button>
        </div>

        {/* Kolom yang didukung */}
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Kolom yang didukung</p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { col: 'nama', req: true },
              { col: 'sku', req: false },
              { col: 'jenis', req: false },
              { col: 'merk', req: false },
              { col: 'ukuran', req: false },
              { col: 'harga_beli', req: false },
              { col: 'harga_jual', req: true },
              { col: 'stok', req: false },
              { col: 'satuan', req: false },
            ].map(({ col, req }) => (
              <div key={col} className="flex items-center gap-1">
                <span className="font-mono text-xs text-slate-700">{col}</span>
                {req && <span className="text-red-500 text-xs">*</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">* wajib diisi</p>
        </div>

        {/* Step 2: Pilih Cabang Tujuan */}
        {branches.length > 1 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Langkah 2 — Pilih Cabang Tujuan</p>
            <Select
              options={[
                { label: 'Semua Cabang (import ke semua)', value: 'all' },
                ...branches.map(b => ({ label: b.name, value: b.id })),
              ]}
              value={effectiveBranchMode}
              onChange={(e) => setBranchMode(e.target.value)}
            />
          </div>
        )}

        {/* Step 3: Upload File */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Langkah 3 — Upload File Excel</p>

          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary-300 transition-all">
              <Upload className="w-7 h-7 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Klik untuk pilih file</span>
              <span className="text-xs text-slate-400 mt-0.5">.xlsx atau .xls</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            result.success
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            {result.success
              ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-medium ${result.success ? 'text-emerald-800' : 'text-red-700'}`}>
                {result.message}
              </p>
              {result.details && result.details.length > 0 && (
                <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.details.map((d, i) => (
                    <li key={i} className="text-xs text-red-600">• {d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>Batal</Button>
        <Button
          onClick={handleImport}
          loading={loading}
          disabled={!file || !!result?.success}
          icon={Upload}
        >
          Import Sekarang
        </Button>
      </ModalFooter>
    </Modal>
  )
}
