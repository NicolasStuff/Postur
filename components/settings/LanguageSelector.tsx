"use client"

import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateUserProfile } from "@/app/actions/user"

interface LanguageSelectorProps {
    currentLocale: string
}

export function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
    const t = useTranslations('settings.profile')
    const router = useRouter()

    const handleLanguageChange = async (newLocale: string) => {
        try {
            // Update user language in database
            await updateUserProfile({ language: newLocale })
            
            // Show success toast
            toast.success(t('languageUpdateSuccess'))
            
            // Change the locale cookie and refresh
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
            router.refresh()
        } catch (error) {
            toast.error(t('languageUpdateError'))
            console.error('Failed to update language:', error)
        }
    }

    return (
        <div className="grid gap-2">
            <Label>{t('language')}</Label>
            <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
            <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="fr">{t('french')}</SelectItem>
                    <SelectItem value="en">{t('english')}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
