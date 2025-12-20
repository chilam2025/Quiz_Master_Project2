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

# update_user_otp_columns.py
from server import app, db
from sqlalchemy import inspect, text

with app.app_context():
    inspector = inspect(db.engine)
    user_columns = [col["name"] for col in inspector.get_columns("user")]

    # 1) otp_hash (VARCHAR)
    if "otp_hash" not in user_columns:
        print("Adding 'otp_hash' column to 'user' table...")
        db.session.execute(
            text("ALTER TABLE \"user\" ADD COLUMN otp_hash VARCHAR(255)")
        )
        db.session.commit()
        print("'otp_hash' added.")
    else:
        print("'otp_hash' already exists. Skipping.")

    # 2) is_verified (BOOLEAN)
    if "is_verified" not in user_columns:
        print("Adding 'is_verified' column to 'user' table...")
        db.session.execute(
            text("ALTER TABLE \"user\" ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE")
        )
        db.session.commit()
        print("'is_verified' added.")
    else:
        print("'is_verified' already exists. Skipping.")

    # 3) otp_expires_at (TIMESTAMP)
    if "otp_expires_at" not in user_columns:
        print("Adding 'otp_expires_at' column to 'user' table...")
        db.session.execute(
            text("ALTER TABLE \"user\" ADD COLUMN otp_expires_at TIMESTAMP")
        )
        db.session.commit()
        print("'otp_expires_at' added.")
    else:
        print("'otp_expires_at' already exists. Skipping.")

    # 4) otp_sent_at (TIMESTAMP)
    if "otp_sent_at" not in user_columns:
        print("Adding 'otp_sent_at' column to 'user' table...")
        db.session.execute(
            text("ALTER TABLE \"user\" ADD COLUMN otp_sent_at TIMESTAMP")
        )
        db.session.commit()
        print("'otp_sent_at' added.")
    else:
        print("'otp_sent_at' already exists. Skipping.")

    print("✅ User OTP columns migration complete.")
