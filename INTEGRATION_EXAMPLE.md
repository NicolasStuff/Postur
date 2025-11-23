# Exemple d'intégration du LanguageSwitcher

## Intégration rapide dans NavUser (Recommandé)

Le composant `NavUser` dans la sidebar est l'endroit idéal pour ajouter le sélecteur de langue.

### Fichier: `/components/nav-user.tsx`

```tsx
"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Languages, // AJOUT
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LanguageSwitcher } from "@/components/LanguageSwitcher" // AJOUT
import { useTranslations } from "next-intl" // AJOUT

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const t = useTranslations('common') // AJOUT

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* AJOUT DU LANGUAGE SWITCHER */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('settings')}
              </DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <LanguageSwitcher showLabel />
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* FIN AJOUT */}

            <DropdownMenuItem>
              <LogOut />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

## Alternative: Dans le footer de la sidebar

### Fichier: `/components/app-sidebar.tsx`

```tsx
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
import { LanguageSwitcher } from "@/components/LanguageSwitcher" // AJOUT
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
    // ... votre configuration actuelle
  ]

  const defaultUser = {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    avatar: "https://github.com/shadcn.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* ... votre header actuel */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
        {/* AJOUT: LanguageSwitcher sous le NavUser */}
        <div className="p-2">
          <LanguageSwitcher variant="ghost" className="w-full" />
        </div>
        {/* FIN AJOUT */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

## Option 3: Dans les paramètres utilisateur

### Fichier: `/app/dashboard/settings/page.tsx`

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      {/* Section Langue */}
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Langue / Language</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choisissez votre langue préférée pour l'interface.
        </p>
        <LanguageSwitcher showLabel variant="outline" />
      </div>

      {/* Autres sections de paramètres */}
    </div>
  )
}
```

## Option 4: Dans un header personnalisé

### Fichier: `/components/header.tsx`

```tsx
'use client'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Postur</h1>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {/* Autres éléments du header */}
        </div>
      </div>
    </header>
  )
}
```

## Variantes du composant

### Avec icône seulement (compact)

```tsx
<LanguageSwitcher />
```

### Avec label (plus explicite)

```tsx
<LanguageSwitcher showLabel />
```

### Variant outline (dans les paramètres)

```tsx
<LanguageSwitcher variant="outline" showLabel />
```

### Variant default (bouton normal)

```tsx
<LanguageSwitcher variant="default" showLabel />
```

## Ajouter les traductions manquantes

Si vous utilisez le composant dans des endroits nécessitant des traductions, ajoutez-les :

### `/messages/fr.json`

```json
{
  "sidebar": {
    "dashboard": "Tableau de bord",
    "calendar": "Calendrier",
    "patients": "Patients",
    "consultations": "Consultations",
    "billing": "Facturation",
    "settings": "Paramètres",
    "appName": "Postur",
    "appDescription": "Gestion de cabinet"
  }
}
```

### `/messages/en.json`

```json
{
  "sidebar": {
    "dashboard": "Dashboard",
    "calendar": "Calendar",
    "patients": "Patients",
    "consultations": "Consultations",
    "billing": "Billing",
    "settings": "Settings",
    "appName": "Postur",
    "appDescription": "Practice Management"
  }
}
```

## Recommandation finale

**L'intégration dans NavUser (Option 1) est la plus recommandée** car :

1. Accessible facilement depuis n'importe quelle page
2. Contextualisé avec les paramètres utilisateur
3. Ne prend pas d'espace supplémentaire dans l'interface
4. Cohérent avec les patterns UX modernes (Gmail, GitHub, etc.)

## Test après intégration

1. Lancer l'application : `npm run dev`
2. Ouvrir la sidebar
3. Cliquer sur le menu utilisateur (NavUser)
4. Vérifier que le LanguageSwitcher apparaît
5. Changer la langue → vérifier que l'interface se met à jour
6. Rafraîchir la page → vérifier que la langue persiste

## Dépannage

Si le composant n'apparaît pas ou ne fonctionne pas :

1. Vérifier les imports dans le fichier
2. Vérifier que `'use client'` est présent en haut du fichier si nécessaire
3. Vérifier la console pour les erreurs
4. Vérifier que les traductions sont présentes dans `/messages/*.json`
5. Redémarrer le serveur de dev si nécessaire
