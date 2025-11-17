# 🔐 BAK UP - Administrator Account Creation Guide

## 🎯 Overview

Administrator accounts have full system access and should **ONLY** be created by authorized BAK UP personnel. 

**Important:** Admin accounts are **NOT available** through public registration for security reasons.

---

## 🚫 Security Policy

### Public Registration
- ✅ Recipients can register
- ✅ Vendors can register
- ✅ VCSE Organizations can register
- ❌ **Administrators CANNOT register publicly**

### Admin Account Creation
- ✅ Only via internal script
- ✅ Only by authorized BAK UP staff
- ✅ Requires direct database access
- ✅ Automatically verified and activated

---

## 🛠️ How to Create Admin Accounts

### Method 1: Interactive Script (Recommended)

```bash
cd backend/src
python3 create_admin.py
```

Follow the prompts:
1. Select "1" to create new administrator
2. Enter first name
3. Enter last name
4. Enter email address
5. Enter phone number
6. Enter password (min 8 characters)
7. Confirm password

**Example:**
```
BAK UP - Administrator Management
===========================================================

1. Create New Administrator
2. List Existing Administrators
3. Exit

Select option (1-3): 1

Enter administrator details:
First Name: John
Last Name: Smith
Email: john.smith@bakup.org
Phone: 07700900123
Password: ********
Confirm Password: ********

===========================================================
✅ Administrator Account Created Successfully!
===========================================================

Name:  John Smith
Email: john.smith@bakup.org
Phone: 07700900123
Type:  System Administrator

The administrator can now login at the BAK UP system.
===========================================================
```

### Method 2: Command Line

**Create Admin:**
```bash
python3 create_admin.py create
```

**List Admins:**
```bash
python3 create_admin.py list
```

---

## 📋 List Existing Administrators

To see all existing admin accounts:

```bash
cd backend/src
python3 create_admin.py list
```

**Output:**
```
===========================================================
Existing Administrator Accounts (2)
===========================================================

1. John Smith
   Email: john.smith@bakup.org
   Phone: 07700900123
   Active: Yes
   Verified: Yes

2. Admin Test
   Email: admin.test@bakup.org
   Phone: 07700900001
   Active: Yes
   Verified: Yes
===========================================================
```

---

## ✅ Admin Account Features

Once created, administrators can:

- ✅ Allocate funds to VCSE organizations
- ✅ View and manage all vouchers
- ✅ View all shops and vendors
- ✅ View all surplus items (discount + free)
- ✅ Monitor system usage
- ✅ Generate reports
- ✅ Oversee all user types
- ✅ Manage system settings

---

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- Use strong, unique passwords
- Change passwords regularly
- Never share admin credentials

### Email Requirements
- Use official BAK UP email addresses
- Format: `name@bakup.org` or `name@bakup.com`
- Avoid personal email addresses

### Access Control
- Only create admin accounts for authorized personnel
- Review admin list regularly
- Deactivate accounts when staff leave
- Keep admin count minimal

---

## ⚠️ Important Notes

1. **No Public Registration:** Admin option has been removed from the public registration form

2. **Automatic Verification:** Admin accounts are automatically verified and activated

3. **Database Access Required:** Creating admins requires direct access to the backend

4. **Production Deployment:** In production, consider additional security:
   - Two-factor authentication
   - IP whitelisting
   - Audit logging
   - Regular security reviews

---

## 🆘 Troubleshooting

### Error: "User with email already exists"
- Check if the email is already registered
- Use `python3 create_admin.py list` to see existing accounts
- Choose a different email address

### Error: "Password must be at least 8 characters"
- Use a longer password
- Follow password best practices

### Error: "Passwords do not match"
- Ensure both password entries are identical
- Check for typos

### Script Not Found
- Ensure you're in the `backend/src` directory
- Check that `create_admin.py` exists
- Verify Python is installed

---

## 📞 Support

For admin account issues, contact:
- BAK UP IT Team
- System Administrator
- Technical Support

---

## 🎉 Summary

✅ Admin accounts are secure and controlled
✅ Only authorized BAK UP staff can create admins
✅ Public cannot register as administrators
✅ Simple script for internal admin creation
✅ All admins are automatically verified

**Keep administrator access secure and limited to authorized personnel only!**
