# Configuration i18n - Résumé exécutif

## Statut : ✅ Configuré et opérationnel

La configuration i18n complète a été mise en place pour l'application postur.

---

## Configuration

### Langues supportées

- **Français (fr)** - Langue par défaut
- **Anglais (en)**

### Stratégie de routage

**prefix-except-default** :

- Français : `/dashboard` (pas de préfixe)
- Anglais : `/en/dashboard` (préfixe `/en`)

### Routes

#### 🌐 Public (Français uniquement)

Ces routes restent **toujours en français** :

- Landing page : `/`
- Réservation publique : `/[slug]`
- Authentification : `/signin`, `/signup`

#### 🔒 Dashboard (Multilingue)

Ces routes supportent **français et anglais** :

- `/dashboard` ou `/en/dashboard`
- `/dashboard/calendar` ou `/en/dashboard/calendar`
- `/dashboard/patients` ou `/en/dashboard/patients`
- `/dashboard/consultations` ou `/en/dashboard/consultations`
- `/dashboard/billing` ou `/en/dashboard/billing`
- `/dashboard/settings` ou `/en/dashboard/settings`
- `/onboarding` ou `/en/onboarding`

---

## Fichiers créés/modifiés

### ✨ Nouveaux fichiers

1. **`/components/providers/LocaleProvider.tsx`**

   - Provider React pour gérer la locale côté client
   - Récupère la langue depuis la DB pour les utilisateurs connectés
   - Hook `useLocale()` pour accéder au contexte

2. **`/components/ui/language-switcher.tsx`**

   - Composant UI pour changer de langue
   - Intégré dans le menu utilisateur (sidebar)

3. **`/docs/I18N_CONFIGURATION.md`**

   - Documentation complète et détaillée
   - Guide d'utilisation pour les développeurs
   - Bonnes pratiques et dépannage

4. **`/docs/I18N_QUICK_START.md`**
   - Guide de démarrage rapide
   - Exemples d'utilisation courants

### 🔧 Fichiers modifiés

1. **`/i18n/routing.ts`**

   - Ajout de `localePrefix: 'as-needed'` pour la stratégie prefix-except-default
   - Documentation inline

2. **`/middleware.ts`**

   - Gestion sophistiquée de 3 stratégies de routage :
     - Routes françaises uniquement (landing, booking)
     - Routes multilingues (dashboard)
     - Routes par défaut
   - Détection de locale depuis cookie, header, et DB

3. **`/app/layout.tsx`**

   - Intégration du `LocaleProvider`
   - Hiérarchie : `NextIntlClientProvider > LocaleProvider > Providers`

4. **`/app/actions/locale.ts`** (existant, amélioré)

   - Actions serveur pour gérer la locale
   - `getUserLocale()` - Récupère la locale de l'utilisateur
   - `updateUserLocale(locale)` - Met à jour la locale

5. **`/components/nav-user.tsx`**

   - Intégration du `LanguageSwitcher` dans le menu utilisateur

6. **`/messages/fr.json` et `/messages/en.json`**
   - Ajout des traductions pour :
     - `sidebar.*` (navigation sidebar)
     - `navigation.*` (menu utilisateur)

### 📚 Fichiers existants (non modifiés)

- `/i18n/config.ts` - Configuration des locales (déjà bon)
- `/i18n/request.ts` - Configuration des requêtes (déjà bon)
- `/messages/fr.json` et `/messages/en.json` - Traductions (complétées)

---

## Workflow utilisateur

### 1. Détection automatique de la langue

Au premier chargement, le système détecte la langue depuis :

1. Cookie `NEXT_LOCALE` (si présent)
2. Base de données (si utilisateur connecté)
3. Header `Accept-Language` (navigateur)
4. Défaut : Français

### 2. Changement de langue

L'utilisateur peut changer de langue via le `LanguageSwitcher` dans le menu utilisateur :

1. Clic sur le sélecteur de langue
2. Sélection de la langue
3. Mise à jour automatique :
   - Base de données (si connecté)
   - Cookie `NEXT_LOCALE`
   - Rafraîchissement de la page avec la nouvelle locale

### 3. Persistance

La langue choisie est persistée dans :

- Base de données (`user.language`)
- Cookie (`NEXT_LOCALE`, durée : 1 an)

---

## Pour les développeurs

### Utilisation dans un composant

```tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("myNamespace");
  return <h1>{t("title")}</h1>;
}
```

### Ajouter une traduction

1. Ajoutez dans `messages/fr.json` :

```json
{
  "myFeature": {
    "title": "Mon titre"
  }
}
```

2. Ajoutez dans `messages/en.json` :

```json
{
  "myFeature": {
    "title": "My title"
  }
}
```

### Navigation avec locale

```tsx
import { Link } from "@/i18n/routing";

<Link href="/dashboard/patients">Patients</Link>;
// Auto : /dashboard/patients (FR) ou /en/dashboard/patients (EN)
```

### Changer la locale programmatiquement

```tsx
import { useLocale } from "@/components/providers/LocaleProvider";

const { locale, setLocale } = useLocale();
await setLocale("en");
```

---

## Documentation

- **Guide complet** : `/docs/I18N_CONFIGURATION.md`
- **Guide rapide** : `/docs/I18N_QUICK_START.md`
- **Ce résumé** : `/I18N_SUMMARY.md`

---

## Checklist de vérification

- [x] Configuration des locales (fr, en)
- [x] Stratégie prefix-except-default
- [x] Middleware pour gérer les routes publiques vs privées
- [x] LocaleProvider pour synchroniser avec la DB
- [x] LanguageSwitcher intégré dans l'UI
- [x] Traductions des composants existants
- [x] Documentation complète
- [x] Persistance dans la DB et cookie

---

## Next steps (optionnel)

Si besoin d'ajouter d'autres langues :

1. Ajouter la locale dans `/i18n/config.ts`
2. Créer `/messages/{locale}.json`
3. Ajouter dans `localeNames` de `/i18n/config.ts`
4. Mettre à jour le type `LocaleType` dans `/app/actions/locale.ts`

---

**Date de configuration** : 2025-11-23
**Configuré par** : Claude Code
**Statut** : Production-ready ✅
