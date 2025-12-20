from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from math import isfinite
import jwt
import json
import os
from functools import wraps
from collections import defaultdict
import re
import dns.resolver
import numpy as np
import math
import random
import uuid
import pandas as pd
import csv
import secrets
import requests






# -------------------------
# App & DB setup
# -------------------------
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://quiz-master-project2-frontend.onrender.com"
])
# Use environment variable if set, otherwise fall back to your PostgreSQL URL
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://quiz_db_14ek_user:V1DJtyn9RYFKN2p6Tx1WcoTSZ4NvDAHH@dpg-d4ti9hbuibrs73ano130-a.oregon-postgres.render.com/quiz_db_14ek?sslmode=require"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("QUIZ_SECRET", "supersecretkey123")


db = SQLAlchemy(app)

# -------------------------
# Models
# -------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")
    #  OTP + verification
    is_verified = db.Column(db.Boolean, default=False)
    otp_hash = db.Column(db.String(255), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_sent_at = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)



class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(400), nullable=True)


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    question = db.Column(db.String(1000), nullable=False)
    options = db.Column(db.Text, nullable=False)  # JSON encoded list
    correct_answer = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(50), nullable=False, default="Medium")



class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    quiz_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=True)
    total_questions = db.Column(db.Integer, nullable=True)
    percentage = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    duration_seconds = db.Column(db.Integer, nullable=True)
    question_order = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), default="in_progress")
    # Stores per-question review details (selected vs correct for each)
    answers_detail = db.Column(db.JSON, nullable=True)
    # Stores per-question review details (question text, selected vs correct)
    answers_detail = db.Column(db.JSON, nullable=True)


#OTP HELPER FUNCTION
OTP_TTL_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 30

def generate_otp_code():
    # 6-digit numeric OTP
    return f"{secrets.randbelow(10**6):06d}"

def set_user_otp(user):
    code = generate_otp_code()
    user.otp_hash = generate_password_hash(code)
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)
    user.otp_sent_at = datetime.utcnow()
    return code

def verify_user_otp(user, code: str) -> bool:
    if not user.otp_hash or not user.otp_expires_at:
        return False
    if datetime.utcnow() > user.otp_expires_at:
        return False
    return check_password_hash(user.otp_hash, code)
#SEND OTP EMAIL
import requests
import os

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "no-reply@yourdomain.com")

def send_otp_email(to_email, code):
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not set")

    r = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Your Quiz OTP Code",
            "html": f"<p>Your OTP code is: <b>{code}</b></p><p>It expires in {OTP_TTL_MINUTES} minutes.</p>",
        },
        timeout=10,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"Email send failed: {r.status_code} {r.text}")


