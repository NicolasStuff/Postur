# Review Loop Findings — Iteration 1

## Verdict Global : NEEDS_WORK
- **Critiques : 4** | **Majeurs : 47** | **Mineurs : 79**
- 10 reviewers, tous NEEDS_WORK

---

## CRITIQUES (bloquants)

### C1. [i18n] messages/en.json — Section `consultation.naturopath` absente (~130 clés)
Toute navigation vers les fonctionnalités naturopathe en anglais provoquera des clés manquantes.

### C2. [i18n] messages/en.json — Section `consultation.osteopath.bodyParts` absente (~80 clés)
Les labels du body chart seront manquants pour les utilisateurs anglophones.

### C3. [API/BILLING/DB] app/actions/billing.ts:690-713 — `updateInvoiceStatus` sans validation de transitions
Pas de machine à états : PAID→DRAFT, CANCELLED→SENT possibles. Pas de transaction (findFirst+update séparés = race condition TOCTOU). `update` sans filtre `userId` (inconsistant). Audit hors transaction.
*Reporté par : reviewer-api, reviewer-billing, reviewer-db*

### C4. [API] app/api/invoices/[invoiceId]/pdf/route.ts:28-29 — Auth masquée, erreur 500 au lieu de 401
La route ne fait pas de vérification d'auth explicite. L'auth est déléguée à `getInvoiceDetails` mais le catch retourne 500 générique au lieu de 401.

---

## MAJEURS (à corriger) — Dédupliqués

### Sécurité
- **M1.** lib/email.ts:56-57 — Injection HTML/XSS dans templates email (variables interpolées sans échappement)
- **M2.** app/actions/billing.ts:842 — `recipientEmail` non validé dans `sendInvoiceByEmail` (relais de spam potentiel)
- **M3.** middleware.ts:111 — Cookie NEXT_LOCALE sans flag `httpOnly`

### Typage
- **M4.** app/actions/billing.ts:869,902 — `as any` sur composants React PDF
- **M5.** app/api/stripe/webhook/route.ts:126,132,256,279 — Double-casts dangereux contournant les types Stripe SDK
- **M6.** app/api/stripe/webhook/route.ts:163 — Cast `string → "PRO"|"PRO_IA"` sans validation runtime

### API/Actions
- **M7.** app/actions/consultation.ts + billing.ts — Duplication massive ~200 lignes logique facturation (risque divergence numérotation)
- **M8.** app/api/stripe/webhook/route.ts:122 — Retourne `{ received: true }` après épuisement des retries (Stripe ne retente pas)

### Billing
- **M9.** app/dashboard/billing/page.tsx:209 — Stats "Total Revenue" inclut factures DRAFT et CANCELLED

### Consultation/AI
- **M10.** components/consultation/osteopath/AudioSoapModal.tsx:228-248 — Race condition recorder.onstop (setState sur composant unmount)
- **M11.** components/consultation/osteopath/AudioSoapModal.tsx:143-201 — Pas de garde contre appels concurrents à handleTranscribeAudio
- **M12.** components/consultation/osteopath/OsteopathConsultation.tsx:248-256 — Race condition autosave editor vs autosave AI (mêmes debounce 2s)
- **M13.** lib/ai/openai.ts:135 — JSON.parse sans try/catch sur réponse LLM
- **M14.** app/api/consultation/[appointmentId]/ai/audio/route.ts:166 — appointmentId non validé

### Auth/Onboarding
- **M15.** app/(auth)/signin/page.tsx:33 — Redirection post-signin vers /dashboard sans vérifier onboarding complet
- **M16.** app/checkout/success/page.tsx — Aucune protection d'auth, events marketing firés sans contexte
- **M17.** app/(auth)/reset-password/page.tsx:43-52 — setIsLoading(false) jamais appelé en cas de succès
- **M18.** middleware.ts:12-16 — /forgot-password et /reset-password absents de FRENCH_ONLY_ROUTES

### UI/React
- **M19.** components/consultation/shared/ConsultationBillingDialog.tsx:85 — useEffect écrase modifications locales du form à chaque re-render parent
- **M20.** components/consultation/osteopath/OsteopathConsultation.tsx:157 — Flash du dialog consentement AI (hasConsentOverride=false avant query)
- **M21.** components/settings/ProfileSettings.tsx:82-95 — Strings hardcodées en FR/EN au lieu de i18n
- **M22.** components/booking/BookingFlow.tsx:63 — `alert()` au lieu de `toast()` (inconsistance UX)
- **M23.** components/consultation/osteopath/OsteopathConsultation.tsx:248-256 — Double-dependency dans useEffect autosave

### Database
- **M24.** prisma/schema.prisma:249-250 — Index unique redondant sur Invoice.appointmentId (simple + composite)
- **M25.** prisma/migrations — FK Invoice.appointmentId change de SET NULL → RESTRICT silencieusement

### i18n/Config
- **M26.** next.config.ts:10,14 — CSP incompatible avec GTM et Axeptio (scripts bloqués en production)
- **M27.** next.config.ts:10 — CSP autorise 'unsafe-inline' pour script-src en production
- **M28.** lib/i18n/errors.ts:48 vs messages/en.json:877 — Incohérence message `invalidSiret`

### Architecture
- **M29.** app/actions/consultation.ts + billing.ts — Fichiers >900 lignes, responsabilités multiples
- **M30.** components/consultation/osteopath/OsteopathConsultation.tsx — Composant monolithique 554 lignes
- **M31.** app/dashboard/billing/page.tsx — Page "use client" au lieu de Server/Client Component pattern

---

## MINEURS (suggestions, non bloquants) — 79 findings
Voir rapports individuels des reviewers. Non bloquants pour le merge.
