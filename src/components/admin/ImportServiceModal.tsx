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

interface ImportServiceModalProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
  onSuccess?: () => void
}

export default function ImportServiceModal({ open, onClose, branches, onSuccess }: ImportServiceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [branchMode, setBranchMode] = useState('all')
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
      shopName:  'MULYA LESTARI',
      title:     'TEMPLATE IMPORT JASA SERVIS',
      filename:  'template_import_servis.xlsx',
      sheetName: 'Jasa Servis',
      columns: [
        { header: 'nama',     key: 'nama',     width: 36, required: true,  note: 'Nama jasa / layanan servis' },
        { header: 'harga',    key: 'harga',    width: 16, required: true,  note: 'Angka saja (Rp)', numFmt: '#,##0', align: 'right' },
        { header: 'kategori', key: 'kategori', width: 22, required: false, note: 'Contoh: Oli, Rem, Tune Up' },
      ],
      exampleRows: [
        { nama: 'Ganti Oli Mesin', harga: 25000, kategori: 'Oli' },
        { nama: 'Tune Up Ringan', harga: 50000, kategori: 'Tune Up' },
        { nama: 'Ganti Ban Depan', harga: 15000, kategori: 'Ban' },
        { nama: 'Servis Karburator', harga: 75000, kategori: 'Karburator' },
        { nama: 'Ganti Kampas Rem', harga: 20000, kategori: 'Rem' },
      ],
    })
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('branchMode', branchMode)

    try {
      const res = await fetch('/api/import/services', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Gagal mengimpor', details: data.details })
      } else {
        setResult({ success: true, message: data.message })
        if (onSuccess) {
          onSuccess()
        } else {
          setTimeout(() => window.location.reload(), 1500)
        }
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
    <Modal open={open} onClose={handleClose} title="Import Jasa Servis dari Excel">
      <div className="p-6 space-y-5">

        {/* Step 1: Download Template */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Langkah 1 — Unduh Template</p>
          <p className="text-xs text-blue-700 mb-3">
            Gunakan template ini agar format kolom sesuai. Isi daftar jasa servis di baris berikutnya.
          </p>
          <Button size="sm" variant="outline" icon={Download} onClick={handleDownloadTemplate}>
            Unduh Template Excel
          </Button>
        </div>

        {/* Kolom yang didukung */}
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Kolom yang didukung</p>
          <div className="flex flex-wrap gap-3">
            {[
              { col: 'nama', req: true, desc: 'Nama jasa servis' },
              { col: 'harga', req: true, desc: 'Harga jasa (Rp)' },
              { col: 'kategori', req: false, desc: 'Contoh: Oli, Rem, Tune Up' },
            ].map(({ col, req, desc }) => (
              <div key={col} className="flex items-start gap-1.5">
                <span className="font-mono text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {col}{req && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">* wajib diisi</p>
        </div>

        {/* Step 2: Pilih Cabang */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Langkah 2 — Pilih Cabang Tujuan</p>
          <Select
            options={[
              { label: 'Semua Cabang (import ke semua)', value: 'all' },
              ...branches.map(b => ({ label: b.name, value: b.id })),
            ]}
            value={branchMode}
            onChange={(e) => setBranchMode(e.target.value)}
          />
        </div>

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
              <button onClick={handleRemoveFile} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
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
