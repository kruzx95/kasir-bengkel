'use server'

import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createActivityLog } from '@/lib/logger'

const LoginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
      branchId: true,
      branch: {
        select: { name: true }
      }
    }
  })

  if (!user || !user.isActive) {
    await createActivityLog({
      action: 'FAILED_LOGIN_ATTEMPT',
      category: 'SYSTEM',
      level: 'WARNING',
      description: `Percobaan login gagal untuk email: ${email} (Akun tidak ditemukan atau nonaktif)`,
      details: { email, reason: !user ? 'User not found' : 'User inactive' },
      userName: email,
      userRole: 'ADMIN',
    })
    return { message: 'Email atau password salah' }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    await createActivityLog({
      action: 'FAILED_LOGIN_ATTEMPT',
      category: 'SYSTEM',
      level: 'WARNING',
      description: `Percobaan login gagal untuk user: ${user.name} (${user.email}) - Kata sandi salah`,
      details: { email: user.email, userId: user.id },
      branchId: user.branchId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
    })
    return { message: 'Email atau password salah' }
  }

  await createSession(user)

  await createActivityLog({
    action: 'USER_LOGIN',
    category: 'USER',
    level: 'INFO',
    description: `User ${user.name} (${user.role}) berhasil login`,
    details: { email: user.email, branchName: user.branch?.name || 'Semua Cabang' },
    branchId: user.branchId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
  })

  if (user.role === 'ADMIN') {
    redirect('/admin')
  } else {
    redirect('/kasir')
  }
}

export async function logout() {
  const session = await getSession().catch(() => null)
  if (session) {
    await createActivityLog({
      action: 'USER_LOGOUT',
      category: 'USER',
      level: 'INFO',
      description: `User ${session.name} (${session.role}) keluar (logout)`,
      branchId: session.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })
  }
  await deleteSession()
  redirect('/login')
}
