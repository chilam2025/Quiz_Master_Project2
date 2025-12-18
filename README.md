Quiz Master - Full Stack Application
Modern quiz platform with React + Flask, PostgreSQL persistence, and JWT-authenticated quiz flow.

🎯 Quick Links
- Quick Start: QUICK_START.md
- Full Setup: SETUP.md
- Architecture: INTEGRATION_SUMMARY.md

✨ Features
- Browse quizzes and pick difficulty (Very Easy / Easy / Medium / Hard)
- Take quizzes, submit, and view results with confetti on pass
- Attempts history (scores/percentages) and prediction view
- JWT auth + PostgreSQL persistence; attempts tied to user/difficulty
- Responsive UI with inline difficulty selection on quiz cards

🏗️ Architecture
Frontend: React + Framer Motion → REST API  
Backend: Python Flask → PostgreSQL  
API: RESTful JSON with JWT + CORS

📁 Project Structure
quiz_master_project2/
├── frontend/quiz-frontend/
│   ├── public/                 # CRA assets
│   └── src/
│       ├── pages/              # Auth, QuizList, QuizPage, Results, History, Prediction, Roles, Admin
│       └── services/api.js     # API client/base URL
├── backend/server.py           # Flask REST API + models
├── Dockerfile (backend)        # backend/Dockerfile
├── Dockerfile (frontend)       # frontend/quiz-frontend/Dockerfile
├── README.md
├── QUICK_START.md
├── SETUP.md
└── INTEGRATION_SUMMARY.md

🚀 Quick Start
Prereqs: Python 3.8+, PostgreSQL 13+, Node 16+/npm

Backend
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL if not using default
python server.py
```

Frontend
```
cd frontend/quiz-frontend
npm install
npm start
```

Open http://localhost:3000

🔌 Key API Endpoints (illustrative)
- POST /login | /register
- GET /quizzes
- POST /quizzes/{id}/start
- GET /quizzes/{id}/questions/random/{difficulty}
- POST /quizzes/{id}/submit
- GET /users/{id}/attempts
- GET /predict?user_id=...

🛠️ Troubleshooting

Backend Not Connecting
```
Check:
1. PostgreSQL is running
2. DATABASE_URL points to an existing DB
3. Backend running on port 5000
4. Check browser console (F12) for errors
```

Port Already in Use
```bash
# Change backend port in server.py:
app.run(debug=True, port=5001)

# Or frontend port:
npm start -- --port 3001
```

Database Connection Failed
```
Update DATABASE_URL in your env or server.py:
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Attempts/Questions Not Loading
```
Check:
1. Backend is running
2. Token stored in localStorage
3. Difficulty is one of: Very Easy/Easy/Medium/Hard
4. Look for errors in backend terminal
```

See SETUP.md for more troubleshooting.

🎓 Learning Outcomes
- Frontend-backend communication (HTTP REST)
- Async JavaScript (fetch/await)
- Database design (SQL schema/queries)
- REST API design + JWT auth
- Error handling and UX feedback
- Data mapping (UI ↔ DB)
- CORS configuration

📝 File Descriptions
Frontend (quiz-frontend)
- src/pages/AuthPage.js - Login/register
- src/pages/QuizList.js - Browse quizzes, pick difficulty
- src/pages/QuizPage.js - Take quiz and submit answers
- src/pages/ResultsPage.js - Score/results view
- src/pages/HistoryPage.js - Attempts history
- src/pages/Prediction.js - Predicted performance
- src/pages/RolesPage.js - Role selection
- src/pages/AdminDashboard.js - Admin placeholder actions
- src/services/api.js - API client/base URL

Backend
- backend/server.py - Flask REST API endpoints, models, JWT auth
- requirements.txt - Python dependencies

Documentation
- README.md - Overview
- QUICK_START.md - Rapid setup
- SETUP.md - Detailed install/config
- INTEGRATION_SUMMARY.md - Architecture details

🎯 Future Enhancements
- [ ] Timer per quiz/difficulty
- [ ] Explanations on results
- [ ] Category filters on quiz list
- [ ] Admin CRUD for quizzes/questions
- [ ] Deeper analytics (per-topic insights)
- [ ] Dark mode toggle
- [ ] Advanced search and filtering

💡 Key Concepts Explained
How Data Persists
1) User logs in and gets JWT  
2) User starts quiz (attempt created server-side)  
3) Questions fetched for chosen difficulty  
4) Answers submitted → scored → stored in DB  
5) History/Prediction fetched from DB  

Smart Fallback
```
if (backend available) {
  → Use API → PostgreSQL (permanent)
} else {
  → Show error (no offline localStorage fallback)
}
```

API Communication
```
Frontend          Backend        Database
  ↓ POST            ↓             ↓
 "Start quiz" → Record attempt → Save
  ↑ JSON            ↑
 Questions  ← Ordered list  ←
```

🤝 Support
- Check browser console (F12)
- Check backend terminal for errors
- Read SETUP.md troubleshooting section
- Verify PostgreSQL is running

📊 Stats
- API Endpoints: quizzes, attempts, submit, history, prediction, auth
- Database Tables: quizzes, questions, attempts, users
- Features: quiz flow, difficulty selection, history, prediction, auth

Docker (optional)
- Backend: `docker build -t quiz-backend ./backend`
- Frontend: `docker build -t quiz-frontend ./frontend/quiz-frontend`
- Run containers with your preferred `docker run` or docker-compose setup; map backend port 5000 and frontend port 80 (or remap).

Ready to start? Head over to QUICK_START.md! 🚀

Last Updated: December 2025
