# Configuration i18n - Documentation

## Vue d'ensemble

L'application utilise **next-intl** pour la gestion de l'internationalisation avec une persistance en base de données pour les utilisateurs connectés.

## Langues supportées

- Français (fr) - langue par défaut
- Anglais (en)

## Architecture

### 1. Fichiers de configuration

#### `/middleware.ts`
Le middleware gère la détection automatique de la langue et la persistance via cookie.

**Fonctionnement:**
1. Vérifie si l'utilisateur a une préférence de langue dans le cookie `NEXT_LOCALE`
2. Si oui, utilise cette langue
3. Sinon, détecte automatiquement la langue depuis l'en-tête `Accept-Language` du navigateur
4. Définit le cookie pour une durée de 1 an

#### `/i18n/request.ts`
Configure `getRequestConfig` pour charger les messages de traduction.

**Fonctionnement:**
1. Récupère la langue de l'utilisateur depuis la DB (si connecté) via `getUserLocale()`
2. Fallback sur la locale détectée par le navigateur
3. Charge les messages depuis `/messages/{locale}.json`

#### `/i18n/routing.ts`
Définit la configuration de routage pour next-intl.

#### `/i18n/config.ts`
Contient les types TypeScript et les noms des langues affichables.

### 2. Persistance en base de données

#### Modèle `User` (Prisma)
```prisma
model User {
  language String @default("fr") // "fr" or "en"
  // ... autres champs
}
```

#### Actions serveur (`/app/actions/locale.ts`)

**`updateUserLocale(locale: 'fr' | 'en')`**
- Met à jour la langue de l'utilisateur en base de données (si connecté)
- Définit le cookie `NEXT_LOCALE` pour effet immédiat
- Retourne un objet `{ success: boolean, message: string }`

**`getUserLocale(): Promise<'fr' | 'en'>`**
- Récupère la langue de l'utilisateur depuis la DB (si connecté)
- Fallback sur le cookie `NEXT_LOCALE`
- Fallback final sur 'fr'

### 3. API Routes

#### `/app/api/user/profile/route.ts`
Endpoint GET pour récupérer le profil utilisateur incluant la langue.

**Retourne:**
```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "language": "fr",
  "practitionerType": "...",
  "slug": "...",
  "role": "..."
}
```

### 4. Composants

#### `/components/LanguageSwitcher.tsx`
Composant dropdown permettant de changer la langue.

**Props:**
- `variant?: 'default' | 'ghost' | 'outline'` - Style du bouton (défaut: 'ghost')
- `showLabel?: boolean` - Afficher le nom de la langue (défaut: false)

**Utilisation:**
```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Avec icône seulement
<LanguageSwitcher />

// Avec label
<LanguageSwitcher showLabel />

// Variant différent
<LanguageSwitcher variant="outline" showLabel />
```

### 5. Hooks

#### `/lib/hooks/useUserLocale.ts`
Hook client pour récupérer la langue de l'utilisateur.

**Utilisation:**
```tsx
import { useUserLocale } from '@/lib/hooks/useUserLocale'

function MyComponent() {
  const { locale, isLoading } = useUserLocale()

  if (isLoading) return <div>Loading...</div>

  return <div>Current locale: {locale}</div>
}
```

**Note:** Ce hook fait un appel API pour récupérer la langue depuis la DB. Pour les composants simples, utilisez plutôt `useLocale()` de next-intl.

## Système de détection de langue

### Pour les visiteurs non connectés

1. **Première visite:**
   - Détection automatique depuis l'en-tête `Accept-Language` du navigateur
   - Langue stockée dans le cookie `NEXT_LOCALE`

2. **Changement manuel:**
   - L'utilisateur clique sur le `LanguageSwitcher`
   - La langue est mise à jour dans le cookie
   - La page est rafraîchie avec la nouvelle langue

### Pour les utilisateurs connectés

1. **Connexion:**
   - La langue est récupérée depuis le champ `language` de la table `User`
   - Si non définie, fallback sur la détection automatique

2. **Changement manuel:**
   - L'utilisateur clique sur le `LanguageSwitcher`
   - Action serveur `updateUserLocale()` appelée
   - Mise à jour en base de données ET dans le cookie
   - La page est rafraîchie avec la nouvelle langue

3. **Sessions suivantes:**
   - La langue est toujours récupérée depuis la base de données
   - Persiste entre les sessions

## Ordre de priorité de la détection

1. **Langue en base de données** (si utilisateur connecté)
2. **Cookie `NEXT_LOCALE`** (si défini)
3. **En-tête `Accept-Language`** (détection navigateur)
4. **Langue par défaut** ('fr')

## Fichiers de traduction

### Structure

```
/messages
  /fr.json  # Traductions françaises
  /en.json  # Traductions anglaises
```

### Format

Les fichiers JSON sont structurés par namespace:

