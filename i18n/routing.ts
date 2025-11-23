import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

/**
 * Routing configuration for next-intl
 *
 * Strategy: prefix-except-default
 * - Default locale (fr): No prefix in URL (e.g., /dashboard)
 * - Other locales (en): Prefix required (e.g., /en/dashboard)
 *
 * Supported locales:
 * - fr (French) - Default
 * - en (English)
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // Use 'as-needed' for prefix-except-default strategy
})

/**
 * Navigation utilities with locale support
 * These components and hooks automatically handle locale prefixes
 *
 * Usage:
 * - Link: Use instead of Next.js Link for automatic locale handling
 * - redirect: Use for programmatic redirects with locale
 * - usePathname: Get current pathname without locale prefix
 * - useRouter: Get router with locale-aware navigation
 */
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
