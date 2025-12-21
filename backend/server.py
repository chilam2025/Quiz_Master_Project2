from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from sqlalchemy import not_
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
from dotenv import load_dotenv
from pathlib import Path
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests



ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(ENV_PATH)
load_dotenv(Path(__file__).with_name(".env"))  # loads backend/.env if server.py is in backend/









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
print("DATABASE_URL from env =", os.environ.get("DATABASE_URL"))
print("SQLALCHEMY_DATABASE_URI =", app.config["SQLALCHEMY_DATABASE_URI"])


db = SQLAlchemy(app)

# -------------------------
# Models
# -------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")
    google_sub = db.Column(db.String(255), unique=True, nullable=True)
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
    difficulty=db.Column(db.String(50),nullable=True)
# -------------------------
# Auth endpoints
# -------------------------

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

@app.route("/auth/google", methods=["POST"])
def auth_google():
    """
    Frontend sends:
    { "id_token": "<google id token>" }

    Backend verifies token with Google and returns:
    { token, user_id, email }
    """
    data = request.get_json() or {}
    token_from_client = data.get("id_token")

    if not token_from_client:
        return jsonify({"error": "id_token is required"}), 400

    if not GOOGLE_CLIENT_ID:
        return jsonify({"error": "GOOGLE_CLIENT_ID not set in env"}), 500

    try:
        # Verify token signature + audience + expiry
        idinfo = id_token.verify_oauth2_token(
            token_from_client,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Extract user info
        email = (idinfo.get("email") or "").lower().strip()
        sub = idinfo.get("sub")  # unique google user id
        email_verified = idinfo.get("email_verified", False)

        if not email or not sub:
            return jsonify({"error": "Invalid Google token payload"}), 401

        # (optional) require verified google email
        if not email_verified:
            return jsonify({"error": "Google email not verified"}), 403

    except ValueError as e:
        # Token invalid / expired / wrong audience
        return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401

    # Find user by google_sub OR email
    user = None
    if sub:
        user = User.query.filter_by(google_sub=sub).first()
    if not user:
        user = User.query.filter_by(email=email).first()

    # Create new user if not exists
    if not user:
        user = User(
            email=email,
            google_sub=sub,
            role="user",
        )
        # set a random password hash so DB NOT NULL is satisfied
        random_pw = secrets.token_urlsafe(32)
        user.set_password(random_pw)

        db.session.add(user)
        db.session.commit()
    else:
        # attach google_sub if missing
        if not user.google_sub:
            user.google_sub = sub
            db.session.commit()

    # issue your own JWT (same as your current generate_token)
    jwt_token = generate_token(user.id, hours=12)

    return jsonify({
        "message": "Google login successful",
        "user_id": user.id,
        "email": user.email,
        "token": jwt_token
    }), 200

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

# =====================================================
# Module 1: Quiz Manager (CRUD + taking quizzes)
# =====================================================
# Quiz creation / admin (optional)

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

@app.route("/quizzes/<int:quiz_id>", methods=["DELETE"])
def delete_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted"})


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
        attempt.difficulty=difficulty
        db.session.add(attempt)
        db.session.flush()  # get ID without commit

    else:
        attempt.started_at = datetime.utcnow()
        attempt.duration_seconds = None
        attempt.difficulty=difficulty

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
    attempt.difficulty = difficulty

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
            "difficulty": a.difficulty,
        })
    return jsonify(result)

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



# =====================================================
# Module 2: Results Tracker (attempt storage + stats)
# =====================================================

@app.route("/results", methods=["POST"])
@token_required
def create_result():
    data = request.get_json() or {}
    quiz_id = data.get("quiz_id")
    score = data.get("score")
    total_questions = data.get("total_questions")

    if quiz_id is None or score is None or total_questions is None:
        return jsonify({"error": "quiz_id, score, and total_questions are required"}), 400

    try:
        quiz_id = int(quiz_id)
        score = int(score)
        total_questions = int(total_questions)
    except (TypeError, ValueError):
        return jsonify({"error": "quiz_id, score, and total_questions must be numbers"}), 400

    if total_questions <= 0:
        return jsonify({"error": "total_questions must be greater than zero"}), 400

    question_order = data.get("question_order") or []
    if not isinstance(question_order, list):
        return jsonify({"error": "question_order must be a list"}), 400

    answers_detail = data.get("answers_detail")
    duration_seconds = data.get("duration_seconds")

    percentage = (score / total_questions) * 100
    timestamp = datetime.utcnow()
    difficulty=data.get("difficulty")
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=request.current_user.id,
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        timestamp=timestamp,
        started_at=timestamp - timedelta(seconds=int(duration_seconds)) if duration_seconds else timestamp,
        duration_seconds=int(duration_seconds) if duration_seconds is not None else None,
        question_order=question_order,
        answers_detail=answers_detail,
        status="submitted",
        difficulty=(difficulty.strip().title() if isinstance(difficulty,str) else  None),
    )

    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "percentage": attempt.percentage,
        "timestamp": attempt.timestamp.isoformat(),
        "duration_seconds": attempt.duration_seconds,
        "question_order": attempt.question_order,
        "answers_detail": attempt.answers_detail,
    }), 201


