"use client"

import * as React from "react"
import {
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

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const t = useTranslations('sidebar')

  const navMain = [
    {
      title: t('dashboard'),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t('calendar'),
      url: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: t('patients'),
      url: "/dashboard/patients",
      icon: Users,
    },
    {
      title: t('consultations'),
      url: "/dashboard/consultations",
      icon: FileText,
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
  ]

  const defaultUser = {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    avatar: "https://github.com/shadcn.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/images/logo.svg" alt="Postur" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('appName')}</span>
                  <span className="truncate text-xs">{t('appDescription')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
