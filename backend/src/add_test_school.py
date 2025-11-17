#!/usr/bin/env python3
"""
Add a test school/care organization account
"""
import sys
from main import app, db, User
from werkzeug.security import generate_password_hash

def add_test_school():
    with app.app_context():
        # Check if school already exists
        existing = User.query.filter_by(email='school.test@bakup.org').first()
        if existing:
            print("✅ Test school account already exists")
            print(f"Email: school.test@bakup.org")
            print(f"Name: {existing.organization_name}")
            print(f"Balance: £{existing.allocated_balance or 0}")
            return
        
        # Create test school account
        school = User(
            email='school.test@bakup.org',
            password_hash=generate_password_hash('school123'),
            first_name='Test',
            last_name='School',
            phone='07700900004',
            user_type='school',
            organization_name='Springfield Primary School',
            address='456 Education Lane',
            postcode='M2 2BB',
            city='Manchester',
            is_verified=True,
            allocated_balance=0.0
        )
        
        db.session.add(school)
        db.session.commit()
        
        print("✅ Test school account created successfully!")
        print(f"Email: school.test@bakup.org")
        print(f"Password: school123")
        print(f"Name: Springfield Primary School")
        print(f"Address: 456 Education Lane, Manchester M2 2BB")

if __name__ == '__main__':
    add_test_school()
