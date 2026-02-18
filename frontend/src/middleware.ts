import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // HSTS: Force HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // CSP: Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://accounts.google.com https://discord.com https://backend-production-6816.up.railway.app wss://backend-production-6816.up.railway.app https://fonts.googleapis.com https://fonts.gstatic.com",
      "frame-src 'self' https://accounts.google.com https://discord.com",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  )

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'
  ]
}
