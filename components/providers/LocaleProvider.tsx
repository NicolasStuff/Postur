"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { updateUserLocale, getUserLocale, type LocaleType } from '@/app/actions/locale'

/**
 * LocaleProvider Component
 *
 * This provider manages the user's locale preference by:
 * 1. Fetching the user's language from the database (for authenticated users)
 * 2. Updating the locale cookie when the user changes their language
 * 3. Providing a function to update the locale across the app
 *
 * Usage:
 * Wrap your app with this provider to enable locale management
 * Use the useLocale hook to access locale state and update function
 */

interface LocaleContextType {
  locale: LocaleType
  setLocale: (locale: LocaleType) => Promise<void>
  isLoading: boolean
}

export const LocaleContext = React.createContext<LocaleContextType>({
  locale: 'fr',
  setLocale: async () => {},
  isLoading: true,
})

interface LocaleProviderProps {
  children: React.ReactNode
  initialLocale?: LocaleType
}

export function LocaleProvider({ children, initialLocale = 'fr' }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<LocaleType>(initialLocale)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user's locale on mount
  useEffect(() => {
    async function fetchUserLocale() {
      try {
        const userLocale = await getUserLocale()
        setLocaleState(userLocale)
      } catch (error) {
        console.error('Error fetching user locale:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserLocale()
  }, [])

  /**
   * Update the user's locale preference
   * This will:
   * 1. Update the database (for authenticated users)
   * 2. Update the cookie
   * 3. Refresh the router to apply the new locale
   */
  const setLocale = async (newLocale: LocaleType) => {
    try {
      setIsLoading(true)

      // Update the locale in the database and cookie
      const result = await updateUserLocale(newLocale)

      if (result.success) {
        setLocaleState(newLocale)

        // Build the new pathname with the correct locale prefix
        // For dashboard routes, we need to add or update the locale prefix
        const currentPathWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'

        // Check if current path is a dashboard route
        const isDashboard = currentPathWithoutLocale.startsWith('/dashboard') ||
                           currentPathWithoutLocale.startsWith('/settings') ||
                           currentPathWithoutLocale.startsWith('/patients') ||
                           currentPathWithoutLocale.startsWith('/calendar') ||
                           currentPathWithoutLocale.startsWith('/billing') ||
                           currentPathWithoutLocale.startsWith('/consultation') ||
                           currentPathWithoutLocale.startsWith('/onboarding')

        if (isDashboard) {
          // For dashboard routes, add locale prefix for non-default locale
          const newPath = newLocale === 'fr' ? currentPathWithoutLocale : `/${newLocale}${currentPathWithoutLocale}`
          router.push(newPath)
          router.refresh()
        } else {
          // For other routes, just refresh
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error updating locale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LocaleContext.Provider>
  )
}

/**
 * Hook to access the locale context
 *
 * Usage:
 * ```tsx
 * const { locale, setLocale, isLoading } = useLocale()
 *
 * // Change locale
 * await setLocale('en')
 * ```
 */
export function useLocale() {
  const context = React.useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