# -------------------------
# Helpers: token generation + decorator
# -------------------------
def generate_token(user_id, hours=12):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=hours)
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    # PyJWT returns bytes on some versions; ensure string
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def token_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth:
            return jsonify({"error": "Token is missing!"}), 401
        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must be: Bearer <token>"}), 401
        token = parts[1]
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            user = User.query.get(data["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 401
            request.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Token is invalid!"}), 401
        return f(*args, **kwargs)
    return wrapped

# -------------------------
# Auth endpoints
# -------------------------
def email_domain_exists(email):
    return True


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Invalid email format"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
    if not re.match(password_regex, password):
        return jsonify({"error": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"}), 400

    user = User(email=email, is_verified=False)
    user.set_password(password)

    # ✅ set OTP
    code = set_user_otp(user)

    db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    # ✅ send email after commit (so user exists)
    try:
        send_otp_email(email, code)
    except Exception as e:
        # optional: you can delete the user if email fails
        return jsonify({"error": f"Failed to send OTP email: {str(e)}"}), 500

    return jsonify({
        "message": "Registration successful. OTP sent to your email.",
        "user_id": user.id,
        "email": user.email,
        "requires_verification": True
    }), 201
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("otp") or "").strip()

    if not email or not code:
        return jsonify({"error": "email and otp required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Already verified"}), 200

    if not verify_user_otp(user, code):
        return jsonify({"error": "Invalid or expired OTP"}), 400

    user.is_verified = True
    user.otp_hash = None
    user.otp_expires_at = None
    user.otp_sent_at = None
    db.session.commit()

    token = generate_token(user.id, hours=12)
    return jsonify({
        "message": "Email verified successfully",
        "user_id": user.id,
        "email": user.email,
        "token": token
    }), 200

@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "email required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Already verified"}), 200

    if user.otp_sent_at:
        elapsed = (datetime.utcnow() - user.otp_sent_at).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            return jsonify({"error": f"Please wait {int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)} seconds before resending"}), 429

    code = set_user_otp(user)
    db.session.commit()

    try:
        send_otp_email(email, code)
    except Exception as e:
        return jsonify({"error": f"Failed to resend OTP: {str(e)}"}), 500

    return jsonify({"message": "OTP resent"}), 200


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.is_verified:
        return jsonify({
            "error": "Email not verified",
            "requires_verification": True,
            "email": user.email
        }), 403

    token = generate_token(user.id, hours=12)
    return jsonify({"message": "Login successful", "user_id": user.id, "email": user.email, "token": token}), 200

# -------------------------
# Quiz creation / admin (optional)
# -------------------------
@app.route("/quizzes", methods=["POST"])
def create_quiz():
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description", "")
    if not title:
        return jsonify({"error": "Quiz title is required"}), 400
    quiz = Quiz(title=title, description=description)
    db.session.add(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz created successfully", "quiz_id": quiz.id}), 201

@app.route("/quizzes/<int:quiz_id>/questions", methods=["POST"])
def add_question(quiz_id):
    data = request.get_json() or {}
    question_text = data.get("question")
    options = data.get("options")
    correct_answer = data.get("correct_answer")
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    if not question_text or options is None or correct_answer is None:
        return jsonify({"error": "Missing fields"}), 400
    if not isinstance(options, list) or len(options) < 2:
        return jsonify({"error": "Options must be a list with at least 2 choices"}), 400
    if not (0 <= correct_answer < len(options)):
        return jsonify({"error": "correct_answer must be a valid index"}), 400
    q = Question(quiz_id=quiz_id, question=question_text, options=json.dumps(options), correct_answer=correct_answer)
    db.session.add(q)
    db.session.commit()
    return jsonify({"message": "Question added successfully", "question_id": q.id}), 201

# -------------------------
# Public read endpoints
# -------------------------


@app.route("/quizzes/<int:quiz_id>/start", methods=["POST"])
@token_required
def start_quiz(quiz_id):
    current_user = request.current_user
    data = request.get_json() or {}

    # Normalize difficulty to match stored values
    difficulty = data.get("difficulty", "Medium").title()
    valid_levels = ["Very Easy", "Easy", "Medium", "Hard"]

    if difficulty not in valid_levels:
        return jsonify({"error": "Invalid difficulty"}), 400

    attempt = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=current_user.id,
        status="in_progress"
    ).first()

    if not attempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=current_user.id,
            question_order=[],
            status="in_progress",
            started_at=datetime.utcnow(),
            duration_seconds=None        )
        db.session.add(attempt)
        db.session.flush()  # get ID without commit

    else:
        attempt.started_at = datetime.utcnow()
        attempt.duration_seconds = None

    questions = Question.query.filter_by(
        quiz_id=quiz_id,
        difficulty=difficulty
    ).all()

    if not questions:
        return jsonify({"error": "No questions available"}), 404

    selected = random.sample(questions, min(20, len(questions)))
    attempt.question_order = [q.id for q in selected]
    attempt.timestamp = datetime.utcnow()
    attempt.started_at = attempt.started_at or datetime.utcnow()

    db.session.commit()

    return jsonify({
        "attempt_id": attempt.id,
        "total_questions": len(selected)
    }), 200



@app.route("/quizzes", methods=["GET"])
def get_quizzes():
    quizzes = Quiz.query.filter(
        Quiz.title.notlike("%Synthetic%")
    ).all()

    result = []

    for q in quizzes:
        question_count = Question.query.filter_by(quiz_id=q.id).count()
        if question_count > 0:
            result.append({
                "id": q.id,
                "title": q.title,
                "description": q.description,
                "total_questions": question_count
            })

    return jsonify(result)


@app.route("/quizzes/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    random.shuffle(questions)  # shuffle questions

    questions_list = [
        {"id": q.id, "question": q.question, "options": json.loads(q.options)}
        for q in questions
    ]

    return jsonify({
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "questions": questions_list
    })

# Single question (index) endpoint - useful for one-question-per-page UI

#Getting the questions by difficulty and randomizes them
from sqlalchemy import not_

@app.route("/quizzes/<int:quiz_id>/questions/random/<difficulty>", methods=["GET"])
@token_required
def get_random_questions(quiz_id, difficulty):
    current_user = request.current_user

    attempt = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=current_user.id,
        status="in_progress"
    ).first()

    if not attempt:
        return jsonify({"error": "No active quiz attempt"}), 400

    if not attempt.question_order:
        return jsonify({"error": "Quiz not initialized"}), 400

    questions = Question.query.filter(
        Question.id.in_(attempt.question_order)
    ).all()

    question_map = {q.id: q for q in questions}

    ordered_questions = [
        question_map[qid]
        for qid in attempt.question_order
        if qid in question_map
    ]

    return jsonify({
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "options": json.loads(q.options)
            }
            for q in ordered_questions
        ]
    }), 200

