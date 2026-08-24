'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  getReportData,
  getRestockReportData,
  getIndentReportData,
  getCorporateReportData,
  getMechanicReportData,
} from '@/actions/report'
import {
  Download,
  Filter,
  Receipt,
  ShoppingCart,
  Printer,
  ClipboardList,
  Building2,
  Users,
  Wrench,
  X,
  Eye,
  Banknote,
  CreditCard,
  QrCode,
} from 'lucide-react'

import { exportProfessionalExcel } from '@/lib/exportExcel'

interface MechanicReportRow {
  id: string
  name: string
  phone: string | null
  branchName: string
  jobCount: number
  serviceRevenue: number
  sparepartRevenue: number
  totalRevenue: number
  transactions: Array<{
    id: string
    invoiceNumber: string
    transactionDate: Date | string
    total: number
    customer: { name: string; plateNumber: string | null; vehicleType: string | null } | null
    items: Array<{ itemName: string; itemType: string; quantity: number; unitPrice: number; subtotal: number }>
  }>
}

interface CorporateLedgerRow {
  id: string
  name: string
  contactPerson: string | null
  contactPhone: string | null
  billingCycle: string
  transactionCount: number
  totalInvoice: number
  totalPaid: number
  outstanding: number
}

interface CorporateTxRow {
  id: string
  invoiceNumber: string
  transactionDate: string | Date
  type: string
  status: string
  total: number
  branch: { name: string }
  user: { name: string }
  customer?: {
    name?: string
    plateNumber?: string | null
    vehicleType?: string | null
    corporateCustomer?: { id: string; name: string } | null
  } | null
  items: { itemName: string; itemType?: string; quantity: number; unitPrice?: number; subtotal: number }[]
}

interface CorporatePaymentRow {
  id: string
  amount: number
  paymentMethod: string
  paidAt: string | Date
  notes?: string | null
  corporateCustomer: { id: string; name: string }
  branch: { name: string }
  createdBy: { name: string }
}

interface TransactionItem {
  quantity: number
  itemName: string
  itemType?: string
  unitPrice?: number
  subtotal: number
}

interface TransactionRow {
  id: string
  invoiceNumber: string
  transactionDate: string | Date
  items: TransactionItem[]
  branch: { name: string }
  user: { name: string }
  customer?: {
    name?: string
    plateNumber?: string | null
    corporateCustomerId?: string | null
    corporateCustomer?: { id: string; name: string } | null
  } | null
  type: string
  status?: string
  total: number
  subtotal: number
  discount?: number
  paymentMethod?: string
  paidAmount?: number
  changeAmount?: number
  payments?: { paymentMethod: string; amount: number }[]
}

interface RestockItem {
  quantity: number
  sparepart: { name: string; sparepartBrand?: string }
  buyPrice: number
}

interface RestockRow {
  id: string
  date: string | Date
  supplierName: string
  branch: { name: string }
  items: RestockItem[]
  total: number
}

interface IndentOrderItem {
  id: string
  quantity: number
  receivedQty: number
  estimatedPrice: number
  sparepart: { name: string; sku: string | null }
}

interface IndentOrderRow {
  id: string
  orderDate: string | Date
  expectedDate: string | Date | null
  supplierName: string
  status: 'PENDING' | 'PARTIAL' | 'RECEIVED'
  type: 'RESTOCK' | 'CUSTOMER'
  notes: string | null
  dpAmount: number
  branch: { name: string }
  user: { name: string }
  customer: { name: string; phone: string | null } | null
  items: IndentOrderItem[]
}

interface ReportClientProps {
  branches: { id: string; name: string }[]
  initialData: TransactionRow[]
  initialSummary: {
    total: number
    service: number
    sparepart: number
    pendingCorporate: number
    discount?: number
    cashTotal?: number
    transferTotal?: number
    qrisTotal?: number
  }
  shopName: string
}

