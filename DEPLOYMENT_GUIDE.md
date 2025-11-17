# BAK UP E-Voucher System - Production Deployment Guide

**Version:** 1.0  
**Date:** November 14, 2025  
**Author:** Manus AI

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Server Setup](#server-setup)
4. [Database Configuration](#database-configuration)
5. [Application Deployment](#application-deployment)
6. [Production Configuration](#production-configuration)
7. [SSL/HTTPS Setup](#ssl-https-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### **Minimum Server Specifications:**
- **OS:** Ubuntu 20.04 LTS or higher (or similar Linux distribution)
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 20GB minimum
- **CPU:** 2 cores minimum
- **Network:** Public IP address with ports 80 and 443 open

### **Software Requirements:**
- Python 3.11 or higher
- Node.js 18.x or higher
- SQLite 3 (or PostgreSQL for production)
- Nginx (web server)
- Supervisor (process manager)
- Certbot (for SSL certificates)

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] A domain name (e.g., bakup.org)
- [ ] DNS records pointing to your server IP
- [ ] SSH access to your server
- [ ] Root or sudo privileges
- [ ] Email service for notifications (optional)
- [ ] Backup strategy in place

---

## 🚀 Server Setup

### **Step 1: Connect to Your Server**

```bash
ssh root@your-server-ip
# or
ssh ubuntu@your-server-ip
```

### **Step 2: Update System Packages**

```bash
sudo apt update
sudo apt upgrade -y
```

### **Step 3: Install Required Software**

```bash
# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx
sudo apt install nginx -y

# Install Supervisor
sudo apt install supervisor -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y
```

### **Step 4: Create Application User**

```bash
# Create a dedicated user for the application
sudo adduser bakup --disabled-password --gecos ""

# Add user to sudo group (optional)
sudo usermod -aG sudo bakup

# Switch to bakup user
sudo su - bakup
```

---

## 📦 Application Deployment

### **Step 1: Upload Application Files**

**Option A: Using SCP (from your local machine)**

```bash
# From your local machine, upload the deployment package
scp bakup-deployment.tar.gz bakup@your-server-ip:/home/bakup/
```

**Option B: Using Git (if you have a repository)**

```bash
# On the server, as bakup user
cd /home/bakup
git clone https://github.com/your-org/bakup-evoucher.git
cd bakup-evoucher
```

**Option C: Manual Upload**

Extract the deployment package I'll provide you:

```bash
cd /home/bakup
tar -xzf bakup-deployment.tar.gz
cd bakup-clean
```

### **Step 2: Set Up Python Virtual Environment**

```bash
cd /home/bakup/bakup-clean/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### **Step 3: Set Up Frontend**

```bash
cd /home/bakup/bakup-clean/frontend

# Install pnpm globally
sudo npm install -g pnpm

# Install dependencies
pnpm install

# Build for production
pnpm run build
```

### **Step 4: Initialize Database**

```bash
cd /home/bakup/bakup-clean/backend

# Activate virtual environment
source venv/bin/activate

# Initialize database
python3.11 -c "from src.main import db, app; app.app_context().push(); db.create_all(); print('Database initialized successfully')"
```

---

## ⚙️ Production Configuration

### **Step 1: Create Environment File**

Create `/home/bakup/bakup-clean/backend/.env`:

```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-very-long-random-secret-key-here-change-this
DATABASE_URL=sqlite:///instance/vcse_charity.db

# Security
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax

# Email Configuration (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Application Settings
MAX_CONTENT_LENGTH=16777216  # 16MB max file upload
```

**Generate a secure secret key:**

```bash
python3.11 -c "import secrets; print(secrets.token_hex(32))"
```

### **Step 2: Update Backend Configuration**

Edit `/home/bakup/bakup-clean/backend/src/main.py`:

```python
# Change debug mode to False
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
```

### **Step 3: Create Gunicorn Configuration**

Create `/home/bakup/bakup-clean/backend/gunicorn_config.py`:

```python
# Gunicorn configuration file
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "/home/bakup/bakup-clean/logs/gunicorn-access.log"
errorlog = "/home/bakup/bakup-clean/logs/gunicorn-error.log"
loglevel = "info"

# Process naming
proc_name = "bakup-backend"

# Server mechanics
daemon = False
pidfile = "/home/bakup/bakup-clean/backend/gunicorn.pid"
```

### **Step 4: Create Logs Directory**

```bash
mkdir -p /home/bakup/bakup-clean/logs
```

---

## 🔧 Supervisor Configuration

Create `/etc/supervisor/conf.d/bakup.conf`:

```bash
sudo nano /etc/supervisor/conf.d/bakup.conf
```

Add the following content:

```ini
[program:bakup-backend]
command=/home/bakup/bakup-clean/backend/venv/bin/gunicorn -c /home/bakup/bakup-clean/backend/gunicorn_config.py src.main:app
directory=/home/bakup/bakup-clean/backend
user=bakup
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/home/bakup/bakup-clean/logs/backend-error.log
stdout_logfile=/home/bakup/bakup-clean/logs/backend-output.log
environment=PATH="/home/bakup/bakup-clean/backend/venv/bin"
```

**Reload Supervisor:**

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start bakup-backend
sudo supervisorctl status
```

---

## 🌐 Nginx Configuration

### **Step 1: Create Nginx Site Configuration**

Create `/etc/nginx/sites-available/bakup`:

```bash
sudo nano /etc/nginx/sites-available/bakup
```

Add the following content:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend (React app)
    root /home/bakup/bakup-clean/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long-running requests
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Logs
    access_log /var/log/nginx/bakup-access.log;
    error_log /var/log/nginx/bakup-error.log;
}
```

### **Step 2: Enable the Site**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bakup /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL/HTTPS Setup

### **Step 1: Obtain SSL Certificate**

```bash
# Make sure your domain points to your server IP
# Then run Certbot
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose to redirect HTTP to HTTPS (option 2)

### **Step 2: Auto-Renewal**

Certbot automatically sets up auto-renewal. Test it:

```bash
sudo certbot renew --dry-run
```

### **Step 3: Update Nginx Configuration**

After SSL setup, your Nginx config will be automatically updated. Verify:

```bash
sudo nano /etc/nginx/sites-available/bakup
```

You should see SSL configuration added by Certbot.

---

## 🔥 Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Monitoring & Maintenance

### **Check Application Status**

```bash
# Check backend status
sudo supervisorctl status bakup-backend

# Check Nginx status
sudo systemctl status nginx

# View backend logs
tail -f /home/bakup/bakup-clean/logs/backend-output.log

# View Nginx logs
sudo tail -f /var/log/nginx/bakup-access.log
```

### **Restart Services**

```bash
# Restart backend
sudo supervisorctl restart bakup-backend

# Restart Nginx
sudo systemctl restart nginx
```

### **Database Backup**

Create a backup script `/home/bakup/backup-database.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/bakup/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/home/bakup/bakup-clean/backend/instance/vcse_charity.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/vcse_charity_$DATE.db"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "vcse_charity_*.db" -mtime +30 -delete

echo "Database backed up to $BACKUP_DIR/vcse_charity_$DATE.db"
```

Make it executable and add to crontab:

```bash
chmod +x /home/bakup/backup-database.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/bakup/backup-database.sh
```

---

## 🔄 Updating the Application

### **Step 1: Backup Current Version**

```bash
cd /home/bakup
cp -r bakup-clean bakup-clean-backup-$(date +%Y%m%d)
```

### **Step 2: Pull Latest Changes**

```bash
cd /home/bakup/bakup-clean
git pull origin main
```

### **Step 3: Update Dependencies**

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
pnpm install
pnpm run build
```

### **Step 4: Restart Services**

```bash
sudo supervisorctl restart bakup-backend
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### **Backend Not Starting**

```bash
# Check logs
tail -f /home/bakup/bakup-clean/logs/backend-error.log

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart supervisor
sudo supervisorctl restart bakup-backend
```

### **502 Bad Gateway Error**

```bash
# Check if backend is running
sudo supervisorctl status bakup-backend

# Check Nginx error logs
sudo tail -f /var/log/nginx/bakup-error.log

# Restart both services
sudo supervisorctl restart bakup-backend
sudo systemctl restart nginx
```

### **Database Locked Error**

```bash
# Check for processes using the database
sudo lsof /home/bakup/bakup-clean/backend/instance/vcse_charity.db

# Restart backend
sudo supervisorctl restart bakup-backend
```

### **Permission Issues**

```bash
# Fix ownership
sudo chown -R bakup:bakup /home/bakup/bakup-clean

# Fix permissions
chmod -R 755 /home/bakup/bakup-clean
chmod 644 /home/bakup/bakup-clean/backend/instance/vcse_charity.db
```

---

## 📞 Support & Maintenance

### **Regular Maintenance Tasks:**

1. **Daily:**
   - Monitor application logs
   - Check disk space usage

2. **Weekly:**
   - Review error logs
   - Check database size
   - Verify backups

3. **Monthly:**
   - Update system packages
   - Review security patches
   - Test backup restoration

### **Monitoring Tools (Optional):**

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Analytics:** Google Analytics
- **Server monitoring:** New Relic, Datadog

---

## 🎯 Production Checklist

Before going live, verify:

- [ ] Domain name configured and pointing to server
- [ ] SSL certificate installed and working
- [ ] Database initialized with admin account
- [ ] All services running (backend, Nginx)
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Error logging working
- [ ] Email notifications configured (if applicable)
- [ ] Test all user workflows
- [ ] Security headers configured
- [ ] HTTPS redirect enabled
- [ ] Monitoring tools set up

---

## 🔐 Security Best Practices

1. **Keep software updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords:**
   - Database passwords
   - Admin accounts
   - Server access

3. **Enable automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

4. **Disable root SSH login:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

5. **Install fail2ban:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | `production` |
| `SECRET_KEY` | Flask secret key | Random 64-char string |
| `DATABASE_URL` | Database connection | `sqlite:///instance/vcse_charity.db` |
| `MAIL_SERVER` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | Email username | `noreply@bakup.org` |
| `MAIL_PASSWORD` | Email password | App-specific password |

---

## 🎉 Deployment Complete!

Your BAK UP E-Voucher System should now be running in production!

**Access your application:**
- **Frontend:** https://your-domain.com
- **Backend API:** https://your-domain.com/api/

**Default Admin Account:**
- Email: prince.caesar@bakup.org
- Password: Prince@2024

**Remember to:**
1. Change the default admin password
2. Create additional admin accounts
3. Set up regular backups
4. Monitor application logs
5. Keep the system updated

---

**For support or questions, refer to the technical documentation or contact your development team.**

**Good luck with your deployment! 🚀**
