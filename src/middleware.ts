import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Webhooks no requieren sesión (se verifican por firma).
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // Todo el panel es admin-only. Cualquier ruta cubierta por el matcher exige
  // sesión con rol admin; si no, a login. (No redirigir a '/' porque '/' también
  // está protegido y crearía un bucle.)
  if (!req.auth?.user || req.auth.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Node.js runtime: el gate de auth incluye NextAuth + adapter Prisma y supera
  // el límite de 1 MB de las Edge Functions. En Node no aplica ese límite.
  runtime: 'nodejs',
  // Protege TODO el panel (antes solo /admin dejaba abiertas las herramientas).
  matcher: [
    '/',
    '/studio/:path*',
    '/ideas/:path*',
    '/collections/:path*',
    '/automatizaciones/:path*',
    '/multi-design/:path*',
    '/promociones/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/webhooks/:path*',
  ],
}
