"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicesSettings } from "@/components/settings/ServicesSettings"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AvailabilitySettings } from "@/components/settings/AvailabilitySettings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <Tabs defaultValue="profile" className="space-y-4">
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
             <Card>
                <CardHeader>
                    <CardTitle>{t('billingSettings.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('billingSettings.placeholder')}</p>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
