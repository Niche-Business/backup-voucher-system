"""
Update existing surplus items with unit and item_type fields
"""

from main import app, db, SurplusItem

def update_items():
    with app.app_context():
        items = SurplusItem.query.all()
        
        # Define unit mappings based on item names
        unit_mappings = {
            'bread': 'loaf',
            'apple': 'kg',
            'milk': 'bottle',
            'vegetable': 'kg',
            'bean': 'can'
        }
        
        for item in items:
            # Set unit based on item name
            item_lower = item.item_name.lower()
            for key, unit in unit_mappings.items():
                if key in item_lower:
                    item.unit = unit
                    break
            
            if not item.unit:
                item.unit = 'piece'
            
            # Set all existing items as 'free' type
            item.item_type = 'free'
            item.price = None
            item.original_price = None
        
        db.session.commit()
        
        print(f"✅ Updated {len(items)} existing surplus items")
        print("\nItem details:")
        for item in items:
            print(f"  - {item.item_name}: {item.quantity} {item.unit} (type: {item.item_type})")
        
        # Now add some discount items for testing
        from main import User, VendorShop
        
        vendor = User.query.filter_by(user_type='vendor').first()
        if vendor:
            shop = VendorShop.query.filter_by(vendor_id=vendor.id).first()
            if shop:
                # Add discount items
                discount_items = [
                    {
                        'item_name': 'Fresh Chicken Breast',
                        'quantity': '10',
                        'unit': 'kg',
                        'category': 'edible',
                        'item_type': 'discount',
                        'original_price': 8.99,
                        'price': 5.99,
                        'description': 'Fresh chicken breast at 33% discount - expires in 2 days'
                    },
                    {
                        'item_name': 'Organic Tomatoes',
                        'quantity': '15',
                        'unit': 'kg',
                        'category': 'edible',
                        'item_type': 'discount',
                        'original_price': 3.50,
                        'price': 2.00,
                        'description': 'Organic tomatoes at discounted price - slightly overripe but perfect for cooking'
                    },
                    {
                        'item_name': 'Whole Wheat Bread',
                        'quantity': '8',
                        'unit': 'loaf',
                        'category': 'edible',
                        'item_type': 'discount',
                        'original_price': 2.50,
                        'price': 1.50,
                        'description': 'Freshly baked whole wheat bread at 40% off'
                    }
                ]
                
                for item_data in discount_items:
                    new_item = SurplusItem(
                        vendor_id=vendor.id,
                        shop_id=shop.id,
                        **item_data
                    )
                    db.session.add(new_item)
                
                db.session.commit()
                print(f"\n✅ Added {len(discount_items)} discount items for testing")
                print("\nDiscount items:")
                for item in discount_items:
                    savings = float(item['original_price']) - float(item['price'])
                    percent = (savings / float(item['original_price'])) * 100
                    print(f"  - {item['item_name']}: £{item['price']} (was £{item['original_price']}, save {percent:.0f}%)")

if __name__ == '__main__':
    update_items()
