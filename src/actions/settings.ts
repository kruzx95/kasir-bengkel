'use server'

import { prisma } from '@/lib/prisma'
import { getSession, isDemoUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { createActivityLog } from '@/lib/logger'
import { DEFAULT_SHOP_NAME, DEFAULT_WA_TEMPLATE } from '@/lib/constants'

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

  if (isDemoUser(session)) {
    return { success: false, message: 'Pengaturan nama toko dinonaktifkan pada Akun Demo.' }
  }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, message: 'Nama toko tidak boleh kosong' }
  if (trimmed.length > 60) return { success: false, message: 'Nama toko maksimal 60 karakter' }

  try {
    const existing = await prisma.appSetting.findUnique({ where: { key: 'shop_name' } })

    await prisma.appSetting.upsert({
      where: { key: 'shop_name' },
      update: { value: trimmed },
      create: { key: 'shop_name', value: trimmed },
    })

    await createActivityLog({
      action: 'SYSTEM_SETTINGS_UPDATE',
      category: 'SYSTEM',
      level: 'INFO',
      description: `Pengaturan nama toko diubah menjadi "${trimmed}" oleh ${session.name}`,
      details: {
        settingKey: 'shop_name',
        previousValue: existing?.value || DEFAULT_SHOP_NAME,
        newValue: trimmed,
      },
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/', 'layout')
    return { success: true, message: 'Nama toko berhasil diperbarui' }
  } catch {
    return { success: false, message: 'Gagal menyimpan pengaturan' }
  }
}

export async function getWaReminderTemplate(): Promise<string> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'whatsapp_reminder_template' },
    })
    return setting?.value || DEFAULT_WA_TEMPLATE
  } catch {
    return DEFAULT_WA_TEMPLATE
  }
}

export async function updateWaReminderTemplate(template: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  if (isDemoUser(session)) {
    return { success: false, message: 'Pengaturan template pesan dinonaktifkan pada Akun Demo.' }
  }

  const trimmed = template.trim()
  if (!trimmed) return { success: false, message: 'Template pesan tidak boleh kosong' }
  if (trimmed.length > 2000) return { success: false, message: 'Template pesan maksimal 2000 karakter' }

  try {
    const existing = await prisma.appSetting.findUnique({ where: { key: 'whatsapp_reminder_template' } })

    await prisma.appSetting.upsert({
      where: { key: 'whatsapp_reminder_template' },
      update: { value: trimmed },
      create: { key: 'whatsapp_reminder_template', value: trimmed },
    })

    await createActivityLog({
      action: 'SYSTEM_SETTINGS_UPDATE',
      category: 'SYSTEM',
      level: 'INFO',
      description: `Template WhatsApp Reminder diperbarui oleh ${session.name}`,
      details: {
        settingKey: 'whatsapp_reminder_template',
        previousValue: existing?.value || DEFAULT_WA_TEMPLATE,
        newValue: trimmed,
      },
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/pengaturan')
    revalidatePath('/admin/reminder')
    revalidatePath('/kasir/reminder')
    return { success: true, message: 'Template pesan WhatsApp berhasil disimpan' }
  } catch {
    return { success: false, message: 'Gagal menyimpan template pesan' }
  }
}
