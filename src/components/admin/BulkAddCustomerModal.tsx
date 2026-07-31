'use client'

import { useState, useCallback } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  Table2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { bulkCreateCustomers, type BulkCustomerRow } from '@/actions/customer'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Branch { id: string; name: string }
interface Corporate { id: string; name: string }

interface BulkAddCustomerModalProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
  corporateList: Corporate[]
}

type TabMode = 'generator' | 'manual'

interface ManualRow {
  id: string
  name: string
  phone: string
  plateNumber: string
  vehicleBrand: string
  vehicleType: string
  vehicleColor: string
  vehicleYear: string
  fuelType: string
  odometer: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INDONESIAN_NAMES = [
  'Budi', 'Siti', 'Ahmad', 'Dewi', 'Hendra', 'Rina', 'Agus', 'Yuni',
  'Bambang', 'Wati', 'Doni', 'Rini', 'Eko', 'Ani', 'Wahyu', 'Lina',
  'Joko', 'Sri', 'Irwan', 'Tari', 'Fajar', 'Mega', 'Rizky', 'Nita',
  'Gilang', 'Putri', 'Arif', 'Dian', 'Surya', 'Fitri',
]

const PLATE_LETTERS = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH']

function generateRows(
  prefix: string,
  count: number,
  platePrefix: string,
  vehicleBrand: string,
  vehicleType: string,
  vehicleColor: string,
  vehicleYear: string,
  fuelType: string,
  odometerBase: number,
): BulkCustomerRow[] {
  return Array.from({ length: count }, (_, i) => {
    const namePart = prefix.trim()
      ? `${prefix.trim()} ${i + 1}`
      : INDONESIAN_NAMES[i % INDONESIAN_NAMES.length]

    const plateNum = String(1000 + i).padStart(4, '0')
    const plateSuffix = PLATE_LETTERS[i % PLATE_LETTERS.length]
    const plateNumber = platePrefix.trim()
      ? `${platePrefix.trim().toUpperCase()} ${plateNum} ${plateSuffix}`
      : undefined

    return {
      name: namePart,
      plateNumber: plateNumber || undefined,
      vehicleBrand: vehicleBrand || undefined,
      vehicleType: vehicleType || undefined,
      vehicleColor: vehicleColor || undefined,
      vehicleYear: vehicleYear || undefined,
      fuelType: (fuelType as 'GASOLINE' | 'DIESEL') || undefined,
      odometer: odometerBase > 0 ? odometerBase + i * 100 : undefined,
    }
  })
}

function newManualRow(): ManualRow {
  return {
    id: Math.random().toString(36).slice(2),
    name: '', phone: '', plateNumber: '',
    vehicleBrand: '', vehicleType: '', vehicleColor: '',
    vehicleYear: '', fuelType: '', odometer: '',
  }
}

const inputCls =
  'w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all'

const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

// ─── Component ───────────────────────────────────────────────────────────────

export default function BulkAddCustomerModal({
  open, onClose, branches, corporateList,
}: BulkAddCustomerModalProps) {
  const [tab, setTab] = useState<TabMode>('generator')

  // shared
  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [corporateId, setCorporateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; created: number; failed: number; errors: string[]; message: string } | null>(null)

  // generator tab
  const [namePrefix, setNamePrefix] = useState('')
  const [count, setCount] = useState(5)
  const [platePrefix, setPlatePrefix] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [odometerBase, setOdometerBase] = useState('')

  // manual tab
  const [manualRows, setManualRows] = useState<ManualRow[]>([newManualRow()])

  // ── generator preview
  const previewRows = generateRows(
    namePrefix, Math.min(Math.max(count, 1), 100),
    platePrefix, vehicleBrand, vehicleType, vehicleColor, vehicleYear, fuelType,
    odometerBase ? Number(odometerBase) : 0,
  )

  // ── manual helpers
  const updateRow = useCallback((id: string, field: keyof ManualRow, value: string) => {
    setManualRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  const addRow = () => setManualRows(rows => [...rows, newManualRow()])
  const removeRow = (id: string) => setManualRows(rows => rows.filter(r => r.id !== id))

  // ── submit
  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)

    let rows: BulkCustomerRow[]

    if (tab === 'generator') {
      rows = previewRows
    } else {
      rows = manualRows
        .filter(r => r.name.trim())
        .map(r => ({
          name: r.name.trim(),
          phone: r.phone || undefined,
          plateNumber: r.plateNumber || undefined,
          vehicleBrand: r.vehicleBrand || undefined,
          vehicleType: r.vehicleType || undefined,
          vehicleColor: r.vehicleColor || undefined,
          vehicleYear: r.vehicleYear || undefined,
          fuelType: r.fuelType ? (r.fuelType as 'GASOLINE' | 'DIESEL') : undefined,
          odometer: r.odometer ? Number(r.odometer) : undefined,
        }))
    }

    if (rows.length === 0) {
      setResult({ success: false, created: 0, failed: 0, errors: [], message: 'Tidak ada data yang valid untuk dimasukkan.' })
      setLoading(false)
      return
    }

    const res = await bulkCreateCustomers(rows, branchId, corporateId || null)
    setResult(res)
    setLoading(false)
  }

  const handleClose = () => {
    setResult(null)
    setLoading(false)
    onClose()
  }

  const selectedBranchName = branches.find(b => b.id === branchId)?.name || '—'
  const selectedCorpName = corporateList.find(c => c.id === corporateId)?.name

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Add Pelanggan Testing"
      description="Fitur khusus Admin — untuk kebutuhan testing data korporat"
      size="xl"
    >
      {/* ── banner testing ─────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl mb-4">
        <FlaskConical className="w-4 h-4 text-violet-500 shrink-0" />
        <p className="text-xs text-violet-700 font-medium">
          Semua nama pelanggan akan otomatis ditambahkan suffix{' '}
          <span className="font-bold">&quot;Testing&quot;</span> —
          Contoh: <em>Budi 1</em> → <strong>Budi 1 Testing</strong>
        </p>
      </div>

      {/* ── shared: branch + corporate ─────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelCls}>Cabang <span className="text-red-400">*</span></label>
          <select value={branchId} onChange={e => setBranchId(e.target.value)} className={inputCls}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Perusahaan Korporat <span className="text-slate-400">(opsional)</span></label>
          <select value={corporateId} onChange={e => setCorporateId(e.target.value)} className={inputCls}>
            <option value="">— Tidak terhubung korporat —</option>
            {corporateList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── tab switcher ───────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
        <button
          onClick={() => setTab('generator')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'generator'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generator Otomatis
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'manual'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          Input Manual
        </button>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* TAB: GENERATOR */}
      {/* ══════════════════════════════════════ */}
      {tab === 'generator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Prefix Nama</label>
              <input
                className={inputCls}
                placeholder="Cth: Driver, Sopir"
                value={namePrefix}
                onChange={e => setNamePrefix(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Jumlah Armada <span className="text-red-400">*</span></label>
              <input
                type="number"
                min={1} max={100}
                className={inputCls}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Prefix Plat</label>
              <input
                className={inputCls}
                placeholder="Cth: B 90, KT 12"
                value={platePrefix}
                onChange={e => setPlatePrefix(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Merk Kendaraan</label>
              <input
                className={inputCls}
                placeholder="Cth: Hino, Toyota"
                value={vehicleBrand}
                onChange={e => setVehicleBrand(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Model / Tipe</label>
              <input
                className={inputCls}
                placeholder="Cth: Dutro, Avanza"
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Warna</label>
              <input
                className={inputCls}
                placeholder="Cth: Putih, Hitam"
                value={vehicleColor}
                onChange={e => setVehicleColor(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Tahun</label>
              <input
                className={inputCls}
                placeholder="Cth: 2022"
                value={vehicleYear}
                onChange={e => setVehicleYear(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Bahan Bakar</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputCls}>
                <option value="">— pilih —</option>
                <option value="GASOLINE">Bensin</option>
                <option value="DIESEL">Diesel</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Odometer Awal (KM)</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                placeholder="Cth: 15000"
                value={odometerBase}
                onChange={e => setOdometerBase(e.target.value)}
              />
            </div>
          </div>

          {/* Preview table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Preview — {previewRows.length} pelanggan · Cabang:{' '}
                <span className="text-violet-700">{selectedBranchName}</span>
                {selectedCorpName && (
                  <span> · Korporat: <span className="text-violet-700">{selectedCorpName}</span></span>
                )}
              </p>
            </div>
            <div className="overflow-auto max-h-52">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-3 py-1.5 text-slate-500 font-medium">#</th>
                    <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Nama (Preview)</th>
                    <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Plat Nomor</th>
                    <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Kendaraan</th>
                    <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Odometer</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const displayName = row.name.trim().toLowerCase().endsWith('testing')
                      ? row.name.trim()
                      : `${row.name.trim()} Testing`
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors">
                        <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{displayName}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{row.plateNumber || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {[row.vehicleBrand, row.vehicleType].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {row.odometer != null ? `${row.odometer.toLocaleString('id-ID')} km` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* TAB: MANUAL */}
      {/* ══════════════════════════════════════ */}
      {tab === 'manual' && (
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-auto max-h-72">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[130px]">Nama *</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[100px]">Telepon</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[110px]">Plat Nomor</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[90px]">Merk</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[90px]">Model</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[80px]">Warna</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[60px]">Tahun</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[80px]">BBM</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-medium min-w-[90px]">Odometer</th>
                    <th className="w-8 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-1.5 py-1">
                        <div>
                          <input
                            className={inputCls}
                            placeholder={`Nama ${i + 1}`}
                            value={row.name}
                            onChange={e => updateRow(row.id, 'name', e.target.value)}
                          />
                          {row.name.trim() && (
                            <p className="text-[10px] text-violet-500 mt-0.5 pl-0.5">
                              → {row.name.trim().toLowerCase().endsWith('testing')
                                ? row.name.trim()
                                : `${row.name.trim()} Testing`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={inputCls} placeholder="08xx" value={row.phone}
                          onChange={e => updateRow(row.id, 'phone', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={`${inputCls} font-mono`} placeholder="B 1234 ABC"
                          value={row.plateNumber} onChange={e => updateRow(row.id, 'plateNumber', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={inputCls} placeholder="Hino" value={row.vehicleBrand}
                          onChange={e => updateRow(row.id, 'vehicleBrand', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={inputCls} placeholder="Dutro" value={row.vehicleType}
                          onChange={e => updateRow(row.id, 'vehicleType', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={inputCls} placeholder="Putih" value={row.vehicleColor}
                          onChange={e => updateRow(row.id, 'vehicleColor', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <input className={inputCls} placeholder="2022" value={row.vehicleYear}
                          onChange={e => updateRow(row.id, 'vehicleYear', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1">
                        <select value={row.fuelType} onChange={e => updateRow(row.id, 'fuelType', e.target.value)}
                          className={inputCls}>
                          <option value="">—</option>
                          <option value="GASOLINE">Bensin</option>
                          <option value="DIESEL">Diesel</option>
                        </select>
                      </td>
                      <td className="px-1.5 py-1">
                        <input type="number" min={0} className={inputCls} placeholder="15000"
                          value={row.odometer} onChange={e => updateRow(row.id, 'odometer', e.target.value)} />
                      </td>
                      <td className="px-1.5 py-1 text-center">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={manualRows.length === 1}
                          className="p-1 text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Button variant="ghost" icon={Plus} size="sm" onClick={addRow}>
            Tambah Baris
          </Button>
        </div>
      )}

      {/* ── Result ────────────────────────────── */}
      {result && (
        <div className={`mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${
          result.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : result.created > 0
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.success
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : result.created > 0
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <div>
            <p className="font-medium">{result.message}</p>
            {result.errors.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs opacity-80">• {e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          icon={FlaskConical}
          onClick={handleSubmit}
          disabled={loading || !branchId}
          className="bg-violet-600 hover:bg-violet-700 text-white border-violet-600 hover:border-violet-700"
        >
          {loading
            ? 'Menyimpan...'
            : `Simpan ${
                tab === 'generator'
                  ? previewRows.length
                  : manualRows.filter(r => r.name.trim()).length
              } Pelanggan Testing`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
