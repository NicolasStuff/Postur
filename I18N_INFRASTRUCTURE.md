# Infrastructure i18n - Next.js avec next-intl

## Vue d'ensemble

L'application utilise **next-intl** pour la gestion de l'internationalisation (i18n) avec support pour le français (fr) et l'anglais (en). Le français est la langue par défaut.

## Structure des fichiers

### Fichiers de configuration

1. **`/i18n/routing.ts`**
   - Définit les locales supportées (fr, en)
   - Définit la locale par défaut (fr)
   - Exporte les helpers de navigation (`Link`, `redirect`, `usePathname`, `useRouter`)

2. **`/i18n/request.ts`**
   - Configuration serveur de next-intl
   - Charge dynamiquement les fichiers de traduction
   - Gère la fallback vers la locale par défaut

3. **`/i18n/config.ts`**
   - Constantes des locales et leurs noms d'affichage
   - Type `Locale` pour TypeScript

4. **`/middleware.ts`**
   - Middleware next-intl pour gérer automatiquement les locales dans les routes
   - Redirige automatiquement vers la locale appropriée

5. **`/next.config.ts`**
   - Intègre le plugin next-intl via `createNextIntlPlugin`

### Fichiers de traduction

Les traductions sont stockées dans `/messages/`:

- **`/messages/fr.json`** - Traductions françaises
- **`/messages/en.json`** - Traductions anglaises

### Structure des traductions

```json
{
  "common": {
    "welcome": "...",
    "loading": "...",
    "save": "...",
    "cancel": "...",
    // ... autres traductions communes
  },
  "auth": {
    "signin": { ... },
    "onboarding": { ... }
  },
  "dashboard": { ... },
  "booking": { ... },
  "consultation": { ... },
  // ... autres sections
}
```

## Hooks personnalisés

### `/lib/hooks/useLocale.ts`

Hook client pour gérer la préférence de langue de l'utilisateur :

```typescript
const { locale, updateLocale, isLoading } = useLocale();
```

- **`locale`**: Langue actuelle de l'utilisateur (récupérée depuis la BDD)
- **`updateLocale(newLocale)`**: Fonction pour changer la langue
- **`isLoading`**: État de chargement

### API Route

**`/app/api/user/locale/route.ts`**

- **GET**: Récupère la préférence de langue de l'utilisateur depuis la BDD
- **POST**: Met à jour la préférence de langue dans la BDD (champ `language` du modèle `User`)

## Utilisation dans les composants

### Composants serveur

```typescript
import { useTranslations } from 'next-intl';

export default function MyServerComponent() {
  const t = useTranslations('common');

  return <h1>{t('welcome')}</h1>;
}
```

### Composants client

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('common');

  return <button>{t('save')}</button>;
}
```

### Navigation avec i18n

Utilisez les helpers de navigation exportés depuis `/i18n/routing.ts` :

```typescript
import { Link, useRouter, usePathname } from '@/i18n/routing';

// Link component
<Link href="/dashboard">Dashboard</Link>

// Programmatic navigation
const router = useRouter();
router.push('/dashboard');

// Get pathname without locale
const pathname = usePathname();
```

## Comment ajouter des traductions

### 1. Ajouter une nouvelle clé de traduction

Ajoutez la traduction dans **les deux fichiers** (`fr.json` et `en.json`) :

**`/messages/fr.json`**
```json
{
  "mySection": {
    "myKey": "Ma traduction en français"
  }
}
```

**`/messages/en.json`**
```json
{
  "mySection": {
    "myKey": "My translation in English"
  }
}
```

### 2. Utiliser la traduction dans un composant

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('mySection');

  return <div>{t('myKey')}</div>;
}
```

### 3. Traductions avec paramètres

**Fichier de traduction**
```json
{
  "greeting": "Bonjour {name}, bienvenue !"
}
```

**Utilisation**
```typescript
t('greeting', { name: 'Jean' })
// Résultat: "Bonjour Jean, bienvenue !"
```

### 4. Traductions riches (avec HTML)

```typescript
t.rich('message', {
  strong: (chunks) => <strong>{chunks}</strong>
})
```

## Sections de traduction existantes

- **`common`**: Traductions communes (boutons, actions, labels génériques)
- **`auth`**: Authentification et onboarding
- **`dashboard`**: Tableau de bord et sections principales
- **`booking`**: Système de réservation
- **`calendar`**: Calendrier
- **`appointment`**: Rendez-vous
- **`patients`**: Gestion des patients
- **`billing`**: Facturation
- **`consultation`**: Consultations (ostéopathe, naturopathe, sophrologue)

## Bonnes pratiques

1. **Toujours ajouter les traductions dans les deux fichiers** (fr.json et en.json)
2. **Utiliser des clés descriptives** : `auth.signin.emailLabel` plutôt que `auth.e1`
3. **Grouper les traductions par section** pour faciliter la maintenance
4. **Ne pas dupliquer** : utilisez la section `common` pour les traductions réutilisables
5. **Tester les deux langues** après avoir ajouté des traductions

## Récupération de la langue utilisateur

La langue de l'utilisateur est stockée dans le champ `language` du modèle `User` dans Prisma :

```prisma
model User {
  // ...
  language String @default("fr") // "fr" or "en"
  // ...
}
```

Le hook `useLocale()` récupère automatiquement cette valeur depuis la base de données et permet de la mettre à jour.

## Migration des composants existants

Pour migrer un composant existant vers i18n :

1. Identifier tous les textes en dur dans le composant
2. Créer une section appropriée dans les fichiers de traduction
3. Ajouter les traductions en français et en anglais
4. Remplacer les textes en dur par `t('cle')`
5. Tester dans les deux langues

## Support et aide

Pour toute question sur l'infrastructure i18n, consultez :
- Documentation next-intl : https://next-intl-docs.vercel.app/
- Ce fichier pour les spécificités du projet
