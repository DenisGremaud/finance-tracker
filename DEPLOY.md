# Déploiement sur Railway

Ce repo est un monorepo avec deux services à déployer séparément (`backend/` et `frontend/`), plus une base PostgreSQL. Railway gère nativement les monorepos via un paramètre "root directory" par service, et propose un déploiement automatique à chaque push sur une branche — c'est ce qu'on utilise ici plutôt qu'un pipeline GitHub Actions dédié au déploiement (plus simple, zéro YAML à maintenir pour ça).

## 1. Créer le projet et la base de données

1. Sur [railway.app](https://railway.app), **New Project** → **Empty Project**.
2. Dans le projet, **+ New** → **Database** → **PostgreSQL**. Railway crée un service `Postgres` avec une variable `DATABASE_URL` que les autres services pourront référencer.

## 2. Service backend (FastAPI)

1. **+ New** → **GitHub Repo** → sélectionner `DenisGremaud/finance-tracker`.
2. Une fois le service créé, aller dans **Settings** :
   - **Root Directory** : `backend`
   - Railway détecte automatiquement `backend/Dockerfile` (confirmé par `backend/railway.json`).
3. Dans **Variables**, ajouter :
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (référence la base créée à l'étape 1)
   - `SECRET_KEY` = une valeur aléatoire longue (ex. générée avec `openssl rand -hex 32`)
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `60`
   - `CORS_ORIGINS` = laisser vide pour l'instant, on le complètera à l'étape 4
4. Dans **Settings → Networking**, cliquer **Generate Domain** pour obtenir une URL publique (ex. `https://finance-backend-production.up.railway.app`). C'est cette URL qui sert de `VITE_API_BASE_URL` pour le frontend.
5. Au déploiement, le `Dockerfile` lance automatiquement `alembic upgrade head` avant `uvicorn` — pas de migration manuelle à faire.

## 3. Service frontend (React/Vite)

1. **+ New** → **GitHub Repo** → même repo `DenisGremaud/finance-tracker` (Railway autorise plusieurs services pointant vers le même repo).
2. **Settings** :
   - **Root Directory** : `frontend`
   - Railway détecte `frontend/Dockerfile`.
3. Dans **Variables**, ajouter :
   - `VITE_API_BASE_URL` = l'URL publique du backend générée à l'étape 2.4 (ex. `https://finance-backend-production.up.railway.app`)

   ⚠️ Vite intègre les variables `VITE_*` **au moment du build**, pas à l'exécution. Le `Dockerfile` du frontend est écrit pour recevoir cette variable comme argument de build (`ARG VITE_API_BASE_URL`) — Railway le fait automatiquement pour les variables de service déclarées.
4. **Settings → Networking** → **Generate Domain** pour obtenir l'URL publique du frontend (ex. `https://finance-app-production.up.railway.app`). C'est cette URL que vous ouvrez sur votre téléphone.

## 3 bis. Activer les emails de réinitialisation de mot de passe (optionnel)

Le parcours « mot de passe oublié » a besoin d'un serveur SMTP pour envoyer le lien. **Tant que `SMTP_HOST` n'est pas renseigné, aucun email ne part** : le lien est seulement écrit dans les logs du backend. Le reste de l'application fonctionne normalement.

Pour l'activer, ajoutez sur le service **backend** :

```
FRONTEND_URL=<URL publique du frontend>
SMTP_HOST=<hôte smtp>
SMTP_PORT=587
SMTP_USER=<identifiant>
SMTP_PASSWORD=<mot de passe / clé API>
SMTP_FROM=Finance Tracker <noreply@votredomaine.com>
```

Quelques options courantes :
- **Resend** — `smtp.resend.com`, port `587`, utilisateur `resend`, mot de passe = votre clé API. Offre gratuite généreuse, et une adresse d'expédition de test utilisable sans vérifier de domaine.
- **Brevo / Mailjet / Postmark** — même principe, ils fournissent hôte, identifiant et clé.
- **Votre boîte mail** (Gmail, Infomaniak…) — possible avec un mot de passe d'application, mais les fournisseurs limitent le volume et classent plus facilement en spam.

`FRONTEND_URL` est important : c'est lui qui construit le lien contenu dans l'email. S'il pointe sur `localhost`, le lien reçu sur votre téléphone ne fonctionnera pas.

## 4. Boucler la config CORS

Une fois l'URL du frontend connue, retourner sur le service **backend** → **Variables** → mettre à jour :

```
CORS_ORIGINS=https://finance-app-production.up.railway.app
```

Railway redéploie automatiquement le service dès qu'une variable change.

## 5. Déploiement automatique sur push

Par défaut, Railway redéploie chaque service automatiquement à chaque push sur la branche connectée (`main` par défaut, réglable dans **Settings → Source** de chaque service). Rien d'autre à configurer : un `git push` sur `main` déclenche le build + déploiement des deux services en parallèle.

Le workflow `.github/workflows/ci.yml` fait tourner les tests backend et le build frontend sur chaque push/PR — utile comme garde-fou (à activer en "required check" sur `main` dans les réglages GitHub du repo si vous voulez bloquer un merge si les tests cassent), mais il ne déclenche pas lui-même le déploiement : c'est Railway qui s'en charge indépendamment.

## 6. Tester depuis le téléphone (PWA)

Une fois les deux services déployés :

1. Ouvrir l'URL du frontend Railway sur le téléphone.
2. **Android/Chrome** : un bandeau "Ajouter à l'écran d'accueil" apparaît, ou via le menu ⋮ → "Installer l'application".
3. **iOS/Safari** : bouton Partager → "Sur l'écran d'accueil".

L'app s'installe alors comme une app native (icône, plein écran, sans barre d'adresse).

## Aller plus loin (optionnel)

Si vous voulez que le déploiement soit conditionné à la réussite des tests CI (plutôt que Railway qui déploie indépendamment dès le push), il faudra désactiver le déploiement auto sur push dans Railway et ajouter un job GitHub Actions qui appelle `railway up` via la [Railway CLI](https://docs.railway.app/guides/cli), authentifié avec un `RAILWAY_TOKEN` stocké en secret GitHub. Pas fait ici par défaut pour garder le setup simple.
