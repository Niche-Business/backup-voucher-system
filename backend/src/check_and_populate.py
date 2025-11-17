#!/usr/bin/env python3
"""
Check existing test users and populate sample data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, db, User, VendorShop, SurplusItem, Voucher
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

def check_existing_users():
    """Check what test users already exist"""
    print("\n" + "="*60)
    print("EXISTING TEST USERS")
    print("="*60)
    
    test_emails = [
        'admin.test@bakup.org',
        'vcse.test@bakup.org',
        'vendor.test@bakup.org',
        'recipient.test@bakup.org'
    ]
    
    users = {}
    for email in test_emails:
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"✓ {user.user_type.upper():12} | {email:30} | Balance: £{user.balance:.2f} | Allocated: £{user.allocated_balance:.2f}")
            users[user.user_type] = user
        else:
            print(f"✗ {email} - NOT FOUND")
    
    return users

def create_missing_users(existing_users):
    """Create any missing test users"""
    print("\n" + "="*60)
    print("CREATING MISSING USERS")
    print("="*60)
    
    test_users_config = {
        'admin': {
            'email': 'admin.test@bakup.org',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'Test',
            'phone': '07700900000',
            'user_type': 'admin'
        },
        'vcse': {
            'email': 'vcse.test@bakup.org',
            'password': 'vcse123',
            'first_name': 'VCSE',
            'last_name': 'Test',
            'phone': '07700900001',
            'user_type': 'vcse',
            'organization_name': 'Test Food Bank',
            'address': '456 Charity Lane',
            'postcode': 'M2 2BB',
            'city': 'Manchester'
        },
        'vendor': {
            'email': 'vendor.test@bakup.org',
            'password': 'vendor123',
            'first_name': 'Vendor',
            'last_name': 'Test',
            'phone': '07700900002',
            'user_type': 'vendor',
            'shop_name': 'Test Food Market',
            'address': '123 High Street',
            'postcode': 'M1 1AA',
            'city': 'Manchester'
        },
        'recipient': {
            'email': 'recipient.test@bakup.org',
            'password': 'recipient123',
            'first_name': 'Recipient',
            'last_name': 'Test',
            'phone': '07700900003',
            'user_type': 'recipient',
            'address': '789 Resident Road',
            'postcode': 'M3 3CC',
            'city': 'Manchester'
        }
    }
    
    for user_type, config in test_users_config.items():
        if user_type not in existing_users:
            user = User(
                email=config['email'],
                password_hash=generate_password_hash(config['password']),
                first_name=config['first_name'],
                last_name=config['last_name'],
                phone=config['phone'],
                user_type=config['user_type'],
                organization_name=config.get('organization_name'),
                shop_name=config.get('shop_name'),
                address=config.get('address'),
                postcode=config.get('postcode'),
                city=config.get('city'),
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.session.add(user)
            existing_users[user_type] = user
            print(f"✓ Created {user_type.upper()} user: {config['email']}")
    
    db.session.commit()
    return existing_users

def add_shops(vendor_user):
    """Add shops for vendor"""
    print("\n" + "="*60)
    print("ADDING SHOPS")
    print("="*60)
    
    # Check if shop already exists
    existing_shop = VendorShop.query.filter_by(vendor_id=vendor_user.id).first()
    if existing_shop:
        print(f"✓ Shop already exists: {existing_shop.shop_name}")
        return existing_shop
    
    shop = VendorShop(
        shop_name="Test Food Market",
        address="123 High Street",
        postcode="M1 1AA",
        city="Manchester",
        phone="07700900002",
        vendor_id=vendor_user.id,
        created_at=datetime.utcnow()
    )
    db.session.add(shop)
    db.session.commit()
    print(f"✓ Created shop: {shop.shop_name}")
    return shop

def add_surplus_items(vendor_user, shop):
    """Add surplus food items"""
    print("\n" + "="*60)
    print("ADDING SURPLUS ITEMS")
    print("="*60)
    
    surplus_items = [
        {
            'name': 'Fresh Bread Loaves',
            'description': 'Freshly baked bread, best before end of day',
            'quantity': 20,
            'price': 0.50,
            'unit': 'loaf',
            'category': 'Bakery'
        },
        {
            'name': 'Organic Apples',
            'description': 'Slightly bruised but perfectly edible organic apples',
            'quantity': 50,
            'price': 0.30,
            'unit': 'kg',
            'category': 'Fruits'
        },
        {
            'name': 'Milk (1L)',
            'description': 'Fresh milk, expires tomorrow',
            'quantity': 15,
            'price': 0.80,
            'unit': 'bottle',
            'category': 'Dairy'
        },
        {
            'name': 'Mixed Vegetables',
            'description': 'Assorted vegetables, perfect for soup',
            'quantity': 30,
            'price': 0.40,
            'unit': 'kg',
            'category': 'Vegetables'
        },
        {
            'name': 'Canned Beans',
            'description': 'Dented cans, contents perfect',
            'quantity': 40,
            'price': 0.25,
            'unit': 'can',
            'category': 'Canned Goods'
        }
    ]
    
    created_count = 0
    for item_data in surplus_items:
        # Check if similar item exists
        existing = SurplusItem.query.filter_by(
            vendor_id=vendor_user.id,
            item_name=item_data['name']
        ).first()
        
        if not existing:
            item = SurplusItem(
                vendor_id=vendor_user.id,
                shop_id=shop.id,
                item_name=item_data['name'],
                description=item_data['description'],
                quantity=f"{item_data['quantity']} {item_data['unit']}",
                category=item_data['category'],
                posted_at=datetime.utcnow()
            )
            db.session.add(item)
            created_count += 1
            print(f"✓ Added: {item_data['name']} - {item_data['quantity']} {item_data['unit']} @ £{item_data['price']}")
    
    if created_count > 0:
        db.session.commit()
        print(f"\n✓ Created {created_count} surplus items")
    else:
        print("✓ Surplus items already exist")

def allocate_funds(admin_user, vcse_user):
    """Allocate funds from admin to VCSE"""
    print("\n" + "="*60)
    print("ALLOCATING FUNDS")
    print("="*60)
    
    if vcse_user.allocated_balance < 1000:
        vcse_user.allocated_balance = 1000.00
        db.session.commit()
        print(f"✓ Allocated £1000.00 to VCSE: {vcse_user.email}")
    else:
        print(f"✓ VCSE already has £{vcse_user.allocated_balance:.2f} allocated")

def create_vouchers(vcse_user, recipient_user):
    """Create sample vouchers"""
    print("\n" + "="*60)
    print("CREATING VOUCHERS")
    print("="*60)
    
    # Check existing vouchers
    existing_count = Voucher.query.filter_by(recipient_id=recipient_user.id).count()
    if existing_count >= 3:
        print(f"✓ {existing_count} vouchers already exist for recipient")
        return
    
    vouchers_data = [
        {'amount': 20.00, 'days_ago': 7, 'used': True},
        {'amount': 25.00, 'days_ago': 3, 'used': False},
        {'amount': 30.00, 'days_ago': 0, 'used': False}
    ]
    
    import random
    import string
    
    for voucher_data in vouchers_data:
        # Generate unique voucher code
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
        
        voucher = Voucher(
            code=code,
            value=voucher_data['amount'],
            recipient_id=recipient_user.id,
            issued_by=vcse_user.id,
            expiry_date=(datetime.utcnow() + timedelta(days=30)).date(),
            status='redeemed' if voucher_data['used'] else 'active',
            created_at=datetime.utcnow() - timedelta(days=voucher_data['days_ago'])
        )
        if voucher_data['used']:
            voucher.redeemed_at = voucher.created_at + timedelta(hours=2)
        
        db.session.add(voucher)
        status = "USED" if voucher_data['used'] else "ACTIVE"
        print(f"✓ Created voucher: £{voucher_data['amount']:.2f} - {status}")
    
    # Deduct from VCSE allocated balance
    total_amount = sum(v['amount'] for v in vouchers_data)
    vcse_user.allocated_balance -= total_amount
    
    db.session.commit()
    print(f"\n✓ Created {len(vouchers_data)} vouchers (Total: £{total_amount:.2f})")
    print(f"✓ VCSE remaining balance: £{vcse_user.allocated_balance:.2f}")

def main():
    print("\n" + "="*60)
    print("BAK UP E-Voucher System - Data Population")
    print("="*60)
    
    with app.app_context():
        try:
            # Check existing users
            users = check_existing_users()
            
            # Create missing users
            users = create_missing_users(users)
            
            # Ensure we have all required users
            if 'vendor' not in users or 'vcse' not in users or 'recipient' not in users:
                print("\n❌ Error: Missing required users")
                return
            
            # Add shops
            shop = add_shops(users['vendor'])
            
            # Add surplus items
            add_surplus_items(users['vendor'], shop)
            
            # Allocate funds
            if 'admin' in users and 'vcse' in users:
                allocate_funds(users['admin'], users['vcse'])
            
            # Create vouchers
            if 'vcse' in users and 'recipient' in users:
                create_vouchers(users['vcse'], users['recipient'])
            
            # Print final summary
            print("\n" + "="*60)
            print("TEST CREDENTIALS")
            print("="*60)
            print("\nAdmin Account:")
            print("  Email: admin.test@bakup.org")
            print("  Password: admin123")
            print("\nVCSE Account:")
            print("  Email: vcse.test@bakup.org")
            print("  Password: vcse123")
            print(f"  Allocated Balance: £{users['vcse'].allocated_balance:.2f}")
            print("\nVendor Account:")
            print("  Email: vendor.test@bakup.org")
            print("  Password: vendor123")
            print("\nRecipient Account:")
            print("  Email: recipient.test@bakup.org")
            print("  Password: recipient123")
            print("\n" + "="*60)
            print("✓ Data population completed successfully!")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    main()

