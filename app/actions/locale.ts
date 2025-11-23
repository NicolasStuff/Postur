'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'

export type LocaleType = 'fr' | 'en'

/**
 * Update the user's locale preference in the database and cookie
 */
export async function updateUserLocale(locale: LocaleType) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      // If not authenticated, just set the cookie
      const cookieStore = await cookies()
      cookieStore.set('NEXT_LOCALE', locale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })

      return { success: true, message: 'Locale updated in cookie' }
    }

    // Update the user's language in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { language: locale },
    })

    // Also set the cookie for immediate effect
    const cookieStore = await cookies()
    cookieStore.set('NEXT_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    return { success: true, message: 'Locale updated successfully' }
  } catch (error) {
    console.error('Error updating user locale:', error)
    return { success: false, message: 'Failed to update locale' }
  }
}

/**
 * Get the user's locale from the database or cookie
 */
export async function getUserLocale(): Promise<LocaleType> {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (session?.user?.id) {
      // Fetch user's language from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      })

      if (user?.language === 'fr' || user?.language === 'en') {
        return user.language as LocaleType
      }
    }

    // Fallback to cookie
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value

    if (localeCookie === 'fr' || localeCookie === 'en') {
      return localeCookie
    }

    // Default to French
    return 'fr'
  } catch (error) {
    console.error('Error getting user locale:', error)
    return 'fr'
  }
}
