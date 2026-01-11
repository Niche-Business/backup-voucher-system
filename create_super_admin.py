"""
Create Super Admin User Script
Creates a super_admin user for impersonation testing
"""

import os
import sys
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash
from datetime import datetime
import getpass

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print("=" * 60)
print("Create Super Admin User")
print("=" * 60)
print()

# Get user input
print("Enter super admin details:")
print()

first_name = input("First Name: ").strip()
if not first_name:
    print("Error: First name is required")
    sys.exit(1)

last_name = input("Last Name: ").strip()
if not last_name:
    print("Error: Last name is required")
    sys.exit(1)

email = input("Email: ").strip().lower()
if not email or '@' not in email:
    print("Error: Valid email is required")
    sys.exit(1)

phone = input("Phone (optional): ").strip()

password = getpass.getpass("Password: ")
if len(password) < 8:
    print("Error: Password must be at least 8 characters")
    sys.exit(1)

password_confirm = getpass.getpass("Confirm Password: ")
if password != password_confirm:
    print("Error: Passwords do not match")
    sys.exit(1)

print()
print("=" * 60)
print("Creating super admin user...")
print("=" * 60)
print()

# Create engine
engine = create_engine(DATABASE_URL)

def create_super_admin():
    """Create the super admin user"""
    with engine.connect() as conn:
        # Check if email already exists
        result = conn.execute(
            text("SELECT id, user_type FROM \"user\" WHERE email = :email"),
            {"email": email}
        )
        existing_user = result.fetchone()
        
        if existing_user:
            user_id, user_type = existing_user
            if user_type == 'super_admin':
                print(f"✓ User {email} is already a super admin (ID: {user_id})")
                return
            else:
                print(f"User {email} exists with type '{user_type}'")
                update = input("Update to super_admin? (yes/no): ").strip().lower()
                if update == 'yes':
                    conn.execute(
                        text("UPDATE \"user\" SET user_type = 'super_admin' WHERE id = :id"),
                        {"id": user_id}
                    )
                    conn.commit()
                    print(f"✓ Updated user {email} to super_admin")
                    return
                else:
                    print("Cancelled")
                    return
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Insert new user
        result = conn.execute(
            text("""
                INSERT INTO "user" (
                    email, password_hash, first_name, last_name, phone,
                    user_type, is_verified, is_active, account_status, created_at
                )
                VALUES (
                    :email, :password_hash, :first_name, :last_name, :phone,
                    'super_admin', true, true, 'ACTIVE', :created_at
                )
                RETURNING id
            """),
            {
                "email": email,
                "password_hash": password_hash,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone if phone else None,
                "created_at": datetime.utcnow()
            }
        )
        
        user_id = result.scalar()
        conn.commit()
        
        print()
        print("=" * 60)
        print("✓ Super Admin Created Successfully!")
        print("=" * 60)
        print()
        print(f"User ID: {user_id}")
        print(f"Name: {first_name} {last_name}")
        print(f"Email: {email}")
        print(f"Phone: {phone if phone else 'N/A'}")
        print(f"User Type: super_admin")
        print()
        print("You can now log in and use the impersonation feature!")
        print()

if __name__ == '__main__':
    try:
        create_super_admin()
    except Exception as e:
        print()
        print("=" * 60)
        print("✗ Failed to create super admin!")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        sys.exit(1)
