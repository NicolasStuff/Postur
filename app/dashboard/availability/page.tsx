import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvailabilitySettings } from "@/components/settings/AvailabilitySettings"
import { getTranslations } from 'next-intl/server'

export default async function AvailabilityPage() {
  const t = await getTranslations('dashboard.settings')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('availability.title')}</h1>

      <Card>
        <CardHeader>
          <CardDescription>{t('availability.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilitySettings />
        </CardContent>
      </Card>
    </div>
  )
}
