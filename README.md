# BAK UP E-Voucher System

**Version:** 1.0  
**Date:** November 14, 2025

---

## 📖 Overview

The BAK UP E-Voucher System is a comprehensive digital platform connecting food vendors, VCSE (Voluntary, Community and Social Enterprise) organizations, schools, and vulnerable families through a unified digital voucher solution.

### **Key Features:**

- ✅ Digital food voucher issuance and redemption
- ✅ "To Go" surplus food posting by vendors
- ✅ Multi-user role management (Admin, VCSE, Schools, Vendors, Recipients)
- ✅ Real-time voucher tracking and balance management
- ✅ Admin dashboard for fund allocation
- ✅ Vendor portal for shop management and item posting
- ✅ Recipient portal for voucher redemption and shopping

---

## 🏗️ System Architecture

### **Frontend:**
- **Framework:** React (Vite)
- **Language:** JavaScript
- **Build Tool:** Vite + pnpm
- **Styling:** Inline CSS (custom)

### **Backend:**
- **Framework:** Flask (Python 3.11)
- **Database:** SQLite (upgradeable to PostgreSQL)
- **ORM:** SQLAlchemy
- **API:** RESTful JSON API

### **Deployment:**
- **Web Server:** Nginx
- **WSGI Server:** Gunicorn
- **Process Manager:** Supervisor
- **SSL:** Let's Encrypt (Certbot)

---

## 📁 Project Structure

```
bakup-clean/
├── backend/
│   ├── src/
│   │   └── main.py              # Main Flask application
│   ├── instance/
│   │   └── vcse_charity.db      # SQLite database
│   ├── venv/                    # Python virtual environment
│   ├── requirements.txt         # Python dependencies
│   ├── gunicorn_config.py       # Gunicorn configuration
│   ├── .env.example             # Environment variables template
│   └── .env                     # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   └── App.jsx              # Main React application
│   ├── dist/                    # Production build output
│   ├── package.json             # Node.js dependencies
│   └── vite.config.js           # Vite configuration
├── logs/                        # Application logs
├── deploy.sh                    # Deployment automation script
├── backup-database.sh           # Database backup script
├── nginx.conf                   # Nginx configuration template
├── supervisor.conf              # Supervisor configuration template
├── DEPLOYMENT_GUIDE.md          # Comprehensive deployment guide
└── README.md                    # This file
```

---

## 🚀 Quick Start (Development)

### **Prerequisites:**
- Python 3.11+
- Node.js 18+
- pnpm

### **1. Backend Setup:**

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3.11 src/main.py
```

Backend will run on: http://localhost:5000

### **2. Frontend Setup:**

```bash
cd frontend
pnpm install
pnpm run dev
```

Frontend will run on: http://localhost:5173

---

## 🌐 Production Deployment

**For detailed production deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

### **Quick Deployment Steps:**

1. **Upload files to server:**
   ```bash
   scp -r bakup-clean bakup@your-server:/home/bakup/
   ```

2. **Run deployment script:**
   ```bash
   cd /home/bakup/bakup-clean
   ./deploy.sh
   ```

3. **Configure services:**
   ```bash
   sudo cp supervisor.conf /etc/supervisor/conf.d/bakup.conf
   sudo cp nginx.conf /etc/nginx/sites-available/bakup
   sudo ln -s /etc/nginx/sites-available/bakup /etc/nginx/sites-enabled/
   ```

4. **Start services:**
   ```bash
   sudo supervisorctl reread && sudo supervisorctl update
   sudo nginx -t && sudo systemctl restart nginx
   ```

5. **Set up SSL:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 👥 User Roles

### **1. Administrator**
- Manage all users and organizations
- Allocate funds to VCSE and Schools
- View system-wide reports
- Edit/delete organizations

### **2. VCSE Organizations**
- Issue vouchers to recipients
- View voucher usage reports
- Manage recipient accounts

### **3. Schools & Care Organizations**
- Receive funds from admin
- Issue vouchers to families
- Track distribution and impact

### **4. Local Shop Vendors**
- Create shop profiles
- Post "To Go" surplus food items
- Redeem vouchers from recipients
- Track sales and earnings

### **5. Recipients**
- Receive digital vouchers
- Browse and purchase from vendors
- View voucher balance
- Access "To Go" discounted items

---

## 🔐 Default Credentials

**Admin Account:**
- Email: prince.caesar@bakup.org
- Password: Prince@2024

**⚠️ IMPORTANT:** Change the admin password immediately after deployment!

---

## 🗄️ Database Schema

### **Main Tables:**
- `user` - All system users
- `voucher` - Digital vouchers
- `vendor_shop` - Shop information
- `surplus_item` - "To Go" food items
- `transaction` - Voucher redemptions
- `login_session` - User sessions
- `notification` - System notifications

---

## 🔧 Configuration

### **Environment Variables (.env):**

```bash
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/vcse_charity.db
SESSION_COOKIE_SECURE=True
```

Generate a secure secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📊 API Endpoints

### **Authentication:**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/forgot-password` - Password reset

