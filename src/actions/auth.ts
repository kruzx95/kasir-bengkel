'use server'

import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
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
    return { message: 'Email atau password salah' }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { message: 'Email atau password salah' }
  }

  await createSession(user)

  createActivityLog({
    action: 'USER_LOGIN',
    category: 'USER',
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
  await deleteSession()
  redirect('/login')
}
