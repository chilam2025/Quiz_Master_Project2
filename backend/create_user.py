from server import app, db, User

with app.app_context():
    # Example: create user with ID 7 and name "Amina Omar"
    if not User.query.get(7):
        user = User(id=7, name="Amina Omar")
        db.session.add(user)
        db.session.commit()
        print("User created successfully")
    else:
        print("User already exists")
