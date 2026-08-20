import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Role } from '@/generated/prisma/client'

export type SessionPayload = {
  userId: string
  name: string
  email: string
  role: Role
  branchId: string | null
  branchName: string | null
  expiresAt: Date
  isDemo?: boolean
}

const secretKey = process.env.SESSION_SECRET || 'dev-default-session-secret-change-in-production-32-chars'
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('[SECURITY WARNING] SESSION_SECRET environment variable is not defined!')
}
const encodedKey = new TextEncoder().encode(secretKey)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    console.log('Failed to verify session')
    return null
  }
}

export async function createSession(
  user: {
    id: string
    name: string
    email: string
    role: Role
    branchId: string | null
    branch: { name: string } | null
  },
  isDemo?: boolean
) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  const isDemoAccount =
    isDemo ??
    (user.email.startsWith('demo.') ||
      user.email === 'demo.admin@irianmotor.com' ||
      user.email === 'demo.kasir@irianmotor.com')

  const session = await encrypt({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    branchName: user.branch?.name ?? null,
    expiresAt,
    isDemo: isDemoAccount,
  })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export function getBranchFilter(session: SessionPayload, requestedBranchId?: string | null) {
  if (isDemoUser(session)) {
    return { branchId: session.branchId || 'DEMO' }
  }
  const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
  if (isSuperAdmin) {
    return requestedBranchId ? { branchId: requestedBranchId } : {}
  }
  return { branchId: session.branchId || 'UNASSIGNED' }
}

/**
 * Check if user has admin role (super admin or branch admin)
 */
export function isAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'ADMIN'
}

/**
 * Check if user has kasir role
 */
export function isKasir(session: SessionPayload | null): boolean {
  return session?.role === 'KASIR'
}

/**
 * Check if user is allowed to access corporate features.
 * Phase 5: Both ADMIN and KASIR can access.
 * Hapus korporat & void payment tetap admin-only (cek terpisah di action).
 */
export function canAccessCorporate(session: SessionPayload | null): boolean {
  return session?.role === 'ADMIN' || session?.role === 'KASIR'
}

/**
 * Check if the active session is a Demo user
 */
export function isDemoUser(session: SessionPayload | null): boolean {
  if (!session) return false
  return (
    !!session.isDemo ||
    session.email === 'demo.admin@irianmotor.com' ||
    session.email === 'demo.kasir@irianmotor.com' ||
    session.email.startsWith('demo.')
  )
}
