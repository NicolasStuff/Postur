# Dockerfile multi-stage pour Next.js avec Prisma

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copier les fichiers de configuration des dépendances
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copier les dépendances installées
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement nécessaires pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Placeholders pour le build (remplacés par les vrais secrets au runtime)
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
ENV BETTER_AUTH_SECRET="build-placeholder-secret"

# Arguments de build pour les variables publiques (inlinées dans le bundle client)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

ARG NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID}

ARG NEXT_PUBLIC_AXEPTIO_CLIENT_ID
ENV NEXT_PUBLIC_AXEPTIO_CLIENT_ID=${NEXT_PUBLIC_AXEPTIO_CLIENT_ID}

ARG NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION
ENV NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION=${NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION}

ARG NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR
ENV NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR=${NEXT_PUBLIC_AXEPTIO_GOOGLE_ANALYTICS_VENDOR}

ARG NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR
ENV NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR=${NEXT_PUBLIC_AXEPTIO_GOOGLE_ADS_VENDOR}

ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

ARG NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=${NEXT_PUBLIC_STRIPE_PRO_PRICE_ID}

ARG NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID=${NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID}

# Générer le client Prisma
RUN pnpm prisma generate

# Build l'application Next.js
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Installer OpenSSL pour Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier le build standalone (inclut @prisma/client via le trace Next.js)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copier le schéma Prisma pour les migrations (release_command dans fly.toml)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Installer le CLI Prisma pour les migrations (release_command)
RUN npm install --no-save --legacy-peer-deps prisma

# Changer le propriétaire des fichiers
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Démarrage (les migrations sont gérées par le release_command de fly.toml)
CMD ["node", "server.js"]
