'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

type UpdateUserData = {
  name: string
  email: string
  passwordHash?: string
}

export async function updateUser(id: string, data: { name: string; email: string; password?: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing && existing.id !== id) {
      return { success: false, message: 'Email sudah digunakan pengguna lain' }
    }

    if (data.password && data.password.length > 0 && data.password.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter' }
    }

    const updateData: UpdateUserData = { name: data.name, email: data.email }
    if (data.password && data.password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    await prisma.user.update({ where: { id }, data: updateData })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah data pengguna'
    return { success: false, message }
  }
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'KASIR'
  branchId?: string | null
}) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    if (!data.name.trim() || !data.email.trim() || !data.password) {
      return { success: false, message: 'Semua field wajib diisi' }
    }

    if (data.password.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter' }
    }

    // KASIR wajib punya cabang, Admin Toko punya cabang, Super Admin null
    // Untuk membedakan, jika tidak ada branchId yg di-pass, kita anggap dia Super Admin (atau KASIR yg error)
    if (data.role === 'KASIR' && !data.branchId) {
      return { success: false, message: 'Kasir wajib memilih cabang' }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar' }
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        passwordHash,
        role: data.role,
        branchId: data.branchId || null,
      },
    })

    return { success: true, message: 'Pengguna berhasil ditambahkan' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan pengguna'
    return { success: false, message }
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    if (session.userId === id) {
      return { success: false, message: 'Tidak dapat menghapus akun sendiri' }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })
    return { success: true, message: 'Pengguna berhasil dihapus' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus pengguna'
    return { success: false, message }
  }
}

export async function changeOwnPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Tidak terautentikasi' }

    if (data.newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter' }
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return { success: false, message: 'User tidak ditemukan' }

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!valid) return { success: false, message: 'Password saat ini tidak sesuai' }

    const hash = await bcrypt.hash(data.newPassword, 10)
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } })

    return { success: true, message: 'Password berhasil diubah' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah password'
    return { success: false, message }
  }
}

export async function updateOwnProfile(data: { name: string; email: string }) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Tidak terautentikasi' }

    if (!data.name.trim()) return { success: false, message: 'Nama tidak boleh kosong' }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing && existing.id !== session.userId) {
      return { success: false, message: 'Email sudah digunakan pengguna lain' }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { name: data.name.trim(), email: data.email },
    })

    return { success: true, message: 'Profil berhasil diperbarui' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui profil'
    return { success: false, message }
  }
}
