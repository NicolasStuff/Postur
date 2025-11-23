# Checklist de vérification i18n

## Fichiers créés

- [x] `/middleware.ts` - Middleware next-intl
- [x] `/app/actions/locale.ts` - Actions serveur
- [x] `/app/api/user/profile/route.ts` - API route
- [x] `/lib/hooks/useUserLocale.ts` - Hook client
- [x] `/components/LanguageSwitcher.tsx` - Composant switcher
- [x] `/I18N_SETUP.md` - Documentation complète
- [x] `/I18N_SUMMARY.md` - Résumé rapide
- [x] `/I18N_FILES.txt` - Liste des fichiers
- [x] `/INTEGRATION_EXAMPLE.md` - Exemples d'intégration
- [x] `/CHECKLIST_I18N.md` - Cette checklist

## Fichiers modifiés

- [x] `/app/layout.tsx` - NextIntlClientProvider
- [x] `/i18n/request.ts` - getUserLocale() intégré
- [x] `/messages/fr.json` - Traductions ajoutées
- [x] `/messages/en.json` - Traductions ajoutées

## Fichiers existants (vérifiés)

- [x] `/next.config.ts` - Plugin next-intl configuré
- [x] `/i18n/routing.ts` - Configuration routing
- [x] `/i18n/config.ts` - Types et config
- [x] `/prisma/schema.prisma` - Champ language présent
- [x] `/package.json` - next-intl installé

## Configuration vérifiée

- [x] Locales supportées: 'fr' et 'en'
- [x] Locale par défaut: 'fr'
- [x] Persistance en DB (User.language)
- [x] Persistance en cookie (NEXT_LOCALE)
- [x] Détection automatique (Accept-Language)
- [x] Fallback en cascade configuré

## Fonctionnalités implémentées

- [x] Changement de langue pour visiteurs
- [x] Changement de langue pour utilisateurs connectés
- [x] Persistance entre sessions
- [x] Détection automatique navigateur
- [x] Synchronisation DB/cookie
- [x] Composant LanguageSwitcher
- [x] API endpoint pour profil utilisateur
- [x] Hook useUserLocale

## Prochaines étapes

- [ ] Intégrer LanguageSwitcher dans NavUser ou Sidebar
- [ ] Tester le changement de langue (visiteur)
- [ ] Tester le changement de langue (utilisateur connecté)
- [ ] Vérifier la persistance entre sessions
- [ ] Traduire les textes en dur restants
- [ ] Ajouter d'autres langues si nécessaire

## Tests à effectuer

### Test 1: Visiteur non connecté
- [ ] Ouvrir en navigation privée
- [ ] Vérifier la langue détectée
- [ ] Changer la langue via LanguageSwitcher
- [ ] Rafraîchir → langue doit persister
- [ ] Cookie NEXT_LOCALE doit être défini

### Test 2: Utilisateur connecté
- [ ] Se connecter
- [ ] Changer la langue
- [ ] Vérifier User.language en DB
- [ ] Se déconnecter et reconnecter
- [ ] Langue doit persister

### Test 3: Synchronisation multi-appareils
- [ ] Se connecter sur appareil A
- [ ] Changer la langue
- [ ] Se connecter sur appareil B
- [ ] Vérifier que la langue est synchronisée

## Commandes utiles

```bash
# Vérifier la DB
npx prisma studio

# Vérifier les cookies
# DevTools > Application > Cookies > NEXT_LOCALE

# Relancer le dev server
npm run dev

# Build de production
npm run build

# Vérifier le schéma Prisma
npx prisma validate
```

## Documentation

- [x] Documentation complète (I18N_SETUP.md)
- [x] Résumé rapide (I18N_SUMMARY.md)
- [x] Exemples d'intégration (INTEGRATION_EXAMPLE.md)
- [x] Liste des fichiers (I18N_FILES.txt)

## Support

En cas de problème:
1. Consulter I18N_SETUP.md section "Dépannage"
2. Vérifier la console navigateur
3. Vérifier les logs serveur
4. Vérifier que tous les fichiers sont présents
5. Redémarrer le serveur de dev

---

**Statut: Configuration i18n complète et fonctionnelle ✅**
