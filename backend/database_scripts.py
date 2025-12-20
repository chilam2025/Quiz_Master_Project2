"""Utility script to align quiz schema columns.

- Moves `difficulty` from the quiz table to the question table (default Medium).
- Adds `question_order`, `status`, `started_at`, and `duration_seconds` to quiz_attempt.

Run the script in an environment where ``server.py`` can be imported.
"""
from server import app, db
from sqlalchemy import inspect, text


def column_exists(inspector, table_name, column_name):
    """Return True if a column exists on the given table."""
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def drop_quiz_difficulty(inspector):
    if column_exists(inspector, "quiz", "difficulty"):
        print("Removing 'difficulty' column from 'quiz' table…")
        db.session.execute(text("ALTER TABLE quiz DROP COLUMN IF EXISTS difficulty"))
        db.session.commit()
        print("'difficulty' column removed from 'quiz' table.")
    else:
        print("'difficulty' column does not exist in 'quiz' table. Skipping removal.")

def add_question_difficulty(inspector):
    if not column_exists(inspector, "question", "difficulty"):
        print("Adding 'difficulty' column to 'question' table…")
        db.session.execute(
            text(
                "ALTER TABLE question "
                "ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) "
                "DEFAULT 'Medium' NOT NULL"
            )
        )
        db.session.commit()
        print("'difficulty' column added to 'question' table.")
    else:
        print("'difficulty' column already exists in 'question' table. Skipping addition.")

def ensure_quiz_attempt_columns(inspector):
    additions = {
                "question_order": "TEXT",
                "status": "VARCHAR(20) DEFAULT 'in_progress' NOT NULL",
                "started_at": "TIMESTAMP",
                "duration_seconds": "INTEGER",
            }

    for column_name, column_type in additions.items():
        if not column_exists(inspector, "quiz_attempt", column_name):
            print(f"Adding '{column_name}' column to 'quiz_attempt' table…")
            db.session.execute(
                text(
                    f"ALTER TABLE quiz_attempt "
                    f"ADD COLUMN IF NOT EXISTS {column_name} {column_type}"
                )
            )
            db.session.commit()
            print(f"'{column_name}' column added to 'quiz_attempt' table.")
        else:
            print(
                f"'{column_name}' column already exists in 'quiz_attempt' table. "
                "Skipping addition."
            )

def main():
     with app.app_context():
            inspector = inspect(db.engine)
            drop_quiz_difficulty(inspector)
            add_question_difficulty(inspector)
            ensure_quiz_attempt_columns(inspector)

if __name__ == "__main__":
    main()