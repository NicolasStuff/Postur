'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { updateUserLocale, type LocaleType } from '@/app/actions/locale'
import { localeNames, type Locale } from '@/i18n/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Languages, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

export function LanguageSwitcher({
  variant = 'ghost',
  showLabel = false
}: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('common')

  const handleLocaleChange = async (newLocale: LocaleType) => {
    if (newLocale === currentLocale) return

    startTransition(async () => {
      try {
        const result = await updateUserLocale(newLocale)

        if (result.success) {
          toast.success(t('languageChanged'))
          // Refresh the page to apply the new locale
          router.refresh()
        } else {
          toast.error(t('languageChangeFailed'))
        }
      } catch (error) {
        console.error('Error changing language:', error)
        toast.error(t('languageChangeFailed'))
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={showLabel ? 'default' : 'icon'}
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
          {showLabel && (
            <span className="ml-2">
              {localeNames[currentLocale]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(localeNames).map(([locale, name]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale as LocaleType)}
            className="flex items-center justify-between cursor-pointer"
            disabled={isPending}
          >
            <span>{name}</span>
            {currentLocale === locale && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
