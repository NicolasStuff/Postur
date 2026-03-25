import { getDashboardData } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, CalendarCheck } from "lucide-react"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { GoogleBookingTutorial } from "@/components/dashboard/GoogleBookingTutorial"
import { getTranslations, getLocale } from 'next-intl/server'
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user?.id) {
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role === "ADMIN") {
      redirect("/dashboard/admin/conversations")
    }
  }

  const data = await getDashboardData()
  const locale = await getLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  const t = await getTranslations('dashboard')

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Google Booking Tutorial */}
      <GoogleBookingTutorial />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('today')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {data.todayAppointments > 1 ? t('consultations') : t('consultation')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('thisWeek')}</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {data.weekAppointments > 1 ? t('consultations') : t('consultation')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPatients')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalPatients > 1 ? t('patients') : t('patient')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('upcomingAppointments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noAppointments')}</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between border-l-4 border-l-blue-500 bg-slate-50 p-3 rounded"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.service.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {format(new Date(appointment.start), "HH:mm", { locale: dateLocale })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.start), "dd MMM yyyy", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
