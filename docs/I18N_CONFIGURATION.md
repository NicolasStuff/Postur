# Configuration i18n - postur

Documentation complète de la configuration d'internationalisation (i18n) de l'application postur.

## Vue d'ensemble

postur utilise [next-intl](https://next-intl-docs.vercel.app/) pour gérer l'internationalisation de l'application avec le support de deux langues :

- **Français (fr)** - Langue par défaut
- **Anglais (en)**

### Stratégie de routage

L'application utilise une stratégie **prefix-except-default** :

- Routes en français (locale par défaut) : **pas de préfixe** (ex: `/dashboard`)
- Routes en anglais : **préfixe `/en`** (ex: `/en/dashboard`)

### Architecture des routes

#### Routes françaises uniquement (Public)

Ces routes restent **toujours en français** et ne supportent pas le changement de langue :

- Landing page : `/`
- Page de réservation publique : `/[slug]` (ex: `/jean-dupont`)
- Authentification : `/signin`, `/signup`

#### Routes multilingues (Dashboard)

Ces routes supportent **français et anglais** et respectent les préférences de l'utilisateur :

- Dashboard : `/dashboard` ou `/en/dashboard`
- Calendrier : `/dashboard/calendar` ou `/en/dashboard/calendar`
- Patients : `/dashboard/patients` ou `/en/dashboard/patients`
- Consultations : `/dashboard/consultations` ou `/en/dashboard/consultations`
- Facturation : `/dashboard/billing` ou `/en/dashboard/billing`
- Paramètres : `/dashboard/settings` ou `/en/dashboard/settings`
- Onboarding : `/onboarding` ou `/en/onboarding`

---

## Structure des fichiers

```
/
├── i18n/
│   ├── config.ts           # Configuration des locales
│   ├── routing.ts          # Configuration du routage i18n
│   └── request.ts          # Configuration des requêtes i18n
├── messages/
│   ├── fr.json            # Traductions françaises
│   └── en.json            # Traductions anglaises
├── middleware.ts          # Middleware de gestion des locales
├── app/
│   ├── layout.tsx         # Layout racine avec NextIntlClientProvider
│   └── actions/
│       └── locale.ts      # Actions serveur pour la gestion des locales
└── components/
    ├── providers/
    │   └── LocaleProvider.tsx   # Provider client pour la gestion des locales
    └── ui/
        └── language-switcher.tsx # Composant de sélection de langue
```

---

## Configuration détaillée

### 1. Configuration des locales (`/i18n/config.ts`)

```typescript
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};
```

**Utilisation :**

- `locales` : Liste des locales supportées
- `defaultLocale` : Locale par défaut (français)
- `localeNames` : Noms affichés dans le sélecteur de langue

### 2. Configuration du routage (`/i18n/routing.ts`)

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed", // prefix-except-default strategy
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

**Utilisation :**

- Utilisez `Link` de `i18n/routing` au lieu de `next/link` pour gérer automatiquement les préfixes de locale
- Utilisez `redirect`, `usePathname`, `useRouter` pour la navigation avec gestion automatique des locales

**Exemple :**

```tsx
import { Link } from "@/i18n/routing";

<Link href="/dashboard">Dashboard</Link>;
// En français : /dashboard
// En anglais : /en/dashboard
```

### 3. Middleware (`/middleware.ts`)

Le middleware gère trois stratégies différentes :

#### Stratégie 1 : Routes françaises uniquement

```typescript
// Landing page, pages de réservation publiques
if (isFrenchOnlyRoute(pathnameWithoutLocale)) {
  // Force la locale française
  // Redirige /en/* vers /*
}
```

#### Stratégie 2 : Routes multilingues (Dashboard)

```typescript
// Détection de la locale depuis :
// 1. Cookie utilisateur (NEXT_LOCALE)
// 2. Header Accept-Language
// 3. Défaut : français
```

#### Stratégie 3 : Autres routes

```typescript
// Comportement par défaut de next-intl
```

### 4. Gestion des locales côté serveur (`/app/actions/locale.ts`)

Deux fonctions principales :

#### `getUserLocale()`

Récupère la locale de l'utilisateur depuis :

1. Base de données (pour les utilisateurs connectés)
2. Cookie `NEXT_LOCALE`
3. Défaut : `'fr'`

```typescript
const locale = await getUserLocale();
// Retourne 'fr' ou 'en'
```

#### `updateUserLocale(locale)`

Met à jour la locale de l'utilisateur :

1. Mise à jour dans la base de données (si connecté)
2. Mise à jour du cookie `NEXT_LOCALE`

```typescript
await updateUserLocale("en");
```

### 5. LocaleProvider (`/components/providers/LocaleProvider.tsx`)

Provider React côté client qui :

- Récupère la locale de l'utilisateur au montage
- Fournit un contexte avec `locale`, `setLocale`, `isLoading`
- Gère la navigation lors du changement de locale

**Utilisation :**

```tsx
import { useLocale } from "@/components/providers/LocaleProvider";

function MyComponent() {
  const { locale, setLocale, isLoading } = useLocale();

  const handleChangeLanguage = async () => {
    await setLocale("en");
  };

  return <div>Current locale: {locale}</div>;
}
```

### 6. LanguageSwitcher (`/components/ui/language-switcher.tsx`)

Composant UI pour changer de langue :

- Dropdown avec les langues disponibles
- Checkmark sur la langue active
- Toast de confirmation
- Gestion automatique de la navigation

**Utilisation :**

```tsx
import { LanguageSwitcher } from "@/components/ui/language-switcher";

<LanguageSwitcher />;
```

---

## Traductions

### Structure des fichiers de traduction

Les fichiers `messages/fr.json` et `messages/en.json` utilisent une structure en arbre :

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "patients": {
      "title": "Patients"
    }
  }
}
```

### Utiliser les traductions dans les composants

#### Composants serveur

```tsx
import { useTranslations } from "next-intl";

