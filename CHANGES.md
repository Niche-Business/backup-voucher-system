# Detailed Changes for Version 1.0.2

**Version:** 1.0.2  
**Date Started:** 2026-01-11  
**Status:** 🔄 IN PROGRESS

---

## 📋 Overview

This version introduces the **SUPER ADMIN** feature, allowing designated administrators to impersonate other users for testing and support purposes. This is a critical feature for debugging user issues and testing the system from different user perspectives.

---

## 🔧 Backend Changes

### 1. Database Schema Changes

#### **New User Type: `super_admin`**
**File:** `backend/src/main.py`  
**Lines:** TBD

```python
# Before:
user_type = db.Column(db.String(20), nullable=False)  
# Values: recipient, vendor, vcse, admin, school

# After:
user_type = db.Column(db.String(20), nullable=False)  
# Values: recipient, vendor, vcse, admin, school, super_admin
```

**Migration:**
```sql
-- Add super_admin as valid user_type
ALTER TABLE user ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('recipient', 'vendor', 'vcse', 'admin', 'school', 'super_admin'));
```

#### **New Table: `impersonation_log`**
**File:** `backend/src/main.py`  
**Lines:** TBD

```python
class ImpersonationLog(db.Model):
    __tablename__ = 'impersonation_log'
    
    id = db.Column(db.Integer, primary_key=True)
    super_admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ended_at = db.Column(db.DateTime)
    actions_performed = db.Column(db.Integer, default=0)
    reason = db.Column(db.String(500))  # Optional reason for impersonation
    
    # Relationships
    super_admin = db.relationship('User', foreign_keys=[super_admin_id])
    target_user = db.relationship('User', foreign_keys=[target_user_id])
```

**Migration:**
```sql
CREATE TABLE impersonation_log (
    id SERIAL PRIMARY KEY,
    super_admin_id INTEGER NOT NULL REFERENCES user(id),
    target_user_id INTEGER NOT NULL REFERENCES user(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    actions_performed INTEGER DEFAULT 0,
    reason VARCHAR(500),
    CONSTRAINT no_self_impersonation CHECK (super_admin_id != target_user_id)
);

CREATE INDEX idx_impersonation_super_admin ON impersonation_log(super_admin_id);
CREATE INDEX idx_impersonation_target_user ON impersonation_log(target_user_id);
CREATE INDEX idx_impersonation_started_at ON impersonation_log(started_at DESC);
```

---

### 2. New Module: Impersonation System

#### **File:** `backend/src/impersonation.py` (NEW FILE)

```python
"""
Impersonation System for Super Admin
Allows super admins to view the system as other users for testing/support
"""

from flask import session, jsonify
from datetime import datetime, timedelta
from functools import wraps

class ImpersonationManager:
    """Manages user impersonation for super admins"""
    
    @staticmethod
    def start_impersonation(super_admin_id, target_user_id, db, User, ImpersonationLog, reason=None):
        """
        Start impersonating a user
        
        Args:
            super_admin_id: ID of the super admin
            target_user_id: ID of the user to impersonate
            db: Database instance
            User: User model
            ImpersonationLog: ImpersonationLog model
            reason: Optional reason for impersonation
            
        Returns:
            dict: Success status and message
        """
        # Verify super admin
        super_admin = User.query.get(super_admin_id)
        if not super_admin or super_admin.user_type != 'super_admin':
            return {'success': False, 'error': 'Unauthorized'}
        
        # Verify target user exists
        target_user = User.query.get(target_user_id)
        if not target_user:
            return {'success': False, 'error': 'Target user not found'}
        
        # Prevent impersonating other super admins
        if target_user.user_type == 'super_admin':
            return {'success': False, 'error': 'Cannot impersonate other super admins'}
        
        # Store original user info in session
        session['original_user_id'] = super_admin_id
        session['original_user_type'] = super_admin.user_type
        session['impersonating'] = True
        session['impersonation_started_at'] = datetime.utcnow().isoformat()
        
        # Switch to target user
        session['user_id'] = target_user_id
        session['user_type'] = target_user.user_type
        
        # Log the impersonation
        log_entry = ImpersonationLog(
            super_admin_id=super_admin_id,
            target_user_id=target_user_id,
            reason=reason
        )
        db.session.add(log_entry)
        db.session.commit()
        
        session['impersonation_log_id'] = log_entry.id
        
        return {
            'success': True,
            'target_user': {
                'id': target_user.id,
                'name': f"{target_user.first_name} {target_user.last_name}",
                'email': target_user.email,
                'user_type': target_user.user_type
            }
        }
    
    @staticmethod
    def end_impersonation(db, ImpersonationLog):
        """
        End current impersonation and return to super admin
        
        Returns:
            dict: Success status and message
        """
        if not session.get('impersonating'):
            return {'success': False, 'error': 'Not currently impersonating'}
        
        # Update impersonation log
        log_id = session.get('impersonation_log_id')
        if log_id:
            log_entry = ImpersonationLog.query.get(log_id)
            if log_entry:
                log_entry.ended_at = datetime.utcnow()
                db.session.commit()
        
        # Restore original user
        original_user_id = session.get('original_user_id')
        original_user_type = session.get('original_user_type')
        
        session['user_id'] = original_user_id
        session['user_type'] = original_user_type
        
        # Clear impersonation flags
        session.pop('original_user_id', None)
        session.pop('original_user_type', None)
        session.pop('impersonating', None)
        session.pop('impersonation_started_at', None)
        session.pop('impersonation_log_id', None)
        
        return {'success': True}
    
    @staticmethod
    def get_status():
        """
        Get current impersonation status
        
        Returns:
            dict: Impersonation status information
        """
        if not session.get('impersonating'):
            return {'impersonating': False}
        
        return {
            'impersonating': True,
            'original_user_id': session.get('original_user_id'),
            'current_user_id': session.get('user_id'),
            'started_at': session.get('impersonation_started_at')
        }
    
    @staticmethod
    def require_super_admin(f):
        """Decorator to require super admin access"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if user is super admin (considering impersonation)
            original_user_type = session.get('original_user_type')
            current_user_type = session.get('user_type')
            
            # If impersonating, check original user type
            if session.get('impersonating'):
                if original_user_type != 'super_admin':
                    return jsonify({'error': 'Super admin access required'}), 403
            else:
                if current_user_type != 'super_admin':
                    return jsonify({'error': 'Super admin access required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
```

