"""
Standalone endpoint to add Food To Go columns to the database
This must be added to main.py and called BEFORE deploying the full Food To Go feature
"""

def create_food_to_go_migration_endpoint(app, db):
    """Add migration endpoint to Flask app"""
    from flask import jsonify, request
    from sqlalchemy import text
    import os
    
    @app.route('/api/admin/migrate-food-to-go', methods=['POST'])
    def migrate_food_to_go():
        """Add Food To Go columns to database - must be called before deploying Food To Go code"""
        # Check secret key
        secret = request.args.get('secret') or (request.get_json() or {}).get('secret')
        expected_secret = os.environ.get('MIGRATION_SECRET_KEY', 'default-secret-key-change-me')
        
        if secret != expected_secret:
            return jsonify({'error': 'Invalid secret key'}), 403
        
        try:
            results = []
            
            # Add assign_shop_method column to voucher table
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD COLUMN assign_shop_method VARCHAR(20) DEFAULT 'none'
                    """))
                    conn.commit()
                results.append('✅ Added assign_shop_method column to voucher table')
            except Exception as e:
                if 'Duplicate column' in str(e) or 'already exists' in str(e):
                    results.append('ℹ️ Column assign_shop_method already exists')
                else:
                    results.append(f'❌ Error adding assign_shop_method: {str(e)[:200]}')
            
            # Add recipient_selected_shop_id column to voucher table
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD COLUMN recipient_selected_shop_id INTEGER
                    """))
                    conn.commit()
                results.append('✅ Added recipient_selected_shop_id column to voucher table')
            except Exception as e:
                if 'Duplicate column' in str(e) or 'already exists' in str(e):
                    results.append('ℹ️ Column recipient_selected_shop_id already exists')
                else:
                    results.append(f'❌ Error adding recipient_selected_shop_id: {str(e)[:200]}')
            
            # Add preferred_shop_id column to user table
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("""
                        ALTER TABLE user 
                        ADD COLUMN preferred_shop_id INTEGER
                    """))
                    conn.commit()
                results.append('✅ Added preferred_shop_id column to user table')
            except Exception as e:
                if 'Duplicate column' in str(e) or 'already exists' in str(e):
                    results.append('ℹ️ Column preferred_shop_id already exists')
                else:
                    results.append(f'❌ Error adding preferred_shop_id: {str(e)[:200]}')
            
            return jsonify({
                'success': True,
                'message': 'Food To Go migration completed',
                'results': results
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Migration failed: {str(e)}'
            }), 500
