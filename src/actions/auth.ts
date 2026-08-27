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
  } else if (user.role === 'MEKANIK') {
    redirect('/mekanik')
  } else {
    redirect('/kasir')
  }
}

export async function loginAsDemo(targetRole: 'ADMIN' | 'KASIR' = 'KASIR') {
  const targetEmail = 'demo.kasir@irianmotor.com'

  let demoBranch = await prisma.branch.findUnique({ where: { code: 'DEMO' } })
  if (!demoBranch) {
    demoBranch = await prisma.branch.create({
      data: {
        code: 'DEMO',
        name: 'Cabang Demo (Showroom)',
        address: 'Jl. Pameran Otomotif No. 88, Jakarta',
        phone: '081299887766',
      },
    })
  }

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      branchId: true,
      branch: {
        select: { name: true },
      },
    },
  })

  // Fallback: create demo user on-demand if missing
  if (!user) {
    const demoPassword = await bcrypt.hash('DemoBengkel123!', 10)
    const created = await prisma.user.create({
      data: {
        name: 'Demo Kasir POS',
        email: targetEmail,
        passwordHash: demoPassword,
        role: 'KASIR',
        branchId: demoBranch.id,
      },
      include: {
        branch: { select: { name: true } },
      },
    })

    user = {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.isActive,
      branchId: created.branchId,
      branch: created.branch,
    }
  } else if (!user.branchId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { branchId: demoBranch.id },
    })
    user.branchId = demoBranch.id
    user.branch = { name: demoBranch.name }
  }

  await createSession(user, true)

  await createActivityLog({
    action: 'DEMO_USER_LOGIN',
    category: 'USER',
    level: 'INFO',
    description: `Akses Mode Demo Kasir: ${user.name} masuk ke sistem`,
    details: { email: user.email, branch: user.branch?.name || 'Cabang Demo' },
    branchId: user.branchId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
  })

  redirect('/kasir')
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

