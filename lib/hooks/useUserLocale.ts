'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { authClient } from '@/lib/auth-client'
import { Locale } from '@/i18n/config'

/**
 * Hook to get the user's locale from the database
 * Falls back to the current locale from next-intl if not authenticated
 */
export function useUserLocale() {
  const currentLocale = useLocale() as Locale
  const [userLocale, setUserLocale] = useState<Locale>(currentLocale)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserLocale() {
      try {
        const session = await authClient.getSession()

        if (session?.data?.user) {
          // Fetch user data from database to get the language preference
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const userData = await response.json()
            if (userData.language && (userData.language === 'fr' || userData.language === 'en')) {
              setUserLocale(userData.language as Locale)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user locale:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserLocale()
  }, [])

  return { locale: userLocale, isLoading }
}