@app.route(
    "/quizzes/<int:quiz_id>/attempts/<int:attempt_id>/question/<int:index>",
    methods=["GET"]
)
@token_required
def get_attempt_question(quiz_id, attempt_id, index):
    current_user = request.current_user

    attempt = QuizAttempt.query.filter_by(
        id=attempt_id,
        quiz_id=quiz_id,
        user_id=current_user.id
    ).first()

    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404

    if index < 0 or index >= len(attempt.question_order):
        return jsonify({"error": "Question index out of range"}), 400

    question_id = attempt.question_order[index]
    q = Question.query.get_or_404(question_id)

    return jsonify({
        "id": q.id,
        "index": index,
        "question": q.question,
        "options": json.loads(q.options),
        "total_questions": len(attempt.question_order)
    })

# -------------------------
# Submission & attempts (protected)
# -------------------------
@app.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
@token_required
def submit_quiz(quiz_id):
    data = request.get_json() or {}
    submitted_answers = data.get("answers")

    if not isinstance(submitted_answers, list):
        return jsonify({"error": "Answers must be a list"}), 400

    current_user = request.current_user

    # 🔹 Get or create attempt
    attempt = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=current_user.id,
        status="in_progress"
    ).first()

    if not attempt:
        return jsonify({"error": "Quiz not started"}), 400

    if not attempt.question_order:
        return jsonify({"error": "No active quiz attempt"}), 400

    question_ids = attempt.question_order

    questions = Question.query.filter(
        Question.id.in_(question_ids)
    ).all()

    if len(submitted_answers) != len(question_ids):
        return jsonify({"error": "Answer all questions"}), 400

    question_map = {q.id: q for q in questions}

    score = 0
    answers_detail = []
    for qid, ans in zip(question_ids, submitted_answers):
        q = question_map[qid]
        options = json.loads(q.options)
        selected_idx = int(ans)
        correct_idx = q.correct_answer
        is_correct = selected_idx == correct_idx
        if is_correct:
            score += 1
        answers_detail.append({
            "question_id": qid,
            "question": q.question,
            "selected_option": selected_idx,
            "selected_text": options[selected_idx] if 0 <= selected_idx < len(options) else None,
            "correct_option": correct_idx,
            "correct_text": options[correct_idx] if 0 <= correct_idx < len(options) else None,
            "is_correct": is_correct
        })

    attempt.score = score
    attempt.total_questions = len(question_ids)
    attempt.percentage = (score / len(question_ids)) * 100
    attempt.timestamp = datetime.utcnow()
    calculated_duration = int((attempt.timestamp - (attempt.started_at or attempt.timestamp)).total_seconds())
    if calculated_duration < 0:
        calculated_duration = 0

    attempt.duration_seconds = calculated_duration
    attempt.answers_detail = answers_detail

    # ✅ reset AFTER grading
    attempt.status = "submitted"

    db.session.commit()

    return jsonify({
        "user_id": current_user.id,
        "quiz_id": quiz_id,
        "score": score,
        "total": len(question_ids),
        "answers": answers_detail
    }), 200



@app.route("/users/<int:user_id>/attempts", methods=["GET"])
@token_required
def get_user_attempts(user_id):
    # ensure token user matches requested user
    if request.current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 401
    attempts = QuizAttempt.query.filter_by(
        user_id=user_id,
        status="submitted"
    ).all()
    result = []
    for a in attempts:
        result.append({
            "quiz_id": a.quiz_id,
            "score": a.score,
            "total": a.total_questions,
            "percentage": a.percentage,
            "status": a.status,
            "timestamp": a.timestamp.isoformat(),
            "duration_seconds": a.duration_seconds,
            "answers_detail": a.answers_detail,
        })
    return jsonify(result)

@app.route("/quizzes/<int:quiz_id>", methods=["DELETE"])
def delete_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted"})


@app.route("/quizzes/<int:quiz_id>", methods=["PUT"])
def update_quiz(quiz_id):
    data = request.get_json()
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    quiz.title = data.get("title", quiz.title)
    quiz.description = data.get("description", quiz.description)
    db.session.commit()

    return jsonify({"message": "Quiz updated"})


