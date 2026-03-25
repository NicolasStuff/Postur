"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, setAiBetaParticipation, updateUserProfile } from "@/app/actions/user"
import {
    getPublicBookingHost,
    getSiretValidationError,
    getSlugValidationError,
    normalizeSlug,
} from "@/lib/onboarding"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"
import { LanguageSelector } from "./LanguageSelector"

// Module-level: safe because getPublicBookingHost reads process.env which is available at module load
const BOOKING_HOST = getPublicBookingHost()

export function ProfileSettings() {
    const tErrors = useTranslations('errors')
    const t = useTranslations('settings.profile')
    const locale = useLocale()
    const queryClient = useQueryClient()
    const { data: user, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => getUserProfile() })

    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        companyAddress: "",
        siret: "",
        slug: "",
        isVatExempt: true,
        defaultVatRate: ""
    })

    // Update form data when user profile loads
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                companyName: user.companyName || "",
                companyAddress: user.companyAddress || "",
                siret: user.siret || "",
                slug: user.slug || "",
                isVatExempt: user.isVatExempt ?? true,
                defaultVatRate: user.defaultVatRate ? String(user.defaultVatRate) : ""
            })
        }
    }, [user])

    const normalizedSlug = normalizeSlug(formData.slug) || ""
    const slugValidationError = getSlugValidationError(formData.slug)
    const siretValidationError = getSiretValidationError(formData.siret)
    const isFormValid =
        formData.name.trim().length > 0 &&
        formData.companyName.trim().length > 0 &&
        formData.companyAddress.trim().length > 0 &&
        slugValidationError === null &&
        siretValidationError === null &&
        (formData.isVatExempt || Number.parseFloat(formData.defaultVatRate) > 0)

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

    const aiBetaMutation = useMutation({
        mutationFn: setAiBetaParticipation,
        onSuccess: (_, enabled) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            // TODO: move to i18n translations
            toast.success(
                enabled
                    ? (locale === "fr"
                        ? "Bêta IA activée avec succès"
                        : "AI beta enabled successfully")
                    : (locale === "fr"
                        ? "Bêta IA désactivée"
                        : "AI beta disabled")
            )
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin"/></div>

    return (
        <div className="space-y-6">
            <LanguageSelector currentLocale={locale} />

            <div className="border-t pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">{t('requiredFieldsDescription')}</p>
                <div className="grid gap-2">
                    <Label>{t('practitionerName')} *</Label>
                    <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder={t('practitionerNamePlaceholder')}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>{t('publicBookingUrl')} *</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{BOOKING_HOST}/</span>
                        <Input
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({...formData, slug: e.target.value})}
                            placeholder={t('slugPlaceholder')}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">{BOOKING_HOST}/{normalizedSlug || t('slugPlaceholder')}</p>
                    {formData.slug.trim().length > 0 && slugValidationError && (
                        <p className="text-sm text-destructive">
                            {slugValidationError === "reserved"
                                ? tErrors('reservedSlug')
                                : tErrors('invalidSlug')}
                        </p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label>{t('companyName')} *</Label>
                    <Input required value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder={t('companyNamePlaceholder')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('address')} *</Label>
                    <Input required value={formData.companyAddress} onChange={(e) => setFormData({...formData, companyAddress: e.target.value})} placeholder={t('addressPlaceholder')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('siret')} *</Label>
                    <Input required value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} placeholder={t('siretPlaceholder')} />
                    {formData.siret.trim().length > 0 && siretValidationError === "invalid" && (
                        <p className="text-sm text-destructive">{tErrors('invalidSiret')}</p>
                    )}
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="vatExempt"
                            checked={formData.isVatExempt}
                            onCheckedChange={(checked) =>
                                setFormData({
                                    ...formData,
                                    isVatExempt: checked === true,
                                    defaultVatRate: checked === true ? "" : formData.defaultVatRate,
                                })
                            }
                        />
                        <div className="space-y-1">
                            <Label htmlFor="vatExempt">{t('isVatExempt')}</Label>
                            <p className="text-sm text-muted-foreground">{t('isVatExemptHint')}</p>
                        </div>
                    </div>
                    {!formData.isVatExempt && (
                        <div className="grid gap-2">
                            <Label>{t('defaultVatRate')} *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.defaultVatRate}
                                onChange={(e) => setFormData({...formData, defaultVatRate: e.target.value})}
                                placeholder={t('defaultVatRatePlaceholder')}
                            />
                        </div>
                    )}
                </div>
                <Button
                    onClick={() =>
                        mutation.mutate({
                            ...formData,
                            defaultVatRate:
                                formData.isVatExempt || formData.defaultVatRate.trim() === ""
                                    ? null
                                    : Number.parseFloat(formData.defaultVatRate),
                        })
                    }
                    disabled={mutation.isPending || !isFormValid}
                >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {t('saveChanges')}
                </Button>
            </div>

            <div className="border-t pt-6 space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        {/* TODO: move to i18n translations */}
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {locale === "fr" ? "Bêta IA clinique" : "Clinical AI beta"}
                            </h3>
                            <Badge variant={user?.aiBetaEnabled ? "default" : "secondary"}>
                                {user?.aiBetaEnabled
                                    ? (locale === "fr" ? "Activée" : "Enabled")
                                    : (locale === "fr" ? "Désactivée" : "Disabled")}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {locale === "fr"
                                ? "Active les fonctions IA d’assistance clinique avec consentement explicite, traçabilité et garde bêta."
                                : "Enables clinical AI assistance features with explicit consent, auditability, and beta gating."}
                        </p>
                    </div>
                    <Button
                        variant={user?.aiBetaEnabled ? "outline" : "default"}
                        onClick={() => aiBetaMutation.mutate(!user?.aiBetaEnabled)}
                        disabled={aiBetaMutation.isPending}
                    >
                        {aiBetaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {/* TODO: move to i18n translations */}
                        {user?.aiBetaEnabled
                            ? (locale === "fr" ? "Désactiver" : "Disable")
                            : (locale === "fr" ? "Activer la bêta" : "Enable beta")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
