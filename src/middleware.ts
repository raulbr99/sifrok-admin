import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiAdminRoute = pathname.startsWith('/api/admin')
  const isWebhook = pathname.startsWith('/api/webhooks')

  // Webhooks no requieren autenticacion (usan firma para verificar)
  if (isWebhook) {
    return NextResponse.next()
  }

  // Rutas admin requieren rol admin
  if (isAdminRoute || isApiAdminRoute) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Verificar rol admin
    if (req.auth.user.role !== 'admin') {
      // Redirigir a home si no es admin
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/webhooks/:path*',
  ],
}
