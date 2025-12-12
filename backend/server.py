from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import json
import os
from functools import wraps
import re
import dns.resolver
import numpy as np
import math
import random


# -------------------------
# App & DB setup
# -------------------------
app = Flask(__name__)
CORS(app, origins=["https://quiz-master-project2-frontend.onrender.com"])

# Use environment variable if set, otherwise fall back to your PostgreSQL URL
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://quiz_db_14ek_user:V1DJtyn9RYFKN2p6Tx1WcoTSZ4NvDAHH@dpg-d4ti9hbuibrs73ano130-a.oregon-postgres.render.com/quiz_db_14ek"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("QUIZ_SECRET", "supersecretkey123")


db = SQLAlchemy(app)

# -------------------------
# Models
# -------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

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


class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("quiz_id", "user_id", name="unique_user_quiz"),
    )

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
    try:
        domain = email.split("@")[1]
        print(f"Checking MX for domain: {domain}")
        dns.resolver.resolve(domain, "MX")
        return True
    except Exception as e:
        print(f"MX check failed for {domain}: {e}")
        return False

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    # 1. Required fields
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    # 2. Validate format
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Invalid email format"}), 400

    # 3. Check real email domain exists
    if not email_domain_exists(email):
        return jsonify({"error": "Email domain does not exist"}), 400

    # 4. Email already taken?
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    # 5. Strong password validation
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
    if not re.match(password_regex, password):
        return jsonify({
            "error": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
        }), 400

    # 6. Create user
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user_id": user.id,
        "email": user.email
    }), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
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
@app.route("/quizzes", methods=["GET"])
def get_quizzes():
    quizzes = Quiz.query.filter(
        Quiz.title.notlike("%Synthetic%")
    ).all()
    return jsonify([{"id": q.id, "title": q.title, "description": q.description} for q in quizzes])

@app.route("/quizzes/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    questions_list = [{"id": q.id, "question": q.question, "options": json.loads(q.options)} for q in questions]
    return jsonify({"id": quiz.id, "title": quiz.title, "description": quiz.description, "questions": questions_list})

# Single question (index) endpoint - useful for one-question-per-page UI
@app.route("/quizzes/<int:quiz_id>/question/<int:index>", methods=["GET"])
def get_quiz_question(quiz_id, index):
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    if not questions:
        return jsonify({"error": "Quiz not found or has no questions"}), 404
    if index < 0 or index >= len(questions):
        return jsonify({"error": "Question index out of range"}), 400
    q = questions[index]
    return jsonify({"id": q.id, "index": index, "question": q.question, "options": json.loads(q.options), "total_questions": len(questions)})

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
    # load questions in stable order
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    if not questions:
        return jsonify({"error": "Quiz not found or has no questions"}), 404
    if len(submitted_answers) != len(questions):
        return jsonify({"error": "Answer all questions"}), 400
    current_user = request.current_user
    # prevent double submission
    existing = QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=current_user.id).first()
    if existing:
        return jsonify({"error": "You already submitted this quiz"}), 400
    score = 0
    for q, a in zip(questions, submitted_answers):
        try:
            ai = int(a)
        except Exception:
            ai = -1
        if ai == q.correct_answer:
            score += 1
    attempt = QuizAttempt(quiz_id=quiz_id, user_id=current_user.id, score=score, total_questions=len(questions), percentage=(score/len(questions))*100)
    db.session.add(attempt)
    db.session.commit()
    return jsonify({"user_id": current_user.id, "quiz_id": quiz_id, "score": score, "total": len(questions)}), 200