export default function ReportClient({ branches, initialData, initialSummary, shopName }: ReportClientProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pembelian' | 'indent' | 'korporat' | 'mekanik'>('transaksi')

  const formatLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayStr = formatLocalYYYYMMDD(new Date())
  const firstDayStr = formatLocalYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  // Transaksi state
  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [branchId, setBranchId] = useState('')
  const [txCategory, setTxCategory] = useState<'ALL' | 'REGULAR' | 'CORPORATE'>('ALL')
  const [data, setData] = useState<TransactionRow[]>(initialData)
  const [summary, setSummary] = useState(initialSummary)

  // Pembelian state
  const [buyStartDate, setBuyStartDate] = useState(firstDayStr)
  const [buyEndDate, setBuyEndDate] = useState(todayStr)
  const [buyBranchId, setBuyBranchId] = useState('')
  const [buyData, setBuyData] = useState<RestockRow[]>([])
  const [buySummary, setBuySummary] = useState({ total: 0, count: 0, topSparepart: null as string | null })
  const [buyLoaded, setBuyLoaded] = useState(false)

  // Indent state
  const [indentStartDate, setIndentStartDate] = useState(firstDayStr)
  const [indentEndDate, setIndentEndDate] = useState(todayStr)
  const [indentBranchId, setIndentBranchId] = useState('')
  const [indentType, setIndentType] = useState<'ALL' | 'RESTOCK' | 'CUSTOMER'>('ALL')
  const [indentStatus, setIndentStatus] = useState<'' | 'PENDING' | 'PARTIAL' | 'RECEIVED'>('')
  const [indentData, setIndentData] = useState<IndentOrderRow[]>([])
  const [indentSummary, setIndentSummary] = useState({
    count: 0,
    totalValue: 0,
    pendingCount: 0,
    partialCount: 0,
    receivedCount: 0,
    topSparepart: null as string | null,
  })
  const [indentLoaded, setIndentLoaded] = useState(false)

  // Korporat state
  const [corpStartDate, setCorpStartDate] = useState(firstDayStr)
  const [corpEndDate, setCorpEndDate] = useState(todayStr)
  const [corpBranchId, setCorpBranchId] = useState('')
  const [corpSelectedId, setCorpSelectedId] = useState('')
  const [corpSubTab, setCorpSubTab] = useState<'ringkasan' | 'rincian'>('ringkasan')

  const [corpOptionList, setCorpOptionList] = useState<{ id: string; name: string }[]>([])
  const [corpLedgers, setCorpLedgers] = useState<CorporateLedgerRow[]>([])
  const [corpTransactions, setCorpTransactions] = useState<CorporateTxRow[]>([])
  const [corpPayments, setCorpPayments] = useState<CorporatePaymentRow[]>([])
  const [corpSummary, setCorpSummary] = useState({ totalInvoice: 0, totalPaid: 0, outstanding: 0, activeCompanies: 0 })
  const [corpLoaded, setCorpLoaded] = useState(false)

  // Mekanik state
  const [mechStartDate, setMechStartDate] = useState(firstDayStr)
  const [mechEndDate, setMechEndDate] = useState(todayStr)
  const [mechBranchId, setMechBranchId] = useState('')
  const [mechData, setMechData] = useState<MechanicReportRow[]>([])
  const [mechSummary, setMechSummary] = useState({
    totalServiceRevenue: 0,
    totalMotorHandled: 0,
    activeMechanicsCount: 0,
  })
  const [mechLoaded, setMechLoaded] = useState(false)
  const [selectedMechModal, setSelectedMechModal] = useState<MechanicReportRow | null>(null)

  const handleMechFilter = () => {
    startTransition(async () => {
      const res = await getMechanicReportData(mechStartDate, mechEndDate, mechBranchId || undefined)
      setMechData(res.mechanics as unknown as MechanicReportRow[])
      setMechSummary(res.summary)
      setMechLoaded(true)
    })
  }

  const handleExportMechExcel = async () => {
    const rows = mechData.map((m) => ({
      namaMekanik: m.name,
      noHp: m.phone || '-',
      cabang: m.branchName,
      jumlahMotor: m.jobCount,
      omzetJasa: m.serviceRevenue,
      omzetSparepart: m.sparepartRevenue,
      totalOmzet: m.totalRevenue,
    }))

    await exportProfessionalExcel({
      shopName: shopName,
      title: 'LAPORAN KINERJA & KOMISI MEKANIK',
      period: `${mechStartDate} s/d ${mechEndDate}`,
      filename: `Laporan_Mekanik_${mechStartDate}_to_${mechEndDate}.xlsx`,
      sheetName: 'Laporan Mekanik',
      columns: [
        { header: 'Nama Mekanik', key: 'namaMekanik', width: 24 },
        { header: 'No. HP', key: 'noHp', width: 16 },
        { header: 'Cabang', key: 'cabang', width: 18 },
        { header: 'Motor Diservis', key: 'jumlahMotor', width: 15, align: 'right' },
        { header: 'Omzet Jasa (Rp)', key: 'omzetJasa', width: 20, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Omzet Sparepart (Rp)', key: 'omzetSparepart', width: 22, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Total Omzet (Rp)', key: 'totalOmzet', width: 22, numFmt: '"Rp "#,##0', align: 'right' },
      ],
      rows,
      summaries: [
        { label: 'Jumlah Mekanik Aktif', value: mechSummary.activeMechanicsCount },
        { label: 'Total Motor Diservis', value: mechSummary.totalMotorHandled },
        { label: 'Total Omzet Jasa', value: mechSummary.totalServiceRevenue, currency: true },
      ],
    })
  }

  const handleCorpFilter = () => {
    startTransition(async () => {
      const res = await getCorporateReportData(corpStartDate, corpEndDate, corpBranchId, corpSelectedId || undefined)
      setCorpOptionList(res.corporates)
      setCorpLedgers(res.ledgers as unknown as CorporateLedgerRow[])
      setCorpTransactions(res.transactions as unknown as CorporateTxRow[])
      setCorpPayments(res.payments as unknown as CorporatePaymentRow[])
      setCorpSummary(res.summary)
      setCorpLoaded(true)
    })
  }

  const handleExportCorporateExcel = async () => {
    if (corpSubTab === 'ringkasan' && (!corpTransactions || corpTransactions.length === 0)) {
      const rows = corpLedgers.map((l) => ({
        perusahaan: l.name,
        kontak: l.contactPerson ? `${l.contactPerson} (${l.contactPhone || '-'})` : '-',
        siklus: l.billingCycle === 'MONTHLY' ? 'Bulanan' : l.billingCycle === 'WEEKLY' ? 'Mingguan' : '2 Mingguan',
        jmlTransaksi: l.transactionCount,
        totalTagihan: l.totalInvoice,
        pembayaranMasuk: l.totalPaid,
        sisaPiutang: l.outstanding,
      }))

      await exportProfessionalExcel({
        shopName: shopName,
        title: 'LAPORAN RINGKASAN PIUTANG KORPORAT',
        period: `${corpStartDate} s/d ${corpEndDate}`,
        filename: `Laporan_Piutang_Korporat_${corpStartDate}_to_${corpEndDate}.xlsx`,
        sheetName: 'Ringkasan Piutang',
        columns: [
          { header: 'Perusahaan', key: 'perusahaan', width: 28 },
          { header: 'Kontak PIC', key: 'kontak', width: 24 },
          { header: 'Siklus Tagihan', key: 'siklus', width: 16, align: 'center' },
          { header: 'Jml Transaksi', key: 'jmlTransaksi', width: 14, align: 'right' },
          { header: 'Total Tagihan (Rp)', key: 'totalTagihan', width: 20, numFmt: '"Rp "#,##0', align: 'right' },
          { header: 'Pembayaran Masuk (Rp)', key: 'pembayaranMasuk', width: 22, numFmt: '"Rp "#,##0', align: 'right' },
          { header: 'Sisa Piutang (Rp)', key: 'sisaPiutang', width: 20, numFmt: '"Rp "#,##0', align: 'right' },
        ],
        rows,
        summaries: [
          { label: 'Jumlah Perusahaan', value: corpSummary.activeCompanies },
          { label: 'Total Tagihan Berjalan', value: corpSummary.totalInvoice, currency: true },
          { label: 'Total Pembayaran Masuk', value: corpSummary.totalPaid, currency: true },
          { label: 'Sisa Piutang Outstanding', value: corpSummary.outstanding, currency: true },
        ],
      })
    } else {
      const rows = corpTransactions.map((tx) => ({
        tanggal: new Date(tx.transactionDate).toLocaleDateString('id-ID'),
        noInvoice: tx.invoiceNumber,
        perusahaan: tx.customer?.corporateCustomer?.name || 'Korporat',
        armada: tx.customer ? `${tx.customer.name} (${tx.customer.plateNumber || '-'})` : '-',
        cabang: tx.branch.name,
        petugas: tx.user.name,
        rincianItem: tx.items
          .map((i) => {
            const typeLabel = i.itemType === 'SERVICE' ? '[JASA]' : '[BARANG]'
            const priceInfo = i.unitPrice ? `@Rp ${i.unitPrice.toLocaleString('id-ID')} ` : ''
            return `${typeLabel} ${i.quantity}x ${i.itemName} (${priceInfo}= Rp ${i.subtotal.toLocaleString('id-ID')})`
          })
          .join('\n'),
        total: tx.total,
        status: tx.status === 'PENDING_CORPORATE' ? 'BELUM LUNAS' : 'LUNAS',
      }))

      await exportProfessionalExcel({
        shopName: shopName,
        title: 'LAPORAN RINCIAN TRANSAKSI ARMADA KORPORAT',
        period: `${corpStartDate} s/d ${corpEndDate}`,
        filename: `Laporan_Transaksi_Korporat_${corpStartDate}_to_${corpEndDate}.xlsx`,
        sheetName: 'Rincian Transaksi',
        columns: [
          { header: 'Tanggal', key: 'tanggal', width: 14 },
          { header: 'No. Invoice', key: 'noInvoice', width: 22, align: 'center' },
          { header: 'Perusahaan', key: 'perusahaan', width: 24 },
          { header: 'Armada / Plat', key: 'armada', width: 22 },
          { header: 'Cabang', key: 'cabang', width: 16 },
          { header: 'Petugas', key: 'petugas', width: 16 },
          { header: 'Rincian Jasa & Barang (Qty, Harga, Subtotal)', key: 'rincianItem', width: 50 },
          { header: 'Total (Rp)', key: 'total', width: 18, numFmt: '"Rp "#,##0', align: 'right' },
          { header: 'Status', key: 'status', width: 14, align: 'center' },
        ],
        rows,
        summaries: [
          { label: 'Jumlah Nota Transaksi', value: corpTransactions.length },
          { label: 'Total Tagihan Armada', value: corpSummary.totalInvoice, currency: true },
        ],
      })
    }
  }

  const handleFilter = () => {
    startTransition(async () => {
      const res = await getReportData(startDate, endDate, branchId, txCategory)
      setData(res.transactions as unknown as TransactionRow[])
      setSummary(res.summary)
    })
  }

  const handleBuyFilter = () => {
    startTransition(async () => {
      const res = await getRestockReportData(buyStartDate, buyEndDate, buyBranchId)
      setBuyData(res.restocks)
      setBuySummary(res.summary)
      setBuyLoaded(true)
    })
  }

  const handleIndentFilter = () => {
    startTransition(async () => {
      const res = await getIndentReportData(
        indentStartDate,
        indentEndDate,
        indentBranchId,
        indentType,
        indentStatus || undefined
      )
      setIndentData(res.indents as unknown as IndentOrderRow[])
      setIndentSummary(res.summary)
      setIndentLoaded(true)
    })
  }

  const handleExportIndentExcel = async () => {
    const rows = indentData.map((order) => ({
      tanggalOrder:   new Date(order.orderDate).toLocaleDateString('id-ID'),
      estimasiTiba:   order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('id-ID') : '-',
      supplier:       order.supplierName,
      cabang:         order.branch.name,
      tipe:           order.type === 'RESTOCK' ? 'Restock' : 'Pelanggan',
      status:         order.status,
      pelanggan:      order.customer?.name || (order.type === 'RESTOCK' ? 'Stok Sendiri' : '—'),
      petugas:        order.user.name,
      dp:             order.dpAmount || 0,
      rincianItem:    order.items.map((i) => `${i.quantity}x ${i.sparepart.name} (@Rp ${i.estimatedPrice.toLocaleString('id-ID')} = Rp ${(i.quantity * i.estimatedPrice).toLocaleString('id-ID')})`).join('\n'),
      estimasiTotal:  order.items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0),
      catatan:        order.notes || '',
    }))

    const totalValue = rows.reduce((sum, r) => sum + (r.estimasiTotal as number), 0)
    const pendingCount = indentData.filter(o => o.status === 'PENDING').length
    const receivedCount = indentData.filter(o => o.status === 'RECEIVED').length

    await exportProfessionalExcel({
      shopName:  shopName,
      title:     'LAPORAN PESANAN INDENT',
      period:    `${indentStartDate} s/d ${indentEndDate}`,
      filename:  `Laporan_Indent_${indentStartDate}_to_${indentEndDate}.xlsx`,
      sheetName: 'Laporan Indent',
      columns: [
        { header: 'Tgl. Order',      key: 'tanggalOrder',  width: 14 },
        { header: 'Est. Tiba',       key: 'estimasiTiba',  width: 14 },
        { header: 'Supplier',        key: 'supplier',      width: 22 },
        { header: 'Cabang',          key: 'cabang',        width: 16 },
        { header: 'Tipe',            key: 'tipe',          width: 12, align: 'center' },
        { header: 'Status',          key: 'status',        width: 12, align: 'center' },
        { header: 'Pelanggan',       key: 'pelanggan',     width: 20 },
        { header: 'Petugas',         key: 'petugas',       width: 16 },
        { header: 'DP (Rp)',         key: 'dp',            width: 16, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Rincian Item',    key: 'rincianItem',   width: 40 },
        { header: 'Est. Total (Rp)', key: 'estimasiTotal', width: 18, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Catatan',         key: 'catatan',       width: 24 },
      ],
      rows,
      summaries: [
        { label: 'Total Pesanan',        value: rows.length },
        { label: 'Status PENDING',       value: pendingCount },
        { label: 'Status DITERIMA',      value: receivedCount },
        { label: 'Estimasi Nilai Total', value: totalValue, currency: true },
      ],
    })
  }

  const handleExportExcel = async () => {
    const rows = data.map((tx: TransactionRow) => {
      const isCorp = tx.status === 'PENDING_CORPORATE' || !!tx.customer?.corporateCustomer || !!tx.customer?.corporateCustomerId
      const corpName = tx.customer?.corporateCustomer?.name

      let paymentText = tx.paymentMethod || 'TUNAI'
      if (tx.paymentMethod === 'SPLIT' || (tx.payments && tx.payments.length > 1)) {
        if (tx.payments && tx.payments.length > 0) {
          paymentText = `SPLIT (${tx.payments.map(p => `${p.paymentMethod === 'CASH' ? 'Tunai' : p.paymentMethod === 'TRANSFER' ? 'Transfer' : 'QRIS'}: Rp ${p.amount.toLocaleString('id-ID')}`).join(', ')})`
        } else {
          paymentText = 'SPLIT'
        }
      } else if (tx.paymentMethod === 'CASH') {
        paymentText = 'TUNAI'
      }

      return {
        tanggal:           new Date(tx.transactionDate).toLocaleDateString('id-ID'),
        noInvoice:         tx.invoiceNumber,
        cabang:            tx.branch.name,
        kasir:             tx.user.name,
        pelanggan:         tx.customer?.name || 'Umum',
        kategoriPelanggan: isCorp ? (corpName ? `Korporat (${corpName})` : 'Korporat') : 'Reguler',
        tipeTransaksi:     tx.type,
        metodeBayar:       paymentText,
        rincianItem:       tx.items.map((i: TransactionItem) => `${i.itemType === 'SERVICE' ? '[JASA]' : '[BARANG]'} ${i.quantity}x ${i.itemName}${i.unitPrice ? ` (@Rp ${i.unitPrice.toLocaleString('id-ID')})` : ''} = Rp ${i.subtotal.toLocaleString('id-ID')}`).join('\n'),
        subtotal:          tx.subtotal,
        diskon:            tx.discount || 0,
        totalAkhir:        tx.total,
      }
    })

    const totalPenjualan = rows.reduce((sum, r) => sum + (r.totalAkhir as number), 0)
    const totalDiskon    = rows.reduce((sum, r) => sum + (r.diskon as number), 0)

    await exportProfessionalExcel({
      shopName:  shopName,
      title:     'LAPORAN TRANSAKSI PENJUALAN',
      period:    `${startDate} s/d ${endDate}`,
      filename:  `Laporan_Transaksi_${startDate}_to_${endDate}.xlsx`,
      sheetName: 'Laporan Transaksi',
      columns: [
        { header: 'Tanggal',       key: 'tanggal',       width: 14 },
        { header: 'No. Invoice',   key: 'noInvoice',     width: 24, align: 'center' },
        { header: 'Cabang',        key: 'cabang',        width: 16 },
        { header: 'Kasir',              key: 'kasir',             width: 16 },
        { header: 'Pelanggan',          key: 'pelanggan',         width: 20 },
        { header: 'Kategori Pelanggan', key: 'kategoriPelanggan', width: 22 },
        { header: 'Tipe',               key: 'tipeTransaksi',     width: 12, align: 'center' },
        { header: 'Metode Bayar',  key: 'metodeBayar',   width: 28 },
        { header: 'Rincian Item',  key: 'rincianItem',   width: 42 },
        { header: 'Subtotal (Rp)', key: 'subtotal',      width: 18, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Diskon (Rp)',   key: 'diskon',        width: 14, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Total (Rp)',    key: 'totalAkhir',    width: 18, numFmt: '"Rp "#,##0', align: 'right' },
      ],
      rows,
      summaries: [
        { label: 'Jumlah Transaksi',  value: rows.length },
        { label: 'Total Penjualan',   value: totalPenjualan, currency: true },
        { label: 'Total Diskon',      value: totalDiskon,    currency: true },
        { label: 'Jasa Servis',       value: summary.service,   currency: true },
        { label: 'Penjualan Sparepart', value: summary.sparepart, currency: true },
        ...(summary.cashTotal !== undefined ? [{ label: 'Kas Tunai (Fisik Laci)', value: summary.cashTotal, currency: true }] : []),
        ...(summary.transferTotal !== undefined ? [{ label: 'Transfer Bank (Rekening)', value: summary.transferTotal, currency: true }] : []),
        ...(summary.qrisTotal !== undefined ? [{ label: 'QRIS', value: summary.qrisTotal, currency: true }] : []),
      ],
    })
  }

  const handlePrintBuy = () => {
    window.print()
  }

  const handleExportBuyExcel = async () => {
    const rows = buyData.map((r: RestockRow) => ({
      tanggal:      new Date(r.date).toLocaleDateString('id-ID'),
      supplier:     r.supplierName,
      cabang:       r.branch.name,
      rincianItem:  r.items.map((i: RestockItem) => `${i.quantity}x ${i.sparepart.name}${i.sparepart.sparepartBrand ? ` (${i.sparepart.sparepartBrand})` : ''} (@Rp ${i.buyPrice.toLocaleString('id-ID')} = Rp ${(i.quantity * i.buyPrice).toLocaleString('id-ID')})`).join('\n'),
      jumlahItem:   r.items.reduce((s: number, i: RestockItem) => s + i.quantity, 0),
      total:        r.total,
    }))

    const grandTotal = rows.reduce((s, r) => s + (r.total as number), 0)
    const jumlahPO   = rows.length

    await exportProfessionalExcel({
      shopName:  shopName,
      title:     'LAPORAN PEMBELIAN SPAREPART',
      period:    `${buyStartDate} s/d ${buyEndDate}`,
      filename:  `Laporan_Pembelian_${buyStartDate}_to_${buyEndDate}.xlsx`,
      sheetName: 'Laporan Pembelian',
      columns: [
        { header: 'Tanggal',         key: 'tanggal',     width: 14 },
        { header: 'Supplier',         key: 'supplier',    width: 24 },
        { header: 'Cabang',           key: 'cabang',      width: 18 },
        { header: 'Rincian Item',     key: 'rincianItem', width: 45 },
        { header: 'Jml. Item',        key: 'jumlahItem',  width: 12, align: 'right' },
        { header: 'Total (Rp)',       key: 'total',       width: 18, numFmt: '"Rp "#,##0', align: 'right' },
      ],
      rows,
      summaries: [
        { label: 'Total PO Pembelian',   value: jumlahPO },
        { label: 'Total Pengeluaran',    value: grandTotal, currency: true },
        ...(buySummary.topSparepart ? [{ label: 'Sparepart Terbanyak Dibeli', value: buySummary.topSparepart }] : []),
      ],
    })
  }

  const transactionColumns = [
    {
      key: 'invoice',
      header: 'No. Invoice',
      render: (row: TransactionRow) => (
        <div>
          <p className="text-sm font-bold text-slate-900 font-mono">{row.invoiceNumber}</p>
          <p className="text-xs text-slate-400">
            {new Date(row.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang / Kasir',
      render: (row: TransactionRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">{row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      render: (row: TransactionRow) => {
        const isCorp = row.status === 'PENDING_CORPORATE' || !!row.customer?.corporateCustomer || !!row.customer?.corporateCustomerId
        const corpName = row.customer?.corporateCustomer?.name
        return (
          <div>
            <p className="text-sm font-semibold text-slate-900">{row.customer?.name || 'Umum / Walk-in'}</p>
            {row.customer?.plateNumber && (
              <p className="text-xs text-slate-400 font-mono">{row.customer.plateNumber}</p>
            )}
            <div className="mt-1">
              {isCorp ? (
                <Badge variant="primary" size="sm" className="text-[10px]">
                  {corpName ? `Korporat: ${corpName}` : 'Korporat'}
                </Badge>
              ) : (
                <Badge variant="default" size="sm" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                  Reguler
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Tipe',
      render: (row: TransactionRow) => (
        <Badge variant={row.type === 'SERVICE' ? 'primary' : row.type === 'SPAREPART' ? 'warning' : 'success'} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Jasa & Barang',
      render: (row: TransactionRow) => (
        <div className="space-y-1 py-1 max-w-md">
          {row.items.map((item, idx) => {
            const isService = item.itemType === 'SERVICE'
            return (
              <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Badge variant={isService ? 'primary' : 'warning'} size="sm" className="shrink-0 text-[10px] px-1.5 py-0 font-medium">
                    {isService ? 'JASA' : 'BARANG'}
                  </Badge>
                  <span className="font-medium text-slate-800 truncate">
                    {item.quantity}x {item.itemName}
                  </span>
                </div>
                <div className="text-right shrink-0 font-mono text-[11px] text-slate-600">
                  {item.unitPrice ? `@${formatCurrency(item.unitPrice)} ` : ''}
                  <span className="font-bold text-slate-900">({formatCurrency(item.subtotal)})</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Pembayaran',
      render: (row: TransactionRow) => {
        if (row.paymentMethod === 'SPLIT' || (row.payments && row.payments.length > 1)) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-md">
                SPLIT
              </span>
              <div className="mt-1 text-[10px] text-slate-500 space-y-0.5 font-medium">
                {row.payments && row.payments.length > 0 ? (
                  row.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span>{p.paymentMethod === 'CASH' ? 'Tunai' : p.paymentMethod === 'TRANSFER' ? 'Trf' : 'QRIS'}:</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))
                ) : (
                  <span>Kombinasi</span>
                )}
              </div>
            </div>
          )
        }
        return (
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-700">
            {row.paymentMethod === 'CASH' ? 'Tunai' : row.paymentMethod || 'TUNAI'}
          </span>
        )
      },
    },
    {
      key: 'total',
      header: 'Total Akhir',
      render: (row: TransactionRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  const restockColumns = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (row: RestockRow) => (
        <p className="text-sm text-slate-700">
          {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier / Cabang',
      render: (row: RestockRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.supplierName}</p>
          <p className="text-xs text-slate-400">{row.branch.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Barang & Harga Beli',
      render: (row: RestockRow) => (
        <div className="space-y-1 py-1 max-w-md">
          {row.items.map((item: RestockItem, i: number) => {
            const itemSubtotal = item.quantity * item.buyPrice
            return (
              <div key={i} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                <span className="font-medium text-slate-800">
                  {item.quantity}x {item.sparepart.name}
                  {item.sparepart.sparepartBrand ? ` (${item.sparepart.sparepartBrand})` : ''}
                </span>
                <div className="text-right shrink-0 font-mono text-[11px] text-slate-600">
                  @{formatCurrency(item.buyPrice)} = <span className="font-bold text-slate-900">{formatCurrency(itemSubtotal)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Pengeluaran',
      render: (row: RestockRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  const statusBadge = (status: IndentOrderRow['status']) => {
    if (status === 'PENDING') return <Badge variant="warning" size="sm">Menunggu</Badge>
    if (status === 'PARTIAL') return <Badge variant="primary" size="sm">Sebagian</Badge>
    return <Badge variant="success" size="sm">Diterima</Badge>
  }

  const indentColumns = [
    {
      key: 'date',
      header: 'Tanggal Order',
      render: (row: IndentOrderRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">
            {new Date(row.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {row.expectedDate && (
            <p className="text-xs text-slate-400">
              ETA: {new Date(row.expectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier / Tipe',
      render: (row: IndentOrderRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.supplierName}</p>
          <Badge variant={row.type === 'RESTOCK' ? 'primary' : 'warning'} size="sm">
            {row.type === 'RESTOCK' ? 'Restock' : 'Customer Order'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'receiver',
      header: 'Pelanggan / Cabang',
      render: (row: IndentOrderRow) => (
        <div>
          {row.customer ? (
            <>
              <p className="text-sm font-medium text-slate-900">{row.customer.name}</p>
              {row.customer.phone && <p className="text-xs text-slate-400">{row.customer.phone}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">Stok Sendiri</p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">{row.branch.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Barang & Est. Harga',
      render: (row: IndentOrderRow) => (
        <div className="space-y-1 py-1 max-w-md">
          {row.items.map((item) => {
            const remaining = item.quantity - item.receivedQty
            const itemEstTotal = item.quantity * item.estimatedPrice
            return (
              <div key={item.id} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-800">
                    {item.quantity}x {item.sparepart.name}
                  </p>
                  <div className="text-[10px]">
                    {item.receivedQty > 0 && (
                      <span className="text-emerald-600 font-medium">({item.receivedQty} diterima) </span>
                    )}
                    {remaining > 0 && item.receivedQty > 0 && (
                      <span className="text-amber-600 font-medium">• sisa {remaining}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-[11px] text-slate-600">
                  @{formatCurrency(item.estimatedPrice)} = <span className="font-bold text-slate-900">{formatCurrency(itemEstTotal)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: IndentOrderRow) => statusBadge(row.status),
    },
    {
      key: 'value',
      header: 'Estimasi Nilai',
      render: (row: IndentOrderRow) => {
        const total = row.items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0)
        return (
          <div>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(total)}</p>
            {row.dpAmount > 0 && (
              <p className="text-xs text-amber-600">DP: {formatCurrency(row.dpAmount)}</p>
            )}
          </div>
        )
      },
    },
  ]

  const corpLedgerColumns = [
    {
      key: 'name',
      header: 'Perusahaan',
      render: (row: CorporateLedgerRow) => (
        <div>
          <p className="text-sm font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">
            {row.contactPerson ? `PIC: ${row.contactPerson}` : ''} {row.contactPhone ? `(${row.contactPhone})` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'billingCycle',
      header: 'Siklus Tagihan',
      render: (row: CorporateLedgerRow) => (
        <Badge variant="info">
          {row.billingCycle === 'MONTHLY' ? 'Bulanan' : row.billingCycle === 'WEEKLY' ? 'Mingguan' : '2 Mingguan'}
        </Badge>
      ),
    },
    {
      key: 'transactionCount',
      header: 'Jml Transaksi',
      render: (row: CorporateLedgerRow) => (
        <span className="text-sm font-medium text-slate-700">{row.transactionCount} Nota</span>
      ),
    },
    {
      key: 'totalInvoice',
      header: 'Total Tagihan',
      render: (row: CorporateLedgerRow) => (
        <span className="text-sm font-semibold text-slate-900">{formatCurrency(row.totalInvoice)}</span>
      ),
    },
    {
      key: 'totalPaid',
      header: 'Pembayaran Masuk',
      render: (row: CorporateLedgerRow) => (
        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(row.totalPaid)}</span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Sisa Piutang',
      render: (row: CorporateLedgerRow) => (
        <span className={`text-sm font-bold ${row.outstanding > 0 ? 'text-amber-600 font-mono' : 'text-slate-500'}`}>
          {formatCurrency(row.outstanding)}
        </span>
      ),
    },
  ]

  const corpTxColumns = [
    {
      key: 'invoiceNumber',
      header: 'No. Invoice',
      render: (row: CorporateTxRow) => (
        <div>
          <p className="text-sm font-bold text-slate-900 font-mono">{row.invoiceNumber}</p>
          <p className="text-xs text-slate-400">
            {new Date(row.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Perusahaan / Armada',
      render: (row: CorporateTxRow) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {row.customer?.corporateCustomer?.name || 'Korporat'}
          </p>
          <p className="text-xs text-slate-500">
            {row.customer ? `${row.customer.name} ${row.customer.plateNumber ? `(${row.customer.plateNumber})` : ''}` : '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang / Petugas',
      render: (row: CorporateTxRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">{row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Item & Harga',
      render: (row: CorporateTxRow) => (
        <div className="space-y-1 py-1 max-w-md">
          {row.items.map((i, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 pb-1 last:border-0 last:pb-0">
              <span className="font-medium text-slate-800">
                {i.quantity}x {i.itemName}
              </span>
              <div className="text-right shrink-0 font-mono text-[11px] text-slate-600">
                {i.unitPrice ? `@${formatCurrency(i.unitPrice)} = ` : ''}
                <span className="font-bold text-slate-900">{formatCurrency(i.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: CorporateTxRow) => (
        <Badge variant={row.status === 'PENDING_CORPORATE' ? 'warning' : 'success'}>
          {row.status === 'PENDING_CORPORATE' ? 'Belum Lunas' : 'Lunas'}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: CorporateTxRow) => (
        <p className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</p>
      ),
    },
  ]

  const mechanicColumns = [
    {
      key: 'name',
      header: 'Nama Mekanik',
      render: (row: MechanicReportRow) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.phone || 'Tanpa No. HP'}</p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: MechanicReportRow) => (
        <span className="text-xs text-slate-600 font-medium">{row.branchName}</span>
      ),
    },
    {
      key: 'jobCount',
      header: 'Motor Diservis',
      render: (row: MechanicReportRow) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs">
          {row.jobCount} Motor
        </span>
      ),
    },
    {
      key: 'serviceRevenue',
      header: 'Omzet Jasa Servis',
      render: (row: MechanicReportRow) => (
        <span className="font-bold text-emerald-600">
          {formatCurrency(row.serviceRevenue)}
        </span>
      ),
    },
    {
      key: 'sparepartRevenue',
      header: 'Penjualan Sparepart',
      render: (row: MechanicReportRow) => (
        <span className="text-xs text-slate-600">
          {formatCurrency(row.sparepartRevenue)}
        </span>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Total Omzet',
      render: (row: MechanicReportRow) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.totalRevenue)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: MechanicReportRow) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={() => setSelectedMechModal(row)}
          disabled={row.jobCount === 0}
        >
          Rincian ({row.jobCount})
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-8 print:space-y-0">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit print:hidden">
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'transaksi'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Laporan Transaksi
        </button>
        <button
          onClick={() => setActiveTab('pembelian')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pembelian'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Laporan Pembelian Sparepart
        </button>
        <button
          onClick={() => setActiveTab('indent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'indent'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Laporan Indent
        </button>
        <button
          onClick={() => {
            setActiveTab('korporat')
            if (!corpLoaded) handleCorpFilter()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'korporat'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Piutang Korporat
        </button>
        <button
          onClick={() => {
            setActiveTab('mekanik')
            if (!mechLoaded) handleMechFilter()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'mekanik'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Laporan Mekanik
        </button>
      </div>

      {/* ===== TAB: TRANSAKSI ===== */}
      {activeTab === 'transaksi' && (
        <>
          <div className="print:hidden space-y-8">
            {/* Filter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
              <div className="w-full md:w-auto">
                <Input label="Mulai Tanggal" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="w-full md:w-auto">
                <Input label="Sampai Tanggal" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {branches.length > 0 && (
                <div className="w-full md:w-56">
                  <Select
                    label="Pilih Cabang"
                    options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  />
                </div>
              )}
              <div className="w-full md:w-56">
                <Select
                  label="Tipe Pelanggan"
                  options={[
                    { label: 'Semua Transaksi', value: 'ALL' },
                    { label: 'Reguler (Harian)', value: 'REGULAR' },
                    { label: 'Korporat (Perusahaan)', value: 'CORPORATE' },
                  ]}
                  value={txCategory}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setTxCategory(e.target.value as any)}
                />
              </div>
              <Button onClick={handleFilter} loading={isPending} icon={Filter}>Filter</Button>
              <Button onClick={() => window.print()} variant="outline" icon={Printer} disabled={data.length === 0}>
                Cetak
              </Button>
              <Button onClick={handleExportExcel} variant="outline" icon={Download} disabled={data.length === 0}>
                Ekspor Excel
              </Button>
            </div>

            {/* Stat Cards - Pendapatan Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pendapatan</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.total)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan Servis</p>
                <p className="text-xl font-bold text-primary-600">{formatCurrency(summary.service)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan Sparepart</p>
                <p className="text-xl font-bold text-warning-600">{formatCurrency(summary.sparepart)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm border-l-4 border-l-amber-400">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Tagihan Korporat (Belum Lunas)</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.pendingCorporate)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Transaksi</p>
                <p className="text-xl font-bold text-slate-700">{data.length} Struk</p>
              </div>
            </div>

            {/* Stat Cards - Rekapitulasi Arus Kas / Metode Pembayaran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kas Tunai (Fisik Laci)</p>
                  <Banknote className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(summary.cashTotal ?? 0)}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Termasuk porsi tunai dari split payment</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Transfer Bank (Rekening)</p>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xl font-black text-blue-700 mt-1">{formatCurrency(summary.transferTotal ?? 0)}</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Termasuk porsi transfer dari split payment</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-2xl border border-purple-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">QRIS</p>
                  <QrCode className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xl font-black text-purple-700 mt-1">{formatCurrency(summary.qrisTotal ?? 0)}</p>
                <p className="text-[11px] text-purple-600 mt-0.5">Termasuk porsi QRIS dari split payment</p>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary-500" />
                  Data Transaksi
                </h3>
              </div>
              <Table
                columns={transactionColumns}
                data={data}
                keyExtractor={(row: TransactionRow) => row.id}
                emptyMessage="Tidak ada transaksi pada rentang tanggal tersebut."
              />
            </div>
          </div>

          {/* Print Layout for Transaksi */}
          <div className="hidden print:block text-slate-900 bg-white text-[11px]">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-[10px] text-slate-500">Rekapitulasi Laporan Transaksi & Pendapatan</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">Laporan Transaksi</h2>
                <p className="text-[10px] mt-0.5">Periode: {new Date(startDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} s/d {new Date(endDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
              </div>
            </div>

            {/* Ringkasan Stats */}
            <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-slate-50 border border-slate-300 rounded text-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Pendapatan</p>
                <p className="text-xs font-bold">{formatCurrency(summary.total)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Pendapatan Servis</p>
                <p className="text-xs font-bold">{formatCurrency(summary.service)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Pendapatan Sparepart</p>
                <p className="text-xs font-bold">{formatCurrency(summary.sparepart)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Transaksi</p>
                <p className="text-xs font-bold">{data.length} Struk</p>
              </div>
            </div>

            {/* Ringkasan Kas Masuk Per Metode */}
            <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-50 border border-slate-300 rounded text-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Kas Fisik Tunai</p>
                <p className="text-xs font-bold text-emerald-700">{formatCurrency(summary.cashTotal ?? 0)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Transfer Bank</p>
                <p className="text-xs font-bold text-blue-700">{formatCurrency(summary.transferTotal ?? 0)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">QRIS</p>
                <p className="text-xs font-bold text-purple-700">{formatCurrency(summary.qrisTotal ?? 0)}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-20">Tanggal</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">No. Invoice</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Cabang / Kasir</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Pelanggan</th>
                  <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Tipe</th>
                  <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Metode</th>
                  <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-1 px-1.5 border border-slate-300 text-[10px]">
                      {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 font-mono text-[10px] font-bold">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-[10px]">
                      {tx.branch.name} ({tx.user.name})
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-[10px]">
                      {tx.customer?.name || 'Umum'}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-center text-[10px]">
                      {tx.type}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-center text-[10px]">
                      {tx.paymentMethod === 'SPLIT' || (tx.payments && tx.payments.length > 1) ? (
                        <span>
                          SPLIT ({tx.payments && tx.payments.length > 0 ? tx.payments.map(p => `${p.paymentMethod === 'CASH' ? 'Tunai' : p.paymentMethod === 'TRANSFER' ? 'Trf' : 'QRIS'}: Rp ${p.amount.toLocaleString('id-ID')}`).join(', ') : 'Mix'})
                        </span>
                      ) : (
                        <span>{tx.paymentMethod === 'CASH' ? 'Tunai' : tx.paymentMethod}</span>
                      )}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-right font-bold text-[10px]">
                      {formatCurrency(tx.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={6} className="text-right py-1.5 px-2 border border-slate-300 uppercase text-[10px]">
                    Total Keseluruhan ({data.length} Transaksi):
                  </td>
                  <td className="text-right py-1.5 px-2 border border-slate-300 text-[11px]">
                    {formatCurrency(summary.total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
              <div>
                <p className="mb-12 font-medium text-slate-600">Dibuat Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Admin / Kasir</p>
              </div>
              <div>
                <p className="mb-12 font-medium text-slate-600">Disetujui Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Manajer / Pemilik</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: PEMBELIAN SPAREPART ===== */}
      {activeTab === 'pembelian' && (
        <>
          <div className="print:hidden space-y-8">
            {/* Filter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
              <div className="w-full md:w-auto">
                <Input label="Mulai Tanggal" type="date" value={buyStartDate} onChange={(e) => setBuyStartDate(e.target.value)} />
              </div>
              <div className="w-full md:w-auto">
                <Input label="Sampai Tanggal" type="date" value={buyEndDate} onChange={(e) => setBuyEndDate(e.target.value)} />
              </div>
              {branches.length > 0 && (
                <div className="w-full md:w-64">
                  <Select
                    label="Pilih Cabang"
                    options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                    value={buyBranchId}
                    onChange={(e) => setBuyBranchId(e.target.value)}
                  />
                </div>
              )}
              <Button onClick={handleBuyFilter} loading={isPending} icon={Filter}>Filter</Button>
              <Button onClick={handleExportBuyExcel} variant="outline" icon={Download} disabled={buyData.length === 0}>
                Ekspor Excel
              </Button>
              <Button onClick={handlePrintBuy} variant="outline" icon={Printer} disabled={buyData.length === 0}>
                Cetak
              </Button>
            </div>

            {!buyLoaded ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Klik tombol Filter untuk menampilkan laporan pembelian sparepart.</p>
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(buySummary.total)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jumlah Restock</p>
                    <p className="text-xl font-bold text-primary-600">{buySummary.count} Transaksi</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sparepart Terbanyak Dibeli</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{buySummary.topSparepart || '—'}</p>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-amber-500" />
                      Data Pembelian Sparepart
                    </h3>
                  </div>
                  <Table
                    columns={restockColumns}
                    data={buyData}
                    keyExtractor={(row: RestockRow) => row.id}
                    emptyMessage="Tidak ada data pembelian pada rentang tanggal tersebut."
                  />
                </div>
              </>
            )}
          </div>

          {/* Print Layout */}
          <div className="hidden print:block text-slate-900 bg-white text-[11px]">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page { size: A4 portrait; margin: 12mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `}} />
            
            {/* Header Kop Surat */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-[10px] text-slate-500">Manajemen Bengkel & Sparepart</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">Laporan Pembelian Sparepart</h2>
                <p className="text-[10px] mt-0.5">Periode: {new Date(buyStartDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} s/d {new Date(buyEndDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
              </div>
            </div>
            
            {Object.entries(
              buyData.reduce((acc, row) => {
                if (!acc[row.supplierName]) {
                  acc[row.supplierName] = { rows: [], total: 0 }
                }
                acc[row.supplierName].rows.push(row)
                acc[row.supplierName].total += row.total
                return acc
              }, {} as Record<string, { rows: RestockRow[], total: number }>)
            ).map(([supplier, data]) => (
              <div key={supplier} className="mb-5 break-inside-avoid">
                <div className="bg-slate-100 py-1 px-3 border-l-4 border-slate-900 mb-2 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase">Supplier: {supplier}</h3>
                  <span className="text-[10px] font-semibold">{data.rows.length} Transaksi</span>
                </div>
                <table className="w-full border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-20">Tanggal</th>
                      <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-24">Cabang</th>
                      <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px]">Barang</th>
                      <th className="text-right py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-28">Harga Satuan</th>
                      <th className="text-right py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(row => (
                      <tr key={row.id}>
                        <td className="py-1.5 px-2 border border-slate-300 align-top">
                          {new Date(row.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-300 align-top">
                          {row.branch.name}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-300 align-top">
                          <div className="space-y-0.5 text-[10px]">
                            {row.items.map((item: RestockItem, i: number) => (
                              <div key={i}><span className="font-semibold">{item.quantity}x</span> {item.sparepart.name}</div>
                            ))}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 border border-slate-300 align-top text-right">
                          <div className="space-y-0.5 text-[10px]">
                            {row.items.map((item: RestockItem, i: number) => (
                              <div key={i}>{formatCurrency(item.buyPrice)}</div>
                            ))}
                          </div>
                        </td>
                        <td className="text-right py-1.5 px-2 border border-slate-300 align-top font-bold">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="text-right font-black py-1.5 px-2 border border-slate-300 uppercase text-[10px]">Subtotal {supplier}:</td>
                      <td className="text-right font-black py-1.5 px-2 border border-slate-300">{formatCurrency(data.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
            
            {/* Grand Total */}
            <div className="bg-slate-900 text-white rounded-lg py-3 px-4 flex justify-between items-center break-inside-avoid mt-4">
              <span className="text-sm font-bold uppercase tracking-wider">Total Pengeluaran Keseluruhan</span>
              <span className="text-base font-black">{formatCurrency(buySummary.total)}</span>
            </div>

            {/* Signatures */}
            <div className="mt-10 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
              <div>
                <p className="mb-16 font-medium text-slate-600">Dibuat Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Admin / Staff</p>
              </div>
              <div>
                <p className="mb-16 font-medium text-slate-600">Disetujui Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Manajer / Pemilik</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: INDENT ===== */}
      {activeTab === 'indent' && (
        <>
          <div className="print:hidden space-y-8">
            {/* Filter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-end gap-4 flex-wrap">
                <div className="w-full md:w-auto">
                  <Input label="Mulai Tanggal" type="date" value={indentStartDate} onChange={(e) => setIndentStartDate(e.target.value)} />
                </div>
                <div className="w-full md:w-auto">
                  <Input label="Sampai Tanggal" type="date" value={indentEndDate} onChange={(e) => setIndentEndDate(e.target.value)} />
                </div>
                {branches.length > 0 && (
                  <div className="w-full md:w-64">
                    <Select
                      label="Pilih Cabang"
                      options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                      value={indentBranchId}
                      onChange={(e) => setIndentBranchId(e.target.value)}
                    />
                  </div>
                )}
                <div className="w-full md:w-48">
                  <Select
                    label="Tipe Indent"
                    options={[
                      { label: 'Semua Tipe', value: 'ALL' },
                      { label: 'Restock (Stok Sendiri)', value: 'RESTOCK' },
                      { label: 'Customer Order', value: 'CUSTOMER' },
                    ]}
                    value={indentType}
                    onChange={(e) => setIndentType(e.target.value as 'ALL' | 'RESTOCK' | 'CUSTOMER')}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    label="Status"
                    options={[
                      { label: 'Semua Status', value: '' },
                      { label: 'Menunggu', value: 'PENDING' },
                      { label: 'Sebagian Diterima', value: 'PARTIAL' },
                      { label: 'Sudah Diterima', value: 'RECEIVED' },
                    ]}
                    value={indentStatus}
                    onChange={(e) => setIndentStatus(e.target.value as '' | 'PENDING' | 'PARTIAL' | 'RECEIVED')}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleIndentFilter} loading={isPending} icon={Filter}>Filter</Button>
                <Button onClick={() => window.print()} variant="outline" icon={Printer} disabled={indentData.length === 0}>
                  Cetak
                </Button>
                <Button onClick={handleExportIndentExcel} variant="outline" icon={Download} disabled={indentData.length === 0}>
                  Ekspor Excel
                </Button>
              </div>
            </div>

            {!indentLoaded ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Klik tombol Filter untuk menampilkan laporan indent.</p>
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Indent</p>
                    <p className="text-xl font-black text-slate-900">{indentSummary.count}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm border-l-4 border-l-amber-400">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Menunggu</p>
                    <p className="text-xl font-bold text-amber-600">{indentSummary.pendingCount}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm border-l-4 border-l-blue-400">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Sebagian</p>
                    <p className="text-xl font-bold text-blue-600">{indentSummary.partialCount}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-green-200/80 shadow-sm border-l-4 border-l-green-400">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Diterima</p>
                    <p className="text-xl font-bold text-green-600">{indentSummary.receivedCount}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 md:col-span-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Estimasi Total</p>
                    <p className="text-base font-black text-slate-900">{formatCurrency(indentSummary.totalValue)}</p>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary-500" />
                      Data Order Indent
                    </h3>
                    {indentSummary.topSparepart && (
                      <p className="text-xs text-slate-500">
                        Sparepart paling banyak di-indent: <span className="font-semibold text-slate-800">{indentSummary.topSparepart}</span>
                      </p>
                    )}
                  </div>
                  <Table
                    columns={indentColumns}
                    data={indentData}
                    keyExtractor={(row: IndentOrderRow) => row.id}
                    emptyMessage="Tidak ada data indent pada rentang tanggal tersebut."
                  />
                </div>
              </>
            )}
          </div>

          {/* Print Layout for Indent */}
          <div className="hidden print:block text-slate-900 bg-white text-[11px]">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-[10px] text-slate-500">Rekapitulasi Laporan Order Indent</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">Laporan Order Indent</h2>
                <p className="text-[10px] mt-0.5">Periode: {new Date(indentStartDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} s/d {new Date(indentEndDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
              </div>
            </div>

            {/* Stat Summary */}
            <div className="grid grid-cols-5 gap-2 mb-4 p-2 bg-slate-50 border border-slate-300 rounded text-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Order</p>
                <p className="text-xs font-bold">{indentSummary.count}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Menunggu</p>
                <p className="text-xs font-bold text-amber-600">{indentSummary.pendingCount}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Sebagian</p>
                <p className="text-xs font-bold text-blue-600">{indentSummary.partialCount}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Diterima</p>
                <p className="text-xs font-bold text-green-600">{indentSummary.receivedCount}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Estimasi Total</p>
                <p className="text-xs font-bold">{formatCurrency(indentSummary.totalValue)}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-20">Tanggal</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Supplier / Tipe</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Pelanggan / Cabang</th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Rincian Barang</th>
                  <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Status</th>
                  <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">Estimasi Total</th>
                </tr>
              </thead>
              <tbody>
                {indentData.map((order) => {
                  const estTotal = order.items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0)
                  return (
                    <tr key={order.id}>
                      <td className="py-1 px-1.5 border border-slate-300 align-top">
                        {new Date(order.orderDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-300 align-top">
                        <span className="font-bold">{order.supplierName}</span> ({order.type})
                      </td>
                      <td className="py-1 px-1.5 border border-slate-300 align-top">
                        {order.customer ? order.customer.name : 'Stok Sendiri'} - {order.branch.name}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-300 align-top">
                        {order.items.map((i) => `${i.quantity}x ${i.sparepart.name}`).join(', ')}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-300 text-center align-top font-semibold">
                        {order.status}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-300 text-right font-bold align-top">
                        {formatCurrency(estTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
              <div>
                <p className="mb-12 font-medium text-slate-600">Dibuat Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Admin / Staff</p>
              </div>
              <div>
                <p className="mb-12 font-medium text-slate-600">Disetujui Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Manajer / Pemilik</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: KORPORAT / PIUTANG ===== */}
      {activeTab === 'korporat' && (
        <div className="space-y-8">
          {/* Filter Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4 print:hidden">
            <div className="w-full md:w-auto">
              <Input label="Mulai Tanggal" type="date" value={corpStartDate} onChange={(e) => setCorpStartDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <Input label="Sampai Tanggal" type="date" value={corpEndDate} onChange={(e) => setCorpEndDate(e.target.value)} />
            </div>
            {branches.length > 0 && (
              <div className="w-full md:w-48">
                <Select
                  label="Pilih Cabang"
                  options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                  value={corpBranchId}
                  onChange={(e) => setCorpBranchId(e.target.value)}
                />
              </div>
            )}
            {corpOptionList.length > 0 && (
              <div className="w-full md:w-56">
                <Select
                  label="Perusahaan Korporat"
                  options={[{ label: 'Semua Perusahaan', value: '' }, ...corpOptionList.map(c => ({ label: c.name, value: c.id }))]}
                  value={corpSelectedId}
                  onChange={(e) => setCorpSelectedId(e.target.value)}
                />
              </div>
            )}
            <Button onClick={handleCorpFilter} loading={isPending} icon={Filter}>Filter</Button>
            <Button onClick={handleExportCorporateExcel} variant="outline" icon={Download} disabled={corpLedgers.length === 0 && corpTransactions.length === 0}>
              Ekspor Excel
            </Button>
            <Button onClick={() => window.print()} variant="outline" icon={Printer} disabled={corpLedgers.length === 0 && corpTransactions.length === 0}>
              Cetak
            </Button>
          </div>

          {!corpLoaded ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 print:hidden">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Klik tombol Filter untuk menampilkan laporan piutang & transaksi korporat.</p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tagihan Berjalan</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(corpSummary.totalInvoice)}</p>
                  <p className="text-xs text-slate-400 mt-1">Akumulasi nilai nota servis/sparepart armada</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Pembayaran Masuk</p>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(corpSummary.totalPaid)}</p>
                  <p className="text-xs text-slate-400 mt-1">Pelunasan & cicilan diterima</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Sisa Piutang (Outstanding)</p>
                  <p className="text-2xl font-black text-amber-600 font-mono">{formatCurrency(corpSummary.outstanding)}</p>
                  <p className="text-xs text-amber-700/80 mt-1">Tagihan aktif belum lunas</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Perusahaan Aktif</p>
                  <p className="text-2xl font-black text-slate-900">{corpSummary.activeCompanies} <span className="text-sm font-normal text-slate-500">PT/CV</span></p>
                  <p className="text-xs text-slate-400 mt-1">Memiliki transaksi pada periode ini</p>
                </div>
              </div>

              {/* Sub-Tab Selector: Ringkasan vs Rincian */}
              <div className="flex gap-2 border-b border-slate-200 pb-2 print:hidden">
                <button
                  onClick={() => setCorpSubTab('ringkasan')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    corpSubTab === 'ringkasan'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ringkasan Piutang per Perusahaan
                </button>
                <button
                  onClick={() => setCorpSubTab('rincian')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    corpSubTab === 'rincian'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rincian Transaksi Armada ({corpTransactions.length})
                </button>
              </div>

              {/* Table View */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {corpSubTab === 'ringkasan' ? 'Ringkasan Piutang Korporat' : 'Audit Log Transaksi Armada Korporat'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Periode {new Date(corpStartDate).toLocaleDateString('id-ID')} s/d {new Date(corpEndDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>

                {corpSubTab === 'ringkasan' ? (
                  <Table
                    columns={corpLedgerColumns}
                    data={corpLedgers}
                    keyExtractor={(row: CorporateLedgerRow) => row.id}
                    emptyMessage="Tidak ada data piutang korporat pada rentang tanggal tersebut."
                  />
                ) : (
                  <Table
                    columns={corpTxColumns}
                    data={corpTransactions}
                    keyExtractor={(row: CorporateTxRow) => row.id}
                    emptyMessage="Tidak ada rincian transaksi armada korporat pada rentang tanggal tersebut."
                  />
                )}
              </div>

              {/* Print View */}
              <div className="hidden print:block space-y-6">
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">{shopName}</h1>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase mt-0.5">Laporan Piutang & Transaksi Armada Korporat</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Periode: {new Date(corpStartDate).toLocaleDateString('id-ID')} s/d {new Date(corpEndDate).toLocaleDateString('id-ID')}
                  </p>
                </div>

                {/* Print Summary Box */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-300 text-center">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Tagihan Berjalan</p>
                    <p className="text-xs font-bold">{formatCurrency(corpSummary.totalInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Pembayaran Masuk</p>
                    <p className="text-xs font-bold text-emerald-600">{formatCurrency(corpSummary.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Sisa Piutang</p>
                    <p className="text-xs font-bold text-amber-600">{formatCurrency(corpSummary.outstanding)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Perusahaan Aktif</p>
                    <p className="text-xs font-bold">{corpSummary.activeCompanies} Perusahaan</p>
                  </div>
                </div>

                {/* Print Table */}
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">Perusahaan / Kontak</th>
                      <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-20">Siklus</th>
                      <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-20">Jml Nota</th>
                      <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">Total Tagihan</th>
                      <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">Pelunasan Masuk</th>
                      <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">Sisa Piutang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corpLedgers.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1 px-1.5 border border-slate-300 align-top">
                          <span className="font-bold">{l.name}</span>
                          {l.contactPerson && <span className="block text-[9px] text-slate-500">PIC: {l.contactPerson} ({l.contactPhone || '-'})</span>}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-300 text-center align-top">
                          {l.billingCycle === 'MONTHLY' ? 'Bulanan' : l.billingCycle === 'WEEKLY' ? 'Mingguan' : '2 Mingguan'}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-300 text-center align-top">
                          {l.transactionCount} Nota
                        </td>
                        <td className="py-1 px-1.5 border border-slate-300 text-right align-top">
                          {formatCurrency(l.totalInvoice)}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-300 text-right align-top text-emerald-700">
                          {formatCurrency(l.totalPaid)}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-300 text-right font-bold align-top text-amber-700">
                          {formatCurrency(l.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-8 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
                  <div>
                    <p className="mb-12 font-medium text-slate-600">Dibuat Oleh,</p>
                    <div className="w-36 mx-auto border-b border-slate-900"></div>
                    <p className="mt-1 font-bold uppercase text-slate-800">Admin / Staf Keuangan</p>
                  </div>
                  <div>
                    <p className="mb-12 font-medium text-slate-600">Disetujui Oleh,</p>
                    <div className="w-36 mx-auto border-b border-slate-900"></div>
                    <p className="mt-1 font-bold uppercase text-slate-800">Manajer / Pemilik</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== TAB: MEKANIK ===== */}
      {activeTab === 'mekanik' && (
        <>
          <div className="print:hidden space-y-8">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-full md:w-auto">
                <Input
                  label="Dari Tanggal"
                  type="date"
                  value={mechStartDate}
                  onChange={(e) => setMechStartDate(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto">
                <Input
                  label="Sampai Tanggal"
                  type="date"
                  value={mechEndDate}
                  onChange={(e) => setMechEndDate(e.target.value)}
                />
              </div>
              {branches.length > 0 && (
                <div className="w-full md:w-56">
                  <Select
                    label="Pilih Cabang"
                    options={[
                      { label: 'Semua Cabang', value: '' },
                      ...branches.map((b) => ({ label: b.name, value: b.id })),
                    ]}
                    value={mechBranchId}
                    onChange={(e) => setMechBranchId(e.target.value)}
                  />
                </div>
              )}
              <Button onClick={handleMechFilter} loading={isPending} icon={Filter}>
                Filter
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                icon={Printer}
                disabled={mechData.length === 0}
              >
                Cetak
              </Button>
              <Button
                onClick={handleExportMechExcel}
                variant="outline"
                icon={Download}
                disabled={mechData.length === 0}
              >
                Ekspor Excel
              </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Motor Diservis
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {mechSummary.totalMotorHandled} <span className="text-sm font-normal text-slate-400">Unit</span>
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Omzet Jasa Mekanik
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(mechSummary.totalServiceRevenue)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Mekanik Aktif
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {mechSummary.activeMechanicsCount} <span className="text-sm font-normal text-slate-400">Orang</span>
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Rata-rata Pekerjaan
                </p>
                <p className="text-2xl font-bold text-primary-600">
                  {mechSummary.activeMechanicsCount > 0
                    ? (mechSummary.totalMotorHandled / mechSummary.activeMechanicsCount).toFixed(1)
                    : 0}{' '}
                  <span className="text-sm font-normal text-slate-400">Motor / Mekanik</span>
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Rekapitulasi Kinerja & Komisi Mekanik</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periode: {new Date(mechStartDate).toLocaleDateString('id-ID')} s/d{' '}
                    {new Date(mechEndDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <Badge variant="primary" size="md">
                  {mechData.length} Mekanik
                </Badge>
              </div>
              <Table
                columns={mechanicColumns}
                data={mechData}
                keyExtractor={(row) => row.id}
                emptyMessage="Tidak ada data mekanik pada periode ini."
              />
            </div>
          </div>

          {/* Modal Rincian Servis Mekanik */}
          {selectedMechModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:hidden">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary-600" />
                      Riwayat Servis: {selectedMechModal.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedMechModal.branchName} · Total {selectedMechModal.jobCount} Transaksi Motor
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMechModal(null)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto divide-y divide-slate-100">
                  {selectedMechModal.transactions.map((tx) => (
                    <div key={tx.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{tx.invoiceNumber}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-slate-900">{formatCurrency(tx.total)}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        👤 {tx.customer?.name || 'Pelanggan Umum'}{' '}
                        {tx.customer?.plateNumber && (
                          <span className="font-mono font-semibold text-slate-700 ml-1">
                            [{tx.customer.plateNumber}]
                          </span>
                        )}
                        {tx.customer?.vehicleType && (
                          <span className="text-slate-400 ml-1">({tx.customer.vehicleType})</span>
                        )}
                      </p>
                      <div className="bg-slate-50 rounded-lg p-2 text-xs space-y-1 text-slate-600">
                        {tx.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {it.itemType === 'SERVICE' ? '🛠️ [Jasa]' : '📦 [Part]'} {it.quantity}x {it.itemName}
                            </span>
                            <span className="font-medium text-slate-800">{formatCurrency(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Total Omzet Jasa: <strong className="text-emerald-600">{formatCurrency(selectedMechModal.serviceRevenue)}</strong>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedMechModal(null)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Printable Layout untuk Mekanik */}
          <div className="hidden print:block text-slate-900 bg-white text-[11px]">
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @media print {
                @page { size: A4 portrait; margin: 12mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `,
              }}
            />

            {/* Header Kop Surat */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-[10px] text-slate-500">Rekapitulasi Kinerja & Komisi Mekanik</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">
                  Laporan Kinerja Mekanik
                </h2>
                <p className="text-[10px] mt-0.5">
                  Periode: {new Date(mechStartDate).toLocaleDateString('id-ID')} s/d{' '}
                  {new Date(mechEndDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* Ringkasan Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-50 border border-slate-300 rounded text-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Motor Diservis</p>
                <p className="text-xs font-bold">{mechSummary.totalMotorHandled} Motor</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Total Omzet Jasa Mekanik</p>
                <p className="text-xs font-bold text-emerald-700">
                  {formatCurrency(mechSummary.totalServiceRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Mekanik Aktif</p>
                <p className="text-xs font-bold">{mechSummary.activeMechanicsCount} Orang</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">
                    Nama Mekanik
                  </th>
                  <th className="text-left py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px]">
                    Cabang
                  </th>
                  <th className="text-center py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-24">
                    Motor Diservis
                  </th>
                  <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-28">
                    Omzet Jasa (Rp)
                  </th>
                  <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-28">
                    Omzet Sparepart (Rp)
                  </th>
                  <th className="text-right py-1 px-1.5 border border-slate-300 font-bold uppercase text-[9px] w-28">
                    Total Omzet (Rp)
                  </th>
                </tr>
              </thead>
              <tbody>
                {mechData.map((m) => (
                  <tr key={m.id}>
                    <td className="py-1 px-1.5 border border-slate-300 font-bold text-[10px]">
                      {m.name}
                      {m.phone && <span className="block font-normal text-[9px] text-slate-500">{m.phone}</span>}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-[10px]">{m.branchName}</td>
                    <td className="py-1 px-1.5 border border-slate-300 text-center font-bold text-[10px]">
                      {m.jobCount} Unit
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-right font-bold text-emerald-700 text-[10px]">
                      {formatCurrency(m.serviceRevenue)}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-right text-[10px]">
                      {formatCurrency(m.sparepartRevenue)}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-300 text-right font-bold text-[10px]">
                      {formatCurrency(m.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="text-right py-1.5 px-2 border border-slate-300 uppercase text-[10px]">
                    Total Keseluruhan:
                  </td>
                  <td className="text-center py-1.5 px-2 border border-slate-300 text-[11px]">
                    {mechSummary.totalMotorHandled} Motor
                  </td>
                  <td className="text-right py-1.5 px-2 border border-slate-300 text-[11px] text-emerald-700">
                    {formatCurrency(mechSummary.totalServiceRevenue)}
                  </td>
                  <td className="text-right py-1.5 px-2 border border-slate-300 text-[11px]">
                    {formatCurrency(
                      mechData.reduce((acc, curr) => acc + curr.sparepartRevenue, 0)
                    )}
                  </td>
                  <td className="text-right py-1.5 px-2 border border-slate-300 text-[11px]">
                    {formatCurrency(
                      mechData.reduce((acc, curr) => acc + curr.totalRevenue, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
              <div>
                <p className="mb-12 font-medium text-slate-600">Dibuat Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Admin / Kasir</p>
              </div>
              <div>
                <p className="mb-12 font-medium text-slate-600">Disetujui Oleh,</p>
                <div className="w-36 mx-auto border-b border-slate-900"></div>
                <p className="mt-1 font-bold uppercase text-slate-800">Kepala Bengkel / Pemilik</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
