#!/usr/bin/env python3
"""
Unified server for BAK UP E-Voucher System
Serves both Flask backend API and React frontend
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend' / 'src'
sys.path.insert(0, str(backend_path))

from flask import send_from_directory
from main import app, db, Category

# Configure frontend serving
frontend_build = Path(__file__).parent / 'frontend' / 'dist'

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend"""
    if path and (frontend_build / path).exists():
        return send_from_directory(str(frontend_build), path)
    return send_from_directory(str(frontend_build), 'index.html')

if __name__ == '__main__':
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
    
    port = int(os.environ.get('PORT', 8080))
    print("=" * 60)
    print("BAK UP E-Voucher System - Unified Server")
    print("=" * 60)
    print(f"Backend: Flask API on /api/*")
    print(f"Frontend: React app from {frontend_build}")
    print(f"Server: http://0.0.0.0:{port}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)

