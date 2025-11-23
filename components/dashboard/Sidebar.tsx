"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Settings, CreditCard, FileText, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()

    return (
      <aside className="hidden w-64 flex-col border-r bg-background p-6 md:flex">
        <div className="flex items-center gap-2 mb-8">
            <Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
            <span className="font-bold text-xl text-primary">TheraFlow</span>
        </div>
        
        <nav className="flex-1 space-y-2">
            <NavItem href="/dashboard/calendar" icon={<Calendar className="h-4 w-4" />} label="Calendrier" pathname={pathname} />
            <NavItem href="/dashboard/patients" icon={<Users className="h-4 w-4" />} label="Patients" pathname={pathname} />
            <NavItem 
                href="/dashboard/consultations" 
                icon={<FileText className="h-4 w-4" />} 
                label="Consultations" 
                pathname={pathname} 
                isActive={pathname.startsWith('/dashboard/consultation')}
            />
            <NavItem href="/dashboard/billing" icon={<CreditCard className="h-4 w-4" />} label="Facturation" pathname={pathname} />
            <NavItem href="/dashboard/settings" icon={<Settings className="h-4 w-4" />} label="Paramètres" pathname={pathname} />
        </nav>

        <div className="mt-auto pt-6 border-t">
             <div className="flex items-center gap-3 mb-4">
                <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">Dr. Martin</p>
                    <p className="text-xs text-muted-foreground">Osteopath</p>
                </div>
             </div>
             <Button variant="outline" className="w-full justify-start" size="sm">
                <LogOut className="mr-2 h-4 w-4" /> Log out
             </Button>
        </div>
      </aside>
    )
}

function NavItem({ href, icon, label, pathname, isActive }: { href: string, icon: React.ReactNode, label: string, pathname: string, isActive?: boolean }) {
    const active = isActive ?? pathname === href
    return (
        <Link href={href}>
            <span className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary hover:bg-muted"
            )}>
                {icon}
                {label}
            </span>
        </Link>
    )
}
