from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import json
import os
from functools import wraps

# -------------------------
# App & DB setup
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
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registration successful", "user_id": user.id, "email": user.email}), 201

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
    quizzes = Quiz.query.all()
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
        result.append({"quiz_id": a.quiz_id, "score": a.score, "total": total})
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
