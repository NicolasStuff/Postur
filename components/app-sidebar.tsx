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

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calendrier",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Patients",
    url: "/dashboard/patients",
    icon: Users,
  },
  {
    title: "Consultations",
    url: "/dashboard/consultations",
    icon: FileText,
  },
  {
    title: "Facturation",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
                  <Image src="/images/logo.svg" alt="TheraFlow" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TheraFlow</span>
                  <span className="truncate text-xs">Gestion de cabinet</span>
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
