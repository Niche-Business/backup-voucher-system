#!/usr/bin/env python3.11
"""Initialize the database and create all tables"""

from main import app, db

if __name__ == '__main__':
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created successfully!")
