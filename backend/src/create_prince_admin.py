"""
Create admin account for Prince Caesar
"""

from main import app, db, User
from werkzeug.security import generate_password_hash

def create_prince_admin():
    """Create admin account for Prince Caesar"""
    
    with app.app_context():
        # Check if account already exists
        existing = User.query.filter_by(email='prince.caesar@bakup.org').first()
        
        if existing:
            print(f"✅ Account already exists for prince.caesar@bakup.org")
            print(f"   Name: {existing.first_name} {existing.last_name}")
            print(f"   Type: {existing.user_type}")
            print(f"   Active: {existing.is_active}")
            print(f"   Verified: {existing.is_verified}")
            return
        
        # Create new admin account
        admin = User(
            email='prince.caesar@bakup.org',
            password_hash=generate_password_hash('Prince@2024'),
            first_name='Prince',
            last_name='Caesar',
            phone='07700900100',
            user_type='admin',
            is_verified=True,
            is_active=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("=" * 60)
        print("✅ Admin Account Created Successfully!")
        print("=" * 60)
        print(f"Name:     Prince Caesar")
        print(f"Email:    prince.caesar@bakup.org")
        print(f"Password: Prince@2024")
        print(f"Phone:    07700900100")
        print(f"Type:     System Administrator")
        print(f"Status:   Active & Verified")
        print("=" * 60)

if __name__ == '__main__':
    create_prince_admin()
