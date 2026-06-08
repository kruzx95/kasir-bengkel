import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Role } from '@/generated/prisma/client'

export interface SessionPayload {
  userId: string
  name: string
  email: string
  role: Role
  branchId: string | null
  branchName: string | null
  expiresAt: Date
}

const secretKey = process.env.SESSION_SECRET
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

export async function createSession(user: {
  id: string
  name: string
  email: string
  role: Role
  branchId: string | null
  branch: { name: string } | null
}) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  const session = await encrypt({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    branchName: user.branch?.name ?? null,
    expiresAt,
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
  const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
  if (isSuperAdmin) {
    return requestedBranchId ? { branchId: requestedBranchId } : {}
  }
  return { branchId: session.branchId || 'UNASSIGNED' }
}
