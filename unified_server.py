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
from main import app

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
    port = int(os.environ.get('PORT', 8080))
    print("=" * 60)
    print("BAK UP E-Voucher System - Unified Server")
    print("=" * 60)
    print(f"Backend: Flask API on /api/*")
    print(f"Frontend: React app from {frontend_build}")
    print(f"Server: http://0.0.0.0:{port}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)

