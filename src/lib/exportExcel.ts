/**
 * Professional Excel export utility using ExcelJS.
 * Supports styled headers, branded cover row, freeze panes, number formatting,
 * and alternating row colors.
 */

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// ─── Brand Colors ────────────────────────────────────────────────────────────
const BRAND_DARK = '1E3A5F'   // deep navy
const BRAND_MID  = '2563EB'   // primary blue
const BRAND_LITE = 'EFF6FF'   // pale blue for alt rows
const HEADER_FG  = 'FFFFFF'   // white text on header
const BORDER_CLR = 'CBD5E1'   // slate-300

// ─── Helpers ─────────────────────────────────────────────────────────────────
const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'FF' + BORDER_CLR } }
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder } as ExcelJS.Borders

function applyHeaderStyle(cell: ExcelJS.Cell, dark = false) {
  cell.font        = { bold: true, color: { argb: 'FF' + HEADER_FG }, size: 10, name: 'Calibri' }
  cell.fill        = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + (dark ? BRAND_DARK : BRAND_MID) } }
  cell.alignment   = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border      = allBorders
}

function applyDataStyle(cell: ExcelJS.Cell, altRow: boolean, numFmt?: string) {
  cell.font      = { size: 9.5, name: 'Calibri', color: { argb: 'FF1E293B' } }
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow ? 'FF' + BRAND_LITE : 'FFFFFFFF' } }
  cell.border    = allBorders
  cell.alignment = { vertical: 'middle', wrapText: true }
  if (numFmt) cell.numFmt = numFmt
}

// ─── Cover / Title Row ───────────────────────────────────────────────────────
function addCoverRow(ws: ExcelJS.Worksheet, shopName: string, title: string, period: string, totalCols: number) {
  // Row 1 - Shop name
  ws.mergeCells(1, 1, 1, totalCols)
  const r1 = ws.getCell(1, 1)
  r1.value     = shopName.toUpperCase()
  r1.font      = { bold: true, size: 14, color: { argb: 'FF' + BRAND_DARK }, name: 'Calibri' }
  r1.alignment = { horizontal: 'center', vertical: 'middle' }
  r1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(1).height = 28

  // Row 2 - Report title
  ws.mergeCells(2, 1, 2, totalCols)
  const r2 = ws.getCell(2, 1)
  r2.value     = title
  r2.font      = { bold: true, size: 11, color: { argb: 'FF' + BRAND_MID }, name: 'Calibri' }
  r2.alignment = { horizontal: 'center', vertical: 'middle' }
  r2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(2).height = 20

  // Row 3 - Period
  ws.mergeCells(3, 1, 3, totalCols)
  const r3 = ws.getCell(3, 1)
  r3.value     = `Periode: ${period}`
  r3.font      = { italic: true, size: 9.5, color: { argb: 'FF64748B' }, name: 'Calibri' }
  r3.alignment = { horizontal: 'center', vertical: 'middle' }
  r3.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(3).height = 16

  // Row 4 - Generated timestamp
  ws.mergeCells(4, 1, 4, totalCols)
  const r4 = ws.getCell(4, 1)
  r4.value     = `Diekspor pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`
  r4.font      = { size: 9, color: { argb: 'FF94A3B8' }, name: 'Calibri' }
  r4.alignment = { horizontal: 'center', vertical: 'middle' }
  r4.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(4).height = 14

  // Row 5 - blank spacer
  ws.getRow(5).height = 6
}

// ─── Summary Rows ─────────────────────────────────────────────────────────────
function addSummaryRows(ws: ExcelJS.Worksheet, startRow: number, summaries: { label: string; value: string | number; currency?: boolean }[], totalCols: number) {
  const titleRow = ws.getRow(startRow)
  titleRow.height = 18
  ws.mergeCells(startRow, 1, startRow, totalCols)
  const titleCell = ws.getCell(startRow, 1)
  titleCell.value     = 'RINGKASAN'
  titleCell.font      = { bold: true, size: 10, color: { argb: 'FF' + HEADER_FG }, name: 'Calibri' }
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_DARK } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  summaries.forEach((s, i) => {
    const r = startRow + 1 + i
    ws.getRow(r).height = 16

    // Label cell (cols 1-2)
    ws.mergeCells(r, 1, r, 2)
    const lbl = ws.getCell(r, 1)
    lbl.value     = s.label
    lbl.font      = { bold: true, size: 9.5, color: { argb: 'FF1E293B' }, name: 'Calibri' }
    lbl.alignment = { vertical: 'middle' }
    lbl.border    = allBorders
    lbl.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }

    // Value cell (col 3 to end)
    ws.mergeCells(r, 3, r, totalCols)
    const val = ws.getCell(r, 3)
    val.value     = s.value
    val.font      = { bold: true, size: 10, color: { argb: 'FF' + BRAND_MID }, name: 'Calibri' }
    val.alignment = { vertical: 'middle', horizontal: 'right' }
    val.border    = allBorders
    val.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
    if (s.currency) val.numFmt = '"Rp "#,##0'
  })
}