```json
{
  "common": {
    "welcome": "Bienvenue",
    "loading": "Chargement...",
    "languageChanged": "Langue modifiée avec succès",
    "languageChangeFailed": "Échec du changement de langue"
  },
  "dashboard": {
    "title": "Tableau de bord"
  },
  "consultation": {
    "shared": {
      "save": "Sauvegarder"
    }
  }
}
```

## Utilisation dans les composants

### Composants serveur

```tsx
import { useTranslations } from 'next-intl'

export default function ServerComponent() {
  const t = useTranslations('common')

  return <h1>{t('welcome')}</h1>
}
```

### Composants client

```tsx
'use client'

import { useTranslations } from 'next-intl'

export default function ClientComponent() {
  const t = useTranslations('dashboard')

  return <h1>{t('title')}</h1>
}
```

### Avec paramètres

```tsx
const t = useTranslations('booking')

// Dans en.json: "confirmationSent": "A confirmation email has been sent to {email}"
<p>{t('bookingSuccess.confirmationSent', { email: 'user@example.com' })}</p>
```

### Obtenir la locale actuelle

```tsx
import { useLocale } from 'next-intl'

export default function Component() {
  const locale = useLocale() // 'fr' | 'en'

  return <div>Current locale: {locale}</div>
}
```

## Intégration dans l'application

### Layout principal (`/app/layout.tsx`)

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Next.config.ts

```ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig = {
  // ... autres options
}

export default withNextIntl(nextConfig)
```

## Comment l'utilisateur peut changer sa langue

### Option 1: Via le composant LanguageSwitcher

Le composant `LanguageSwitcher` peut être placé n'importe où dans l'application:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Dans un header/navbar
<nav>
  <LanguageSwitcher />
</nav>

// Dans les paramètres
<div className="settings">
  <h2>Langue</h2>
  <LanguageSwitcher showLabel />
</div>
```

### Option 2: Programmatiquement

```tsx
'use client'

import { updateUserLocale } from '@/app/actions/locale'
import { useRouter } from 'next/navigation'

export default function LanguageButton() {
  const router = useRouter()

  const changeToEnglish = async () => {
    const result = await updateUserLocale('en')
    if (result.success) {
      router.refresh()
    }
  }

  return <button onClick={changeToEnglish}>Switch to English</button>
}
```

## Bonnes pratiques

1. **Toujours utiliser les traductions** - Ne jamais écrire du texte en dur
2. **Namespaces cohérents** - Organiser les traductions par fonctionnalité
3. **Clés descriptives** - Utiliser des noms de clés explicites
4. **Paramètres pour le contenu dynamique** - Utiliser `{variable}` dans les traductions
5. **Fallbacks** - Toujours avoir une traduction en français (langue par défaut)

## Dépannage

### La langue ne change pas

1. Vérifier que le cookie `NEXT_LOCALE` est bien défini
2. Vérifier les logs de la console pour les erreurs
3. Vérifier que `router.refresh()` est appelé après le changement
4. Vérifier que l'utilisateur est bien authentifié (si applicable)

### Traductions manquantes

1. Vérifier que la clé existe dans `/messages/{locale}.json`
2. Vérifier l'orthographe de la clé
3. Vérifier le namespace utilisé avec `useTranslations()`

### Erreur de build

1. Vérifier que tous les fichiers JSON sont valides (pas de virgules en trop)
2. Vérifier que `next.config.ts` contient bien `withNextIntl()`
3. Relancer `npm run build`

## Fichiers créés/modifiés

### Créés
- `/middleware.ts` - Middleware next-intl avec gestion cookie
- `/app/actions/locale.ts` - Actions serveur pour la gestion de la langue
- `/app/api/user/profile/route.ts` - API route pour récupérer le profil utilisateur
- `/lib/hooks/useUserLocale.ts` - Hook pour récupérer la locale utilisateur
- `/components/LanguageSwitcher.tsx` - Composant de changement de langue
- `/i18n/request.ts` - Configuration next-intl (modifié pour intégrer getUserLocale)
- `/i18n/routing.ts` - Configuration de routage
- `/i18n/config.ts` - Types et configuration

### Modifiés
- `/app/layout.tsx` - Ajout de NextIntlClientProvider
- `/messages/fr.json` - Ajout des traductions (languageChanged, languageChangeFailed)
- `/messages/en.json` - Ajout des traductions (languageChanged, languageChangeFailed)
- `/prisma/schema.prisma` - Champ `language` déjà présent dans le modèle User
- `/next.config.ts` - Déjà configuré avec next-intl plugin

## Tests

Pour tester le système i18n:

1. **Test visiteur non connecté:**
   - Ouvrir l'application en navigation privée
   - Changer la langue via le LanguageSwitcher
   - Vérifier que la langue persiste au rafraîchissement

2. **Test utilisateur connecté:**
   - Se connecter à l'application
   - Changer la langue via le LanguageSwitcher
   - Se déconnecter puis se reconnecter
   - Vérifier que la langue préférée est conservée

3. **Test détection automatique:**
   - Changer la langue du navigateur
   - Ouvrir l'application en navigation privée
   - Vérifier que la langue détectée correspond
