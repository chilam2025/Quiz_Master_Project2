Quiz Master
===========

Modern quiz platform with a React frontend and Flask backend backed by PostgreSQL. Users can browse quizzes, pick a difficulty, take timed attempts,see there predicted next scores, view their history with JWT-secured APIs and lastly the toppers will see thereselves in the dashboard. This README walks through features, architecture, and step-by-step setup so new contributors can run the app locally, with Docker, or deploy it to their own host.

Table of Contents
-----------------
- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quickstart (tl;dr)](#quickstart-tldr)
- [Local Development Setup](#local-development-setup)
  - [Backend (Flask)](#backend-flask)
  - [Frontend (React)](#frontend-react)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running with Docker Compose](#running-with-docker-compose)
- [Deployment Guide](#deployment-guide)
- [Key API Endpoints](#key-api-endpoints)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Further Reading](#further-reading)

Features
--------
- Quiz browsing with difficulty selection (Very Easy / Easy / Medium / Hard)
- Authenticated quiz flow: start, answer questions, submit, and view results
- Attempts history with scores and percentages per difficulty
- Prediction view and celebratory confetti on passing scores
- JWT authentication with PostgreSQL persistence for all attempts
- Responsive UI with inline difficulty selection on quiz cards
- Role-aware endpoints to support admin controls and scoreboards
- Docker Compose definitions for consistent frontend/backend startup

System Architecture
-------------------
- **Frontend:** React + Framer Motion, consuming REST endpoints
- **Backend:** Python Flask REST API with JWT auth
- **Database:** PostgreSQL
- **APIs:** JSON over HTTP with CORS enabled

Prerequisites
-------------
- Python **3.8+**
- Node.js **16+** and npm
- PostgreSQL **13+**
- Docker **24+** (optional, for Compose-based setup)
- Git and a shell environment

Quickstart (tl;dr)
------------------
1. Install prerequisites above.
2. Start PostgreSQL and create a database (see [Database Setup](#database-setup)).
3. In one terminal: follow [Backend (Flask)](#backend-flask) to install deps and run `python server.py`.
4. In another terminal: follow [Frontend (React)](#frontend-react) to install deps and run `npm start`.
5. Visit `http://localhost:3000` and register/login to take a quiz.

Local Development Setup
-----------------------

### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set DATABASE_URL if you are not using the default in server.py
export DATABASE_URL="postgresql+psycopg2://quiz_db_14ek_user:V1DJtyn9RYFKN2p6Tx1WcoTSZ4NvDAHH@dpg-d4ti9hbuibrs73ano130-a.oregon-postgres.render.com:5432/quiz_db_14ek?sslmode=require"
export QUIZ_SECRET="supersecretkey123"  # used for JWT signing

# Create tables (run once per database)
python init_db.py

python server.py  # Runs on http://localhost:5000 by default
```

### Frontend (React)
```bash
cd frontend/quiz-frontend
npm install

# (optional) point to a non-default backend
echo "REACT_APP_API_URL=http://localhost:5000" > .env

npm start  # Opens at http://localhost:3000
```

Environment Configuration
-------------------------
The backend reads `DATABASE_URL` (fallback is defined in `server.py`). Ensure your database exists and credentials are correct before starting the server. The default URL points to a hosted instance used for demos—set your own `DATABASE_URL` for local development. `QUIZ_SECRET` overrides the default JWT signing key.

For local development, the frontend expects the backend at `http://localhost:5000`. If you change ports, update the base URL in `frontend/quiz-frontend/src/services/api.js`.

Database Setup
--------------
1. Start PostgreSQL locally (or use a hosted instance).
2. Create a database for the app (example for macOS/Linux):
   ```bash
   createdb quiz_master
   ```
3. Set `DATABASE_URL` to point to the database, e.g.:
   ```bash
   export DATABASE_URL="postgresql://quiz_user:quiz_password@localhost:5432/quiz_master"
   ```
4. Launch `server.py` (or `python init_db.py`) to create tables based on the models.

Running with Docker Compose
---------------------------
```bash
docker compose up --build
```
- Backend exposed on port **5000**
- Frontend exposed on port **3000** (or mapped port defined in compose)
- Provide `DATABASE_URL` and any secrets via an `.env` file loaded by Docker Compose

Deployment Guide
----------------
The stack is deployable on any host that can run Python and Node builds. A common workflow:

1. **Backend build/run**
   - Set environment variables: `DATABASE_URL`, `QUIZ_SECRET`, and optionally `PORT` if you modify `server.py`.
   - Install dependencies: `pip install -r requirements.txt`.
   - Serve with your WSGI server of choice (e.g., `gunicorn wsgi:app`) behind HTTPS.

2. **Frontend build**
   - Set `REACT_APP_API_URL` to your deployed backend URL.
   - Build once and serve the static files from a CDN or your web host: `npm run build` then deploy `build/`.

3. **Docker/Compose**
   - Ensure the Compose file has the correct `DATABASE_URL` (e.g., via an `.env` file next to `docker-compose.yml`).
   - Push images to your registry and `docker compose up -d` on the target host.

Key API Endpoints
-----------------
- `POST /login` and `POST /register`
- `GET /quizzes`
- `POST /quizzes/{id}/start`
- `GET /quizzes/{id}/questions/random/{difficulty}`
- `POST /quizzes/{id}/submit`
- `GET /users/{id}/attempts`
- `GET /predict?user_id=...`

Project Structure
-----------------
```
quiz_master_project2/
├── frontend/quiz-frontend/
│   ├── public/                     # CRA assets
    ├── Dockerfile (frontend)       # frontend/quiz-frontend/Dockerfile           
│   └── src/
│       ├── pages/              # Auth, QuizList, QuizPage, Results, History, Prediction Roles, Admin 
│       └── services/api.js     # API client/base URL
├── backend/
│   ├── server.py               # Flask REST API + models
│   ├── init_db.py              # Creates tables and seeds defaults
│   ├── database_scripts.py     # Migration/utility helpers
│   ├── sqlite_to_pg.py         # SQLite → Postgres transfer script
│   ├── Droptables.py           # Development-only cleanup
│   ├── create_user.py          # Script to create an initial user
│   ├── requirements.txt        # Backend dependencies
│   ├── Dockerfile              # Backend container build
│   ├── wsgi.py                 # WSGI entrypoint
│   └── render.yaml             # Render.com deploy configuration
├── docker-compose.yml          # Orchestrates frontend + backend
├── README.md
├── QUICK_START.md
├── SETUP.md
└── INTEGRATION_SUMMARY.md
```
Troubleshooting
---------------
- **Backend not connecting:** Ensure PostgreSQL is running, `DATABASE_URL` is valid, and backend is on port 5000. Check browser console and backend logs for errors.
- **Port already in use:** Change backend port in `server.py` (e.g., `app.run(..., port=5001)`) or start the frontend with `npm start -- --port 3001`.
- **Database connection failed:** Verify `DATABASE_URL` formatting: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.
- **Attempts/questions not loading:** Confirm backend is running, JWT token exists in `localStorage`, difficulty matches expected values, and check backend terminal for stack traces.

Further Reading
---------------
- **QUICK_START.md:** Rapid setup steps
- **SETUP.md:** Detailed installation, configuration, and troubleshooting
- **INTEGRATION_SUMMARY.md:** Architecture notes and data flow