@app.route("/quizzes/<int:quiz_id>/questions/bulk", methods=["POST"])
def add_questions_bulk(quiz_id):
    data = request.get_json()
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    valid_difficulties = ["Very Easy", "Easy", "Medium", "Hard"]
    created = []

    for item in data:
        question_text = item.get("question_text")
        options = item.get("options")
        correct = item.get("correct_answer")
        difficulty = item.get("difficulty", "Medium")

        if not question_text or not options or correct is None:
            return jsonify({"error": "Missing fields"}), 400

        if difficulty not in valid_difficulties:
            return jsonify({"error": f"Invalid difficulty: {difficulty}"}), 400

        correct_index = options.index(correct)

        q = Question(
            quiz_id=quiz_id,
            question=question_text,
            options=json.dumps(options),
            correct_answer=correct_index,
            difficulty=difficulty
        )
        db.session.add(q)
        created.append({"question": question_text, "difficulty": difficulty})

    db.session.commit()
    return jsonify({"message": f"{len(created)} questions added", "questions": created}), 201



# -------------------------
# Module 3: Performance Predictor endpoints
# -------------------------

# Ensure folder exists for CSVs
os.makedirs("ml_datasets", exist_ok=True)

@app.route("/module3/generate_synthetic", methods=["POST"])
@token_required
def generate_synthetic():
    """
    Generate synthetic QuizAttempt records in memory (DB-free) for ML.
    Body JSON (optional):
      {
        "n": 10,
        "base": 60,
        "trend": 1.5,
        "noise": 6,
        "pattern": "linear",   # linear, quadratic, sinusoidal, plateau
        "total_questions": 17,
        "quiz_id": "SYN-xxxxxx"  # optional, if not provided a new one will be generated
      }
    Returns JSON with all columns of QuizAttempt.
    """
    data = request.get_json() or {}
    n = int(data.get("n", 10))
    base = float(data.get("base", 60.0))
    trend = float(data.get("trend", 1.0))
    noise = float(data.get("noise", 5.0))
    pattern = data.get("pattern", "linear")
    total_q = int(data.get("total_questions", 20))
    current_user = request.current_user

    # Use provided quiz_id or generate a new one
    quiz_id_base = data.get("quiz_id")
    if quiz_id_base is None:
        quiz_id_base = f"SYN-{uuid.uuid4().hex[:6]}"

    created = []
    start_time = datetime.utcnow() - timedelta(days=n)

    for i in range(n):
        # Unique attempt ID per quiz
        quiz_id = f"{quiz_id_base}-{i}"

        # Generate percentage according to pattern
        if pattern == "linear":
            pct = base + trend * i
        elif pattern == "quadratic":
            curvature = data.get("curvature", 0.5)
            pct = base + trend * i + curvature * (i ** 2)
        elif pattern == "sinusoidal":
            amplitude = data.get("amplitude", 10.0)
            frequency = data.get("frequency", 0.5)
            pct = base + amplitude * math.sin(frequency * i)
        elif pattern == "plateau":
            growth = data.get("growth", 0.3)
            midpoint = n / 2
            pct = 100 / (1 + math.exp(-growth * (i - midpoint)))
        else:
            pct = base + trend * i

        # Add Gaussian noise
        pct += np.random.normal(0, noise)
        pct = max(0.0, min(100.0, pct))  # clamp to [0,100]
        score = int(round((pct / 100.0) * total_q))

        attempt_data = {
            "id": i + 1,
            "quiz_id": quiz_id,
            "user_id": current_user.id,
            "score": score,
            "total_questions": total_q,
            "percentage": round(pct, 2),
            "timestamp": (start_time + timedelta(days=i)).isoformat(),
            "question_order": list(range(1, total_q + 1)),
            "status": "completed"
        }
        created.append(attempt_data)

    # Save CSV for ML, per user per quiz
    csv_file = f"ml_datasets/user_{current_user.id}_quiz_{quiz_id_base}.csv"
    df = pd.DataFrame(created)
    df.to_csv(csv_file, index=False)

    return jsonify({
        "message": f"Generated {len(created)} synthetic attempts (not saved to DB)",
        "dataset_file": csv_file,
        "samples": len(created),
        "created": created
    }), 200

# -------------------------------
# Linear regression (training)

# -------------------------------
# Linear regression (training)
# -------------------------------
def fit_linear_regression(x, y):
    if len(x) < 2:
        return None
    a, b = np.polyfit(x, y, 1)
    return {"slope": float(a), "intercept": float(b)}

# -------------------------------
# Regression metrics
# -------------------------------
def regression_metrics(y_true, y_pred):
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)
    mse = np.mean((y_true - y_pred) ** 2)
    rmse = np.sqrt(mse)
    mae = np.mean(np.abs(y_true - y_pred))
    return {"mse": round(float(mse), 4), "rmse": round(float(rmse), 4), "mae": round(float(mae), 4)}

# -------------------------------
# Train/test split
# -------------------------------
def train_test_split_time_series(x, y, train_ratio=0.7):
    split_idx = int(len(x) * train_ratio)
    return x[:split_idx], y[:split_idx], x[split_idx:], y[split_idx:]

