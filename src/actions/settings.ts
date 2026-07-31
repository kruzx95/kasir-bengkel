'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const DEFAULT_SHOP_NAME = 'MULYA LESTARI'

export async function getShopName(): Promise<string> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'shop_name' },
    })
    return setting?.value || DEFAULT_SHOP_NAME
  } catch {
    return DEFAULT_SHOP_NAME
  }
}

export async function updateShopName(name: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, message: 'Nama toko tidak boleh kosong' }
  if (trimmed.length > 60) return { success: false, message: 'Nama toko maksimal 60 karakter' }

  try {
    await prisma.appSetting.upsert({
      where: { key: 'shop_name' },
      update: { value: trimmed },
      create: { key: 'shop_name', value: trimmed },
    })

    revalidatePath('/', 'layout')
    return { success: true, message: 'Nama toko berhasil diperbarui' }
  } catch {
    return { success: false, message: 'Gagal menyimpan pengaturan' }
  }
}
