#!/bin/bash

# BAK UP E-Voucher System - Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting BAK UP E-Voucher System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/bakup/bakup-clean"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOGS_DIR="$APP_DIR/logs"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as bakup user
if [ "$USER" != "bakup" ]; then
    print_error "This script must be run as the 'bakup' user"
    echo "Please run: sudo su - bakup"
    exit 1
fi

# Create logs directory
print_info "Creating logs directory..."
mkdir -p "$LOGS_DIR"
print_success "Logs directory created"

# Backend Setup
print_info "Setting up backend..."
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3.11 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_info "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Create instance directory if it doesn't exist
mkdir -p instance

# Initialize database if it doesn't exist
if [ ! -f "instance/vcse_charity.db" ]; then
    print_info "Initializing database..."
    python3.11 << EOF
from src.main import db, app
app.app_context().push()
db.create_all()
print('Database initialized successfully')
EOF
    print_success "Database initialized"
else
    print_info "Database already exists, skipping initialization"
fi

# Frontend Setup
print_info "Setting up frontend..."
cd "$FRONTEND_DIR"

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    print_info "Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed"
fi

# Install dependencies
print_info "Installing frontend dependencies..."
pnpm install
print_success "Frontend dependencies installed"

# Build frontend
print_info "Building frontend for production..."
pnpm run build
print_success "Frontend built successfully"

# Set correct permissions
print_info "Setting file permissions..."
cd "$APP_DIR"
chmod -R 755 .
chmod 644 backend/instance/vcse_charity.db 2>/dev/null || true
print_success "Permissions set"

# Check if .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error ".env file not found!"
    print_info "Please create $BACKEND_DIR/.env based on .env.example"
    print_info "Run: cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env"
    print_info "Then edit .env with your configuration"
    exit 1
fi

print_success "Backend setup complete"
print_success "Frontend setup complete"

echo ""
print_success "🎉 Deployment preparation complete!"
echo ""
print_info "Next steps:"
echo "1. Copy supervisor.conf to /etc/supervisor/conf.d/bakup.conf"
echo "   sudo cp $APP_DIR/supervisor.conf /etc/supervisor/conf.d/bakup.conf"
echo ""
echo "2. Copy nginx.conf to /etc/nginx/sites-available/bakup"
echo "   sudo cp $APP_DIR/nginx.conf /etc/nginx/sites-available/bakup"
echo "   sudo ln -s /etc/nginx/sites-available/bakup /etc/nginx/sites-enabled/"
echo ""
echo "3. Update nginx.conf with your domain name"
echo "   sudo nano /etc/nginx/sites-available/bakup"
echo ""
echo "4. Reload services"
echo "   sudo supervisorctl reread"
echo "   sudo supervisorctl update"
echo "   sudo supervisorctl start bakup-backend"
echo "   sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "5. Set up SSL with Certbot"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
print_success "Happy deploying! 🚀"
