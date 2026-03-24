# Runbook d'exécution — Axeptio + GTM + GA4 + Google Ads pour Postur

## Objectif

Mettre en ligne rapidement une stack d'acquisition compatible avec le code déjà implémenté dans Postur, en respectant les contraintes suivantes :

- `Axeptio` comme CMP
- `Google Consent Mode v2` en `basic mode`
- `GTM + GA4 + Google Ads` uniquement sur les surfaces marketing et acquisition
- aucun script marketing dans l'espace santé authentifié
- pas d'Enhanced Conversions ni de remarketing en semaine 1

Ce document décrit :

1. ce qui est déjà codé dans Postur
2. ce qu'il faut configurer côté Axeptio / Google
3. comment vérifier que tout fonctionne
4. les points à ne pas oublier avant lancement campagne

---

## 1. Ce qui est déjà implémenté dans le code

### 1.1 Surfaces où le tracking est autorisé

Le tracking marketing est chargé uniquement sur :

- le landing public
- les pages d'auth
- l'onboarding
- la page de succès checkout
- les pages légales

Il n'est pas chargé dans :

- `/dashboard`
- `/dashboard/patients`
- `/dashboard/consultation/*`
- `/dashboard/calendar`
- `/dashboard/billing`

Fichiers principaux :

- `components/providers/MarketingTrackingProvider.tsx`
- `app/(landing)/layout.tsx`
- `app/(auth)/layout.tsx`
- `app/onboarding/layout.tsx`
- `app/checkout/layout.tsx`

### 1.2 Variables d'environnement attendues

Le code attend les variables suivantes :

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_AXEPTIO_CLIENT_ID=your_axeptio_client_id
NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION=postur-fr-EU
NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR=google_analytics_4
NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR=google_ads
```

Fichier de référence :

- `.env.example`

### 1.3 Événements marketing déjà émis par le front

Le code pousse déjà ces événements dans `dataLayer` :

- `page_view_public`
- `sign_up_started`
- `sign_up_completed`
- `begin_checkout`
- `trial_started`
- `subscription_purchased`

Où ils partent :

- `sign_up_started` : page `/signin`, clic inscription
- `sign_up_completed` : onboarding après redirection signup réussie
- `begin_checkout` : clic sur le plan dans l'onboarding
- `trial_started` + `subscription_purchased` : page `/checkout/success`
- `page_view_public` : navigation sur surfaces marketing/acquisition

Fichiers utiles :

- `lib/marketing.ts`
- `app/(auth)/signin/page.tsx`
- `app/onboarding/page.tsx`
- `app/checkout/success/page.tsx`

### 1.4 Consent Mode déjà initialisé dans le code

Avant tout consentement, Postur initialise :

```js
ad_storage=denied
ad_user_data=denied
ad_personalization=denied
analytics_storage=denied
```

Ensuite, après interaction Axeptio, le code :

- met à jour les signaux Google Consent Mode
- charge `GTM` seulement si consentement requis accordé

Référence :

- `components/providers/MarketingTrackingProvider.tsx`

---

## 2. Pré-requis avant exécution

Checklist :

- [ ] disposer d'un compte `Axeptio`
- [ ] disposer d'un conteneur `Google Tag Manager`
- [ ] disposer d'une propriété `GA4`
- [ ] disposer d'un compte `Google Ads`
- [ ] avoir accès au projet Postur en production
- [ ] avoir accès aux variables d'environnement de production
- [ ] avoir un domaine de prod définitif

Pré-requis recommandés :

- [ ] Tag Assistant Companion installé dans Chrome
- [ ] accès administrateur GTM / GA4 / Google Ads
- [ ] accès au back-office Axeptio

---

## 3. Étape 1 — Configurer Axeptio

### 3.1 Créer ou ouvrir le projet Axeptio

Dans Axeptio :

1. ouvrir le projet destiné au domaine de production Postur
2. vérifier que le domaine de production est bien autorisé
3. récupérer le `clientId`
4. définir une `cookiesVersion` stable, par exemple :
   - `postur-fr-EU`
   - ou `postur-2026-03`

Ces deux valeurs alimenteront :

- `NEXT_PUBLIC_AXEPTIO_CLIENT_ID`
- `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION`

Important pour Postur :

- l'implémentation actuelle charge déjà le script Axeptio directement dans le front
- il ne faut donc pas installer en plus le template `Axeptio CMP` dans GTM pour cette version
- sinon tu risques un double chargement CMP et des comportements incohérents

### 3.2 Activer le Google Consent Mode v2

Dans le widget Axeptio :

1. ouvrir la configuration du widget
2. activer l'écran dédié `Consent Mode v2`
3. republier le projet

Référence officielle :

- Axeptio explique qu'il faut activer l'écran dédié puis définir les paramètres par défaut côté intégration.  
  Source : [Axeptio - Installation du Google Consent Mode v2](https://support.axeptio.eu/hc/fr/articles/22570846852753-Installation-du-Google-Consent-Mode-v2)

### 3.3 Ajouter les services Google dans le widget

Dans la configuration des services Axeptio :

- ajouter `Google Analytics 4`
- ajouter `Google Ads`

Important :

- le code Postur vérifie le consentement avec `sdk.hasAcceptedVendor(...)`
- il faut donc fournir dans l'environnement le nom technique exact utilisé par Axeptio pour chaque service

Valeurs par défaut prévues dans le repo :

```env
NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR=google_analytics_4
NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR=google_ads
```

À faire :

1. vérifier dans Axeptio le nom technique exact du service GA4
2. vérifier dans Axeptio le nom technique exact du service Google Ads
3. si Axeptio utilise d'autres identifiants, remplacer les deux variables par les valeurs exactes

Règle pratique :

- si tu n'es pas sûr du slug réel, ne mets pas en prod tant que le consentement n'a pas été validé en navigateur

### 3.4 Choisir le mode

Choix retenu pour Postur :

- `Basic mode`

Cela veut dire :

- les tags Google ne doivent pas charger avant consentement
- le comportement attendu dans Postur est déjà aligné avec ça

Référence officielle :

- Axeptio décrit le basic mode comme un mode où les services Google ne doivent être chargés qu'après consentement.  
  Source : [Axeptio - Installation du Google Consent Mode v2](https://support.axeptio.eu/hc/fr/articles/22570846852753-Installation-du-Google-Consent-Mode-v2)

---

## 4. Étape 2 — Configurer les variables de production

Dans ton environnement de production, renseigne :

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_AXEPTIO_CLIENT_ID=...
NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION=...
NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR=...
NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR=...
```

