"""
Database migration endpoint for notifications system
Run this after deploying to create the notifications tables
"""

from flask import jsonify
from sqlalchemy import text, inspect

def create_notifications_migration_endpoint(app, db):
    """Create an endpoint to run notifications system migration"""
    
    @app.route('/api/admin/migrate-notifications', methods=['POST'])
    def migrate_notifications():
        """
        Run database migration to create notifications tables
        This should be called once after deployment
        """
        try:
            results = []
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            # 1. Create notifications table
            if 'notifications' not in existing_tables:
                results.append("Creating notifications table...")
                db.session.execute(text("""
                    CREATE TABLE notifications (
                        id SERIAL PRIMARY KEY,
                        type VARCHAR(50) NOT NULL,
                        shop_id INTEGER REFERENCES vendor_shops(id) ON DELETE CASCADE,
                        item_id INTEGER,
                        target_group VARCHAR(50) NOT NULL,
                        message TEXT NOT NULL,
                        item_name VARCHAR(200),
                        shop_name VARCHAR(200),
                        quantity VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_read BOOLEAN DEFAULT FALSE,
                        user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE
                    )
                """))
                results.append("✓ notifications table created")
                
                # Create indexes
                results.append("Creating indexes for notifications table...")
                db.session.execute(text("CREATE INDEX idx_notifications_target_group ON notifications(target_group)"))
                db.session.execute(text("CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC)"))
                db.session.execute(text("CREATE INDEX idx_notifications_is_read ON notifications(is_read)"))
                db.session.execute(text("CREATE INDEX idx_notifications_user_id ON notifications(user_id)"))
                results.append("✓ Indexes created for notifications table")
            else:
                results.append("✓ notifications table already exists")
            
            # 2. Create notification_preferences table
            if 'notification_preferences' not in existing_tables:
                results.append("Creating notification_preferences table...")
                db.session.execute(text("""
                    CREATE TABLE notification_preferences (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                        sound_enabled BOOLEAN DEFAULT TRUE,
                        email_enabled BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                results.append("✓ notification_preferences table created")
                
                # Create index
                results.append("Creating index for notification_preferences table...")
                db.session.execute(text("CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id)"))
                results.append("✓ Index created for notification_preferences table")
            else:
                results.append("✓ notification_preferences table already exists")
            
            db.session.commit()
            results.append("\n✅ Notifications system migration completed successfully!")
            
            return jsonify({
                'message': 'Notifications system migration completed',
                'details': results
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'error': f'Migration failed: {str(e)}',
                'details': results
            }), 500
    
    return app
