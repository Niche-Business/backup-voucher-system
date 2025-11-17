#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing Node.js dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
