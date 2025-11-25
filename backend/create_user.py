from server import app, db, User

with app.app_context():
    if not User.query.filter_by(username="testuser").first():
        user = User(username="testuser")
        user.set_password("12345")
        db.session.add(user)
        db.session.commit()
        print("User created successfully")
    else:
        print("User already exists")