Checklist :

- [ ] `NEXT_PUBLIC_GTM_ID` correspond au conteneur web GTM de prod
- [ ] `NEXT_PUBLIC_AXEPTIO_CLIENT_ID` correspond au projet Axeptio de prod
- [ ] `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION` est la version actuellement publiée
- [ ] les deux variables `VENDOR` correspondent aux identifiants réels Axeptio

Après mise à jour :

- [ ] redéployer Postur

---

## 5. Étape 3 — Configurer GTM

## 5.1 Créer le conteneur

Si le conteneur GTM n'existe pas encore :

1. créer un conteneur `Web`
2. nommer le conteneur `Postur - Prod`
3. copier l'identifiant `GTM-XXXXXXX`
4. le mettre dans `NEXT_PUBLIC_GTM_ID`

### 5.2 Ne pas injecter de `gtag.js` directement

Règle :

- toute la stack Google passe par `GTM`
- ne pas ajouter un script `gtag.js` séparé dans le code ou via un CMS
- ne pas ajouter non plus le template `Axeptio CMP` dans GTM tant que Postur charge Axeptio directement

### 5.3 Créer les triggers custom event

Dans GTM, créer les triggers suivants :

- `CE - page_view_public`
  - type : `Custom Event`
  - event name : `page_view_public`

- `CE - sign_up_started`
  - event name : `sign_up_started`

- `CE - sign_up_completed`
  - event name : `sign_up_completed`

- `CE - begin_checkout`
  - event name : `begin_checkout`

- `CE - trial_started`
  - event name : `trial_started`

- `CE - subscription_purchased`
  - event name : `subscription_purchased`

### 5.4 Créer les variables Data Layer utiles

Dans GTM, créer au minimum :

- `DLV - event`
- `DLV - surface`
- `DLV - path`
- `DLV - location`
- `DLV - method`
- `DLV - plan`

### 5.5 Créer la balise GA4 configuration

Créer une balise :

