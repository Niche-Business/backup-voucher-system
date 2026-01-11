"""
Migration to add date_of_birth field to User table
"""

def create_date_of_birth_migration_endpoint(app, db):
    """Create endpoint to add date_of_birth field to User table"""
    
    @app.route('/api/admin/run-dob-migration', methods=['POST'])
    def run_dob_migration():
        """Add date_of_birth field to User table"""
        try:
            from flask import request, jsonify, session
            
            # Check admin authentication
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            from sqlalchemy import text
            
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user' AND column_name='date_of_birth'
            """)
            
            result = db.session.execute(check_query).fetchone()
            
            if result:
                return jsonify({
                    'message': 'date_of_birth field already exists',
                    'status': 'already_exists'
                }), 200
            
            # Add date_of_birth column
            alter_query = text("""
                ALTER TABLE user 
                ADD COLUMN date_of_birth DATE
            """)
            
            db.session.execute(alter_query)
            db.session.commit()
            
            return jsonify({
                'message': 'Successfully added date_of_birth field to User table',
                'status': 'success'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'error': f'Migration failed: {str(e)}',
                'status': 'error'
            }), 500