export default function ServerComponent() {
  const t = useTranslations("dashboard");

  return <h1>{t("title")}</h1>;
}
```

#### Composants client

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function ClientComponent() {
  const t = useTranslations("common");

  return <button>{t("save")}</button>;
}
```

#### Traductions avec paramètres

```json
{
  "greeting": "Bonjour {name} !"
}
```

```tsx
const t = useTranslations('messages')
<p>{t('greeting', { name: 'Jean' })}</p>
// Affiche : "Bonjour Jean !"
```

### Ajouter de nouvelles traductions

1. Ajoutez la clé dans `messages/fr.json` :

```json
{
  "myFeature": {
    "title": "Mon titre",
    "description": "Ma description"
  }
}
```

2. Ajoutez la traduction anglaise dans `messages/en.json` :

```json
{
  "myFeature": {
    "title": "My title",
    "description": "My description"
  }
}
```

3. Utilisez dans votre composant :

```tsx
const t = useTranslations('myFeature')
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

---

## Base de données

### Champ `language` dans le modèle User

```prisma
model User {
  // ...
  language  String  @default("fr") // "fr" or "en"
  // ...
}
```

La langue de l'utilisateur est stockée dans la base de données et synchronisée automatiquement avec :

- Le cookie `NEXT_LOCALE`
- Le contexte i18n de l'application

---

## Workflow utilisateur

### 1. Première visite (non connecté)

1. L'utilisateur visite le site
2. Le middleware détecte la langue du navigateur (header `Accept-Language`)
3. Si la langue du navigateur est l'anglais → `/en/dashboard`
4. Sinon → `/dashboard` (français par défaut)

### 2. Changement de langue (non connecté)

1. L'utilisateur clique sur le LanguageSwitcher
2. Le cookie `NEXT_LOCALE` est mis à jour
3. La page se rafraîchit avec la nouvelle locale

### 3. Première connexion

1. L'utilisateur se connecte
2. La langue stockée en DB est chargée
3. Si différente de la langue actuelle, redirection automatique

### 4. Changement de langue (connecté)

1. L'utilisateur clique sur le LanguageSwitcher
2. La langue est mise à jour dans la DB
3. Le cookie `NEXT_LOCALE` est mis à jour
4. La page se rafraîchit avec la nouvelle locale

---

## Bonnes pratiques

### 1. Navigation

✅ **Toujours utiliser les composants de navigation i18n**

```tsx
import { Link, useRouter } from "@/i18n/routing";

<Link href="/dashboard">Dashboard</Link>;
```

❌ **Ne pas utiliser les composants Next.js directement**

```tsx
// Éviter
import Link from "next/link";
```

### 2. Traductions

✅ **Organiser les traductions par feature**

```json
{
  "patients": {
    "list": { ... },
    "create": { ... },
    "edit": { ... }
  }
}
```

❌ **Éviter les traductions plates**

```json
{
  "patientsList": "...",
  "patientsCreate": "...",
  "patientsEdit": "..."
}
```

### 3. Clés de traduction

✅ **Utiliser des clés descriptives en anglais**

```json
{
  "save": "Enregistrer",
  "cancel": "Annuler"
}
```

❌ **Éviter les clés françaises**

```json
{
  "enregistrer": "Enregistrer"
}
```

### 4. Composants réutilisables

✅ **Passer le namespace de traduction en props**

```tsx
function Modal({ titleKey }: { titleKey: string }) {
  const t = useTranslations();
  return <h2>{t(titleKey)}</h2>;
}

<Modal titleKey="patients.create.title" />;
```

### 5. Dates et nombres

Utilisez les utilitaires next-intl pour formater :

```tsx
import { useFormatter } from "next-intl";

function Component() {
  const format = useFormatter();

  return (
    <div>
      {format.dateTime(new Date(), {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      {format.number(1234.56, {
        style: "currency",
        currency: "EUR",
      })}
    </div>
  );
}
```

---

## Dépannage

### Problème : Les traductions ne se chargent pas

**Solution :**

1. Vérifiez que le fichier `messages/{locale}.json` existe
2. Vérifiez la syntaxe JSON (pas de virgules en trop)
3. Redémarrez le serveur de développement

### Problème : La locale ne change pas

**Solution :**

1. Vérifiez que le cookie `NEXT_LOCALE` est bien défini
2. Videz le cache du navigateur
3. Vérifiez que le middleware est bien actif

### Problème : Erreur "useTranslations must be used within NextIntlClientProvider"

**Solution :**

1. Vérifiez que `NextIntlClientProvider` enveloppe votre composant dans `layout.tsx`
2. Si composant client, ajoutez `'use client'` en haut du fichier

### Problème : Les routes publiques affichent /en/

**Solution :**

1. Vérifiez que la route est bien dans `FRENCH_ONLY_ROUTES` du middleware
2. Redémarrez le serveur

---

## Commandes utiles

### Vérifier la structure des traductions

```bash
# Comparer les clés entre fr.json et en.json
node scripts/check-translations.js
```

### Générer les types TypeScript pour les traductions

```bash
# next-intl génère automatiquement les types
npm run dev
```

---

## Ressources

- [Documentation next-intl](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)

---

## Support

Pour toute question ou problème concernant l'i18n :

1. Consultez cette documentation
2. Vérifiez les exemples dans le code
3. Contactez l'équipe de développement

---

**Dernière mise à jour :** 2025-11-23
**Version :** 1.0.0