---

### 3. New API Endpoints

#### **File:** `backend/src/main.py`  
**Section:** API Routes

```python
# Import impersonation module
from impersonation import ImpersonationManager

# Impersonation endpoints
@app.route('/api/admin/impersonate', methods=['POST'])
def start_impersonation():
    """Start impersonating a user (super admin only)"""
    if session.get('user_type') != 'super_admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    target_user_id = data.get('target_user_id')
    reason = data.get('reason', '')
    
    if not target_user_id:
        return jsonify({'error': 'Target user ID required'}), 400
    
    result = ImpersonationManager.start_impersonation(
        super_admin_id=session['user_id'],
        target_user_id=target_user_id,
        db=db,
        User=User,
        ImpersonationLog=ImpersonationLog,
        reason=reason
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@app.route('/api/admin/end-impersonation', methods=['POST'])
def end_impersonation():
    """End current impersonation"""
    result = ImpersonationManager.end_impersonation(db, ImpersonationLog)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@app.route('/api/admin/impersonation-status', methods=['GET'])
def get_impersonation_status():
    """Get current impersonation status"""
    status = ImpersonationManager.get_status()
    return jsonify(status), 200

@app.route('/api/admin/users-list', methods=['GET'])
@ImpersonationManager.require_super_admin
def get_users_list():
    """Get list of users for impersonation (super admin only)"""
    users = User.query.filter(User.user_type != 'super_admin').all()
    
    users_list = [{
        'id': user.id,
        'name': f"{user.first_name} {user.last_name}",
        'email': user.email,
        'user_type': user.user_type,
        'phone': user.phone
    } for user in users]
    
    return jsonify({'users': users_list}), 200

@app.route('/api/admin/impersonation-logs', methods=['GET'])
@ImpersonationManager.require_super_admin
def get_impersonation_logs():
    """Get impersonation audit logs (super admin only)"""
    logs = ImpersonationLog.query.order_by(ImpersonationLog.started_at.desc()).limit(100).all()
    
    logs_list = [{
        'id': log.id,
        'super_admin': f"{log.super_admin.first_name} {log.super_admin.last_name}",
        'target_user': f"{log.target_user.first_name} {log.target_user.last_name}",
        'target_user_type': log.target_user.user_type,
        'started_at': log.started_at.isoformat(),
        'ended_at': log.ended_at.isoformat() if log.ended_at else None,
        'duration_minutes': ((log.ended_at - log.started_at).total_seconds() / 60) if log.ended_at else None,
        'actions_performed': log.actions_performed,
        'reason': log.reason
    } for log in logs]
    
    return jsonify({'logs': logs_list}), 200
```