@app.route("/users/<int:user_id>/attempts", methods=["GET"])
@token_required
def get_user_attempts(user_id):
    # ensure token user matches requested user
    if request.current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 401
    attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
    result = []
    for a in attempts:
        total = Question.query.filter_by(quiz_id=a.quiz_id).count()
        result.append({"quiz_id": a.quiz_id, "score": a.score, "total": total, "timestamp": a.timestamp.isoformat()
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

    if not isinstance(data, list):
        return jsonify({"error": "Expected a list of questions"}), 400

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    created = []

    for item in data:
        question_text = item.get("question_text")
        options = item.get("options")
        correct = item.get("correct_answer")

        if not question_text or not options or correct is None:
            return jsonify({"error": "Missing fields in one of the questions"}), 400

        if not isinstance(options, list) or len(options) < 2:
            return jsonify({"error": "Options must be a list with at least 2 items"}), 400

        if correct not in options:
            return jsonify({"error": "correct_answer must be one of the options"}), 400

        correct_index = options.index(correct)

        q = Question(
            quiz_id=quiz_id,
            question=question_text,
            options=json.dumps(options),
            correct_answer=correct_index
        )

        db.session.add(q)
        created.append(question_text)

    db.session.commit()

    return jsonify({
        "message": f"{len(created)} questions added successfully",
        "questions_added": created
    }), 201



# -------------------------
# Module 3: Performance Predictor endpoints
# -------------------------
import uuid
from math import isfinite

def create_synthetic_quiz_for_attempt(quiz_title):
    """Create a quiz used for synthetic attempts and return its id."""
    q = Quiz(title=quiz_title, description="Synthetic quiz for testing Module 3")
    db.session.add(q)
    db.session.commit()
    return q.id

@app.route("/module3/generate_synthetic", methods=["POST"])
@token_required


@token_required
def generate_synthetic():
    """
    Generate synthetic QuizAttempt records for the current user for testing.
    Body JSON (optional):
      {
        "n": 10,
        "base": 60,
        "trend": 1.5,
        "noise": 6,
        "pattern": "linear"   # linear, quadratic, sinusoidal, plateau
      }
    Returns created attempt summaries.
    """
    data = request.get_json() or {}
    n = int(data.get("n", 10))
    base = float(data.get("base", 60.0))
    trend = float(data.get("trend", 1.0))
    noise = float(data.get("noise", 5.0))
    pattern = data.get("pattern", "linear")  # default linear
    current_user = request.current_user

    created = []
    start_time = datetime.utcnow() - timedelta(days=n)

    for i in range(n):
        # create a dedicated synthetic quiz for each attempt
        quiz_title = f"Synthetic Quiz {current_user.id}-{uuid.uuid4().hex[:6]}-{i}"
        quiz_id = create_synthetic_quiz_for_attempt(quiz_title)

        # generate percentage according to pattern
        if pattern == "linear":
            pct = base + trend * i
        elif pattern == "quadratic":
            curvature = data.get("curvature", 0.5)  # default curvature
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
            pct = base + trend * i  # fallback linear

        # add Gaussian noise
        pct += np.random.normal(0, noise)
        pct = max(0.0, min(100.0, pct))  # clamp to [0,100]

        total_q = 17
        score = int(round((pct / 100.0) * total_q))

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=current_user.id,
            score=score,
            total_questions=total_q,
            percentage=float(pct),
            timestamp=(start_time + timedelta(days=i))
        )
        db.session.add(attempt)
        created.append({
            "quiz_id": quiz_id,
            "score": score,
            "percentage": round(pct, 2),
            "timestamp": attempt.timestamp.isoformat()
        })

    db.session.commit()
    return jsonify({"message": f"Created {len(created)} synthetic attempts", "created": created}), 201



def fit_linear_regression(x, y):
    """
    Fit simple linear regression y = a*x + b.
    x, y are 1D numpy arrays (floats). Returns dict with slope, intercept, r2.
    """
    if len(x) < 2:
        return None
    try:
        a, b = np.polyfit(x, y, 1)
        # compute R^2
        y_pred = a * x + b
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0
        return {"slope": float(a), "intercept": float(b), "r2": float(r2)}
    except Exception:
        return None


def difficulty_from_prediction(predicted_pct, slope):
    """
    Map predicted percentage and trend to a recommended difficulty label.
    Logic:
      - If slope positive and predicted high -> recommend harder
      - If slope negative and predicted low -> recommend easier
      - Otherwise map by predicted_pct thresholds.
    Returns label string.
    """
    if predicted_pct is None or not isfinite(predicted_pct):
        return "Unknown"

    if predicted_pct >= 85:
        base = "Hard"
    elif predicted_pct >= 65:
        base = "Medium"
    elif predicted_pct >= 45:
        base = "Easy"
    else:
        base = "Very Easy"

    # adjust based on trend
    if slope is None:
        return base

    if slope > 0.75:
        # improving quickly -> bump up difficulty one level where possible
        if base == "Very Easy":
            return "Easy"
        if base == "Easy":
            return "Medium"
        if base == "Medium":
            return "Hard"
        return base
    elif slope < -0.75:
        # declining -> be more conservative
        if base == "Hard":
            return "Medium"
        if base == "Medium":
            return "Easy"
        if base == "Easy":
            return "Very Easy"
        return base

    return base


def trend_label(slope):
    if slope is None:
        return "insufficient data"
    if slope > 0.5:
        return "improving"
    if slope < -0.5:
        return "declining"
    return "stable"


@app.route("/predict", methods=["GET"])
@token_required
def predict_next_score():
    """
    GET /predict?user_id=<id>
    Returns predicted next percentage, expected score, difficulty recommendation, trend, and model info.
    """
    uid = request.args.get("user_id", None)
    if uid is None:
        return jsonify({"error": "user_id query parameter required"}), 400
    try:
        uid = int(uid)
    except ValueError:
        return jsonify({"error": "invalid user_id"}), 400

    # authorization: token user must match requested user
    if request.current_user.id != uid:
        return jsonify({"error": "Unauthorized - token user mismatch"}), 401

    # Get user's attempts
    attempts = QuizAttempt.query.filter_by(user_id=uid).order_by(QuizAttempt.timestamp.asc()).all()
    if not attempts:
        return jsonify({"error": "No attempts found for user; create synthetic data or take quizzes"}), 404

    # Prepare x, y
    y_user = np.array([float(a.percentage) for a in attempts])
    x_user = np.arange(1, len(y_user) + 1, dtype=float)

    # Fit regression
    model_user = fit_linear_regression(x_user, y_user)
    history = [
        {
            "attempt_index": int(i + 1),
            "percentage": float(round(float(p), 2)),
            "timestamp": attempts[i].timestamp.isoformat()
        } for i, p in enumerate(y_user)
    ]

    if model_user is None:
        return jsonify({
            "history": history,
            "message": "Not enough data to fit a regression (need at least 2 attempts).",
            "prediction": None
        }), 200

    slope = model_user["slope"]
    intercept = model_user["intercept"]
    r2 = model_user.get("r2", 0.0)

    # Predict next attempt
    next_x = float(len(x_user) + 1)
    predicted_pct = slope * next_x + intercept
    predicted_pct = float(max(0.0, min(100.0, predicted_pct)))  # clamp

    # Expected score based on last quiz's total_questions
    total_questions = attempts[-1].total_questions if attempts else 10  # fallback 10
    predicted_score = int(round((predicted_pct / 100.0) * total_questions))

    # Optional: nudge for very new users using all-user slope
    if len(y_user) < 3:
        all_attempts = QuizAttempt.query.order_by(QuizAttempt.timestamp.asc()).all()
        if len(all_attempts) > 1:
            y_all = np.array([a.percentage for a in all_attempts])
            x_all = np.arange(1, len(y_all) + 1, dtype=float)
            model_all = fit_linear_regression(x_all, y_all)
            if model_all is not None:
                predicted_pct += 0.1 * (model_all['slope'] - slope) * next_x
                predicted_pct = float(max(0.0, min(100.0, predicted_pct)))
                predicted_score = int(round((predicted_pct / 100.0) * total_questions))

    rec_difficulty = difficulty_from_prediction(predicted_pct, slope)
    trend = trend_label(slope)

    return jsonify({
        "user_id": uid,
        "prediction": {
            "next_attempt_index": int(next_x),
            "predicted_percentage": round(predicted_pct, 2),
            "predicted_score": predicted_score,
            "total_questions": total_questions
        },
        "recommendation": {
            "difficulty": rec_difficulty,
            "reason": f"based on predicted {round(predicted_pct,2)}% and slope {round(slope,3)}"
        },
        "trend": trend,
        "model": {
            "slope": round(slope, 4),
            "intercept": round(intercept, 4),
            "r2": round(r2, 4)
        },
        "history": history
    }), 200





# -------------------------
# Initialize DB & run
# -------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        quizzes = Quiz.query.all()
        for quiz in quizzes:
            count = Question.query.filter_by(quiz_id=quiz.id).count()
            print(f"Quiz {quiz.id} has {count} questions in the database")
    app.run(debug=True)