- type : `Google Analytics: GA4 Configuration`
- measurement ID : ton ID GA4
- trigger : `CE - page_view_public`

Recommandation :

- décocher la collecte automatique inutile si tu veux rester sobre
- ne pas activer des extensions additionnelles tant que la campagne n'en a pas besoin

### 5.6 Créer les balises GA4 event

Créer 5 balises `GA4 Event` :

- `GA4 - sign_up_started`
  - event name : `sign_up_started`
  - trigger : `CE - sign_up_started`

- `GA4 - sign_up_completed`
  - trigger : `CE - sign_up_completed`

- `GA4 - begin_checkout`
  - trigger : `CE - begin_checkout`

- `GA4 - trial_started`
  - trigger : `CE - trial_started`

- `GA4 - subscription_purchased`
  - trigger : `CE - subscription_purchased`

Paramètres d'événement recommandés :

- `plan`
- `location`
- `surface`
- `method`
- `path`

### 5.7 Créer les balises Google Ads conversion

Dans `Google Ads` :

1. aller dans `Objectifs > Conversions`
2. créer les conversions suivantes :
   - `sign_up_completed`
   - `trial_started`
   - `subscription_purchased`

Pour chaque conversion :

- type : `Website`
- catégorie conseillée :
  - `sign_up_completed` → `Sign-up`
  - `trial_started` → `Begin checkout` ou `Subscribe`
  - `subscription_purchased` → `Purchase` ou `Subscribe`

Ensuite dans GTM :

- créer une balise Google Ads conversion pour chaque conversion
- associer la balise au trigger correspondant

Recommandation semaine 1 :

- `sign_up_completed` = conversion secondaire
- `trial_started` = conversion principale si ton essai est l'objectif marketing immédiat
- `subscription_purchased` = conversion principale business, même si le volume est faible au début

### 5.8 Ne pas activer en semaine 1

Ne pas activer tout de suite :

- Enhanced Conversions
- remarketing
- audiences GA4 complexes
- Google Signals
- tags déclenchés sur dashboard ou pages cliniques

---

## 6. Étape 4 — Configurer Google Ads

### 6.1 Créer la campagne

Pour un lancement rapide SaaS :

- type : `Search` ou `Performance Max` léger si tu maîtrises déjà l'écosystème
- objectif : `inscription essai gratuit`

Recommandation pratique :

- commencer avec `Search`
- messages simples
- mots-clés à intention haute

### 6.2 Paramétrage de base conseillé

- ciblage : `France`
- langue : `Français`
- conversions principales :
  - `trial_started`
  - éventuellement `subscription_purchased`
- exclusions :
  - termes étudiants si non cible
  - termes “gratuit sans logiciel”
  - requêtes trop génériques au départ

### 6.3 Ce qu'il faut éviter la première semaine

- lancer des audiences remarketing sans avoir validé le consentement
- optimiser sur trop de conversions à la fois
- mélanger trafic branding et générique sans séparation

---

## 7. Étape 5 — Recette technique

## 7.1 Vérifier qu'aucun tag Google ne part avant consentement

Sur `/` puis `/signin` :

1. ouvrir DevTools
2. filtre réseau sur :
   - `googletagmanager`
   - `google-analytics`
   - `doubleclick`
   - `googleads`
3. charger la page sans interagir avec la CMP

Attendu :

- aucun chargement GTM avant consentement
- aucun hit GA4
- aucun hit Ads

### 7.2 Vérifier le chargement après consentement

1. accepter les services Google dans Axeptio
2. vérifier que `https://www.googletagmanager.com/gtm.js?id=...` se charge
3. naviguer sur la landing

Attendu :

- GTM se charge après consentement
- les événements `page_view_public` apparaissent dans `dataLayer`

### 7.3 Vérifier Consent Mode avec Tag Assistant

Référence officielle :