// ─── Column definitions ───────────────────────────────────────────────────────
export interface ColDef {
  header: string
  key: string
  width: number
  numFmt?: string
  align?: ExcelJS.Alignment['horizontal']
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportProfessionalExcel<T extends Record<string, unknown>>(opts: {
  shopName: string
  title: string
  period: string
  filename: string
  sheetName: string
  columns: ColDef[]
  rows: T[]
  summaries?: { label: string; value: string | number; currency?: boolean }[]
}) {
  const { shopName, title, period, filename, sheetName, columns, rows, summaries } = opts

  const wb = new ExcelJS.Workbook()
  wb.creator  = shopName
  wb.created  = new Date()
  wb.modified = new Date()

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: {
      oddHeader: `&C&B${shopName} - ${title}`,
      oddFooter: `&LDiekspor: ${new Date().toLocaleDateString('id-ID')}&RHalaman &P dari &N`,
    },
  })

  // Set column widths
  ws.columns = columns.map(c => ({ key: c.key, width: c.width }))

  // Cover rows (1-5)
  addCoverRow(ws, shopName, title, period, columns.length)

  // Header row (row 6)
  const HEADER_ROW = 6
  const headerRow = ws.getRow(HEADER_ROW)
  headerRow.height = 22
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header
    applyHeaderStyle(cell)
  })

  // Freeze panes
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: HEADER_ROW, topLeftCell: `A${HEADER_ROW + 1}`, activeCell: `A${HEADER_ROW + 1}` }]

  // Data rows (from row 7)
  rows.forEach((row, rIdx) => {
    const exRow = ws.getRow(HEADER_ROW + 1 + rIdx)
    exRow.height = 16
    columns.forEach((col, cIdx) => {
      const cell = exRow.getCell(cIdx + 1)
      cell.value = row[col.key] as ExcelJS.CellValue
      applyDataStyle(cell, rIdx % 2 === 1, col.numFmt)
      if (col.align) cell.alignment = { ...cell.alignment, horizontal: col.align }
    })
  })

  // No data notice
  if (rows.length === 0) {
    const noDataRow = ws.getRow(HEADER_ROW + 1)
    noDataRow.height = 20
    ws.mergeCells(HEADER_ROW + 1, 1, HEADER_ROW + 1, columns.length)
    const cell = noDataRow.getCell(1)
    cell.value     = 'Tidak ada data dalam periode yang dipilih.'
    cell.font      = { italic: true, color: { argb: 'FF94A3B8' }, name: 'Calibri' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  // Summary section
  if (summaries && summaries.length > 0) {
    const dataEndRow = HEADER_ROW + Math.max(rows.length, 1)
    const summaryStart = dataEndRow + 2
    addSummaryRows(ws, summaryStart, summaries, columns.length)
  }

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: HEADER_ROW, column: columns.length },
  }

  // Write & save
  const buffer = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
}

// ─── Template Export ──────────────────────────────────────────────────────────
/**
 * Export a styled Import Template Excel file.
 * Includes cover rows, instruction block, color-coded headers (required = red star),
 * and yellow-highlighted example data rows with a "DELETE BEFORE IMPORT" note.
 */
export interface TemplateColDef {
  header: string
  key: string
  width: number
  required?: boolean
  note?: string          // shown in the instruction row below header
  numFmt?: string
  align?: ExcelJS.Alignment['horizontal']
}

