import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { headers } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from custom header set by middleware (includes cookie value)
  const headersList = await headers()
  const userLocale = headersList.get('x-user-locale')

  // Use user's locale if available, otherwise fallback to request locale
  let locale = userLocale || (await requestLocale)

  // Validate the locale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
