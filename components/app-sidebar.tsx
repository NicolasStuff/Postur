"use client"

import * as React from "react"
import {
  Briefcase,
  Calendar,
  Users,
  Settings,
  CreditCard,
  FileText,
  LayoutDashboard,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface SubscriptionData {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trialDaysRemaining: number
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
  subscription?: SubscriptionData | null
}

export function AppSidebar({ user, subscription, ...props }: AppSidebarProps) {
  const t = useTranslations('sidebar')
  const tSub = useTranslations('subscription')

  const navGroups = [
    {
      label: t('sections.activity'),
      items: [
        {
          title: t('dashboard'),
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: t('consultations'),
          url: "/dashboard/consultations",
          icon: FileText,
        },
        {
          title: t('calendar'),
          url: "/dashboard/calendar",
          icon: Calendar,
        },
      ],
    },
    {
      label: t('sections.patientCare'),
      items: [
        {
          title: t('patients'),
          url: "/dashboard/patients",
          icon: Users,
        },
      ],
    },
    {
      label: t('sections.management'),
      items: [
        {
          title: t('services'),
          url: "/dashboard/services",
          icon: Briefcase,
        },
        {
          title: t('billing'),
          url: "/dashboard/billing",
          icon: CreditCard,
        },
        {
          title: t('settings'),
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ]

  const defaultUser = {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    avatar: "/images/logo.svg",
  }

  // Get subscription badge info
  const getSubscriptionBadge = () => {
    if (!subscription) return null

    if (subscription.status === "TRIALING") {
      return {
        label: tSub("trial.banner"),
        className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      }
    }

    if (subscription.status === "ACTIVE") {
      return {
        label: subscription.plan === "PRO_IA" ? "Pro + IA" : "Pro",
        className: subscription.plan === "PRO_IA"
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
          : "bg-slate-100 text-slate-800 hover:bg-slate-100",
      }
    }

    return null
  }

  const badge = getSubscriptionBadge()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image src="/images/logo.svg" alt="Postur" width={32} height={32} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{t('appName')}</span>
                      {badge && (
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5 py-0", badge.className)}
                        >
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    <span className="truncate text-xs">{t('appDescription')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarTrigger className="size-8 group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
