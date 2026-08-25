'use client'

import { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import CustomerAutocomplete from '@/components/ui/CustomerAutocomplete'
import Badge from '@/components/ui/Badge'
import { createTransaction, type TransactionPayload } from '@/actions/transaction'
import { formatCurrency } from '@/lib/utils'
import {
  Trash2,
  Search,
  ArrowLeft,
  Receipt,
  Wrench,
  Package,
  PackagePlus,
  User,
  RotateCcw,
  Plus,
  Building2,
  Zap,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  AlertCircle,
  Clock,
  Handshake,
  ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'

const DRAFT_KEY = 'irian_motor_tx_draft'

interface DraftState {
  customerId: string
  isCorporate: boolean
  items: TransactionPayload['items']
  discount: number
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS' | 'SPLIT' | 'DEBT'
  cashGiven: number | ''
  splitCash: number | ''
  splitTransfer: number | ''
  splitQris: number | ''
  splitCashGiven: number | ''
  debtDpAmount: number | ''
  debtDpMethod: 'CASH' | 'TRANSFER' | 'QRIS'
  mechanicId: string
  notes: string
  odometer: number | ''
}

const defaultDraft: DraftState = {
  customerId: '',
  isCorporate: false,
  items: [],
  discount: 0,
  paymentMethod: 'CASH',
  cashGiven: '',
  splitCash: '',
  splitTransfer: '',
  splitQris: '',
  splitCashGiven: '',
  debtDpAmount: '',
  debtDpMethod: 'CASH',
  mechanicId: '',
  notes: '',
  odometer: '',
}

function loadDraft(): DraftState {
  if (typeof window === 'undefined') return defaultDraft
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return defaultDraft
    return { ...defaultDraft, ...JSON.parse(raw) }
  } catch {
    return defaultDraft
  }
}

function saveDraft(state: DraftState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

interface ItemData {
  id: string
  name: string
  price: number
  type: 'SERVICE' | 'SPAREPART'
  stock?: number
  etalase?: string | null
}

interface NewTransactionClientProps {
  customers: { id: string; name: string; plateNumber: string | null; corporateCustomerId: string | null; odometer: number | null }[]
  services: { id: string; name: string; price: number }[]
  spareparts: { id: string; name: string; sellPrice: number; stock: number; sku: string | null; etalase?: string | null }[]
  mechanics?: { id: string; name: string }[]
  corporates?: { id: string; name: string }[]
  basePath?: string
  branchId?: string | null
}

export default function NewTransactionClient({
  customers,
  services,
  spareparts,
  mechanics = [],
  corporates = [],
  basePath = '/kasir/transaksi',
  branchId: txBranchId,
}: NewTransactionClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Load dari draft saat pertama render
  const [customerId, setCustomerId] = useState<string>(() => loadDraft().customerId)
  const [isCorporate, setIsCorporate] = useState<boolean>(() => loadDraft().isCorporate)
  const [items, setItems] = useState<TransactionPayload['items']>(() => loadDraft().items)
  const [discount, setDiscount] = useState<number>(() => loadDraft().discount)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS' | 'SPLIT' | 'DEBT'>(() => loadDraft().paymentMethod || 'CASH')
  const [cashGiven, setCashGiven] = useState<number | ''>(() => loadDraft().cashGiven ?? '')
  const [splitCash, setSplitCash] = useState<number | ''>(() => loadDraft().splitCash ?? '')
  const [splitTransfer, setSplitTransfer] = useState<number | ''>(() => loadDraft().splitTransfer ?? '')
  const [splitQris, setSplitQris] = useState<number | ''>(() => loadDraft().splitQris ?? '')
  const [splitCashGiven, setSplitCashGiven] = useState<number | ''>(() => loadDraft().splitCashGiven ?? '')
  const [debtDpAmount, setDebtDpAmount] = useState<number | ''>(() => loadDraft().debtDpAmount ?? '')
  const [debtDpMethod, setDebtDpMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>(() => loadDraft().debtDpMethod ?? 'CASH')
  const [mechanicId, setMechanicId] = useState<string>(() => loadDraft().mechanicId)
  const [notes, setNotes] = useState<string>(() => loadDraft().notes)
  const [odometer, setOdometer] = useState<number | ''>(() => loadDraft().odometer)
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    try { return (JSON.parse(raw) as DraftState).items.length > 0 } catch { return false }
  })

  // Auto-save ke localStorage setiap kali state berubah
  useEffect(() => {
    const draft: DraftState = {
      customerId,
      isCorporate,
      items,
      discount,
      paymentMethod,
      cashGiven,
      splitCash,
      splitTransfer,
      splitQris,
      splitCashGiven,
      debtDpAmount,
      debtDpMethod,
      mechanicId,
      notes,
      odometer
    }
    saveDraft(draft)
    startTransition(() => setHasDraft(items.length > 0))
  }, [customerId, isCorporate, items, discount, paymentMethod, cashGiven, splitCash, splitTransfer, splitQris, splitCashGiven, debtDpAmount, debtDpMethod, mechanicId, notes, odometer])

  const handleResetDraft = () => {
    if (!confirm('Hapus semua item dan mulai transaksi baru?')) return
    clearDraft()
    setCustomerId('')
    setIsCorporate(false)
    setItems([])
    setDiscount(0)
    setPaymentMethod('CASH')
    setCashGiven('')
    setSplitCash('')
    setSplitTransfer('')
    setSplitQris('')
    setSplitCashGiven('')
    setDebtDpAmount('')
    setDebtDpMethod('CASH')
    setMechanicId('')
    setNotes('')
    setOdometer('')
    setHasDraft(false)
  }

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Manual / Custom Input State (Jasa & Sparepart Luar)
  const [manualTab, setManualTab] = useState<'SERVICE' | 'SPAREPART'>('SERVICE')
  const [manualJasaName, setManualJasaName] = useState('')
  const [manualJasaPrice, setManualJasaPrice] = useState<number | ''>('')
  const [manualPartName, setManualPartName] = useState('')
  const [manualPartQty, setManualPartQty] = useState<number | ''>(1)
  const [manualPartBuyPrice, setManualPartBuyPrice] = useState<number | ''>('')
  const [manualPartPrice, setManualPartPrice] = useState<number | ''>('')

  // Refs for POS Keyboard Shortcuts
  const customerInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const manualJasaNameRef = useRef<HTMLInputElement>(null)
  const manualJasaPriceRef = useRef<HTMLInputElement>(null)
  const manualPartNameRef = useRef<HTMLInputElement>(null)
  const manualPartQtyRef = useRef<HTMLInputElement>(null)
  const manualPartBuyPriceRef = useRef<HTMLInputElement>(null)
  const manualPartPriceRef = useRef<HTMLInputElement>(null)
  const mechanicSelectRef = useRef<HTMLSelectElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const notesInputRef = useRef<HTMLInputElement>(null)
  const odometerInputRef = useRef<HTMLInputElement>(null)

  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(0)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery)
    setHighlightedSearchIndex(0)
  }

  // Detect if selected customer is corporate
  const selectedCustomer = customers.find(c => c.id === customerId)
  const isSelectedCorporate = !!selectedCustomer?.corporateCustomerId

  const catalog = useMemo(() => {
    const s: ItemData[] = services.map(s => ({ id: s.id, name: s.name, price: s.price, type: 'SERVICE' }))
    const sp: ItemData[] = spareparts.map(sp => ({ 
      id: sp.id, 
      name: `${sp.name} ${sp.sku ? `(${sp.sku})` : ''}`, 
      price: sp.sellPrice, 
      type: 'SPAREPART',
      stock: sp.stock,
      etalase: sp.etalase
    }))
    return [...s, ...sp]
  }, [services, spareparts])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    
    const scored = catalog
      .map(item => {
        const name = `${item.name} ${item.etalase ?? ''}`.toLowerCase()
        const allMatch = tokens.every(t => name.includes(t))
        if (!allMatch) return null
        
        let score = 0
        if (name.startsWith(tokens[0])) score += 10
        if (name.includes(searchQuery.toLowerCase().trim())) score += 5
        tokens.forEach(t => { if (name.includes(t)) score += 1 })
        
        return { item, score }
      })
      .filter((r): r is { item: ItemData; score: number } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    
    return scored.map(r => r.item)
  }, [searchQuery, catalog])

  // Computed Totals
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0)
  const total = Math.max(0, subtotal - discount)

  const handleAddItem = (item: ItemData) => {
    if (item.type === 'SPAREPART' && item.stock && item.stock <= 0) {
      alert('Stok sparepart habis!')
      return
    }

    const existingItemIndex = items.findIndex(i => i.itemId === item.id)
    if (existingItemIndex >= 0) {
      const newItems = [...items]
      const currQty = newItems[existingItemIndex].quantity
      
      if (item.type === 'SPAREPART' && item.stock && currQty >= item.stock) {
        alert('Melebihi stok yang tersedia!')
        return
      }
      
      newItems[existingItemIndex].quantity += 1
      setItems(newItems)
    } else {
      setItems([...items, {
        itemType: item.type,
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price
      }])
    }
    setSearchQuery('')
    // Keep focus in search input for rapid consecutive item scanning/typing
    searchInputRef.current?.focus()
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedSearchIndex(prev => (prev + 1 < searchResults.length ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedSearchIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults.length > 0 && searchResults[highlightedSearchIndex]) {
        handleAddItem(searchResults[highlightedSearchIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSearchQuery('')
    }
  }

  const handleAddManualJasa = () => {
    const finalPrice = typeof manualJasaPrice === 'number' ? manualJasaPrice : Number(manualJasaPrice)
    if (isNaN(finalPrice) || finalPrice <= 0) {
      alert('Masukkan nominal biaya jasa yang valid (lebih dari Rp 0)')
      manualJasaPriceRef.current?.focus()
      return
    }

    const finalName = manualJasaName.trim() || 'Jasa Manual'

    setItems([...items, {
      itemType: 'SERVICE',
      itemId: 'MANUAL_JASA_' + Date.now(),
      itemName: finalName,
      quantity: 1,
      unitPrice: finalPrice
    }])
    setManualJasaName('')
    setManualJasaPrice('')
    manualJasaNameRef.current?.focus()
  }

  const handleAddManualSparepart = () => {
    const finalPrice = typeof manualPartPrice === 'number' ? manualPartPrice : Number(manualPartPrice)
    const finalBuyPrice = typeof manualPartBuyPrice === 'number' ? manualPartBuyPrice : (manualPartBuyPrice ? Number(manualPartBuyPrice) : 0)
    const finalQty = typeof manualPartQty === 'number' && manualPartQty > 0 ? manualPartQty : 1

    if (isNaN(finalPrice) || finalPrice <= 0) {
      alert('Masukkan harga satuan sparepart yang valid (lebih dari Rp 0)')
      manualPartPriceRef.current?.focus()
      return
    }

    const finalName = manualPartName.trim() || 'Sparepart Luar'

    setItems([...items, {
      itemType: 'SPAREPART',
      itemId: 'MANUAL_PART_' + Date.now(),
      itemName: finalName,
      quantity: finalQty,
      unitPrice: finalPrice,
      buyPrice: finalBuyPrice > 0 ? finalBuyPrice : null,
    }])
    setManualPartName('')
    setManualPartQty(1)
    setManualPartBuyPrice('')
    setManualPartPrice('')
    manualPartNameRef.current?.focus()
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleUpdateQty = (index: number, newQty: number) => {
    const item = items[index]
    
    // Hanya cek stok jika sparepart dari master/stok toko (bukan manual/luar bengkel)
    if (item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_')) {
      const sp = spareparts.find(s => s.id === item.itemId)
      if (sp && newQty > sp.stock) {
        alert(`Maksimal stok: ${sp.stock}`)
        newQty = sp.stock
      }
    }

    const newItems = [...items]
    newItems[index].quantity = newQty
    setItems(newItems)
  }
  // Single Cash calculations
  const cashReceivedNum = typeof cashGiven === 'number' ? cashGiven : 0
  const cashChangeAmount = cashReceivedNum > total ? cashReceivedNum - total : 0

  // Split Payment calculations
  const splitCashNum = typeof splitCash === 'number' ? splitCash : 0
  const splitTransferNum = typeof splitTransfer === 'number' ? splitTransfer : 0
  const splitQrisNum = typeof splitQris === 'number' ? splitQris : 0
  const splitTotalPaid = splitCashNum + splitTransferNum + splitQrisNum
  const splitDeficit = Math.max(0, total - splitTotalPaid)
  const splitCashGivenNum = typeof splitCashGiven === 'number' && splitCashGiven > 0 ? splitCashGiven : splitCashNum
  const splitCashChange = splitCashGivenNum > splitCashNum ? splitCashGivenNum - splitCashNum : 0

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Pilih minimal satu item untuk transaksi.')
      searchInputRef.current?.focus()
      return
    }

    const isActualCorporate = isSelectedCorporate && isCorporate

    if (!isActualCorporate && paymentMethod === 'SPLIT') {
      if (splitTotalPaid < total) {
        setError(`Total pembayaran split baru Rp ${splitTotalPaid.toLocaleString('id-ID')}, masih kurang Rp ${splitDeficit.toLocaleString('id-ID')} dari total tagihan (Rp ${total.toLocaleString('id-ID')}).`)
        return
      }
    }

    setError(null)
    startTransition(async () => {
      let paymentsPayload: Array<{ paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS'; amount: number }> | undefined = undefined
      let paidAmountPayload = total
      let changeAmountPayload = 0

      if (isActualCorporate) {
        paidAmountPayload = 0
        changeAmountPayload = 0
      } else if (paymentMethod === 'DEBT') {
        if (!customerId || customerId.trim() === '') {
          setError('Pelanggan wajib dipilih atau didaftarkan terlebih dahulu untuk transaksi piutang / hutang.')
          customerInputRef.current?.focus()
          return
        }
        const dp = typeof debtDpAmount === 'number' ? Math.max(0, debtDpAmount) : 0
        if (dp > total) {
          setError(`Nominal DP (Rp ${dp.toLocaleString('id-ID')}) tidak boleh melebihi total tagihan (Rp ${total.toLocaleString('id-ID')}).`)
          return
        }
        paidAmountPayload = dp
        changeAmountPayload = 0
        if (dp > 0) {
          paymentsPayload = [{ paymentMethod: debtDpMethod, amount: dp }]
        }
      } else if (paymentMethod === 'SPLIT') {
        paymentsPayload = [
          { paymentMethod: 'CASH' as const, amount: splitCashNum },
          { paymentMethod: 'TRANSFER' as const, amount: splitTransferNum },
          { paymentMethod: 'QRIS' as const, amount: splitQrisNum },
        ].filter(p => p.amount > 0)
        paidAmountPayload = splitCashGivenNum + splitTransferNum + splitQrisNum
        changeAmountPayload = splitCashChange
      } else if (paymentMethod === 'CASH') {
        paidAmountPayload = cashReceivedNum >= total ? cashReceivedNum : total
        changeAmountPayload = cashChangeAmount
      } else {
        paidAmountPayload = total
        changeAmountPayload = 0
      }

      const payload: TransactionPayload = {
        customerId: customerId || null,
        mechanicId: mechanicId || null,
        items,
        discount,
        paymentMethod,
        payments: paymentsPayload,
        paidAmount: paidAmountPayload,
        changeAmount: changeAmountPayload,
        notes: notes || null,
        odometer: odometer === '' ? null : odometer,
        isCorporate: isActualCorporate,
        isDebt: paymentMethod === 'DEBT' && !isActualCorporate,
        dpPaymentMethod: debtDpMethod,
        branchId: txBranchId || null,
      }
      
      const res = await createTransaction(payload)
      if (res.success) {
        clearDraft()
        router.push(`${basePath}/${res.invoiceNumber || ''}`)
      } else {
        setError(res.message || 'Gagal membuat transaksi')
      }
    })
  }

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })

  // Global Keyboard Shortcuts (F1 - F9, Alt+1 - Alt+9, Ctrl+K, Ctrl+Enter, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Pelanggan (F1 atau Alt+1)
      if (e.key === 'F1' || (e.altKey && e.key === '1')) {
        e.preventDefault()
        customerInputRef.current?.focus()
      } 
      // Cari Item (F2, Alt+2, atau Ctrl+K)
      else if (e.key === 'F2' || (e.altKey && e.key === '2') || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } 
      // Jasa Manual (F3 atau Alt+3)
      else if (e.key === 'F3' || (e.altKey && e.key === '3')) {
        e.preventDefault()
        setManualTab('SERVICE')
        manualJasaNameRef.current?.focus()
        manualJasaNameRef.current?.select()
      } 
      // Mekanik (F4 atau Alt+4)
      else if (e.key === 'F4' || (e.altKey && e.key === '4')) {
        e.preventDefault()
        mechanicSelectRef.current?.focus()
      } 
      // Sparepart Luar / Custom (F5, Alt+5, atau F6)
      else if (e.key === 'F5' || (e.altKey && e.key === '5') || e.key === 'F6' || (e.altKey && e.key === '6')) {
        e.preventDefault()
        setManualTab('SPAREPART')
        manualPartNameRef.current?.focus()
        manualPartNameRef.current?.select()
      } 
      // Ganti Metode Pembayaran (F7 atau Alt+7)
      else if (e.key === 'F7' || (e.altKey && e.key === '7')) {
        e.preventDefault()
        setPaymentMethod(prev => {
          if (prev === 'CASH') return 'TRANSFER'
          if (prev === 'TRANSFER') return 'QRIS'
          if (prev === 'QRIS') return 'SPLIT'
          if (prev === 'SPLIT') return 'DEBT'
          return 'CASH'
        })
      } 
      // Diskon (F8 atau Alt+8)
      else if (e.key === 'F8' || (e.altKey && e.key === '8')) {
        e.preventDefault()
        discountInputRef.current?.focus()
        discountInputRef.current?.select()
      } 
      // Simpan Transaksi (F9, Alt+9, atau Ctrl+Enter)
      else if (e.key === 'F9' || (e.altKey && e.key === '9') || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault()
        handleSubmitRef.current()
      } 
      // Escape untuk bersihkan pencarian
      else if (e.key === 'Escape') {
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={basePath}>
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Transaksi Baru</h1>
          <p className="text-xs sm:text-sm text-slate-500">Buat invoice untuk layanan atau penjualan</p>
        </div>
        {hasDraft && (
          <button
            onClick={handleResetDraft}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {/* Ribbon Pintasan Keyboard (Fast POS Mode) */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pintasan Keyboard POS Cepat
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-amber-400">F1 / Alt+1</kbd> Pelanggan
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-emerald-400">F2 / Alt+2 / Ctrl+K</kbd> Cari Item
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-sky-400">F3 / Alt+3</kbd> Jasa Manual
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-purple-400">F4 / Alt+4</kbd> Mekanik
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-amber-400">F6 / Alt+6</kbd> Part Luar
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-pink-400">F7 / Alt+7</kbd> Metode Bayar
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <kbd className="font-mono font-bold text-yellow-400">F8 / Alt+8</kbd> Diskon
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
            <kbd className="font-mono font-bold text-emerald-300">F9 / Alt+9 / Ctrl+Enter</kbd> Simpan
          </span>
        </div>
      </div>

      {/* Banner draft tersimpan */}
      {hasDraft && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          Draft tersimpan — transaksi dilanjutkan dari sesi sebelumnya
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-500" /> Cari Servis / Sparepart
              </h2>
              <span className="text-[10px] px-2 py-0.5 font-mono font-bold bg-primary-50 text-primary-700 border border-primary-200 rounded-md">
                Tekan F2
              </span>
            </div>
            
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik nama barang atau jasa... (Gunakan tombol Panah Atas/Bawah & Enter)"
                value={searchQuery}
                onKeyDown={handleSearchKeyDown}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
              
              {searchQuery && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {searchResults.map((item, idx) => {
                        const isHighlighted = idx === highlightedSearchIndex
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleAddItem(item)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${
                              isHighlighted ? 'bg-primary-50 ring-1 ring-primary-400' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                item.type === 'SERVICE' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {item.type === 'SERVICE' ? <Wrench className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className={`text-sm font-medium transition-colors ${
                                  isHighlighted ? 'text-primary-900 font-bold' : 'text-slate-900 group-hover:text-primary-700'
                                }`}>
                                  {item.name}
                                </p>
                                {item.type === 'SPAREPART' && (
                                  <p className={`text-xs ${item.stock === 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                    Stok: {item.stock} {item.etalase && <span className="ml-1 text-slate-500 font-medium">· Rak: {item.etalase}</span>}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-700">
                                {formatCurrency(item.price)}
                              </span>
                              {isHighlighted && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-200 text-primary-800 font-bold">
                                  Enter
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      <p className="text-slate-600 mb-2">Tidak ditemukan hasil untuk {`"${searchQuery}"`}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setManualTab('SERVICE')
                            setManualJasaName(searchQuery)
                            setSearchQuery('')
                            setTimeout(() => manualJasaPriceRef.current?.focus(), 50)
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Jadikan Jasa Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualTab('SPAREPART')
                            setManualPartName(searchQuery)
                            setSearchQuery('')
                            setTimeout(() => manualPartPriceRef.current?.focus(), 50)
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          Jadikan Sparepart Luar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Manual / Custom Section (Jasa & Sparepart Luar) */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Tab Header */}
                <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setManualTab('SERVICE')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      manualTab === 'SERVICE'
                        ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Jasa Manual / Custom</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-normal ${
                      manualTab === 'SERVICE' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
                    }`}>F3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualTab('SPAREPART')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      manualTab === 'SPAREPART'
                        ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Sparepart Luar (Non-Stok)</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-normal ${
                      manualTab === 'SPAREPART' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                    }`}>F6</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-3.5">
                  {/* Form Jasa Manual */}
                  <div className={manualTab === 'SERVICE' ? 'space-y-2.5' : 'hidden'}>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      <div className="sm:col-span-7">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nama / Keterangan Jasa
                        </label>
                        <input
                          ref={manualJasaNameRef}
                          placeholder="Contoh: Tambal Ban, Bubut Tromol, Cuci Motor..."
                          type="text"
                          value={manualJasaName}
                          onChange={(e) => setManualJasaName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              manualJasaPriceRef.current?.focus()
                            }
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Biaya Jasa (Rp)
                        </label>
                        <input
                          ref={manualJasaPriceRef}
                          placeholder="Contoh: 25000"
                          type="number"
                          min="0"
                          value={manualJasaPrice === '' ? '' : manualJasaPrice}
                          onChange={(e) => setManualJasaPrice(e.target.value ? Number(e.target.value) : '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddManualJasa()
                            }
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Button 
                          className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold whitespace-nowrap"
                          onClick={handleAddManualJasa}
                          disabled={manualJasaPrice === '' || Number(manualJasaPrice) <= 0}
                          icon={Plus}
                        >
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Form Sparepart Luar (Non-Stok) */}
                  <div className={manualTab === 'SPAREPART' ? 'space-y-2.5' : 'hidden'}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nama Sparepart Luar
                        </label>
                        <input
                          ref={manualPartNameRef}
                          placeholder="Contoh: Bearing Koyo, Busi Racing..."
                          type="text"
                          value={manualPartName}
                          onChange={(e) => setManualPartName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              manualPartQtyRef.current?.focus()
                            }
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1 text-center">
                          Qty
                        </label>
                        <input
                          ref={manualPartQtyRef}
                          placeholder="1"
                          type="number"
                          min="1"
                          value={manualPartQty === '' ? '' : manualPartQty}
                          onChange={(e) => setManualPartQty(e.target.value ? Number(e.target.value) : '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              manualPartBuyPriceRef.current?.focus()
                            }
                          }}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 text-center placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1 truncate">
                          Harga Modal (Rp)
                        </label>
                        <input
                          ref={manualPartBuyPriceRef}
                          placeholder="Contoh: 50000"
                          type="number"
                          min="0"
                          value={manualPartBuyPrice === '' ? '' : manualPartBuyPrice}
                          onChange={(e) => setManualPartBuyPrice(e.target.value ? Number(e.target.value) : '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              manualPartPriceRef.current?.focus()
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1 truncate">
                          Harga Jual (Rp)
                        </label>
                        <input
                          ref={manualPartPriceRef}
                          placeholder="Contoh: 75000"
                          type="number"
                          min="0"
                          value={manualPartPrice === '' ? '' : manualPartPrice}
                          onChange={(e) => setManualPartPrice(e.target.value ? Number(e.target.value) : '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddManualSparepart()
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <Button 
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap"
                          onClick={handleAddManualSparepart}
                          disabled={manualPartPrice === '' || Number(manualPartPrice) <= 0}
                          icon={Plus}
                        >
                          Tambah
                        </Button>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1 border-t border-amber-100">
                      <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Barang bersumber dari luar bengkel. Item ini masuk ke invoice namun <strong>tidak memotong stok toko</strong>.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-500" /> Detail Item
              </h2>
              <Badge variant="primary" size="md">{items.length} item</Badge>
            </div>
            
            {items.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
                <p className="text-xs text-slate-400 mt-1">Cari item di atas atau gunakan input manual untuk menambahkan</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {items.map((item, index) => (
                  <div key={`${item.itemId}-${index}`} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.itemName}</p>
                        {item.itemId?.startsWith('MANUAL_PART_') && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                            Luar Bengkel {item.buyPrice && item.buyPrice > 0 ? `(Modal: ${formatCurrency(item.buyPrice)})` : '(Non-Stok)'}
                          </span>
                        )}
                        {item.itemId?.startsWith('MANUAL_JASA_') && (
                          <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded shrink-0">
                            Jasa Custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(item.unitPrice)} / {item.itemType === 'SERVICE' ? 'jasa' : 'pcs'}
                        {item.buyPrice && item.buyPrice > 0 && (
                          <span className="text-slate-400 ml-1">
                            • Modal: {formatCurrency(item.buyPrice)} (Untung: <strong className="text-emerald-600">{formatCurrency(item.unitPrice - item.buyPrice)}</strong>)
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-1 sm:gap-3 bg-white border border-slate-200 rounded-lg p-1">
                        <button 
                          onClick={() => {
                            if (item.quantity > 1) handleUpdateQty(index, item.quantity - 1)
                          }}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >-</button>
                        <input
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateQty(index, val === '' ? 0 : parseInt(val) || 0);
                          }}
                          onBlur={() => {
                            if (item.quantity < 1) handleUpdateQty(index, 1);
                          }}
                          className="w-10 text-center text-sm font-semibold text-slate-900 bg-transparent border-none p-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          onClick={() => handleUpdateQty(index, item.quantity + 1)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >+</button>
                      </div>
                      
                      <div className="w-24 sm:w-32 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Checkout & Customer */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" /> Informasi Pelanggan
              </h2>
              <span className="text-[10px] px-2 py-0.5 font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                Tekan F1
              </span>
            </div>
            
            <CustomerAutocomplete
              inputRef={customerInputRef}
              initialCustomers={customers}
              selectedId={customerId}
              branchId={txBranchId}
              onSelect={(customer) => {
                if (customer) {
                  setCustomerId(customer.id)
                  setIsCorporate(!!customer.corporateCustomerId)
                  setOdometer(customer.odometer ?? '')
                } else {
                  setCustomerId('')
                  setIsCorporate(false)
                  setOdometer('')
                }
              }}
            />

            {/* Corporate badge: shown when selected customer belongs to a PT */}
            {customerId && isSelectedCorporate && (() => {
              const corp = corporates.find(c => c.id === customers.find(cu => cu.id === customerId)?.corporateCustomerId)
              return (
                <div className="flex items-start gap-2 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <Building2 className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-violet-800">
                      {corp ? corp.name : 'Kendaraan Korporat'}
                    </p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      Transaksi ini akan masuk ke Piutang Korporat (PENDING_CORPORATE)
                    </p>
                  </div>
                </div>
              )
            })()}

            {customerId && (
              <Input
                ref={odometerInputRef}
                id="odometer"
                name="odometer"
                label="Odometer / Jarak Tempuh (Km) Terbaru"
                type="number"
                placeholder="Contoh: 15200"
                min="0"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value ? Number(e.target.value) : '')}
              />
            )}

            {/* Corporate billing info - auto-detect for corporate customers */}
            {isSelectedCorporate && (
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-900">Pelanggan Korporat</p>
                      <p className="text-xs text-violet-600">
                        {isCorporate ? 'Status: Piutang Korporat (PENDING_CORPORATE)' : 'Status: Langsung Bayar (COMPLETED)'}
                      </p>
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 border-t border-violet-200/60 cursor-pointer text-xs font-medium text-violet-900">
                  <input
                    type="checkbox"
                    checked={!isCorporate}
                    onChange={(e) => setIsCorporate(!e.target.checked)}
                    className="rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Langsung Bayar di Kasir (Lunas Saat Ini)</span>
                </label>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mechanic" className="block text-sm font-medium text-slate-700">
                  Mekanik Penanggung Jawab
                </label>
                <span className="text-[10px] px-2 py-0.5 font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                  Tekan F4
                </span>
              </div>
              <select
                ref={mechanicSelectRef}
                id="mechanic"
                name="mechanic"
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 transition-all duration-200 appearance-none hover:border-slate-300 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3e%3cpath%20fill=%27%2394a3b8%27%20d=%27M2%204l4%204%204-4%27/%3e%3c/svg%3e')] bg-size-[12px] bg-position-[right_16px_center] bg-no-repeat pr-10"
              >
                <option value="">Tidak ada / Hanya Beli Sparepart</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pt-2 border-t border-slate-100 mt-4 space-y-4">
              <Input
                ref={notesInputRef}
                id="notes"
                name="notes"
                label="Catatan Mekanik / Keluhan"
                placeholder="Contoh: Rantai berisik, minta di-setting..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              Ringkasan Pembayaran
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Diskon (Rp)</span>
                  <span className="text-[10px] px-1.5 py-0.2 font-mono font-bold bg-slate-800 text-yellow-400 border border-slate-700 rounded">
                    F8
                  </span>
                </div>
                <input
                  ref={discountInputRef}
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="my-6 border-t border-slate-800"></div>
            
            <div className="flex justify-between items-end mb-6">
              <span className="text-slate-400">Total Akhir</span>
              <span className="text-3xl font-bold text-emerald-400">{formatCurrency(total)}</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Metode Pembayaran</p>
                <span className="text-[10px] px-1.5 py-0.2 font-mono font-bold bg-slate-800 text-pink-400 border border-slate-700 rounded">
                  F7 Ganti
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {(
                  [
                    { key: 'CASH', label: 'Tunai', icon: Banknote },
                    { key: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                    { key: 'QRIS', label: 'QRIS', icon: QrCode },
                    { key: 'SPLIT', label: 'Split / Mix', icon: Layers },
                    { key: 'DEBT', label: 'Hutang / DP', icon: Clock },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl transition-all border flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === key 
                        ? (key === 'DEBT' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/50' : 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/50')
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Mode CASH (Tunai Tunggal) */}
              {paymentMethod === 'CASH' && !isCorporate && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">Uang Diterima (Rp)</label>
                    <button
                      type="button"
                      onClick={() => setCashGiven(total)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Uang Pas
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Contoh: ${total}`}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-base font-bold text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  />

                  {/* Tombol Cepat Pecahan */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[50000, 100000, 200000, 500000]
                      .filter(denom => denom >= total)
                      .slice(0, 3)
                      .map(denom => (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => setCashGiven(denom)}
                          className="text-[10px] font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md text-slate-300 transition-colors"
                        >
                          Rp {denom.toLocaleString('id-ID')}
                        </button>
                      ))}
                  </div>

                  {/* Kembalian / Status */}
                  {cashReceivedNum > 0 && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      cashReceivedNum >= total
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-red-950/40 border-red-800/60 text-red-300'
                    }`}>
                      <span className="text-xs font-semibold">
                        {cashReceivedNum >= total ? 'Kembalian Tunai' : 'Kurang'}
                      </span>
                      <span className="text-sm font-black">
                        {cashReceivedNum >= total
                          ? formatCurrency(cashChangeAmount)
                          : formatCurrency(total - cashReceivedNum)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode TRANSFER & QRIS Tunggal */}
              {(paymentMethod === 'TRANSFER' || paymentMethod === 'QRIS') && !isCorporate && (
                <div className="mt-3 p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60 text-center">
                  <p className="text-xs text-slate-400">
                    Pembayaran {paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'QRIS'} lunas pas:
                  </p>
                  <p className="text-base font-bold text-primary-400 mt-0.5">
                    {formatCurrency(total)}
                  </p>
                </div>
              )}

              {/* Mode HUTANG / PIUTANG (Belum Lunas / DP) */}
              {paymentMethod === 'DEBT' && !isCorporate && (
                <div className="mt-3 space-y-3 bg-amber-950/30 p-3.5 rounded-2xl border border-amber-800/60">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-800/40">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Transaksi Piutang / Hutang
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      Status: Belum Lunas
                    </span>
                  </div>

                  {/* Customer Status Warning / Confirmation */}
                  {!customerId ? (
                    <div className="p-2.5 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Pelanggan Wajib Dipilih!</strong>
                        <span>Silakan pilih atau daftarkan nama pelanggan di form atas agar piutang tercatat.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Piutang atas nama <strong>{selectedCustomer?.name}</strong></span>
                    </div>
                  )}

                  {/* DP / Uang Muka Input */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-300 font-medium">Uang Muka / DP Awal (Rp)</label>
                      <button
                        type="button"
                        onClick={() => setDebtDpAmount('')}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-200"
                      >
                        Tanpa DP (Rp 0)
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={total}
                      placeholder="0 (Jika tidak ada uang muka)"
                      value={debtDpAmount}
                      onChange={(e) => setDebtDpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    />

                    {/* Quick DP Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: 'Rp 0 (Hutang Penuh)', val: 0 },
                        { label: 'DP 25%', val: Math.round(total * 0.25) },
                        { label: 'DP 50%', val: Math.round(total * 0.5) },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setDebtDpAmount(preset.val === 0 ? '' : preset.val)}
                          className="text-[10px] font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md text-slate-300 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metode Pembayaran DP jika DP > 0 */}
                  {Number(debtDpAmount) > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs text-slate-300 font-medium">Metode Pembayaran DP</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['CASH', 'TRANSFER', 'QRIS'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setDebtDpMethod(m)}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              debtDpMethod === m
                                ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sisa Piutang Calculation Box */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Total Tagihan:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Uang Muka (DP):</span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(Number(debtDpAmount) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-slate-800">
                      <span className="text-amber-300">Sisa Piutang (Kurang Bayar):</span>
                      <span className="text-amber-400 text-sm font-black">
                        {formatCurrency(Math.max(0, total - (Number(debtDpAmount) || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode SPLIT PAYMENT (Kombinasi) */}
              {paymentMethod === 'SPLIT' && !isCorporate && (
                <div className="mt-3 space-y-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary-400" />
                      Rincian Split Payment
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total Tagihan: <strong className="text-slate-200">{formatCurrency(total)}</strong>
                    </span>
                  </div>

                  {/* 1. Porsi Tunai */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3 text-emerald-400" /> 1. Tunai (Cash)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const rem = Math.max(0, total - splitTransferNum - splitQrisNum)
                          setSplitCash(rem)
                        }}
                        className="text-[10px] text-primary-400 hover:text-primary-300"
                      >
                        Isi Sisa
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rp 0"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-primary-500 outline-none"
                      />
                    </div>
                    {/* Opsional: Uang tunai fisik untuk hitung kembalian */}
                    {splitCashNum > 0 && (
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>Uang Tunai Diterima:</span>
                        <input
                          type="number"
                          min="0"
                          placeholder={splitCashNum ? String(splitCashNum) : 'Uang pas'}
                          value={splitCashGiven}
                          onChange={(e) => setSplitCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-[10px] font-medium text-white focus:border-primary-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Porsi Transfer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-blue-400" /> 2. Transfer Bank
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const rem = Math.max(0, total - splitCashNum - splitQrisNum)
                          setSplitTransfer(rem)
                        }}
                        className="text-[10px] text-primary-400 hover:text-primary-300"
                      >
                        Isi Sisa
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="Rp 0"
                      value={splitTransfer}
                      onChange={(e) => setSplitTransfer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-primary-500 outline-none"
                    />
                  </div>

                  {/* 3. Porsi QRIS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-purple-400" /> 3. QRIS
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const rem = Math.max(0, total - splitCashNum - splitTransferNum)
                          setSplitQris(rem)
                        }}
                        className="text-[10px] text-primary-400 hover:text-primary-300"
                      >
                        Isi Sisa
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="Rp 0"
                      value={splitQris}
                      onChange={(e) => setSplitQris(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-primary-500 outline-none"
                    />
                  </div>

                  {/* Ringkasan Status Split */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Terbayar:</span>
                      <span className="font-bold text-white">{formatCurrency(splitTotalPaid)}</span>
                    </div>

                    {splitTotalPaid < total && (
                      <div className="flex items-center justify-between text-xs bg-red-950/60 border border-red-800/80 text-red-300 px-2.5 py-1.5 rounded-lg">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Masih Kurang
                        </span>
                        <span className="font-bold">{formatCurrency(splitDeficit)}</span>
                      </div>
                    )}

                    {splitTotalPaid === total && (
                      <div className="flex items-center justify-between text-xs bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-2.5 py-1 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Pembayaran Pas (Lunas)
                        </span>
                      </div>
                    )}

                    {splitCashChange > 0 && (
                      <div className="flex items-center justify-between text-xs bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg">
                        <span>Kembalian Tunai:</span>
                        <span className="font-bold">{formatCurrency(splitCashChange)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full py-4 text-base font-bold shadow-xl shadow-primary-900/50 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              loading={isPending}
              disabled={items.length === 0 || (!isCorporate && paymentMethod === 'SPLIT' && splitTotalPaid < total)}
            >
              <span>Simpan Transaksi</span>
              <span className="text-xs font-mono font-normal opacity-75 bg-primary-800 px-2 py-0.5 rounded border border-primary-400/30">
                F9 / Ctrl+Enter
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}