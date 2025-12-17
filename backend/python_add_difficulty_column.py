# update_difficulty_column.py
from server import app, db
from sqlalchemy import inspect, text

with app.app_context():
    # -------------------------
    # 1. Remove difficulty from quiz table
    # -------------------------
    inspector = inspect(db.engine)
    quiz_columns = [col['name'] for col in inspector.get_columns('quiz')]

    if 'difficulty' in quiz_columns:
        print("Removing 'difficulty' column from 'quiz' table...")
        try:
            db.session.execute(text("ALTER TABLE quiz DROP COLUMN difficulty"))
            db.session.commit()
            print("'difficulty' column removed from 'quiz' table.")
        except Exception as e:
            print(f"Could not drop 'difficulty' from quiz table: {e}")
            print("SQLite may require a manual table rebuild. Please handle manually if needed.")
    else:
        print("'difficulty' column does not exist in 'quiz' table. Skipping removal.")

    # -------------------------
    # 2. Add difficulty to question table
    # -------------------------
    question_columns = [col['name'] for col in inspector.get_columns('question')]

    if 'difficulty' not in question_columns:
        print("Adding 'difficulty' column to 'question' table...")
        db.session.execute(
            text("ALTER TABLE question ADD COLUMN difficulty VARCHAR(50) DEFAULT 'Medium' NOT NULL")
        )
        db.session.commit()
        print("'difficulty' column added to 'question' table.")
    else:
        print("'difficulty' column already exists in 'question' table. Skipping addition.")
    # -------------------------
    # Add question_order to quiz_attempt table
    # -------------------------
    quiz_attempt_columns = [col['name'] for col in inspector.get_columns('quiz_attempt')]

    if 'question_order' not in quiz_attempt_columns:
        print("Adding 'question_order' column to 'quiz_attempt' table...")

        db.session.execute(
            text("""
                ALTER TABLE quiz_attempt
                ADD COLUMN question_order TEXT
            """)
        )

        db.session.commit()
        print("'question_order' column added to 'quiz_attempt' table.")
    else:
        print("'question_order' column already exists in 'quiz_attempt' table. Skipping addition.")

    # -------------------------
    # Add status to quiz_attempt table
    # -------------------------
    quiz_attempt_columns = [col['name'] for col in inspector.get_columns('quiz_attempt')]

    if 'status' not in quiz_attempt_columns:
        print("Adding 'status' column to 'quiz_attempt' table...")

        db.session.execute(
            text("""
                ALTER TABLE quiz_attempt
                ADD COLUMN status VARCHAR(20) DEFAULT 'in_progress' NOT NULL
            """)
        )

        db.session.commit()
        print("'status' column added to 'quiz_attempt' table.")
    else:
        print("'status' column already exists in 'quiz_attempt' table. Skipping addition.")