- Google recommande de vérifier dans Tag Assistant le `default consent` puis les `updates` après interaction utilisateur.  
  Source : [Google - Troubleshoot consent mode with Tag Assistant](https://developers.google.com/tag-platform/security/guides/consent-debugging)

Procédure :

1. ouvrir [Tag Assistant](https://tagassistant.google.com/)
2. lancer une session sur le domaine de prod
3. ouvrir la bannière cookies
4. accepter les services Google

Contrôles :

- vérifier le premier `Consent event`
- vérifier que les paramètres suivants sont bien présents :
  - `ad_storage`
  - `ad_user_data`
  - `ad_personalization`
  - `analytics_storage`

Attendu :

- valeurs par défaut : `denied`
- après consentement : `granted` pour les paramètres concernés

### 7.4 Vérifier les événements business

#### Signup

1. ouvrir `/signin`
2. démarrer une inscription
3. aller jusqu'à l'onboarding

Attendu :

- `sign_up_started`
- puis `sign_up_completed`

#### Checkout

1. sélectionner un plan dans l'onboarding
2. vérifier `begin_checkout`
3. finaliser Stripe en test
4. revenir sur `/checkout/success`

Attendu :

- `trial_started`
- `subscription_purchased`

### 7.5 Vérifier qu'il n'y a rien dans l'espace santé

Ouvrir :

- `/dashboard`
- `/dashboard/patients`
- `/dashboard/consultation/...`

Attendu :

- pas de script `postur-gtm-script`
- pas de requêtes `googletagmanager`
- pas de hits Ads

---

## 8. Étape 6 — Publication GTM / Axeptio / prod

Ordre recommandé :

1. publier la configuration Axeptio
2. mettre à jour les variables d'environnement prod
3. redéployer Postur
4. publier le conteneur GTM
5. faire une recette complète
6. seulement après, activer la campagne Google Ads

---

## 9. Étape 7 — Checklist de lancement campagne

- [ ] variables d'environnement renseignées en prod
- [ ] widget Axeptio publié
- [ ] Consent Mode v2 activé dans Axeptio
- [ ] services `GA4` et `Google Ads` bien présents dans Axeptio
- [ ] GTM publié
- [ ] conversion `sign_up_completed` configurée
- [ ] conversion `trial_started` configurée
- [ ] conversion `subscription_purchased` configurée
- [ ] aucune balise Google avant consentement
- [ ] aucune balise Google dans le dashboard
- [ ] Tag Assistant validé
- [ ] politique cookies relue
- [ ] privacy policy relue
- [ ] campagne Google Ads en pause prête à être lancée

---

## 10. Points encore hors code

Ce repo ne remplace pas ces actions :

- finaliser juridiquement les textes `/legal/*`
- valider les noms exacts de vendors Axeptio
- choisir les conversions principales dans Google Ads
- décider la stratégie d'enchères
- préparer l'hébergement HDS si Postur reste un SaaS santé au sens plein

---

## 11. Références officielles

- Axeptio — Google Consent Mode v2 :  
  [https://support.axeptio.eu/hc/fr/articles/22570846852753-Installation-du-Google-Consent-Mode-v2](https://support.axeptio.eu/hc/fr/articles/22570846852753-Installation-du-Google-Consent-Mode-v2)

- Axeptio — Connexion avec Google Tag Manager :  
  [https://support.axeptio.eu/fr/articles/273991-interface-google-tag-manager/](https://support.axeptio.eu/fr/articles/273991-interface-google-tag-manager/)

- Axeptio — Ordre de chargement du script :  
  [https://support.axeptio.eu/en/articles/273981-embed-the-axeptio-script-on-your-site](https://support.axeptio.eu/en/articles/273981-embed-the-axeptio-script-on-your-site)

- Axeptio — Blocage et logique de consentement :  
  [https://support.axeptio.eu/fr/articles/323889-axeptio-et-le-blocage-des-cookies-qui-fait-quoi](https://support.axeptio.eu/fr/articles/323889-axeptio-et-le-blocage-des-cookies-qui-fait-quoi)

- Google — Vérifier Consent Mode avec Tag Assistant :  
  [https://developers.google.com/tag-platform/security/guides/consent-debugging](https://developers.google.com/tag-platform/security/guides/consent-debugging)

---

## 12. Notes Postur

Le code actuel repose sur le comportement suivant :

- Axeptio initialise le consentement
- Postur charge ensuite GTM uniquement si consentement Google accordé
- les conversions business sont poussées par le front
- l'espace clinique reste isolé de la stack marketing

Si tu changes ce modèle, il faudra réviser :

- `components/providers/MarketingTrackingProvider.tsx`
- `lib/marketing.ts`
- `app/(auth)/signin/page.tsx`
- `app/onboarding/page.tsx`
- `app/checkout/success/page.tsx`
