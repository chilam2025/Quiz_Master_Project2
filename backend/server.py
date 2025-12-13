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
import uuid
from math import isfinite

# -------------------------
# App & DB setup (SQLite)
# -------------------------
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "quiz.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
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
    role = db.Column(db.String(20), default="user")  # user | admin

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(400))


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    question = db.Column(db.String(1000), nullable=False)
    options = db.Column(db.Text, nullable=False)
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
# JWT Helpers
# -------------------------
def generate_token(user):
    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def token_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth:
            return jsonify({"error": "Token missing"}), 401

        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid auth header"}), 401

        try:
            data = jwt.decode(parts[1], app.config["SECRET_KEY"], algorithms=["HS256"])
            user = User.query.get(data["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 401
            request.current_user = user
            request.current_role = data.get("role", "user")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return wrapped


def admin_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if request.current_role != "admin":
            return jsonify({"error": "Admin access only"}), 403
        return f(*args, **kwargs)
    return wrapped

# -------------------------
# Auth helpers
# -------------------------
def email_domain_exists(email):
    try:
        domain = email.split("@")[1]
        dns.resolver.resolve(domain, "MX")
        return True
    except Exception:
        return False

# -------------------------
# Auth endpoints
# -------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        return jsonify({"error": "Invalid email format"}), 400

    if not email_domain_exists(email):
        return jsonify({"error": "Email domain does not exist"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$", password):
        return jsonify({"error": "Weak password"}), 400

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user)

    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "role": user.role
    }), 200


# -------------------------
# Quiz admin routes
# -------------------------
@app.route("/quizzes", methods=["POST"])
@token_required
@admin_required
def create_quiz():
    data = request.get_json() or {}
    quiz = Quiz(title=data.get("title"), description=data.get("description", ""))
    db.session.add(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz created", "quiz_id": quiz.id}), 201


@app.route("/quizzes/<int:quiz_id>/questions", methods=["POST"])
@token_required
@admin_required
def add_question(quiz_id):
    data = request.get_json()
    q = Question(
        quiz_id=quiz_id,
        question=data["question"],
        options=json.dumps(data["options"]),
        correct_answer=data["correct_answer"]
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({"message": "Question added"}), 201

# -------------------------
# Public quiz routes
# -------------------------
@app.route("/quizzes", methods=["GET"])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "description": q.description} for q in quizzes])


@app.route("/quizzes/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    return jsonify({
        "id": quiz.id,
        "title": quiz.title,
        "questions": [
            {"id": q.id, "question": q.question, "options": json.loads(q.options)}
            for q in questions
        ]
    })

# -------------------------
# Quiz submission
# -------------------------
@app.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
@token_required
def submit_quiz(quiz_id):
    data = request.get_json()
    answers = data.get("answers")

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    if len(answers) != len(questions):
        return jsonify({"error": "Answer all questions"}), 400

    if QuizAttempt.query.filter_by(
        quiz_id=quiz_id, user_id=request.current_user.id
    ).first():
        return jsonify({"error": "Already submitted"}), 400

    score = sum(
        1 for q, a in zip(questions, answers) if int(a) == q.correct_answer
    )

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=request.current_user.id,
        score=score,
        total_questions=len(questions),
        percentage=(score / len(questions)) * 100
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({"score": score, "total": len(questions)})

# -------------------------
# Initialize DB
# -------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database ready")
    app.run(debug=True)
