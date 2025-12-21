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
- [Deployment URLs](#deployment-urls)
- [AI/ML Component](#aiml-component)
- [Key API Endpoints](#key-api-endpoints)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Modules Explanations](#modules-explanations)
  - [Module 1: Quiz Manager](#module-1-quiz-manager)
  - [Module 2: Results Tracker](#module-2-results-tracker)
  - [Module 3: Performance Predictor](#module-3-performance-predictor)
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

Deployment URLs
---------------
- **Frontend (Render):** https://quiz-master-project2-frontend.onrender.com
- **Backend (Render):** https://quiz-master-backend.onrender.com (configure `DATABASE_URL` and `QUIZ_SECRET` via Render dashboard)

AI/ML Component
---------------
- **Model:** Lightweight linear regression (slope + intercept) trained per user per quiz on past attempt percentages.
- **Dataset:** User’s submitted attempts stored in `QuizAttempt` (train/test split performed on the fly in `/predict`).
- **Metrics:** Reports training/test MAE and RMSE plus dataset sample counts inside `/predict` response.
- **Integration:** `GET /predict` endpoint returns next-score forecast, recommended difficulty, goal estimation, and streak/confidence insights for the UI.
- **Synthetic data helper:** `POST /module3/generate_synthetic` produces optional in-memory attempts to experiment with the model.  

Key API Endpoints
-----------------
- `POST /login` and `POST /register`
- `GET /quizzes`
- `POST /quizzes/{id}/start`
- `GET /quizzes/{id}/questions/random/{difficulty}`
- `POST /quizzes/{id}/submit`
- `POST /results` (save a submitted attempt)
- `GET /results` (list submitted attempts; optional `quiz_id` filter)
- `GET /results/stats` (aggregate averages/best/latest)
- `GET /users/{id}/attempts` (legacy per-user history already powering the existing results UI)
- `GET /predict?user_id=...&quiz_id=...&goal=...`

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

API Documentation
-----------------

### Authentication
- **POST `/auth/google`** – Send a Google `id_token`; the backend verifies it, creates/links the user, and returns the app JWT (`token`) plus `user_id` and `email`.

### Quiz Management
- **POST `/quizzes`** – Create a quiz with `title` and optional `description`; returns `quiz_id`.
- **POST `/quizzes/<quiz_id>/questions`** – Add a single question with `question`, `options` (list), and `correct_answer` (index).
- **POST `/quizzes/<quiz_id>/questions/bulk`** – Add multiple questions at once; each entry needs `question_text`, `options`, `correct_answer`, and optional `difficulty` (`Very Easy`/`Easy`/`Medium`/`Hard`).
- **PUT `/quizzes/<quiz_id>`** – Update quiz `title` and/or `description`.
- **DELETE `/quizzes/<quiz_id>`** – Delete a quiz and its questions.

### Taking Quizzes *(requires `Authorization: Bearer <token>` where noted)*
- **POST `/quizzes/<quiz_id>/start`** *(auth)* – Start or resume an attempt at a chosen `difficulty` (`Very Easy`/`Easy`/`Medium`/`Hard`); returns `attempt_id` and `total_questions` with question order fixed.
- **GET `/quizzes`** – List available quizzes (non-synthetic) with question counts.
- **GET `/quizzes/<quiz_id>`** – Get quiz details with all questions and options (questions are shuffled).
- **GET `/quizzes/<quiz_id>/questions/random/<difficulty>`** *(auth)* – For an active attempt, return the stored randomized question list for the selected difficulty.
- **GET `/quizzes/<quiz_id>/attempts/<attempt_id>/question/<index>`** *(auth)* – Retrieve one question by index from an in-progress attempt (useful for paginated UIs).

### Submitting Attempts & Results *(auth)*
- **POST `/quizzes/<quiz_id>/submit`** – Grade the current attempt using provided `answers` array, update score/percentage/duration, mark it `submitted`, and return per-question correctness.
- **POST `/results`** – Save a completed attempt directly with `quiz_id`, `score`, `total_questions`, optional `question_order`, `answers_detail`, and `duration_seconds`; computes percentage and returns stored data.
- **GET `/results`** – List submitted attempts for the authenticated user; optional `quiz_id` query filters the list.
- **GET `/results/stats`** – Aggregate stats (attempt count, average/best/latest percentages, totals correct/questions) for the authenticated user, optionally filtered by `quiz_id`.
- **GET `/users/<user_id>/attempts`** – List submitted attempts for a specific user (must match the token user) with score, percentage, duration, and answer details.

### Performance Tools *(auth)*
- **POST `/module3/generate_synthetic`** – Generate synthetic attempt data (not saved to the DB) for ML experiments. Accepts parameters like `n`, `base`, `trend`, `noise`, `pattern`, `total_questions`, and optional `quiz_id`; returns the CSV path and samples.
- **GET `/predict`** – Predict the user’s next score for a quiz using past submitted attempts; requires `user_id` and `quiz_id` query params (optional `goal`). Returns history, regression metrics, predicted percentage/score, difficulty recommendation, and goal progress.

### Leaderboards *(auth)*
- **GET `/leaderboard/weekly`** – Weekly leaderboard (top 10) based on weighted percentages adjusted by difficulty and timing; only users with at least 3 attempts (including Medium/Hard) that week are eligible. Returns the week range and ranked entries with badges.

Modules Explanations
--------------------

Quick navigation:
- [Module 1: Quiz Manager](#module-1-quiz-manager)
- [Module 2: Results Tracker](#module-2-results-tracker)
- [Module 3: Performance Predictor](#module-3-performance-predictor)
  
<a id="module-1-quiz-manager"></a>
# Module 1: Quiz Manager
This module covers quiz creation, delivery, and submission for the QuizMaster platform.

## Responsibilities
- Manage quiz metadata (title, description).
- Serve randomized question sets by difficulty per quiz.
- Handle quiz lifecycle: start attempt, fetch questions, submit answers.
- Secure endpoints with JWT authentication for attempt workflows.

## Key Backend Touchpoints
- `GET /quizzes` — list all quizzes for selection.
- `POST /quizzes/<quiz_id>/start` — create or resume an in-progress attempt for the authenticated user.
- `GET /quizzes/<quiz_id>/questions/random/<difficulty>` — retrieve a randomized set of questions for the chosen difficulty.
- `POST /quizzes/<quiz_id>/submit` — grade answers, persist attempt results, and return per-question feedback.
- `POST /quizzes/<quiz_id>/questions/bulk` — seed/update quiz questions in bulk with difficulty metadata.

## Frontend Pages
- Quiz list and difficulty picker.
- Quiz-taking experience (one question at a time) with JWT token attached on API calls.
- Submission confirmation with score/percentage feedback.

## Files to Explore
- Backend: `backend/server.py` (quiz endpoints & models).
- Frontend: `frontend/quiz-frontend/src/pages` and `frontend/quiz-frontend/src/services/api.js`.

<a id="module-2-results-tracker"></a>
# Module 2: Results Tracker

Tracks user attempts, surfaces historical performance, and provides aggregated statistics per quiz and user.

## Responsibilities
- Persist quiz results for each authenticated user.
- Expose history APIs for frontend charts and history tables.
- Provide summary statistics (averages, best scores, totals) per user and per quiz.

## Key Backend Touchpoints
- `POST /results` — save a submitted quiz result (score, totals, duration, answers detail).
- `GET /results` — fetch the authenticated user’s submitted attempts (optionally filtered by `quiz_id`).
- `GET /results/stats` — return aggregate metrics (attempt count, averages, best score, latest attempt) for the user, with optional `quiz_id` filtering.
- `GET /users/{id}/attempts` — legacy history endpoint already used by the UI to render attempt lists; `/results` simply standardizes the payload and filtering.

## Frontend Pages
- Results history list with timestamps and percentages.
- Score trend charts (per quiz or overall) built from `/results` data.
- Summary cards showing averages and best attempts from `/results/stats`.

## Files to Explore
- Backend: `backend/server.py` (results endpoints built on the `QuizAttempt` model).
- Frontend: history/results pages in `frontend/quiz-frontend/src/pages` using `services/api.js`.

<a id="module-3-performance-predictor"></a>
# Module 3: Performance Predictor (AI/ML)
Implements the AI component that forecasts a user’s next quiz score and recommends a difficulty level.

## Responsibilities
- Train a lightweight linear regression model on the user’s past quiz percentages.
- Provide prediction and confidence insights via the `/predict` API.
- Supply goal tracking, streak calculation, and category insights for the UI.
- Generate synthetic attempt data for experimentation via `/module3/generate_synthetic`.

## Key Backend Touchpoints
- `GET /predict?user_id=<id>&quiz_id=<id>&goal=<optional>` — returns predicted percentage, recommended difficulty, goal estimation, and dataset metrics.
- `POST /module3/generate_synthetic` — creates synthetic attempts in-memory to feed the model.

## Frontend Pages
- Performance dashboard showing predicted next score and recommended difficulty.
- Trend chart for historical attempts and goal progress.

## Files to Explore
- Backend: `backend/server.py` (prediction logic based on `QuizAttempt` history).
- Data helpers: look for `calculate_streak_from_attempts`, `confidence_level`, and regression slope/intercept computation in `backend/server.py`.
  
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
