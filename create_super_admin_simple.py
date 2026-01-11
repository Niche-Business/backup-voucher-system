#!/usr/bin/env python3
"""
Simple Super Admin Account Creator
Creates a super admin account for the BAK UP CIC E-Voucher System
Run this script on the Render server via SSH or shell access
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from main import app, db, User
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_super_admin(email, password, first_name, last_name, phone=None):
    """Create a super admin user"""
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        
        if existing_user:
            if existing_user.user_type == 'super_admin':
                print(f"✓ User {email} is already a super admin (ID: {existing_user.id})")
                return existing_user
            else:
                print(f"✓ User {email} exists with type '{existing_user.user_type}'")
                print(f"✓ Upgrading to super_admin...")
                existing_user.user_type = 'super_admin'
                db.session.commit()
                print(f"✓ User {email} upgraded to super_admin successfully!")
                return existing_user
        
        # Create new super admin user
        password_hash = generate_password_hash(password)
        
        new_user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            user_type='super_admin',
            is_verified=True,
            is_active=True,
            account_status='ACTIVE',
            created_at=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        print("\n" + "=" * 60)
        print("✓ SUPER ADMIN CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"User ID: {new_user.id}")
        print(f"Name: {first_name} {last_name}")
        print(f"Email: {email}")
        print(f"Phone: {phone if phone else 'N/A'}")
        print(f"User Type: super_admin")
        print("=" * 60)
        print("\nYou can now log in with these credentials!")
        print("Access the System Changelog via Admin Dashboard → System Changelog")
        print("=" * 60 + "\n")
        
        return new_user

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("BAK UP CIC - Super Admin Account Creator")
    print("=" * 60 + "\n")
    
    # You can customize these values or pass them as command line arguments
    if len(sys.argv) >= 5:
        email = sys.argv[1]
        password = sys.argv[2]
        first_name = sys.argv[3]
        last_name = sys.argv[4]
        phone = sys.argv[5] if len(sys.argv) > 5 else None
    else:
        # Default values - CHANGE THESE BEFORE RUNNING!
        print("Usage: python3 create_super_admin_simple.py <email> <password> <first_name> <last_name> [phone]")
        print("\nOr edit the script to set default values.\n")
        sys.exit(1)
    
    try:
        create_super_admin(email, password, first_name, last_name, phone)
    except Exception as e:
        print("\n" + "=" * 60)
        print("✗ ERROR CREATING SUPER ADMIN")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print("\nMake sure:")
        print("1. Database is accessible")
        print("2. DATABASE_URL environment variable is set")
        print("3. You're running this from the project root directory")
        print("=" * 60 + "\n")
        sys.exit(1)