export async function exportTemplateExcel(opts: {
  shopName: string
  title: string
  filename: string
  sheetName: string
  columns: TemplateColDef[]
  exampleRows: Record<string, unknown>[]
}) {
  const { shopName, title, filename, sheetName, columns, exampleRows } = opts

  const wb = new ExcelJS.Workbook()
  wb.creator  = shopName
  wb.created  = new Date()
  wb.modified = new Date()

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  ws.columns = columns.map(c => ({ key: c.key, width: c.width }))

  // ── Row 1: Shop name ──
  ws.mergeCells(1, 1, 1, columns.length)
  const r1 = ws.getCell(1, 1)
  r1.value     = shopName.toUpperCase()
  r1.font      = { bold: true, size: 13, color: { argb: 'FF' + BRAND_DARK }, name: 'Calibri' }
  r1.alignment = { horizontal: 'center', vertical: 'middle' }
  r1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(1).height = 26

  // ── Row 2: Title ──
  ws.mergeCells(2, 1, 2, columns.length)
  const r2 = ws.getCell(2, 1)
  r2.value     = title
  r2.font      = { bold: true, size: 11, color: { argb: 'FF' + BRAND_MID }, name: 'Calibri' }
  r2.alignment = { horizontal: 'center', vertical: 'middle' }
  r2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  ws.getRow(2).height = 20

  // ── Row 3: Instruction banner ──
  ws.mergeCells(3, 1, 3, columns.length)
  const r3 = ws.getCell(3, 1)
  r3.value     = '⚠  PETUNJUK: Hapus baris contoh (warna kuning) sebelum mengimpor. Kolom bertanda (*) WAJIB diisi. Jangan mengubah nama kolom header.'
  r3.font      = { bold: true, size: 9.5, color: { argb: 'FF92400E' }, name: 'Calibri' }
  r3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  r3.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
  r3.border    = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder } as ExcelJS.Borders
  ws.getRow(3).height = 28

  // ── Row 4: Spacer ──
  ws.getRow(4).height = 6

  // ── Row 5: Column header ──
  const HEADER_ROW = 5
  const headerRow = ws.getRow(HEADER_ROW)
  headerRow.height = 22
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value     = col.required ? `${col.header} *` : col.header
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.required ? 'FF1E3A5F' : 'FF2563EB' } }
    cell.alignment = { vertical: 'middle', horizontal: col.align ?? 'center', wrapText: true }
    cell.border    = allBorders
  })

  // ── Row 6: Column notes (requirement hints) ──
  const noteRow = ws.getRow(HEADER_ROW + 1)
  noteRow.height = 14
  columns.forEach((col, idx) => {
    const cell = noteRow.getCell(idx + 1)
    cell.value     = col.note ?? (col.required ? 'Wajib diisi' : 'Opsional')
    cell.font      = { italic: true, size: 8, color: { argb: 'FF64748B' }, name: 'Calibri' }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = allBorders
  })

  // Freeze above data
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: HEADER_ROW + 1, topLeftCell: `A${HEADER_ROW + 2}`, activeCell: `A${HEADER_ROW + 2}` }]

  // ── Example rows (yellow highlight) ──
  const DATA_START = HEADER_ROW + 2
  exampleRows.forEach((row, rIdx) => {
    const exRow = ws.getRow(DATA_START + rIdx)
    exRow.height = 16
    columns.forEach((col, cIdx) => {
      const cell = exRow.getCell(cIdx + 1)
      cell.value     = row[col.key] as ExcelJS.CellValue
      cell.font      = { size: 9.5, name: 'Calibri', color: { argb: 'FF78350F' }, italic: true }
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: col.align ?? 'left' }
      cell.border    = allBorders
      if (col.numFmt) cell.numFmt = col.numFmt
    })
  })

  // ── Empty data rows (for user input) ──
  const EMPTY_ROWS = 30
  const emptyStart = DATA_START + exampleRows.length
  for (let r = 0; r < EMPTY_ROWS; r++) {
    const exRow = ws.getRow(emptyStart + r)
    exRow.height = 16
    columns.forEach((_, cIdx) => {
      const cell = exRow.getCell(cIdx + 1)
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: r % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } }
      cell.border = allBorders
      cell.alignment = { vertical: 'middle' }
    })
  }

  // ── Auto-filter ──
  ws.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to:   { row: HEADER_ROW, column: columns.length },
  }

  // ── Write & save ──
  const buffer = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
}

