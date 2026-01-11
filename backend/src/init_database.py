#!/usr/bin/env python3
"""
Database Initialization Script for BAK UP System
This script creates all database tables and initializes the admin account
"""

from main import app, db, User, generate_password_hash
import os

def init_database():
    """Initialize database tables and create admin account"""
    with app.app_context():
        print("🔄 Creating database tables...")
        
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Check if admin already exists
        admin_email = 'prince.caesar@bakup.org'
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"ℹ️  Admin account already exists: {admin_email}")
        else:
            # Create admin account
            print("🔄 Creating admin account...")
            admin = User(
                email=admin_email,
                password_hash=generate_password_hash('Prince@2024'),
                first_name='Prince',
                last_name='Caesar',
                user_type='admin',
                is_verified=True,
                is_active=True
            )
            
            db.session.add(admin)
            db.session.commit()
            
            print(f"✅ Admin account created successfully!")
            print(f"   Email: {admin_email}")
            print(f"   Password: Prince@2024")
        
        print("\n🎉 Database initialization complete!")
        print(f"   Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")

if __name__ == '__main__':
    init_database()
