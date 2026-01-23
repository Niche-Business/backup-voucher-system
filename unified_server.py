#!/usr/bin/env python3
"""
Unified server for BAK UP E-Voucher System
Serves both Flask backend API and React frontend
"""
# Deployment trigger: UI text updates applied - Dec 1, 2025
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend' / 'src'
sys.path.insert(0, str(backend_path))

from flask import send_from_directory, Response, abort, redirect, request
import mimetypes
from main import app, db, Category, User
from werkzeug.security import generate_password_hash

# Configure frontend serving
# In production (Render), the build is at /opt/render/project/src/frontend/dist
# In development, it's relative to this file
if os.environ.get('RENDER'):
    frontend_build = Path('/opt/render/project/src/frontend/dist')
else:
    frontend_build = Path(__file__).parent / 'frontend' / 'dist'

# Redirect middleware to force custom domain
@app.before_request
def redirect_to_custom_domain():
    """Redirect from Render domain to custom domain"""
    host = request.host.lower()
    # Redirect if accessed via Render domain
    if 'onrender.com' in host or 'backup-voucher-system' in host:
        # Redirect to custom domain while preserving path and query string
        return redirect(
            'https://app.breezeconsult.org' + request.full_path.replace(host, 'app.breezeconsult.org'),
            code=301
        )

# Note: This catch-all route is registered AFTER all API routes from main.py
# Flask will match more specific routes first, so /api/* routes will work correctly
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend with correct MIME types"""
    # Ensure proper MIME types for JavaScript modules
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('application/javascript', '.mjs')
    mimetypes.add_type('text/css', '.css')
    
    # Debug logging
    if path and path.endswith('.js'):
        file_path = frontend_build / path
        print(f"[SERVE] Requested: {path}")
        print(f"[SERVE] Looking in: {frontend_build}")
        print(f"[SERVE] Full path: {file_path}")
        print(f"[SERVE] Exists: {file_path.exists()}")
        if file_path.exists():
            print(f"[SERVE] File size: {file_path.stat().st_size} bytes")
    
    if path and (frontend_build / path).exists():
        # Get the file and set correct MIME type
        file_path = frontend_build / path
        mime_type, _ = mimetypes.guess_type(str(file_path))
        response = send_from_directory(str(frontend_build), path)
        if mime_type:
            response.headers['Content-Type'] = mime_type
        # Add cache-busting headers for JavaScript and CSS files
        if path.endswith(('.js', '.mjs', '.css')):
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response
    return send_from_directory(str(frontend_build), 'index.html')

if __name__ == '__main__':
    # Verify frontend build exists
    if not frontend_build.exists():
        print("⚠️  WARNING: Frontend build directory not found!")
        print(f"   Expected: {frontend_build}")
        print("   The server will start anyway. Frontend may not work correctly.")
    else:
        # Check for index.html
        index_file = frontend_build / 'index.html'
        if not index_file.exists():
            print("⚠️  WARNING: index.html not found in build directory!")
            print(f"   Expected: {index_file}")
        
        # Check for assets directory
        assets_dir = frontend_build / 'assets'
        if not assets_dir.exists() or not list(assets_dir.glob('*.js')):
            print("⚠️  WARNING: No JavaScript files found in assets directory!")
            print(f"   Expected: {assets_dir}/*.js")
        else:
            print("✓ Frontend build verified successfully!")
    
            print(f"  - Build directory: {frontend_build}")
            print(f"  - Index file: {index_file}")
            
            # Read and display what's in index.html
            try:
                with open(index_file, 'r') as f:
                    html_content = f.read()
                    # Find the script tag
                    import re
                    script_match = re.search(r'src="(/assets/index\.[^"]+\.js)"', html_content)
                    if script_match:
                        print(f"  - index.html references: {script_match.group(1)}")
                
                js_files = list(assets_dir.glob('*.js'))
                print(f"  - JavaScript files in assets/:")
                for js_file in js_files:
                    size_kb = js_file.stat().st_size / 1024
                    print(f"    * {js_file.name}: {size_kb:.1f} KB")
            except Exception as e:
                print(f"  - Could not read build details: {e}")
    
    # Initialize database
    with app.app_context():
        print("Initializing database...")
        db.create_all()
        
        # Create default categories if they don't exist
        if not Category.query.first():
            categories = [
                Category(name='Fresh Produce', type='edible', description='Fruits, vegetables, and fresh items'),
                Category(name='Bakery', type='edible', description='Bread, pastries, and baked goods'),
                Category(name='Dairy', type='edible', description='Milk, cheese, yogurt, and dairy products'),
                Category(name='Meat & Fish', type='edible', description='Fresh and frozen meat and fish'),
                Category(name='Packaged Foods', type='edible', description='Canned, boxed, and packaged items'),
                Category(name='Non-Food Items', type='non-edible', description='Toiletries, household items, and other essentials')
            ]
            db.session.add_all(categories)
            db.session.commit()
            print("Database initialized with default categories")
        else:
            print("Database already initialized")
        
        # Add missing columns to user table (VCSE verification system)
        try:
            from sqlalchemy import text, inspect
            inspector = inspect(db.engine)
            user_columns = [col['name'] for col in inspector.get_columns('user')]
            
            columns_to_add = [
                ('account_status', "VARCHAR(30) DEFAULT 'ACTIVE'"),
                ('rejection_reason', "TEXT"),
                ('verified_at', "TIMESTAMP"),
                ('verified_by_admin_id', "INTEGER REFERENCES \"user\"(id)")
            ]
            
            for col_name, col_def in columns_to_add:
                if col_name not in user_columns:
                    db.session.execute(text(f"ALTER TABLE \"user\" ADD COLUMN {col_name} {col_def}"))
                    db.session.commit()
                    print(f"✓ Added column '{col_name}' to user table")
            
            print("✓ User table schema updated")
        except Exception as e:
            print(f"Note: User table migration: {e}")
            db.session.rollback()
        
        # Create cart_notification table if it doesn't exist
        try:
            from sqlalchemy import text
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS cart_notification (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    surplus_item_id INTEGER,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES "user" (id)
                )
            """))
            db.session.commit()
            print("✓ cart_notification table created/verified")
        except Exception as e:
            print(f"Note: cart_notification table setup: {e}")
            db.session.rollback()
        
        # Note: Admin accounts are now managed through the create_admin_account endpoint
        # No automatic admin creation on startup to prevent auto-recreation after deletion
        print("✓ Admin account management: Use /api/create-admin endpoint")
    
    port = int(os.environ.get('PORT', 8080))
    print("=" * 60)
    print("BAK UP E-Voucher System - Unified Server")
    print("=" * 60)
    print(f"Backend: Flask API on /api/*")
    print(f"Frontend: React app from {frontend_build}")
    print(f"Server: http://0.0.0.0:{port}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)

