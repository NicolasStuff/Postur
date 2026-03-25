import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

/**
 * IMPORTANT: Routes that should remain in French only
 * These routes are public-facing and should not have locale prefixes
 *
 * - Landing page: / (app/page.tsx)
 * - Public booking pages: /[slug] (app/[slug]/page.tsx)
 * - Public assets and images
 */
const FRENCH_ONLY_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

/**
 * Check if a pathname matches a French-only route pattern
 */
function isFrenchOnlyRoute(pathname: string): boolean {
  // Check if it's exactly a French-only route
  if (FRENCH_ONLY_ROUTES.includes(pathname)) {
    return true
  }

  // Check if it's a public booking page (slug pattern)
  // Pattern: /[slug] (single segment, no dash, no special chars)
  const slugPattern = /^\/[a-zA-Z0-9]+$/
  if (slugPattern.test(pathname)) {
    return true
  }

  return false
}

/**
 * Dashboard and authenticated routes that should support i18n
 * These routes are for logged-in users and should respect user's language preference
 */
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/onboarding',
  '/settings',
  '/patients',
  '/calendar',
  '/billing',
  '/consultation',
]

/**
 * Check if a pathname is a dashboard route
 */
function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /**
   * STRATEGY 1: French-only routes (Landing page, public booking pages)
   * - Force French locale
   * - No locale prefix in URL
   */
  if (isFrenchOnlyRoute(pathname)) {
    // Set French locale header for these routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-locale', 'fr')
    requestHeaders.set('x-next-intl-locale', 'fr')
    requestHeaders.set('x-pathname', pathname)

    // Continue without locale handling
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  /**
   * STRATEGY 2: Dashboard routes (authenticated, multi-language)
   * - Support both French and English
   * - NO URL prefix (stays at /dashboard, not /fr/dashboard or /en/dashboard)
   * - Detect locale from:
   *   1. User's cookie (set when user changes language)
   *   2. Default to French
   * - Pass locale to pages via header
   */
  if (isDashboardRoute(pathname)) {
    // Get the locale from user's cookie (set by the app when user changes language)
    const userLocaleCookie = request.cookies.get('NEXT_LOCALE')?.value
    const locale = userLocaleCookie && routing.locales.includes(userLocaleCookie as (typeof routing.locales)[number])
      ? userLocaleCookie
      : routing.defaultLocale

    // Set locale header for next-intl
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-locale', locale)
    requestHeaders.set('x-next-intl-locale', locale)
    requestHeaders.set('x-pathname', pathname)

    // Continue without URL rewriting, just pass headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Ensure the cookie is set on the response
    response.cookies.set('NEXT_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })

    return response
  }

  /**
   * STRATEGY 3: All other routes (API, etc.)
   * - Set default French locale
   */
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-locale', routing.defaultLocale)
  requestHeaders.set('x-next-intl-locale', routing.defaultLocale)
  requestHeaders.set('x-pathname', pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes: /api/*
    // - Next.js internals: /_next/*
    // - Vercel internals: /_vercel/*
    // - Static files with extensions: *.ico, *.png, *.jpg, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
