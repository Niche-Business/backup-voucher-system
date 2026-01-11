"""
Database migration script to add discount pricing fields to surplus_item table
"""

from main import app, db

def migrate():
    with app.app_context():
        # Add new columns to surplus_item table
        with db.engine.connect() as conn:
            try:
                # Add unit column
                conn.execute(db.text("ALTER TABLE surplus_item ADD COLUMN unit VARCHAR(50)"))
                print("✅ Added 'unit' column")
            except Exception as e:
                print(f"⚠️  'unit' column might already exist: {e}")
            
            try:
                # Add item_type column
                conn.execute(db.text("ALTER TABLE surplus_item ADD COLUMN item_type VARCHAR(20) DEFAULT 'free'"))
                print("✅ Added 'item_type' column")
            except Exception as e:
                print(f"⚠️  'item_type' column might already exist: {e}")
            
            try:
                # Add price column
                conn.execute(db.text("ALTER TABLE surplus_item ADD COLUMN price DECIMAL(10, 2)"))
                print("✅ Added 'price' column")
            except Exception as e:
                print(f"⚠️  'price' column might already exist: {e}")
            
            try:
                # Add original_price column
                conn.execute(db.text("ALTER TABLE surplus_item ADD COLUMN original_price DECIMAL(10, 2)"))
                print("✅ Added 'original_price' column")
            except Exception as e:
                print(f"⚠️  'original_price' column might already exist: {e}")
            
            conn.commit()
        
        print("\n✅ Migration completed successfully!")
        print("New fields added to surplus_item table:")
        print("  - unit: For specifying item units (kg, liters, pieces, etc.)")
        print("  - item_type: 'discount' or 'free'")
        print("  - price: Discounted price for discount items")
        print("  - original_price: Original price before discount")

if __name__ == '__main__':
    migrate()
