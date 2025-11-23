"use client"

import * as React from "react"
import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/components/providers/LocaleProvider"
import { localeNames } from "@/i18n/config"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

/**
 * LanguageSwitcher Component
 *
 * A dropdown menu that allows users to change the application language.
 * Supports French (fr) and English (en).
 *
 * Features:
 * - Displays current language
 * - Shows checkmark next to active language
 * - Updates user preference in database and cookie
 * - Shows toast notification on success/error
 *
 * Usage:
 * ```tsx
 * <LanguageSwitcher />
 * ```
 */
export function LanguageSwitcher() {
  const { locale, setLocale, isLoading } = useLocale()
  const t = useTranslations('common')

  const handleLanguageChange = async (newLocale: 'fr' | 'en') => {
    if (newLocale === locale || isLoading) return

    try {
      await setLocale(newLocale)
      toast.success(t('languageChanged'))
    } catch (error) {
      console.error('Error changing language:', error)
      toast.error(t('languageChangeFailed'))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3"
          disabled={isLoading}
        >
          <Languages className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">
            {localeNames[locale]}
          </span>
          <span className="sm:hidden">
            {locale.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('fr')}
          className="cursor-pointer"
        >
          <Check
            className={`mr-2 h-4 w-4 ${
              locale === 'fr' ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {localeNames.fr}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className="cursor-pointer"
        >
          <Check
            className={`mr-2 h-4 w-4 ${
              locale === 'en' ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {localeNames.en}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
