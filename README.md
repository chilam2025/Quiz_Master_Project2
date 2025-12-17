Quiz Master - Full Stack Application
A modern quiz platform with frontend-backend integration, PostgreSQL persistence, and JWT-authenticated quiz flow.

🎯 Quick Links
Quick Start: See QUICK_START.md for 3-minute setup
Full Setup: See SETUP.md for detailed instructions
Architecture: See INTEGRATION_SUMMARY.md for technical details

✨ Features
Core Functionality
✅ Browse Quizzes - View available quizzes by title/description
✅ Pick Difficulty - Select Very Easy / Easy / Medium / Hard per quiz
✅ Take Quizzes - Answer questions with inline navigation
✅ Submit & Score - Get results and confetti on success
✅ History - Review past attempts and percentages
✅ Prediction - See predicted performance and recommendations

Storage & Persistence
✅ PostgreSQL Database - Primary persistent storage
✅ JWT-Protected API - Authenticated quiz access
✅ Session-aware Attempts - Attempts tied to user and difficulty

User Experience
✅ Inline Difficulty - Choose difficulty directly on the quiz card
✅ Notifications - Loading/error states for fetch/submit
✅ Responsive Design - Works on desktop and mobile

🏗️ Architecture
Frontend (React)
    ↓ HTTP REST API
Backend (Python Flask)
    ↓ SQL Queries
Database (PostgreSQL)

Tech Stack
Frontend: React + Framer Motion
Backend: Python Flask
Database: PostgreSQL
API: RESTful JSON API with JWT/CORS support

📁 Project Structure
quiz_master_project2/
├── frontend/
│   └── quiz-frontend/
│       ├── public/               # CRA public assets
│       └── src/
│           ├── pages/            # Auth, QuizList, QuizPage, Results, History, Prediction, Roles, Admin
│           └── services/         # API client
│
├── backend/
│   └── server.py                 # Flask REST API + PostgreSQL models
│
├── README.md                     # This file
├── QUICK_START.md                # 3-minute setup guide
├── SETUP.md                      # Detailed setup
└── INTEGRATION_SUMMARY.md        # Technical architecture

🚀 Quick Start
Prerequisites
- Python 3.8+
- PostgreSQL 13+
- Node.js 16+ / npm

3-Minute Setup
1) Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL env var if not using default
python server.py

2) Frontend
cd frontend/quiz-frontend
npm install
npm start

3) Open Browser
http://localhost:3000

🔌 Key API Endpoints (illustrative)
POST   /login                    # Obtain JWT
POST   /register                 # Create user
GET    /quizzes                  # List quizzes
POST   /quizzes/{id}/start       # Begin attempt (with difficulty)
GET    /quizzes/{id}/questions/random/{difficulty}  # Fetch ordered questions
POST   /quizzes/{id}/submit      # Submit answers and score
GET    /users/{id}/attempts      # History
GET    /predict?user_id=...      # Prediction data

🛠️ Troubleshooting

Backend Not Connecting
```
Check:
1. PostgreSQL is running
2. Database URL in env matches an existing DB
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
3. Difficulty matches allowed values (Very Easy/Easy/Medium/Hard)
4. Look for errors in backend terminal
```

See SETUP.md for more troubleshooting.

🎓 Learning Outcomes
✅ Frontend-Backend Communication - HTTP REST API  
✅ Asynchronous JavaScript - Async/Await pattern  
✅ Database Design - SQL schema and queries  
✅ API Design - RESTful principles  
✅ Error Handling - User-friendly errors  
✅ Fallback Strategies - (adaptable, session-aware attempts)  
✅ Data Conversion - UI ↔ Database mapping  
✅ CORS Configuration - Cross-origin requests  
✅ Security - JWT auth, validation  
✅ User Experience - Notifications, feedback  

📝 File Descriptions
Frontend (quiz-frontend)
- src/pages/AuthPage.js - Login/register UI
- src/pages/QuizList.js - Browse quizzes, pick difficulty
- src/pages/QuizPage.js - Take quiz and submit answers
- src/pages/ResultsPage.js - Show score and next actions
- src/pages/HistoryPage.js - Attempts history
- src/pages/Prediction.js - Predicted performance view
- src/pages/RolesPage.js - Role selection
- src/pages/AdminDashboard.js - Admin placeholder actions
- src/services/api.js - API client/base URL

Backend
- backend/server.py - Flask server with REST API endpoints, models, JWT auth
- requirements.txt - Python dependencies

Documentation
- README.md - Overview and quick reference
- QUICK_START.md - Rapid setup guide
- SETUP.md - Detailed installation and configuration
- INTEGRATION_SUMMARY.md - Technical architecture details

🚦 Next Steps
1. Setup - Follow QUICK_START.md  
2. Test - Run through quiz start → submit → results → history  
3. Explore - Check prediction view  
4. Extend - Add more quizzes/questions  
5. Deploy - Follow production notes in SETUP.md  

📚 Resources
- Flask Documentation
- PostgreSQL Documentation
- MDN Web Docs - Fetch/Await
- REST API Best Practices
- JWT Auth Concepts

🎯 Future Enhancements
- [ ] Timer per quiz/difficulty
- [ ] Question explanations on results
- [ ] Category filters on quiz list
- [ ] Admin CRUD for quizzes/questions
- [ ] Rich analytics (per-topic insights)
- [ ] Dark mode toggle
- [ ] Advanced search and filtering

📄 License
Internal/educational use.

👨‍💻 Version History
**v1.0** - December 2025
- Core quiz flow, history, prediction, JWT backend, PostgreSQL persistence, and documentation.

💡 Key Concepts Explained
How Data Persists
1. User logs in and gets JWT
2. User starts quiz (attempt created server-side)
3. Questions fetched for the chosen difficulty
4. Answers submitted → scored → stored in DB
5. History/Prediction fetch from DB

API Communication
Frontend          Backend        Database
  ↓ POST            ↓             ↓
 "Start quiz" → Record attempt → Save
  ↑ JSON            ↑
 Questions  ← Ordered list  ←

🤝 Support
For issues:
1. Check browser console (F12)
2. Check backend terminal for errors
3. Read SETUP.md troubleshooting section
4. Verify PostgreSQL is running

📊 Stats
- Lines of Code: substantial React + Flask + SQL
- API Endpoints: quizzes, attempts, submit, history, prediction, auth
- Database Tables: quizzes, questions, attempts, users
- Features: quiz flow, difficulty, history, prediction, auth

Ready to start? Head over to QUICK_START.md! 🚀

Last Updated: December 2025
