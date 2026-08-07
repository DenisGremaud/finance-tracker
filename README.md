# Finance Tracker

Application de suivi de dépenses personnelles : dépenses, catégories, budgets mensuels et statistiques.

## Stack

- **Backend** : FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT (python-jose), bcrypt (passlib)
- **Frontend** : React + TypeScript (Vite), Tailwind CSS, shadcn/ui, react-router-dom, PWA (installable sur mobile)

## Prérequis

- Python 3.11+
- Node.js 20+
- Docker (pour PostgreSQL) ou une instance PostgreSQL locale

## Démarrage rapide

### 1. Base de données

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

L'API est disponible sur `http://localhost:8000` (docs interactives sur `/docs`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

## Variables d'environnement

**backend/.env**
- `DATABASE_URL` : URL de connexion PostgreSQL
- `SECRET_KEY` : clé secrète pour signer les JWT — **à changer impérativement en production** (ex. `openssl rand -hex 32`), sinon les tokens peuvent être falsifiés
- `ACCESS_TOKEN_EXPIRE_MINUTES` : durée de validité des tokens
- `RESET_TOKEN_EXPIRE_MINUTES` : durée de validité d'un lien de réinitialisation
- `CORS_ORIGINS` : origines autorisées (front Vite par défaut)
- `FRONTEND_URL` : URL publique du frontend, utilisée pour construire le lien de réinitialisation
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS`, `SMTP_FROM` : envoi des emails de réinitialisation. **Si `SMTP_HOST` est vide, aucun email n'est envoyé** : le lien est écrit dans les logs du backend, ce qui permet de tester le parcours en local.

**frontend/.env**
- `VITE_API_BASE_URL` : URL de l'API backend

## Structure du projet

```
finance-tracker/
├── backend/    # API FastAPI (routers, models, schemas, services, tests)
└── frontend/   # App React + Vite (pages, components, api client)
```

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

## Fonctionnalités

- Authentification par email/mot de passe (JWT)
- CRUD des dépenses avec filtres (catégorie, plage de dates)
- Gestion des catégories
- Budgets mensuels par catégorie avec suivi du dépassement
- Tableau de bord avec statistiques et graphiques (dépenses par mois, par catégorie)
- Progressive Web App : installable sur téléphone (Android/iOS) via "Ajouter à l'écran d'accueil"

## Sécurité

- Mots de passe hashés avec bcrypt (jamais stockés en clair)
- Authentification par JWT signé (HS256), vérifié sur chaque route protégée
- Validation du mot de passe côté serveur (min. 8 caractères, au moins une lettre et un chiffre)
- Rate limiting sur `/auth/login` (10/min) et `/auth/register` (5/min) par IP pour limiter le brute-force
- Toutes les requêtes CRUD sont scopées par utilisateur (impossible d'accéder aux données d'un autre compte)
- Headers de sécurité (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) sur toutes les réponses
- Protection XSS/injection SQL native (React échappe le contenu, SQLAlchemy paramètre toutes les requêtes)

⚠️ Non couvert pour l'instant : vérification d'email à l'inscription, révocation de token (un JWT reste valide jusqu'à expiration), 2FA.

## Déploiement

Voir [DEPLOY.md](./DEPLOY.md) pour déployer sur Railway (backend + frontend + PostgreSQL), avec déploiement automatique à chaque push sur `main`.
