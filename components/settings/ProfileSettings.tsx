"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/app/actions/user"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"
import { LanguageSelector } from "./LanguageSelector"

export function ProfileSettings() {
    const t = useTranslations('settings.profile')
    const locale = useLocale()
    const queryClient = useQueryClient()
    const { data: user, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => getUserProfile() })

    const [formData, setFormData] = useState({
        companyName: "",
        companyAddress: "",
        siret: "",
        slug: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                companyName: user.companyName || "",
                companyAddress: user.companyAddress || "",
                siret: user.siret || "",
                slug: user.slug || ""
            })
        }
    }, [user])

    const mutation = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            toast.success(t('profileUpdateSuccess'))
        },
        onError: (err) => {
            toast.error(t('profileUpdateError') + ': ' + err.message)
        }
    })

    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin"/></div>

    return (
        <div className="space-y-6">
            <LanguageSelector currentLocale={locale} />

            <div className="border-t pt-6 space-y-4">
                <div className="grid gap-2">
                    <Label>{t('publicBookingUrl')}</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">postur.com/</span>
                        <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder={t('slugPlaceholder')} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('companyName')}</Label>
                    <Input value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder={t('companyNamePlaceholder')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('address')}</Label>
                    <Input value={formData.companyAddress} onChange={(e) => setFormData({...formData, companyAddress: e.target.value})} placeholder={t('addressPlaceholder')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('siret')}</Label>
                    <Input value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} placeholder={t('siretPlaceholder')} />
                </div>
                <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {t('saveChanges')}
                </Button>
            </div>
        </div>
    )
}