### **Admin:**
- `GET /api/admin/schools` - List schools
- `POST /api/admin/allocate-funds` - Allocate funds
- `PUT /api/admin/schools/<id>` - Edit school
- `DELETE /api/admin/schools/<id>` - Delete school
- `GET /api/admin/vcse` - List VCSE organizations
- `PUT /api/admin/vcse/<id>` - Edit VCSE
- `DELETE /api/admin/vcse/<id>` - Delete VCSE

### **Vendors:**
- `GET /api/vendor/shops` - List vendor shops
- `POST /api/vendor/shops` - Create shop
- `POST /api/items/post` - Post "To Go" item
- `GET /api/vendor/to-go-items` - List vendor's items

### **Vouchers:**
- `POST /api/vouchers/issue` - Issue voucher
- `POST /api/vouchers/redeem` - Redeem voucher
- `GET /api/vouchers/balance` - Check balance

---

## 🛠️ Maintenance

### **View Logs:**
```bash
# Backend logs
tail -f /home/bakup/bakup-clean/logs/backend-output.log

# Nginx logs
sudo tail -f /var/log/nginx/bakup-access.log
```

### **Restart Services:**
```bash
# Restart backend
sudo supervisorctl restart bakup-backend

# Restart Nginx
sudo systemctl restart nginx
```

### **Database Backup:**
```bash
# Manual backup
./backup-database.sh

# Automated daily backup (add to crontab)
crontab -e
# Add: 0 2 * * * /home/bakup/bakup-clean/backup-database.sh
```

### **Update Application:**
```bash
cd /home/bakup/bakup-clean

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
pnpm install
pnpm run build

# Restart services
sudo supervisorctl restart bakup-backend
```

---

## 🐛 Troubleshooting

### **Backend won't start:**
```bash
# Check logs
tail -f /home/bakup/bakup-clean/logs/backend-error.log

# Check if port is in use
sudo lsof -i :5000

# Restart
sudo supervisorctl restart bakup-backend
```

### **502 Bad Gateway:**
```bash
# Check backend status
sudo supervisorctl status bakup-backend

# Check Nginx config
sudo nginx -t

# Restart both
sudo supervisorctl restart bakup-backend
sudo systemctl restart nginx
```

### **Database locked:**
```bash
# Check processes
sudo lsof /home/bakup/bakup-clean/backend/instance/vcse_charity.db

# Restart backend
sudo supervisorctl restart bakup-backend
```

---

## 📞 Support

For issues, questions, or feature requests:
1. Check the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Review application logs
3. Contact your development team

---

## 📝 License

Proprietary - BAK UP Organization

---

## 🎯 Roadmap

### **Upcoming Features:**
- [ ] QR code voucher redemption
- [ ] SMS code voucher redemption
- [ ] Printable vouchers
- [ ] Shopping cart notifications
- [ ] VCSE reporting dashboard
- [ ] Local shop reporting dashboard
- [ ] Email notifications
- [ ] Mobile app

---

## 🙏 Acknowledgments

Developed with ❤️ by Manus AI for BAK UP Organization

**Version:** 1.0  
**Last Updated:** November 14, 2025

---

**For detailed deployment instructions, please refer to [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**
# Force rebuild Wed Nov 26 05:19:01 EST 2025
# Auto-deploy test - Tue Jan 27 04:31:54 EST 2026
# Auto-deploy test 2 - Tue Jan 27 04:33:00 EST 2026
# Auto-deploy test 3 - Tue Jan 27 04:34:34 EST 2026
# Auto-deploy FINAL TEST - Tue Jan 27 04:41:59 EST 2026
# Auto-deploy FINAL WORKING TEST - Tue Jan 27 07:19:16 EST 2026