---

## 🎨 Frontend Changes

### 1. New Component: Impersonation Banner

#### **File:** `frontend/src/components/ImpersonationBanner.jsx` (NEW FILE)

```jsx
/**
 * Impersonation Banner Component
 * Displays when a super admin is impersonating another user
 */

import React from 'react';

export function ImpersonationBanner({ targetUser, onExitImpersonation }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ff9800',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      fontWeight: 'bold'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>👁️</span>
        <span>
          Viewing as: <strong>{targetUser.name}</strong> ({targetUser.user_type})
        </span>
      </div>
      
      <button
        onClick={onExitImpersonation}
        style={{
          backgroundColor: 'white',
          color: '#ff9800',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        Exit Impersonation
      </button>
    </div>
  );
}

export default ImpersonationBanner;
```

### 2. Admin Dashboard Updates

#### **File:** `frontend/src/App.jsx`  
**Section:** AdminDashboard component

**Changes:**
1. Add "Switch User" button in admin dashboard header
2. Add user selection modal
3. Import and use ImpersonationBanner
4. Add impersonation state management
5. Add API calls for impersonation

```jsx
// Add to AdminDashboard imports
import ImpersonationBanner from './components/ImpersonationBanner';

// Add state variables
const [showUserSelector, setShowUserSelector] = useState(false);
const [usersList, setUsersList] = useState([]);
const [userSearchQuery, setUserSearchQuery] = useState('');
const [impersonationStatus, setImpersonationStatus] = useState(null);

// Add functions
const loadUsersList = async () => {
  try {
    const data = await apiCall('/admin/users-list');
    setUsersList(data.users || []);
  } catch (error) {
    console.error('Failed to load users list:', error);
  }
};

const startImpersonation = async (targetUserId) => {
  try {
    const result = await apiCall('/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId })
    });
    
    if (result.success) {
      // Reload page to switch to target user's dashboard
      window.location.reload();
    }
  } catch (error) {
    alert('Failed to start impersonation: ' + error.message);
  }
};

const endImpersonation = async () => {
  try {
    const result = await apiCall('/admin/end-impersonation', {
      method: 'POST'
    });
    
    if (result.success) {
      // Reload page to return to super admin dashboard
      window.location.reload();
    }
  } catch (error) {
    alert('Failed to end impersonation: ' + error.message);
  }
};

// Check impersonation status on load
useEffect(() => {
  const checkImpersonation = async () => {
    try {
      const status = await apiCall('/admin/impersonation-status');
      setImpersonationStatus(status);
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
    }
  };
  
  checkImpersonation();
}, []);
```

---

## 🔒 Security Changes

### 1. Authorization Middleware

**Added checks to ensure:**
- Only super_admin can access impersonation endpoints
- Cannot impersonate other super admins
- Session timeout for impersonation (1 hour max)
- Rate limiting on impersonation attempts

### 2. Audit Logging

**All impersonation events are logged:**
- Who impersonated whom
- When it started and ended
- How long it lasted
- What actions were performed (optional)
- Reason for impersonation (optional)

---

## 📝 Configuration Changes

### Environment Variables

No new environment variables required.

### Database Migrations

Run migrations to add:
1. `super_admin` user type
2. `impersonation_log` table

---

## 🧪 Testing Requirements

### Unit Tests
- Test impersonation start/end functions
- Test authorization checks
- Test audit logging

### Integration Tests
- Test full impersonation flow
- Test API endpoints
- Test session management

### Manual Testing
- Test all user types can be impersonated
- Test exit impersonation
- Test unauthorized access prevention

---

## 📊 Impact Analysis

### Performance Impact
- Minimal (only affects super admin operations)
- Audit logging adds small database overhead

### Security Impact
- **Positive:** Better debugging and support capabilities
- **Risk:** Potential for abuse if not properly secured
- **Mitigation:** Comprehensive audit logging, authorization checks

### User Experience Impact
- **Super Admins:** New powerful feature for testing
- **Regular Users:** No impact (unless notified of impersonation)

---

## 🚀 Deployment Notes

1. Run database migrations before deployment
2. Create at least one super_admin user
3. Test impersonation in staging environment
4. Monitor audit logs after deployment

---

## 📅 Change Log

### 2026-01-11
- Created CHANGES.md
- Planned database schema changes
- Designed impersonation system architecture
- Designed frontend components

---

## ✅ Completion Status

**Status:** 📝 PLANNED (Not yet implemented)

This document will be updated as changes are implemented.
