# Guide de Déploiement TheraFlow

Ce guide explique comment déployer TheraFlow avec Docker et Fly.io, incluant la configuration CI/CD.

## 📋 Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé localement
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installé
- Un compte [Fly.io](https://fly.io/app/sign-up)
- Un dépôt GitHub avec accès aux GitHub Actions

## 🐳 Développement Local avec Docker

### Option 1 : Docker Compose (Recommandé pour le développement)

1. **Créer un fichier `.env.local`** :
```bash
DATABASE_URL=postgresql://theraflow:theraflow_dev_password@localhost:5432/theraflow_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

2. **Démarrer les services** :
```bash
docker-compose up -d
```

3. **Vérifier le statut** :
```bash
docker-compose ps
```

4. **Voir les logs** :
```bash
docker-compose logs -f app
```

5. **Arrêter les services** :
```bash
docker-compose down
```

### Option 2 : Docker uniquement

```bash
# Build l'image
docker build -t theraflow .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e BETTER_AUTH_SECRET="your-secret" \
  theraflow
```

## 🚀 Déploiement sur Fly.io

### 1. Configuration initiale

1. **Se connecter à Fly.io** :
```bash
flyctl auth login
```

2. **Créer une nouvelle application** :
```bash
flyctl apps create theraflow
# Ou utilisez le nom dans fly.toml
```

3. **Créer la base de données PostgreSQL** :
```bash
# Créer une instance Postgres
flyctl postgres create --name theraflow-db --region cdg

# Attacher la base de données à l'application
flyctl postgres attach theraflow-db --app theraflow
```

Cela va automatiquement créer la variable d'environnement `DATABASE_URL`.

### 2. Configurer les secrets

```bash
# Better Auth secret (générer une chaîne aléatoire sécurisée)
flyctl secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32) --app theraflow

# URL de l'application
flyctl secrets set BETTER_AUTH_URL=https://theraflow.fly.dev --app theraflow

# Autres variables selon vos besoins
flyctl secrets set NEXT_PUBLIC_APP_URL=https://theraflow.fly.dev --app theraflow
```

### 3. Vérifier la configuration

```bash
# Voir les secrets configurés (valeurs masquées)
flyctl secrets list --app theraflow

# Voir les variables d'environnement
flyctl config show --app theraflow
```

### 4. Premier déploiement

```bash
# Déployer l'application
flyctl deploy

# Vérifier le statut
flyctl status

# Voir les logs
flyctl logs
```

### 5. Ouvrir l'application

```bash
flyctl open
```

## 🔄 CI/CD avec GitHub Actions

### Configuration

1. **Obtenir le token Fly.io** :
```bash
flyctl auth token
```

2. **Ajouter le secret dans GitHub** :
   - Allez dans votre dépôt GitHub
   - Settings → Secrets and variables → Actions
   - Créez un nouveau secret : `FLY_API_TOKEN`
   - Collez le token obtenu

3. **Le workflow se déclenche automatiquement** :
   - Sur chaque push vers `main` : déploiement automatique
   - Sur chaque pull request : tests uniquement

### Workflow

Le fichier `.github/workflows/deploy.yml` configure :
- ✅ Installation des dépendances
- ✅ Génération du client Prisma
- ✅ Linting
- ✅ Build de l'application
- ✅ Déploiement automatique sur Fly.io (branche main)

## 🗄️ Gestion de la Base de Données

### Migrations Prisma

Les migrations sont automatiquement exécutées au démarrage grâce à :
- Dans le Dockerfile : `CMD` qui exécute `prisma migrate deploy`
- Dans fly.toml : `release_command = "npx prisma migrate deploy"`

### Créer une nouvelle migration

En local :
```bash
npx prisma migrate dev --name ma-nouvelle-migration
```

Puis commitez les fichiers de migration et pushez. Le déploiement appliquera automatiquement les migrations.

### Accéder à la base de données

```bash
# Se connecter à la base de données
flyctl postgres connect -a theraflow-db

# Ou créer un proxy local
flyctl proxy 5432 -a theraflow-db
# Puis connectez-vous avec votre client SQL préféré sur localhost:5432
```

### Studio Prisma en production

```bash
# Créer un proxy vers la base de données
flyctl proxy 5432 -a theraflow-db

# Dans un autre terminal, avec DATABASE_URL pointant vers localhost:5432
npx prisma studio
```

## 📊 Monitoring et Logs

### Logs en temps réel

```bash
flyctl logs -a theraflow
```

### Métriques

```bash
flyctl metrics -a theraflow
```

### Health Check

L'application expose un endpoint de health check :
```bash
curl https://theraflow.fly.dev/api/health
```

## 🔧 Commandes Utiles

### Redémarrer l'application

```bash
flyctl apps restart theraflow
```

### Scaler l'application

```bash
# Augmenter la mémoire
flyctl scale memory 2048 --app theraflow

# Augmenter le nombre d'instances
flyctl scale count 2 --app theraflow
```

### SSH dans le conteneur

```bash
flyctl ssh console -a theraflow
```

### Détruire l'application (⚠️ Attention)

```bash
flyctl apps destroy theraflow
```

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez les logs :
```bash
flyctl logs -a theraflow
```

2. Vérifiez que DATABASE_URL est bien configurée :
```bash
flyctl secrets list -a theraflow
```

3. Vérifiez que les migrations sont à jour :
```bash
flyctl ssh console -a theraflow
# Dans le conteneur :
npx prisma migrate status
```

### Erreur de connexion à la base de données

1. Vérifiez que la base de données est attachée :
```bash
flyctl postgres list
flyctl status -a theraflow-db
```

2. Testez la connexion :
```bash
flyctl postgres connect -a theraflow-db
```

### Build Docker échoue localement

1. Nettoyez le cache Docker :
```bash
docker system prune -a
```

2. Rebuild sans cache :
```bash
docker build --no-cache -t theraflow .
```

## 📚 Ressources

- [Documentation Fly.io](https://fly.io/docs/)
- [Documentation Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation Docker](https://docs.docker.com/)

## 🔐 Sécurité

⚠️ **Important** :
- Ne committez JAMAIS vos fichiers `.env` ou secrets
- Utilisez toujours `flyctl secrets` pour les données sensibles
- Changez régulièrement vos secrets (BETTER_AUTH_SECRET, etc.)
- Activez l'authentification à deux facteurs sur Fly.io
- Revoyez régulièrement les logs pour détecter des activités suspectes
