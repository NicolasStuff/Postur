import createMiddleware from 'next-intl/middleware'
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

// Create the next-intl middleware with locale detection
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Remove locale prefix if present to get the base pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'

  /**
   * STRATEGY 1: French-only routes (Landing page, public booking pages)
   * - Force French locale
   * - No locale prefix in URL
   * - Redirect if user tries to access with /en prefix
   */
  if (isFrenchOnlyRoute(pathnameWithoutLocale)) {
    // If user tries to access with /en prefix, redirect to French version
    if (pathname.startsWith('/en/') || pathname === '/en') {
      const url = request.nextUrl.clone()
      url.pathname = pathnameWithoutLocale
      return NextResponse.redirect(url)
    }

    // Set French locale header for these routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-locale', 'fr')

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
   * - Detect locale from:
   *   1. User's cookie (set when user changes language)
   *   2. Accept-Language header (browser preference)
   *   3. Default to French
   */
  if (isDashboardRoute(pathnameWithoutLocale)) {
    // Get the locale from user's cookie (set by the app when user changes language)
    const userLocaleCookie = request.cookies.get('NEXT_LOCALE')?.value

    // If user has a preferred locale in cookie, use it
    if (userLocaleCookie && routing.locales.includes(userLocaleCookie as any)) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-locale', userLocaleCookie)

      // Pass through next-intl middleware with user's locale
      const response = intlMiddleware(request)

      // Ensure the cookie is set on the response
      response.cookies.set('NEXT_LOCALE', userLocaleCookie, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      })

      return response
    }

    // Otherwise, let next-intl handle locale detection (from Accept-Language header)
    return intlMiddleware(request)
  }

  /**
   * STRATEGY 3: All other routes
   * - Use default next-intl behavior
   */
  return intlMiddleware(request)
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