def recommend_difficulty_from_percentage(pct):
    """
    Convert predicted percentage into quiz difficulty level
    """
    if pct is None:
        return {
            "level": "Easy",
            "reason": "Insufficient historical data"
        }

    if pct >= 85:
        return {
            "level": "Hard",
            "reason": "High predicted mastery"
        }
    elif pct >= 65:
        return {
            "level": "Medium",
            "reason": "Good understanding, moderate challenge recommended"
        }
    elif pct >= 40:
        return {
            "level": "Easy",
            "reason": "Basic understanding, additional practice advised"
        }
    else:
        return {
            "level": "Very Easy",
            "reason": "Low predicted performance, start with fundamentals"
        }

# -------------------------------
# Prediction endpoint (per quiz)
# -------------------------------
# ✅ Add these helper functions somewhere ABOVE /predict (once)

def confidence_level(attempt_count: int, percentages: np.ndarray):
    """
    Returns a confidence label/score based on number of attempts + variability.
    """
    if attempt_count < 2:
        return {"label": "Low", "score": 0.2, "reason": "Need at least 2 attempts"}

    std = float(np.std(percentages)) if attempt_count >= 2 else 0.0

    # base increases with attempts (caps at 0.85)
    base = min(0.85, 0.35 + 0.10 * attempt_count)
    # penalty increases with instability (caps at 0.5)
    penalty = min(0.50, std / 30.0)

    score = max(0.10, min(0.95, base - penalty))

    if score >= 0.75:
        label = "High"
    elif score >= 0.45:
        label = "Medium"
    else:
        label = "Low"

    reason = f"{attempt_count} attempts, variability (std) ≈ {round(std, 2)}"
    return {"label": label, "score": round(score, 2), "reason": reason}


def trend_insight(percentages: np.ndarray):
    """
    Simple 'what this means' insight based on last change.
    """
    if len(percentages) < 2:
        return {"label": "Not enough data", "reason": "Need at least 2 attempts"}

    last = float(percentages[-1])
    prev = float(percentages[-2])
    delta = last - prev

    if delta >= 5:
        return {"label": "Improving", "reason": f"Up by {round(delta, 2)}% from last attempt"}
    elif delta <= -5:
        return {"label": "Dropping", "reason": f"Down by {round(abs(delta), 2)}% from last attempt"}
    else:
        return {"label": "Stable", "reason": "Small change recently"}


def calculate_streak_from_attempts(attempts):
    """
    Counts consecutive-day streak from submitted attempts.
    - multiple attempts same day do not break streak
    """
    if not attempts:
        return 0

    attempts_sorted = sorted(attempts, key=lambda x: x.timestamp, reverse=True)
    streak = 1
    last_date = attempts_sorted[0].timestamp.date()

    for att in attempts_sorted[1:]:
        cur_date = att.timestamp.date()
        day_diff = (last_date - cur_date).days

        if day_diff == 0:
            # same day attempt - ignore
            continue
        if day_diff == 1:
            streak += 1
            last_date = cur_date
            continue

        break

    return streak


# ✅ FULL UPDATED /predict (copy-paste to replace your current predict endpoint)

