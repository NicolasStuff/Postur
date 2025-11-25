import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicesSettings } from "@/components/settings/ServicesSettings"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AvailabilitySettings } from "@/components/settings/AvailabilitySettings"
import { BillingSettings } from "@/components/settings/BillingSettings"
import { getTranslations } from 'next-intl/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string; upgrade?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const t = await getTranslations('dashboard.settings')
  const params = await searchParams

  // Fetch subscription data
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/signin")
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      trialEndsAt: true,
      cancelAtPeriodEnd: true,
    },
  })

  const defaultTab = params.tab || "profile"
  const showUpgradeModal = params.upgrade === "true"

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="availability">{t('tabs.availability')}</TabsTrigger>
          <TabsTrigger value="services">{t('tabs.services')}</TabsTrigger>
          <TabsTrigger value="billing">{t('tabs.billing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>{t('profile.title')}</CardTitle>
                    <CardDescription>{t('profile.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProfileSettings />
                </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="availability">
            <Card>
                <CardHeader>
                    <CardTitle>{t('availability.title')}</CardTitle>
                    <CardDescription>{t('availability.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <AvailabilitySettings />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="services">
            <Card>
                <CardHeader>
                    <CardTitle>{t('services.title')}</CardTitle>
                    <CardDescription>{t('services.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ServicesSettings />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="billing">
            <BillingSettings
              subscription={subscription}
              showUpgradeModal={showUpgradeModal}
            />
        </TabsContent>
      </Tabs>
    </div>
  )
}
