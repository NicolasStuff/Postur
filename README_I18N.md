# 🌍 Configuration i18n Complète - TheraFlow/Postur

## ✅ Statut: **Configuration terminée et fonctionnelle**

---

## 📋 Résumé

L'application TheraFlow/Postur dispose maintenant d'un système d'internationalisation complet avec:

- ✅ Support **Français (fr)** et **Anglais (en)**
- ✅ Langue par défaut: **Français**
- ✅ **Persistance en base de données** pour les utilisateurs connectés
- ✅ **Détection automatique** de la langue du navigateur
- ✅ Composant **LanguageSwitcher** prêt à l'emploi

---

## 🗂️ Fichiers créés

| Fichier | Description |
|---------|-------------|
| `/middleware.ts` | Middleware next-intl avec gestion cookie + DB |
| `/app/actions/locale.ts` | Actions serveur (updateUserLocale, getUserLocale) |
| `/app/api/user/profile/route.ts` | API endpoint pour récupérer le profil utilisateur |
| `/lib/hooks/useUserLocale.ts` | Hook client pour la locale utilisateur |
| `/components/LanguageSwitcher.tsx` | **Composant dropdown** pour changer de langue |

## 📝 Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `/app/layout.tsx` | Ajout de NextIntlClientProvider |
| `/i18n/request.ts` | Intégration de getUserLocale() |
| `/messages/fr.json` | Ajout traductions (languageChanged, languageChangeFailed) |
| `/messages/en.json` | Ajout traductions (languageChanged, languageChangeFailed) |

## 📚 Documentation créée

| Fichier | Contenu |
|---------|---------|
| `I18N_SETUP.md` | 📖 Documentation technique complète |
| `I18N_SUMMARY.md` | 📝 Résumé et guide rapide |
| `INTEGRATION_EXAMPLE.md` | 💡 Exemples d'intégration du composant |
| `I18N_FILES.txt` | 📂 Liste de tous les fichiers i18n |
| `CHECKLIST_I18N.md` | ✅ Checklist de vérification |
| `README_I18N.md` | 🌍 Ce fichier - Vue d'ensemble |

---

## 🚀 Démarrage rapide

### 1️⃣ Intégrer le LanguageSwitcher

Le moyen le plus simple est de l'ajouter dans le menu utilisateur (NavUser):

```tsx
// Dans /components/nav-user.tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Dans le DropdownMenuContent
<DropdownMenuGroup>
  <div className="px-2 py-1.5">
    <LanguageSwitcher showLabel />
  </div>
</DropdownMenuGroup>
```

Voir `INTEGRATION_EXAMPLE.md` pour plus d'exemples.

### 2️⃣ Utiliser les traductions

```tsx
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common')
  return <h1>{t('welcome')}</h1>
}
```

### 3️⃣ Tester

```bash
npm run dev
# Ouvrir http://localhost:3000
# Changer la langue via le LanguageSwitcher
# Vérifier que l'interface se met à jour
```

---

## 🔄 Fonctionnement

### Pour les visiteurs non connectés

```
1. Première visite → Détection depuis navigateur (Accept-Language)
2. Changement de langue → Sauvegarde dans cookie (NEXT_LOCALE)
3. Visites suivantes → Lecture du cookie
```

### Pour les utilisateurs connectés

```
1. Connexion → Lecture de User.language depuis la DB
2. Changement de langue → Mise à jour en DB + cookie
3. Sessions suivantes → Toujours depuis la DB (persiste entre appareils)
```

### Ordre de priorité

```
1. Base de données (User.language) - si connecté
   ↓
2. Cookie (NEXT_LOCALE) - si défini
   ↓
3. Navigateur (Accept-Language) - détection auto
   ↓
4. Défaut - Français (fr)
```

---

## 🎨 Variantes du LanguageSwitcher

### Icône seule (compact)
```tsx
<LanguageSwitcher />
```

### Avec label
```tsx
<LanguageSwitcher showLabel />
```

### Variant outline
```tsx
<LanguageSwitcher variant="outline" showLabel />
```

---

## 🗺️ Structure des traductions

```
/messages
  ├── fr.json   ← Traductions françaises
  └── en.json   ← Traductions anglaises
```

### Format

```json
{
  "common": {
    "welcome": "Bienvenue",
    "loading": "Chargement...",
    "languageChanged": "Langue modifiée avec succès"
  }
}
```

---

## ✅ Checklist d'intégration

- [ ] Lire `I18N_SUMMARY.md` pour comprendre le système
- [ ] Intégrer `LanguageSwitcher` dans NavUser ou Sidebar (voir `INTEGRATION_EXAMPLE.md`)
- [ ] Tester en tant que visiteur non connecté
- [ ] Tester en tant qu'utilisateur connecté
- [ ] Vérifier la persistance (rafraîchir la page)
- [ ] Vérifier que le cookie `NEXT_LOCALE` est défini
- [ ] Traduire les textes en dur restants dans l'application

---

## 🧪 Tests recommandés

### Test 1: Visiteur
1. Ouvrir en navigation privée
2. Changer la langue
3. Rafraîchir → doit persister

### Test 2: Utilisateur connecté
1. Se connecter
2. Changer la langue
3. Se déconnecter et reconnecter → doit persister

### Test 3: Multi-appareils
1. Changer la langue sur appareil A
2. Se connecter sur appareil B → doit être synchronisé

---

## 🛠️ Commandes utiles

```bash
# Lancer le serveur de développement
npm run dev

# Vérifier la base de données
npx prisma studio

# Build de production
npm run build

# Valider le schéma Prisma
npx prisma validate
```

---

## 📖 Où trouver quoi?

| Je veux... | Consulter... |
|------------|--------------|
| Comprendre l'architecture | `I18N_SETUP.md` |
| Guide rapide d'utilisation | `I18N_SUMMARY.md` |
| Exemples d'intégration | `INTEGRATION_EXAMPLE.md` |
| Liste de tous les fichiers | `I18N_FILES.txt` |
| Vérifier ce qui est fait | `CHECKLIST_I18N.md` |
| Vue d'ensemble rapide | `README_I18N.md` (ce fichier) |

---

## 🆘 Besoin d'aide?

### La langue ne change pas
1. Vérifier la console navigateur (erreurs?)
2. Vérifier que `router.refresh()` est appelé
3. Vérifier que le cookie `NEXT_LOCALE` est défini
4. Redémarrer le serveur de dev

### Traductions manquantes
1. Vérifier que la clé existe dans `/messages/{locale}.json`
2. Vérifier l'orthographe de la clé
3. Vérifier le namespace: `useTranslations('namespace')`

### Plus d'aide
Consulter la section **Dépannage** dans `I18N_SETUP.md`

---

## 🎯 Prochaines étapes suggérées

1. **Intégrer le LanguageSwitcher** dans votre UI (NavUser recommandé)
2. **Tester** les différents scénarios (visiteur, utilisateur connecté)
3. **Traduire** les textes en dur qui restent dans l'application
4. **Ajouter d'autres langues** si nécessaire (modifier `/i18n/config.ts`)

---

## 🎉 Félicitations!

Votre application TheraFlow/Postur dispose maintenant d'un système i18n professionnel, moderne et scalable!

**Documentation complète:** `I18N_SETUP.md`  
**Guide d'intégration:** `INTEGRATION_EXAMPLE.md`  
**Checklist:** `CHECKLIST_I18N.md`

---

**🌍 Support multilingue: ✅ Français | ✅ English**
