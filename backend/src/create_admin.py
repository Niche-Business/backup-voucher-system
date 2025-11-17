"""
BAK UP Administrator Account Creation Script
For internal use by BAK UP team only

This script creates administrator accounts with proper security.
Admin accounts should NEVER be created through public registration.
"""

from main import app, db, User
from werkzeug.security import generate_password_hash
import sys

def create_admin():
    """Create a new administrator account"""
    
    print("=" * 60)
    print("BAK UP - Administrator Account Creation")
    print("=" * 60)
    print("\nThis script creates administrator accounts for BAK UP.")
    print("Admin accounts have full system access and should only be")
    print("created by authorized BAK UP personnel.\n")
    
    # Get admin details
    print("Enter administrator details:")
    first_name = input("First Name: ").strip()
    last_name = input("Last Name: ").strip()
    email = input("Email: ").strip()
    phone = input("Phone: ").strip()
    password = input("Password: ").strip()
    confirm_password = input("Confirm Password: ").strip()
    
    # Validate inputs
    if not all([first_name, last_name, email, phone, password]):
        print("\n❌ Error: All fields are required!")
        return False
    
    if password != confirm_password:
        print("\n❌ Error: Passwords do not match!")
        return False
    
    if len(password) < 8:
        print("\n❌ Error: Password must be at least 8 characters!")
        return False
    
    # Check if email already exists
    with app.app_context():
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"\n❌ Error: User with email {email} already exists!")
            return False
        
        # Create admin user
        try:
            admin = User(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                user_type='admin',
                is_verified=True,  # Admins are automatically verified
                is_active=True
            )
            
            db.session.add(admin)
            db.session.commit()
            
            print("\n" + "=" * 60)
            print("✅ Administrator Account Created Successfully!")
            print("=" * 60)
            print(f"\nName:  {first_name} {last_name}")
            print(f"Email: {email}")
            print(f"Phone: {phone}")
            print(f"Type:  System Administrator")
            print(f"\nThe administrator can now login at the BAK UP system.")
            print("=" * 60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error creating admin account: {e}")
            db.session.rollback()
            return False

def list_admins():
    """List all existing administrator accounts"""
    
    with app.app_context():
        admins = User.query.filter_by(user_type='admin').all()
        
        if not admins:
            print("\n📋 No administrator accounts found.")
            return
        
        print("\n" + "=" * 60)
        print(f"Existing Administrator Accounts ({len(admins)})")
        print("=" * 60)
        
        for i, admin in enumerate(admins, 1):
            print(f"\n{i}. {admin.first_name} {admin.last_name}")
            print(f"   Email: {admin.email}")
            print(f"   Phone: {admin.phone}")
            print(f"   Active: {'Yes' if admin.is_active else 'No'}")
            print(f"   Verified: {'Yes' if admin.is_verified else 'No'}")
        
        print("=" * 60)

def main():
    """Main menu"""
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'list':
            list_admins()
            return
        elif sys.argv[1] == 'create':
            create_admin()
            return
    
    # Interactive menu
    while True:
        print("\n" + "=" * 60)
        print("BAK UP - Administrator Management")
        print("=" * 60)
        print("\n1. Create New Administrator")
        print("2. List Existing Administrators")
        print("3. Exit")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == '1':
            create_admin()
        elif choice == '2':
            list_admins()
        elif choice == '3':
            print("\nGoodbye!")
            break
        else:
            print("\n❌ Invalid option. Please select 1-3.")

if __name__ == '__main__':
    main()
