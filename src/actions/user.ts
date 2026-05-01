'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function updateUser(id: string, data: { name: string; email: string; password?: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    // Check if email already taken by someone else
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing && existing.id !== id) {
      return { success: false, message: 'Email sudah digunakan pengguna lain' }
    }

    const updateData: any = {
      name: data.name,
      email: data.email
    }

    if (data.password && data.password.length > 0) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal mengubah data pengguna' }
  }
}
