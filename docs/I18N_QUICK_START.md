# i18n Quick Start Guide

Guide rapide pour utiliser l'internationalisation dans postur.

## Configuration actuelle

- **Langues supportées** : Français (fr), Anglais (en)
- **Langue par défaut** : Français
- **Stratégie** : prefix-except-default (`/dashboard` pour FR, `/en/dashboard` pour EN)

## Utilisation rapide

### 1. Dans un composant

```tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("myNamespace");

  return <h1>{t("title")}</h1>;
}
```

### 2. Ajouter une traduction

**messages/fr.json**

```json
{
  "myNamespace": {
    "title": "Mon titre"
  }
}
```

**messages/en.json**

```json
{
  "myNamespace": {
    "title": "My title"
  }
}
```

### 3. Navigation

```tsx
import { Link } from "@/i18n/routing";

<Link href="/dashboard/patients">Patients</Link>;
```

### 4. Changer de langue

Le composant `<LanguageSwitcher />` est déjà intégré dans la sidebar (menu utilisateur).

Ou utilisez le hook :

```tsx
import { useLocale } from "@/components/providers/LocaleProvider";

const { locale, setLocale } = useLocale();

// Changer la langue
await setLocale("en");
```

## Routes

### Public (Français uniquement)

- `/` - Landing page
- `/[slug]` - Page de réservation
- `/signin`, `/signup` - Authentification

### Dashboard (Multilingue)

- `/dashboard` ou `/en/dashboard`
- `/dashboard/calendar` ou `/en/dashboard/calendar`
- `/dashboard/patients` ou `/en/dashboard/patients`
- `/dashboard/consultations` ou `/en/dashboard/consultations`
- `/dashboard/billing` ou `/en/dashboard/billing`
- `/dashboard/settings` ou `/en/dashboard/settings`

## Fichiers importants

- `/i18n/routing.ts` - Configuration du routage
- `/middleware.ts` - Gestion des locales
- `/messages/fr.json` - Traductions françaises
- `/messages/en.json` - Traductions anglaises
- `/components/providers/LocaleProvider.tsx` - Provider de locale
- `/components/ui/language-switcher.tsx` - Sélecteur de langue

## Documentation complète

Consultez `/docs/I18N_CONFIGURATION.md` pour la documentation détaillée.
