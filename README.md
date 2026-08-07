# Finance Tracker

Application de suivi de dépenses personnelles : dépenses, catégories, budgets mensuels et statistiques.

## Stack

- **Backend** : FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT (python-jose), bcrypt (passlib)
- **Frontend** : React + TypeScript (Vite), Tailwind CSS, shadcn/ui, react-router-dom

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
- `SECRET_KEY` : clé secrète pour signer les JWT
- `ACCESS_TOKEN_EXPIRE_MINUTES` : durée de validité des tokens
- `CORS_ORIGINS` : origines autorisées (front Vite par défaut)

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
