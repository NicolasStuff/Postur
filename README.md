# Postur

Postur est une application SaaS de gestion de cabinet pour ostéopathes. Le produit combine agenda, réservation en ligne, fiches patients, consultation avec body chart interactif, facturation, abonnements Stripe et fonctions IA encadrées.

## Aperçu

Fonctionnalités principales :

- authentification praticien via Better Auth
- onboarding cabinet avec slug public de réservation
- agenda hebdomadaire, exceptions de planning et gestion des prestations
- page de réservation publique `/<slug>`
- gestion des patients et historique de consultations
- consultation ostéopathique avec body chart, timeline de traumatismes et notes enrichies
- facturation avec génération de PDF et préparation Factur-X
- abonnements `Pro` et `Pro + IA` via Stripe
- support temps réel côté utilisateur et administration
- interface bilingue `fr` / `en`

Fonctions IA optionnelles :

- suggestions de notes cliniques
- génération de brouillon SOAP
- compte-rendu patient
- transcription audio de consultation

Ces fonctions s'appuient sur OpenAI et Deepgram et doivent rester alignées avec le cadre décrit dans la documentation conformité.

## Stack technique

- Next.js 15, React 19, TypeScript
- App Router, Server Actions, route handlers
- Prisma 7 + PostgreSQL
- Better Auth
- Tailwind CSS 4, Radix UI, shadcn/ui
- Stripe, Resend, OpenAI, Deepgram
- `next-intl` pour l'i18n

## Démarrage rapide

Prérequis :

- Node.js et npm
- PostgreSQL local, ou Docker pour lancer une base

Installation locale recommandée :

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

L'application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

Notes :

- `docker-compose.yml` permet aussi de lancer une stack conteneurisée.
- Un endpoint de health check est exposé sur `/api/health`.
- Un script SQL de bootstrap admin est disponible dans `scripts/sql/create_admin_account.sql`.

## Variables d'environnement

Copier `.env.example` vers `.env.local`, puis compléter au minimum :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | Secret Better Auth |
| `BETTER_AUTH_URL` | URL de base utilisée par l'authentification |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application |

Variables optionnelles selon les modules activés :

| Groupe | Variables |
| --- | --- |
| IA | `OPENAI_API_KEY`, `OPENAI_MODEL_MINI`, `OPENAI_MODEL_FULL`, `DEEPGRAM_API_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_IA_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID` |
| Email / support | `RESEND_API_KEY`, `SUPPORT_NOTIFICATION_EMAIL`, `EMAIL_FROM` |
| Tracking / consentement | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_AXEPTIO_CLIENT_ID`, `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION`, `NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR`, `NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR` |
| Sécurité | `TRUSTED_ORIGINS` |

Valeurs par défaut côté IA :

- `OPENAI_MODEL_MINI` : `gpt-5-mini`
- `OPENAI_MODEL_FULL` : `gpt-5.4`

## Scripts utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarre l'application buildée |
| `npm run lint` | Exécute ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint simples |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Pousse le schéma Prisma vers la base |
| `npm run db:migrate` | Applique les migrations en environnement local |
| `npm run db:migrate:deploy` | Applique les migrations en environnement déployé |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npm run docker:build` | Build l'image Docker |
| `npm run docker:up` | Lance la stack Docker |
| `npm run docker:down` | Arrête la stack Docker |
| `npm run docker:logs` | Affiche les logs du conteneur applicatif |
| `npm run docker:restart` | Redémarre le conteneur applicatif |

## Structure du dépôt

| Chemin | Contenu |
| --- | --- |
| `app/` | pages Next.js, layouts, API routes, server actions |
| `components/` | UI, dashboard, consultation, billing, booking, support |
| `lib/` | logique métier, auth, billing, IA, notifications, support |
| `prisma/` | schéma Prisma et migrations |
| `messages/` | traductions `fr` / `en` |
| `docs/` | documentation produit, i18n et conformité |
| `public/` | assets statiques et captures marketing |

## Documentation associée

- `DEPLOYMENT.md` : déploiement Docker et Fly.io
- `docs/compliance/health-rgpd-hds-facturx-execution-runbook.md` : trajectoire RGPD santé, HDS, IA clinique et Factur-X
- `docs/compliance/google-ads-axeptio-launch-runbook.md` : cadrage tracking et consentement
- `docs/I18N_QUICK_START.md` et `docs/I18N_CONFIGURATION.md` : internationalisation
- `messages/README.md` : conventions de traduction

## Conformité et prudence

Le dépôt contient des fondations techniques et de la documentation d'exécution pour la conformité santé, HDS, IA clinique et Factur-X. En revanche, le code seul ne suffit pas à revendiquer une conformité complète en production : l'infrastructure, les contrats fournisseurs, la gouvernance et les validations documentaires restent déterminants.
