from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json
import os

# -------------------------
# Step 1: Create app
# -------------------------
app = Flask(__name__)
CORS(app)

# -------------------------
# Step 2: Configure SQLite
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "quiz.db")
print("Database path:", db_path)

app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------------
# Step 3: Models
# -------------------------
class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500))

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'))
    question = db.Column(db.String(500), nullable=False)
    options = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)   # student unique ID
    name = db.Column(db.String(100))

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer)
    score = db.Column(db.Integer)

    __table_args__ = (
        db.UniqueConstraint('quiz_id', 'user_id', name='unique_user_quiz'),
    )

# -------------------------
# Step 4: Routes
# -------------------------

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user_id = data.get("id")
    name = data.get("name")

    if not user_id or not name:
        return jsonify({"error": "User id and name are required"}), 400

    # Check if user already exists
    existing_user = User.query.get(user_id)
    if existing_user:
        return jsonify({"error": "User with this ID already exists"}), 400

    user = User(id=user_id, name=name)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created successfully", "user_id": user.id}), 201

@app.route('/quizzes', methods=['POST'])
def create_quiz():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")
    if not title:
        return jsonify({"error": "Quiz title is required"}), 400
    quiz = Quiz(title=title, description=description)
    db.session.add(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz created successfully", "quiz_id": quiz.id}), 201

@app.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
def add_question(quiz_id):
    data = request.get_json()
    question_text = data.get("question")
    options = data.get("options")
    correct_answer = data.get("correct_answer")

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    if not question_text or not options or correct_answer is None:
        return jsonify({"error": "Missing fields"}), 400
    if not isinstance(options, list) or len(options) < 2:
        return jsonify({"error": "Options must be a list with at least 2 choices"}), 400
    if correct_answer < 0 or correct_answer >= len(options):
        return jsonify({"error": "correct_answer must be a valid index"}), 400

    question = Question(
        quiz_id=quiz_id,
        question=question_text,
        options=json.dumps(options),
        correct_answer=correct_answer
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({"message": "Question added successfully", "question_id": question.id}), 201

@app.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    data = request.get_json()
    submitted_answers = data.get("answers")
    user_id = data.get("user_id")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Invalid user_id"}), 400

    existing = QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=user_id).first()
    if existing:
        return jsonify({"error": "This user already submitted this quiz"}), 400

    if not submitted_answers or not isinstance(submitted_answers, list):
        return jsonify({"error": "Answers must be provided as a list"}), 400

    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    if not questions:
        return jsonify({"error": "Quiz not found or has no questions"}), 404
    if len(submitted_answers) != len(questions):
        return jsonify({"error": "Number of answers does not match number of questions"}), 400

    score = 0
    for q, submitted in zip(questions, submitted_answers):
        if submitted == q.correct_answer:
            score += 1

    attempt = QuizAttempt(quiz_id=quiz_id, user_id=user_id, score=score)
    db.session.add(attempt)
    db.session.commit()

    return jsonify({"user_id":user_id,
                    "quiz_id": quiz_id,
                    "score": score,
                    "total": len(questions)})

@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "description": q.description} for q in quizzes])

@app.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    questions_list = [{"id": q.id, "question": q.question,"options": json.loads(q.options)}

    for q in questions]

    return jsonify({"id": quiz.id,
                    "title": quiz.title,
                    "description": quiz.description,
                    "questions": questions_list})


@app.route('/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    db.session.delete(question)
    db.session.commit()
    return jsonify({"message": f"Question {question_id} deleted successfully"})
# -------------------------
# Step 5: Initialize DB and run
# -------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # ensures tables exist
        quizzes = Quiz.query.all()
        for quiz in quizzes:
            count = Question.query.filter_by(quiz_id=quiz.id).count()
            print(f"Quiz {quiz.id} has {count} questions in the database")

    app.run(debug=True)