@app.route("/predict", methods=["GET"])
@token_required
def predict_next_score():
    uid = request.args.get("user_id")
    quiz_id = request.args.get("quiz_id")
    goal = request.args.get("goal")  # optional, e.g. 80

    if uid is None or quiz_id is None:
        return jsonify({"error": "user_id and quiz_id query parameters required"}), 400

    try:
        uid = int(uid)
        quiz_id = int(quiz_id)  # ✅ ensure integer
    except ValueError:
        return jsonify({"error": "invalid user_id or quiz_id"}), 400

    # Authorization: user can only predict themselves
    if request.current_user.id != uid:
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch quiz info for nicer UI
    quiz = Quiz.query.get(quiz_id)
    quiz_title = quiz.title if quiz else f"Quiz #{quiz_id}"
    quiz_description = quiz.description if quiz else ""

    # Get submitted attempts for THIS quiz from DB
    attempts = (
        QuizAttempt.query
        .filter_by(user_id=uid, quiz_id=quiz_id, status="submitted")
        .order_by(QuizAttempt.timestamp.asc())
        .all()
    )

    # Feature #9: attempt requirement progress
    attempts_required = 2
    if len(attempts) < attempts_required:
        progress = round((len(attempts) / attempts_required) * 100, 0) if attempts_required else 0
        return jsonify({
            "message": "At least 2 quiz attempts are required for prediction",
            "attempts_found": len(attempts),
            "attempts_required": attempts_required,
            "progress": progress,

            "user_id": uid,
            "quiz_id": quiz_id,
            "quiz": {
                "id": quiz_id,
                "title": quiz_title,
                "description": quiz_description
            }
        }), 200

    # Build series from DB
    y_all = np.array([float(a.percentage) for a in attempts], dtype=float)
    x_all = np.arange(1, len(y_all) + 1, dtype=float)

    # Summary stats (Feature #8)
    best_pct = float(np.max(y_all))
    avg_pct = float(np.mean(y_all))
    last_pct = float(y_all[-1])

    # Confidence + insight (Features #1, #2)
    conf = confidence_level(len(y_all), y_all)
    insight = trend_insight(y_all)

    # Streak (Feature #5)
    streak = calculate_streak_from_attempts(attempts)

    # Split for metrics (only if >=3)
    if len(x_all) < 3:
        x_train, y_train = x_all, y_all
        x_test, y_test = np.array([]), np.array([])
    else:
        x_train, y_train, x_test, y_test = train_test_split_time_series(
            x_all, y_all, train_ratio=0.7
        )

    model = fit_linear_regression(x_train, y_train)
    if model is None:
        return jsonify({"error": "Model training failed"}), 500

    a, b = model["slope"], model["intercept"]

    # Metrics
    y_train_pred = a * x_train + b
    train_metrics = regression_metrics(y_train, y_train_pred)

    if len(x_test) > 0:
        y_test_pred = a * x_test + b
        test_metrics = regression_metrics(y_test, y_test_pred)
    else:
        test_metrics = None

    # Predict next attempt
    next_x = float(len(x_all) + 1)
    predicted_pct = float(a * next_x + b)
    predicted_pct = max(0.0, min(100.0, predicted_pct))

    total_questions = int(attempts[-1].total_questions or 0)
    predicted_score = (
        int(round((predicted_pct / 100.0) * total_questions))
        if total_questions else None
    )

    # Difficulty recommendation (already in your code)
    diff = recommend_difficulty_from_percentage(predicted_pct)

    # History for chart (frontend)
    history = [
        {
            "attempt_index": i + 1,
            "percentage": float(att.percentage),
            "timestamp": att.timestamp.isoformat()
        }
        for i, att in enumerate(attempts)
    ]

    # Feature #3: goal estimation (optional)
    goal_pct = None
    attempts_to_goal = None
    if goal is not None:
        try:
            goal_pct = float(goal)
            goal_pct = max(0.0, min(100.0, goal_pct))

            # if slope positive, estimate attempts needed
            if a > 0:
                x_goal = (goal_pct - b) / a  # solve a*x + b >= goal
                attempts_to_goal = max(0, math.ceil(x_goal - len(x_all)))
            else:
                attempts_to_goal = None
        except ValueError:
            goal_pct = None
            attempts_to_goal = None
    # Feature #3: goal estimation (improved)
    goal_pct = None
    attempts_to_goal = None
    goal_note = None

    if goal is not None:
        try:
            goal_pct = float(goal)
            goal_pct = max(0.0, min(100.0, goal_pct))

            # if already meeting goal, need 0 attempts
            if predicted_pct >= goal_pct:
                attempts_to_goal = 0
                goal_note = "You are already on/above your goal based on the prediction."
            else:
                # if slope positive, estimate attempts needed
                if a > 0:
                    x_goal = (goal_pct - b) / a  # solve a*x + b >= goal
                    attempts_to_goal = max(0, math.ceil(x_goal - len(x_all)))
                    goal_note = "Estimated using your current improvement trend."
                else:
                    attempts_to_goal = None
                    goal_note = "Your recent trend is not increasing yet. More practice will improve the estimate."
        except ValueError:
            goal_pct = None
            attempts_to_goal = None
            goal_note = "Invalid goal value."

    # Feature #4: next action hint for frontend (button routing)
    next_action = {
        "type": "start_quiz",
        "quiz_id": quiz_id,
        "difficulty": diff["level"],
        "label": f"Start a {diff['level']} quiz now"
    }

    return jsonify({
        "user_id": uid,
        "quiz_id": quiz_id,

        "quiz": {
            "id": quiz_id,
            "title": quiz_title,
            "description": quiz_description
        },

        "history": history,

        "summary": {
            "attempts": len(y_all),
            "best_percentage": round(best_pct, 2),
            "average_percentage": round(avg_pct, 2),
            "last_percentage": round(last_pct, 2)
        },

        "confidence": conf,      # Feature #1
        "insight": insight,      # Feature #2
        "streak": streak,        # Feature #5

        "goal": {
    "target_percentage": round(goal_pct, 2) if goal_pct is not None else None,
    "estimated_attempts_needed": attempts_to_goal,
    "note": goal_note
        },


        "dataset": {
            "total_samples": len(y_all),
            "train_samples": len(y_train),
            "test_samples": len(y_test)
        },

        "training": {
            "model": {
                "slope": round(float(a), 4),
                "intercept": round(float(b), 4)
            },
            "metrics": train_metrics
        },

        "testing": {
            "metrics": test_metrics
        },

        "prediction": {
            "next_attempt_index": int(next_x),
            "predicted_percentage": round(predicted_pct, 2),
            "predicted_score": predicted_score,
            "total_questions": total_questions
        },

        "recommendation": {
            "next_quiz_difficulty": diff["level"],
            "reason": diff["reason"]
        },

        "next_action": next_action,  # Feature #4

        "attempt_gate": {            # Feature #9 (useful even after unlocking)
            "attempts_found": len(attempts),
            "attempts_required": attempts_required
        }
    }), 200