@app.route("/results", methods=["GET"])
@token_required
def list_results():
    """Return submitted attempts for the authenticated user."""
    quiz_id = request.args.get("quiz_id")
    query = QuizAttempt.query.filter_by(user_id=request.current_user.id, status="submitted")

    if quiz_id is not None:
        try:
            quiz_id_int = int(quiz_id)
            query = query.filter_by(quiz_id=quiz_id_int)
        except ValueError:
            return jsonify({"error": "quiz_id must be numeric"}), 400

    attempts = query.order_by(QuizAttempt.timestamp.desc()).all()

    payload = []
    for a in attempts:
        payload.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "score": a.score,
            "total_questions": a.total_questions,
            "percentage": a.percentage,
            "timestamp": a.timestamp.isoformat(),
            "duration_seconds": a.duration_seconds,
            "question_order": a.question_order,
            "answers_detail": a.answers_detail,
        })
    return jsonify(payload)


@app.route("/results/stats", methods=["GET"])
@token_required
def results_stats():
    """Return aggregate stats for the authenticated user (optionally filtered by quiz)."""
    quiz_id = request.args.get("quiz_id")
    query = QuizAttempt.query.filter_by(user_id=request.current_user.id, status="submitted")

    if quiz_id is not None:
        try:
            quiz_id_int = int(quiz_id)
            query = query.filter_by(quiz_id=quiz_id_int)
        except ValueError:
            return jsonify({"error": "quiz_id must be numeric"}), 400

    attempts = query.order_by(QuizAttempt.timestamp.desc()).all()
    if not attempts:
        return jsonify({
            "attempts": 0,
            "average_percentage": None,
            "best_percentage": None,
            "latest_percentage": None,
            "total_correct": 0,
            "total_questions": 0,
        })

    percentages = [a.percentage for a in attempts if a.percentage is not None]
    scores = [a.score for a in attempts if a.score is not None]
    totals = [a.total_questions for a in attempts if a.total_questions is not None]

    average_pct = sum(percentages) / len(percentages) if percentages else None
    best_pct = max(percentages) if percentages else None
    latest_pct = percentages[0] if percentages else None

    return jsonify({
        "attempts": len(attempts),
        "average_percentage": round(average_pct, 2) if average_pct is not None else None,
        "best_percentage": round(best_pct, 2) if best_pct is not None else None,
        "latest_percentage": round(latest_pct, 2) if latest_pct is not None else None,
        "total_correct": sum(scores),
        "total_questions": sum(totals),
    })

