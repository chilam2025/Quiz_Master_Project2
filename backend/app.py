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

# -------------------------
# Step 4: Routes
# -------------------------
@app.route('/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    db.session.delete(question)
    db.session.commit()
    return jsonify({"message": f"Question {question_id} deleted successfully"})

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
    if not submitted_answers or not isinstance(submitted_answers, list):
        return jsonify({"error": "Answers must be provided as a list"}), 400

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    if not questions:
        return jsonify({"error": "Quiz not found or has no questions"}), 404

    score = 0
    for q, submitted in zip(questions, submitted_answers):
        if submitted == q.correct_answer:
            score += 1

    return jsonify({"score": score, "total": len(questions)})

@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "description": q.description} for q in quizzes])

@app.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    questions_list = [{"id": q.id, "question": q.question, "options": json.loads(q.options), "correct_answer": q.correct_answer} for q in questions]

    return jsonify({"id": quiz.id, "title": quiz.title, "description": quiz.description, "questions": questions_list})

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
