#!/usr/bin/env python3.11
"""
Migration script to create VendorShop records for existing vendors
who registered before the auto-shop-creation feature was added.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, db, User, VendorShop

def migrate_vendor_shops():
    """Create VendorShop records for vendors who don't have one yet"""
    with app.app_context():
        print("=" * 60)
        print("VENDOR SHOP MIGRATION SCRIPT")
        print("=" * 60)
        
        # Get all vendors
        vendors = User.query.filter_by(user_type='vendor').all()
        print(f"\nFound {len(vendors)} vendor accounts")
        
        created_count = 0
        skipped_count = 0
        
        for vendor in vendors:
            # Check if vendor already has a shop
            existing_shop = VendorShop.query.filter_by(vendor_id=vendor.id).first()
            
            if existing_shop:
                print(f"  ✓ Vendor {vendor.email} already has shop: {existing_shop.shop_name}")
                skipped_count += 1
                continue
            
            # Check if vendor has shop_name in their profile
            if not vendor.shop_name:
                print(f"  ⚠ Vendor {vendor.email} has no shop_name in profile - skipping")
                skipped_count += 1
                continue
            
            # Create VendorShop record
            try:
                new_shop = VendorShop(
                    vendor_id=vendor.id,
                    shop_name=vendor.shop_name,
                    address=vendor.address or '',
                    postcode=vendor.postcode or '',
                    city=vendor.city or '',
                    phone=vendor.phone or '',
                    is_active=True
                )
                db.session.add(new_shop)
                db.session.commit()
                
                print(f"  ✅ Created shop for {vendor.email}: {new_shop.shop_name}")
                created_count += 1
                
            except Exception as e:
                db.session.rollback()
                print(f"  ❌ Error creating shop for {vendor.email}: {str(e)}")
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE")
        print("=" * 60)
        print(f"  Shops created: {created_count}")
        print(f"  Vendors skipped: {skipped_count}")
        print(f"  Total vendors: {len(vendors)}")
        print("=" * 60)

if __name__ == '__main__':
    migrate_vendor_shops()