# ===========================================
# AI + USER INSIGHTS MODULE (NEW FEATURES)
# ===========================================




# -------------------------------------------------------
# 1. Weighted Average Prediction
# -------------------------------------------------------
def weighted_average_prediction(scores):
    if len(scores) == 0:
        return None

    weights = np.arange(1, len(scores) + 1)  # 1,2,3...n
    weighted_avg = np.dot(scores, weights) / weights.sum()
    return round(weighted_avg, 2)


# -------------------------------------------------------
# 2. Smart Difficulty Recommendation
# -------------------------------------------------------
def recommend_difficulty(predicted_score):
    if predicted_score is None:
        return "Easy"

    if predicted_score >= 80:
        return "Hard"
    elif predicted_score >= 60:
        return "Medium"
    else:
        return "Easy"


# -------------------------------------------------------
# 3. Personal Learning Style Detection
# -------------------------------------------------------
def detect_learning_style(scores):
    if len(scores) < 3:
        return "Not enough data"

    trend = scores[-1] - scores[-3]

    if trend > 10:
        return "Fast Improver"
    elif trend < -10:
        return "Struggling Recently"
    elif np.std(scores) < 8:
        return "Consistent Learner"
    else:
        return "Inconsistent Learner"


# -------------------------------------------------------
# 4. Weak Topic Analysis
# -------------------------------------------------------
def find_weak_topics(attempts):
    topic_scores = {}

    for att in attempts:
        topic = att.topic
        score = att.score

        if topic not in topic_scores:
            topic_scores[topic] = []
        topic_scores[topic].append(score)

    weak = []
    for t, vals in topic_scores.items():
        avg = sum(vals) / len(vals)
        if avg < 60:
            weak.append({"topic": t, "avg_score": round(avg, 2)})

    return weak


# -------------------------------------------------------
# 5. Adaptive Quiz Generation
# -------------------------------------------------------
def adaptive_quiz_config(difficulty, weak_topics):
    return {
        "difficulty": difficulty,
        "focus_topics": [t["topic"] for t in weak_topics[:2]]  # pick top 2 weak
    }


# -------------------------------------------------------
# 6. Personalized Study Tips
# -------------------------------------------------------
def study_tips(scores, weak_topics):
    tips = []

    if len(scores) >= 2 and scores[-1] < scores[-2]:
        tips.append("Your last score dropped — consider reviewing hard topics.")

    if weak_topics:
        tips.append(f"Practice more: {', '.join([t['topic'] for t in weak_topics])}")

    if len(scores) >= 4 and np.mean(scores[-4:]) >= 80:
        tips.append("Excellent consistency — try challenging quizzes!")

    if not tips:
        tips.append("Keep practicing regularly to improve steadily.")

    return tips


# -------------------------------------------------------
# 7. Anomaly Detection
# -------------------------------------------------------
def detect_anomaly(scores):
    if len(scores) < 3:
        return None

    last = scores[-1]
    avg_prev = np.mean(scores[:-1])

    if last < avg_prev - 20:
        return "Sudden Performance Drop"
    elif last > avg_prev + 20:
        return "Unusual Score Spike"
    return None


# -------------------------------------------------------
# 8. Recommendation Engine
# -------------------------------------------------------
def recommend_quiz(predicted_score, weak_topics):
    if predicted_score is None:
        return {"title": "Beginner Starter Quiz", "reason": "New user"}

    if weak_topics:
        return {
            "title": f"{weak_topics[0]['topic']} Basics",
            "reason": f"You are weak in {weak_topics[0]['topic']}"
        }

    if predicted_score < 60:
        return {"title": "Fundamental Concepts Quiz", "reason": "Improve basics"}

    if predicted_score < 80:
        return {"title": "Intermediate Practice Quiz", "reason": "Match your level"}

    return {"title": "Advanced Challenge Quiz", "reason": "You seem ready!"}


