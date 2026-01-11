"""
Database migration script to add redeemed_at_shop_id field to Voucher table
"""
import os
import sys

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app, db

def migrate():
    with app.app_context():
        try:
            # Check if column already exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('voucher')]
            
            if 'redeemed_at_shop_id' in columns:
                print("✓ Column 'redeemed_at_shop_id' already exists")
                return
            
            # Add the column
            print("Adding 'redeemed_at_shop_id' column to voucher table...")
            db.engine.execute('''
                ALTER TABLE voucher 
                ADD COLUMN redeemed_at_shop_id INTEGER 
                REFERENCES vendor_shop(id)
            ''')
            
            print("✓ Successfully added 'redeemed_at_shop_id' column")
            
        except Exception as e:
            print(f"✗ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate()
