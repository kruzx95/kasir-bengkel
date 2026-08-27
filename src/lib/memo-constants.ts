export const TUNE_UP_ITEMS = [
  { key: 'busi', label: 'Pemeriksaan Busi' },
  { key: 'saringanUdara', label: 'Pemeriksaan Saringan Udara' },
  { key: 'saringanBensin', label: 'Pemeriksaan Saringan Bensin' },
  { key: 'throttleBody', label: 'Pemeriksaan Throttle Body' },
  { key: 'airRadiator', label: 'Pemeriksaan Air Radiator' },
  { key: 'airWiper', label: 'Pemeriksaan Air Wiper Kaca' },
  { key: 'cairanRem', label: 'Pemeriksaan Cairan Rem' },
  { key: 'cairanKopling', label: 'Pemeriksaan Cairan Kopling' },
  { key: 'oliPowersteering', label: 'Pemeriksaan Oli Powersteering' },
  { key: 'lampuLampu', label: 'Pemeriksaan Lampu-lampu' },
  { key: 'filterCabinAc', label: 'Pemeriksaan Filter Cabin AC' },
  { key: 'karetWiper', label: 'Pemeriksaan Karet Wiper Kaca' },
  { key: 'fanbelt', label: 'Pemeriksaan Fanbelt' },
  { key: 'airAccu', label: 'Pemeriksaan Air Accu' },
  { key: 'kalibrasiInjektor', label: 'Kalibrasi Injektor (Tune Up Paket)' },
  { key: 'gurahRuangBakar', label: 'Gurah Ruang Bakar (Tune Up Paket)' },
] as const

export const BRAKES_ITEMS = [
  { key: 'kampasRem', label: 'Pemeriksaan Kampas Rem' },
  { key: 'karetRem', label: 'Pemeriksaan Karet Rem' },
  { key: 'minyakRem', label: 'Pemeriksaan Minyak Rem' },
  { key: 'komponenRemLain', label: 'Pemeriksaan Komponen Rem Yang Lain' },
] as const

export const SUSPENSION_ITEMS = [
  { key: 'laharRoda', label: 'Cek Lahar Roda' },
  { key: 'bolaBolaStir', label: 'Cek Bola-bola Stir' },
  { key: 'bushingDanKaret', label: 'Cek Bushing dan Karet-karet' },
  { key: 'shockBreakerDepanBelakang', label: 'Cek Shock Breaker Depan Belakang' },
  { key: 'cvJoint', label: 'Cek CV Joint' },
  { key: 'bautBautKolong', label: 'Cek Baut-baut Kolong Keseluruhan' },
] as const

export const MEMO_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info' }> = {
  DRAFT: { label: 'Draft (Baru)', variant: 'default' },
  ESTIMATED: { label: 'Estimasi Harga Diisi', variant: 'info' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', variant: 'warning' },
  COMPLETED: { label: 'Selesai Pengerjaan', variant: 'success' },
  CONVERTED: { label: 'Sudah Jadi Invoice', variant: 'purple' },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
}

export type ChecklistTuneUp = Partial<Record<(typeof TUNE_UP_ITEMS)[number]['key'], boolean>>
export type ChecklistBrakes = Partial<Record<(typeof BRAKES_ITEMS)[number]['key'], boolean>>
export type ChecklistSuspension = Partial<Record<(typeof SUSPENSION_ITEMS)[number]['key'], boolean>>