# -------------------------------------------------------
# 9. Streak Tracking System
# -------------------------------------------------------
def calculate_streak(attempts):
    if not attempts:
        return 0

    attempts_sorted = sorted(attempts, key=lambda x: x.timestamp, reverse=True)
    streak = 1
    last_date = attempts_sorted[0].timestamp.date()

    for att in attempts_sorted[1:]:
        cur_date = att.timestamp.date()
        if (last_date - cur_date).days == 1:
            streak += 1
            last_date = cur_date
        else:
            break

    return streak


# -------------------------------------------------------
# 10. Category-Based Score Tracking
# -------------------------------------------------------
def category_performance(attempts):
    categories = {}

    for att in attempts:
        cat = att.topic
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(att.score)

    return {
        cat: round(sum(v) / len(v), 2)
        for cat, v in categories.items()
    }

# -------------------------------------------------------
# Weekly leaderboard (top 10, resets each week)
# -------------------------------------------------------


@app.route("/leaderboard/weekly", methods=["GET"])
@token_required
def weekly_leaderboard():
    now = datetime.utcnow()
    start_date = now.date() - timedelta(days=now.weekday())
    start_of_week = datetime.combine(start_date, datetime.min.time())
    end_of_week = start_of_week + timedelta(days=7)

    attempts = QuizAttempt.query.filter(
        QuizAttempt.status == "submitted",
        QuizAttempt.timestamp >= start_of_week,
        QuizAttempt.timestamp < end_of_week,
    ).all()

    user_stats = defaultdict(lambda: {"percentages": [], "durations": []})

    for att in attempts:
        if att.percentage is None:
            continue
        stats = user_stats[att.user_id]
        stats["percentages"].append(att.percentage)
        if att.duration_seconds is not None:
            stats["durations"].append(att.duration_seconds)

    if not user_stats:
        return jsonify({
            "week_start": start_of_week.isoformat(),
            "week_end": end_of_week.isoformat(),
            "leaders": []
        }), 200

    users = User.query.filter(User.id.in_(user_stats.keys())).all()
    user_map = {u.id: u for u in users}

    leaderboard = []
    for uid, stats in user_stats.items():
        percentages = stats["percentages"]
        durations = stats["durations"]
        avg_pct = round(sum(percentages) / len(percentages), 2)
        avg_duration = None
        if durations:
            avg_duration = int(sum(durations) / len(durations))

        leaderboard.append({
            "user_id": uid,
            "email": user_map.get(uid).email if user_map.get(uid) else "Unknown",
            "average_percentage": avg_pct,
            "average_duration_seconds": avg_duration,
            "attempts_count": len(percentages),
        })

    leaderboard.sort(key=lambda item: (
        -item["average_percentage"],
        item["average_duration_seconds"] if item["average_duration_seconds"] is not None else float("inf"),
    ))

    for idx, entry in enumerate(leaderboard, start=1):
        entry["rank"] = idx
        if idx == 1:
            entry["badge"] = "gold"
        elif idx == 2:
            entry["badge"] = "silver"
        elif idx == 3:
            entry["badge"] = "bronze"
        else:
            entry["badge"] = None

    return jsonify({
        "week_start": start_of_week.isoformat(),
        "week_end": end_of_week.isoformat(),
        "leaders": leaderboard[:10]
    }), 200

# =====================================================
# MAIN ANALYTICS ENDPOINT
# =====================================================

@app.route("/analytics", methods=["GET"])
@token_required
def analytics():
    user = request.current_user
    attempts = QuizAttempt.query.filter_by(user_id=user.id).all()
    scores = [a.score for a in attempts]

    # AI MODULE COMPUTATION
    predicted = weighted_average_prediction(scores)
    difficulty = recommend_difficulty(predicted)
    learning_style = detect_learning_style(scores)
    weak = find_weak_topics(attempts)
    tips = study_tips(scores, weak)
    anomaly = detect_anomaly(scores)
    quiz_rec = recommend_quiz(predicted, weak)
    streak = calculate_streak(attempts)
    category_perf = category_performance(attempts)
    adaptive_config = adaptive_quiz_config(difficulty, weak)

    return jsonify({
        "predicted_score": predicted,
        "difficulty": difficulty,
        "learning_style": learning_style,
        "weak_topics": weak,
        "study_tips": tips,
        "anomaly": anomaly,
        "recommended_quiz": quiz_rec,
        "streak": streak,
        "category_performance": category_perf,
        "adaptive_quiz": adaptive_config
    })


# -------------------------
# Initialize DB & run
# -------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print(f"Using database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    host = os.environ.get("FLASK_RUN_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    print(f"Backend running on http://{host}:{port}")
    # Bind to all interfaces so the container is reachable from other services/host.
    app.run(
        host=host,
        port=port,
        debug=True,
        use_reloader=False,
    )