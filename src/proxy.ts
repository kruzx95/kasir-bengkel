import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const publicRoutes = ['/login']
const kasirRoutes = ['/kasir']
const adminRoutes = ['/admin']

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(route + '/'))
  const isKasirRoute = kasirRoutes.some((route) => path === route || path.startsWith(route + '/'))
  const isAdminRoute = adminRoutes.some((route) => path === route || path.startsWith(route + '/'))

  // Get session from cookie
  const sessionCookie = request.cookies.get('session')?.value
  const session = await decrypt(sessionCookie)

  // Redirect root to login or dashboard
  if (path === '/') {
    if (session) {
      const dashboardUrl = session.role === 'ADMIN' ? '/admin' : '/kasir'
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from login page
  if (isPublicRoute && session) {
    const dashboardUrl = session.role === 'ADMIN' ? '/admin' : '/kasir'
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check role-based access
  if (session) {
    if (isAdminRoute && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/kasir', request.url))
    }
    if (isKasirRoute && session.role !== 'KASIR') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
