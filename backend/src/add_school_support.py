"""
Add School/Care Organization support to BAK UP system
"""

from main import app, db, User

def add_school_support():
    """Add school/care organization user type support"""
    
    with app.app_context():
        # Check if we need to add any sample school accounts
        existing_school = User.query.filter_by(user_type='school').first()
        
        if existing_school:
            print("✅ School user type already exists in database")
            print(f"   Found: {existing_school.first_name} {existing_school.last_name}")
            return
        
        # Create a sample school account for testing
        from werkzeug.security import generate_password_hash
        
        school = User(
            email='school.test@bakup.org',
            password_hash=generate_password_hash('school123'),
            first_name='Springfield',
            last_name='Primary School',
            phone='07700900200',
            user_type='school',
            organization_name='Springfield Primary School',
            address='45 Education Lane, Manchester M2 3ED',
            is_verified=True,
            is_active=True,
            allocated_balance=0.00  # Schools receive voucher allocations from admin
        )
        
        db.session.add(school)
        db.session.commit()
        
        print("=" * 60)
        print("✅ School/Care Organization Support Added!")
        print("=" * 60)
        print(f"Sample School Account Created:")
        print(f"  Name:         Springfield Primary School")
        print(f"  Email:        school.test@bakup.org")
        print(f"  Password:     school123")
        print(f"  Phone:        07700900200")
        print(f"  Type:         School/Care Organization")
        print(f"  Status:       Active & Verified")
        print("=" * 60)
        print()
        print("Schools can now:")
        print("  ✅ Register through the public form")
        print("  ✅ Receive voucher allocations from administrators")
        print("  ✅ Distribute vouchers to families they support")
        print("  ✅ Track voucher usage and impact")
        print("=" * 60)

if __name__ == '__main__':
    add_school_support()
