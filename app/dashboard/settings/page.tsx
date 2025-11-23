"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicesSettings } from "@/components/settings/ServicesSettings"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AvailabilitySettings } from "@/components/settings/AvailabilitySettings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>Professional Profile</CardTitle>
                    <CardDescription>Manage your public information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProfileSettings />
                </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="availability">
            <Card>
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                    <CardDescription>Configure your weekly schedule.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AvailabilitySettings />
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="services">
            <Card>
                <CardHeader>
                    <CardTitle>Services & Pricing</CardTitle>
                    <CardDescription>Configure the services you offer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ServicesSettings />
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="billing">
             <Card>
                <CardHeader>
                    <CardTitle>Billing Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Billing configuration placeholder.</p>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