# -------------------------
# Module 3: Performance Predictor endpoints
# -------------------------
def create_synthetic_quiz_for_attempt(quiz_title):
    """Create a quiz used for synthetic attempts and return its id."""
    q = Quiz(title=quiz_title, description="Synthetic quiz for testing Module 3")
    db.session.add(q)
    db.session.commit()
    return q.id

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
            "status": "submitted"
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
def difficulty_to_num(d):
    if not d:
        return 3  # default Medium
    d = d.strip().title()
    mapping = {"Very Easy": 1, "Easy": 2, "Medium": 3, "Hard": 4}
    return mapping.get(d, 3)




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
        quiz_id = int(quiz_id)
    except ValueError:
        return jsonify({"error": "invalid user_id or quiz_id"}), 400

    if request.current_user.id != uid:
        return jsonify({"error": "Unauthorized"}), 401

    quiz = Quiz.query.get(quiz_id)
    quiz_title = quiz.title if quiz else f"Quiz #{quiz_id}"
    quiz_description = quiz.description if quiz else ""

    # ✅ IMPORTANT: do NOT filter by difficulty
    attempts = (
        QuizAttempt.query
        .filter_by(user_id=uid, quiz_id=quiz_id, status="submitted")
        .order_by(QuizAttempt.timestamp.asc(),QuizAttempt.id.asc())
        .all()
    )

    attempts_required = 2
    if len(attempts) < attempts_required:
        progress = round((len(attempts) / attempts_required) * 100, 0)
        return jsonify({
            "message": "At least 2 quiz attempts are required for prediction",
            "attempts_found": len(attempts),
            "attempts_required": attempts_required,
            "progress": progress,
            "user_id": uid,
            "quiz_id": quiz_id,
            "quiz": {"id": quiz_id, "title": quiz_title, "description": quiz_description}
        }), 200

    # y = percentage
    y = np.array([float(a.percentage) for a in attempts], dtype=float)

    # x1 = attempt index
    x1 = np.arange(1, len(y) + 1, dtype=float)

    # x2 = difficulty numeric
    x2 = np.array([difficulty_to_num(getattr(a, "difficulty", None)) for a in attempts], dtype=float)

    # Weighted regression to react to recent drops (newest matters more)
    w = np.linspace(0.6, 1.0, len(y))  # older=0.6 newest=1.0
    W = np.diag(w)

    # Design matrix: [1, x1, x2]
    X = np.column_stack([np.ones_like(x1), x1, x2])

    beta, *_ = np.linalg.lstsq(W @ X, W @ y, rcond=None)
    b0, b1, b2 = beta.tolist()

    # Predict next attempt at same difficulty as last attempt
    next_x1 = float(len(y) + 1)
    last_diff_num = float(x2[-1])

    predicted_pct = b0 + b1 * next_x1 + b2 * last_diff_num

    # Fallback for small data (prevents crazy 0%/100% swings with only few attempts)
    if len(y) < 5:
        predicted_pct = float(0.7 * y[-1] + 0.3 * y[-2])

    # clamp to [0, 100]
    predicted_pct = float(max(0.0, min(100.0, predicted_pct)))

    total_questions = int(attempts[-1].total_questions or 0)
    predicted_score = int(round((predicted_pct / 100.0) * total_questions)) if total_questions else None

    # summary
    best_pct = float(np.max(y))
    avg_pct = float(np.mean(y))
    last_pct = float(y[-1])

    conf = confidence_level(len(y), y)
    insight = trend_insight(y)
    streak = calculate_streak_from_attempts(attempts)

    # history includes difficulty (useful for frontend)
    history = [
        {
            "attempt_index": i + 1,
            "percentage": float(att.percentage),
            "difficulty": getattr(att, "difficulty", None),
            "timestamp": att.timestamp.isoformat() if att.timestamp else None,
        }
        for i, att in enumerate(attempts)
    ]

    # goal estimation
    goal_pct = None
    attempts_to_goal = None
    goal_note = None
    if goal is not None:
        try:
            goal_pct = float(goal)
            goal_pct = max(0.0, min(100.0, goal_pct))
            if predicted_pct >= goal_pct:
                attempts_to_goal = 0
                goal_note = "You are already on/above your goal based on the prediction."
            else:
                if b1 > 0:
                    x_goal = (goal_pct - (b0 + b2 * last_diff_num)) / b1
                    attempts_to_goal = max(0, math.ceil(x_goal - len(y)))
                    goal_note = "Estimated using your recent trend (difficulty-aware)."
                else:
                    attempts_to_goal = None
                    goal_note = "Your trend is not increasing yet. More attempts will improve the estimate."
        except ValueError:
            goal_note = "Invalid goal value."

    diff = recommend_difficulty_from_percentage(predicted_pct)

    return jsonify({
        "user_id": uid,
        "quiz_id": quiz_id,
        "quiz": {"id": quiz_id, "title": quiz_title, "description": quiz_description},
        "history": history,

        "summary": {
            "attempts": len(y),
            "best_percentage": round(best_pct, 2),
            "average_percentage": round(avg_pct, 2),
            "last_percentage": round(last_pct, 2)
        },

        "confidence": conf,
        "insight": insight,
        "streak": streak,

        "goal": {
            "target_percentage": round(goal_pct, 2) if goal_pct is not None else None,
            "estimated_attempts_needed": attempts_to_goal,
            "note": goal_note
        },

        "prediction": {
            "next_attempt_index": int(next_x1),
            "predicted_percentage": round(predicted_pct, 2),
            "predicted_score": predicted_score,
            "total_questions": total_questions,
            "based_on_last_difficulty": getattr(attempts[-1], "difficulty", None)
        },

        "recommendation": {
            "next_quiz_difficulty": diff["level"],
            "reason": diff["reason"]
        },

        "attempt_gate": {
            "attempts_found": len(attempts),
            "attempts_required": attempts_required
        }
    }), 200

@app.route("/debug/attempts", methods=["GET"])
@token_required
def debug_attempts():
    uid = int(request.args.get("user_id"))
    quiz_id = int(request.args.get("quiz_id"))

    rows = (
        QuizAttempt.query
        .filter_by(user_id=uid, quiz_id=quiz_id)
        .order_by(QuizAttempt.timestamp.asc())
        .all()
    )

    return jsonify([{
        "id": r.id,
        "quiz_id": r.quiz_id,
        "status": r.status,
        "score": r.score,
        "total_questions": r.total_questions,
        "percentage": r.percentage,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None
    } for r in rows]), 200



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

    DIFF_WEIGHT = {
        "Very Easy": 0.9,
        "Easy": 1.0,
        "Medium": 1.2,
        "Hard": 1.5,
    }

    EXPECTED_SEC_PER_Q = {
        "Very Easy": 25,
        "Easy": 35,
        "Medium": 45,
        "Hard": 60,
    }

    attempts = QuizAttempt.query.filter(
        QuizAttempt.status == "submitted",
        QuizAttempt.timestamp >= start_of_week,
        QuizAttempt.timestamp < end_of_week,
    ).all()

    user_stats = defaultdict(lambda: {
        "weighted_points_sum": 0.0,
        "weight_sum": 0.0,
        "time_ratios": [],
        "attempts_count": 0,
        "has_medium_or_hard": False,
    })

    # ✅ helper: normalize any weird values into the 4 valid labels
    def norm_diff(raw):
        if raw is None:
            return "Easy"
        s = str(raw).strip().lower()
        s = s.replace("-", " ").replace("_", " ")
        s = " ".join(s.split())  # collapse spaces

        if s in ("very easy", "veryeasy"):
            return "Very Easy"
        if s == "easy":
            return "Easy"
        if s in ("medium", "med"):
            return "Medium"
        if s == "hard":
            return "Hard"
        return "Easy"

    for att in attempts:
        if att.percentage is None:
            continue

        diff = norm_diff(getattr(att, "difficulty", None))

        # ✅ safe lookups (no KeyError)
        w = DIFF_WEIGHT.get(diff, DIFF_WEIGHT["Easy"])

        stats = user_stats[att.user_id]
        stats["attempts_count"] += 1

        stats["weighted_points_sum"] += float(att.percentage) * w
        stats["weight_sum"] += w

        if diff in ("Medium", "Hard"):
            stats["has_medium_or_hard"] = True

        dur = getattr(att, "duration_seconds", None)
        tq = getattr(att, "total_questions", None)

        if dur is not None and tq:
            expected_sec = EXPECTED_SEC_PER_Q.get(diff, EXPECTED_SEC_PER_Q["Easy"])
            expected = expected_sec * int(tq)
            if expected > 0:
                stats["time_ratios"].append(float(dur) / float(expected))

    if not user_stats:
        return jsonify({
            "week_start": start_of_week.isoformat(),
            "week_end": end_of_week.isoformat(),
            "leaders": []
        }), 200

    MIN_ATTEMPTS = 3
    REQUIRE_MEDIUM_OR_HARD = True

    eligible_user_ids = []
    for uid, stats in user_stats.items():
        if stats["attempts_count"] < MIN_ATTEMPTS:
            continue
        if REQUIRE_MEDIUM_OR_HARD and not stats["has_medium_or_hard"]:
            continue
        eligible_user_ids.append(uid)

    if not eligible_user_ids:
        return jsonify({
            "week_start": start_of_week.isoformat(),
            "week_end": end_of_week.isoformat(),
            "leaders": []
        }), 200

    users = User.query.filter(User.id.in_(eligible_user_ids)).all()
    user_map = {u.id: u for u in users}

    leaderboard = []
    for uid in eligible_user_ids:
        stats = user_stats[uid]
        if stats["weight_sum"] <= 0:
            continue

        weighted_score = round(stats["weighted_points_sum"] / stats["weight_sum"], 2)

        avg_time_ratio = None
        if stats["time_ratios"]:
            avg_time_ratio = round(sum(stats["time_ratios"]) / len(stats["time_ratios"]), 3)

        leaderboard.append({
            "user_id": uid,
            "email": user_map.get(uid).email if user_map.get(uid) else "Unknown",
            "weighted_score": weighted_score,
            "avg_time_ratio": avg_time_ratio,
            "attempts_count": stats["attempts_count"],
        })

    leaderboard.sort(key=lambda item: (
        -item["weighted_score"],
        item["avg_time_ratio"] if item["avg_time_ratio"] is not None else float("inf"),
    ))

    for idx, entry in enumerate(leaderboard, start=1):
        entry["rank"] = idx
        entry["badge"] = "gold" if idx == 1 else "silver" if idx == 2 else "bronze" if idx == 3 else None

    return jsonify({
        "week_start": start_of_week.isoformat(),
        "week_end": end_of_week.isoformat(),
        "leaders": leaderboard[:10]
    }), 200





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