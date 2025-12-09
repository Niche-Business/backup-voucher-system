"""
Audit Log System
Tracks and logs all important user activities for security and compliance
"""

from flask import Blueprint, jsonify, session, request
from datetime import datetime, timedelta
import logging
import json

audit_bp = Blueprint('audit', __name__)
logger = logging.getLogger(__name__)

# Global references
db = None
User = None

# Audit Log Model
class AuditLog(db.Model if db else object):
    """Model for storing audit log entries"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True) if db else None
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) if db else None
    user_email = db.Column(db.String(255), nullable=True) if db else None
    user_type = db.Column(db.String(50), nullable=True) if db else None
    action = db.Column(db.String(100), nullable=False) if db else None
    resource_type = db.Column(db.String(50), nullable=True) if db else None
    resource_id = db.Column(db.String(100), nullable=True) if db else None
    details = db.Column(db.Text, nullable=True) if db else None
    ip_address = db.Column(db.String(45), nullable=True) if db else None
    user_agent = db.Column(db.String(500), nullable=True) if db else None
    status = db.Column(db.String(20), default='success') if db else None
    timestamp = db.Column(db.DateTime, default=datetime.utcnow) if db else None
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_type': self.user_type,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'status': self.status,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None
        }


def init_audit_system(flask_app, app_db, user_model):
    """Initialize the audit log system"""
    global db, User, AuditLog
    db = app_db
    User = user_model
    
    # Create AuditLog model dynamically
    class AuditLog(db.Model):
        __tablename__ = 'audit_logs'
        
        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
        user_email = db.Column(db.String(255), nullable=True)
        user_type = db.Column(db.String(50), nullable=True)
        action = db.Column(db.String(100), nullable=False)
        resource_type = db.Column(db.String(50), nullable=True)
        resource_id = db.Column(db.String(100), nullable=True)
        details = db.Column(db.Text, nullable=True)
        ip_address = db.Column(db.String(45), nullable=True)
        user_agent = db.Column(db.String(500), nullable=True)
        status = db.Column(db.String(20), default='success')
        timestamp = db.Column(db.DateTime, default=datetime.utcnow)
        
        def to_dict(self):
            return {
                'id': self.id,
                'user_id': self.user_id,
                'user_email': self.user_email,
                'user_type': self.user_type,
                'action': self.action,
                'resource_type': self.resource_type,
                'resource_id': self.resource_id,
                'details': self.details,
                'ip_address': self.ip_address,
                'status': self.status,
                'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None
            }
    
    globals()['AuditLog'] = AuditLog
    
    # Create table if it doesn't exist
    with flask_app.app_context():
        try:
            db.create_all()
        except Exception as e:
            logger.warning(f"Could not create audit_logs table: {e}")
    
    logger.info("Audit log system initialized")


def log_activity(action, resource_type=None, resource_id=None, details=None, status='success', user_id=None):
    """
    Log a user activity
    
    Args:
        action: Description of the action (e.g., 'login', 'create_voucher', 'update_user')
        resource_type: Type of resource affected (e.g., 'voucher', 'user', 'transaction')
        resource_id: ID of the affected resource
        details: Additional details (can be dict or string)
        status: Status of the action ('success', 'failure', 'warning')
        user_id: User ID (if not in session)
    """
    try:
        # Get user info
        if not user_id:
            user_id = session.get('user_id')
        
        user_email = None
        user_type = None
        if user_id:
            user = User.query.get(user_id)
            if user:
                user_email = user.email
                user_type = user.user_type
        
        # Get request info
        ip_address = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent', '')[:500] if request else None
        
        # Convert details to JSON if it's a dict
        if isinstance(details, dict):
            details = json.dumps(details)
        
        # Create audit log entry
        audit_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            user_type=user_type,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )
        
        db.session.add(audit_entry)
        db.session.commit()
        
        logger.info(f"Audit log created: {action} by user {user_email} ({user_type})")
        return True
    
    except Exception as e:
        logger.error(f"Error creating audit log: {str(e)}")
        db.session.rollback()
        return False


@audit_bp.route('/api/admin/audit-logs', methods=['GET'])
def get_audit_logs():
    """
    Get audit logs (admin only)
    Supports filtering by user, action, date range, etc.
    """
    # Check authentication
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Forbidden - Admin access required'}), 403
    
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        user_filter = request.args.get('user_id')
        action_filter = request.args.get('action')
        resource_type_filter = request.args.get('resource_type')
        status_filter = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = AuditLog.query
        
        if user_filter:
            query = query.filter(AuditLog.user_id == int(user_filter))
        
        if action_filter:
            query = query.filter(AuditLog.action.ilike(f'%{action_filter}%'))
        
        if resource_type_filter:
            query = query.filter(AuditLog.resource_type == resource_type_filter)
        
        if status_filter:
            query = query.filter(AuditLog.status == status_filter)
        
        if date_from:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(AuditLog.timestamp >= date_from_obj)
        
        if date_to:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < date_to_obj)
        
        # Order by most recent first
        query = query.order_by(AuditLog.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'logs': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@audit_bp.route('/api/admin/audit-logs/stats', methods=['GET'])
def get_audit_stats():
    """Get audit log statistics (admin only)"""
    # Check authentication
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Forbidden - Admin access required'}), 403
    
    try:
        # Get date range
        days = int(request.args.get('days', 30))
        date_from = datetime.utcnow() - timedelta(days=days)
        
        # Total logs
        total_logs = AuditLog.query.filter(AuditLog.timestamp >= date_from).count()
        
        # Logs by status
        success_logs = AuditLog.query.filter(
            AuditLog.timestamp >= date_from,
            AuditLog.status == 'success'
        ).count()
        
        failure_logs = AuditLog.query.filter(
            AuditLog.timestamp >= date_from,
            AuditLog.status == 'failure'
        ).count()
        
        # Top actions
        from sqlalchemy import func
        top_actions = db.session.query(
            AuditLog.action,
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.timestamp >= date_from
        ).group_by(AuditLog.action).order_by(func.count(AuditLog.id).desc()).limit(10).all()
        
        # Top users
        top_users = db.session.query(
            AuditLog.user_email,
            AuditLog.user_type,
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.timestamp >= date_from,
            AuditLog.user_email.isnot(None)
        ).group_by(AuditLog.user_email, AuditLog.user_type).order_by(func.count(AuditLog.id).desc()).limit(10).all()
        
        # Activity by day
        activity_by_day = db.session.query(
            func.date(AuditLog.timestamp).label('date'),
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.timestamp >= date_from
        ).group_by(func.date(AuditLog.timestamp)).order_by(func.date(AuditLog.timestamp)).all()
        
        return jsonify({
            'success': True,
            'total_logs': total_logs,
            'success_logs': success_logs,
            'failure_logs': failure_logs,
            'top_actions': [{'action': action, 'count': count} for action, count in top_actions],
            'top_users': [{'email': email, 'user_type': user_type, 'count': count} for email, user_type, count in top_users],
            'activity_by_day': [{'date': str(date), 'count': count} for date, count in activity_by_day]
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching audit stats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@audit_bp.route('/api/admin/audit-logs/export', methods=['GET'])
def export_audit_logs():
    """Export audit logs to CSV (admin only)"""
    # Check authentication
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Forbidden - Admin access required'}), 403
    
    try:
        import csv
        import io
        from flask import make_response
        
        # Get filters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = AuditLog.query
        
        if date_from:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(AuditLog.timestamp >= date_from_obj)
        
        if date_to:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < date_to_obj)
        
        logs = query.order_by(AuditLog.timestamp.desc()).all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Timestamp', 'User Email', 'User Type', 'Action', 'Resource Type', 'Resource ID', 'Status', 'IP Address', 'Details'])
        
        # Data
        for log in logs:
            writer.writerow([
                log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else '',
                log.user_email or '',
                log.user_type or '',
                log.action or '',
                log.resource_type or '',
                log.resource_id or '',
                log.status or '',
                log.ip_address or '',
                log.details or ''
            ])
        
        # Create response
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename=audit_logs_{datetime.now().strftime("%Y%m%d")}.csv'
        response.headers['Content-Type'] = 'text/csv'
        
        return response
    
    except Exception as e:
        logger.error(f"Error exporting audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Decorator to automatically log actions
def audit_action(action, resource_type=None):
    """
    Decorator to automatically log actions
    
    Usage:
        @audit_action('create_voucher', 'voucher')
        def create_voucher():
            ...
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            try:
                result = f(*args, **kwargs)
                
                # Extract resource_id from result if it's a dict
                resource_id = None
                if isinstance(result, dict) and 'id' in result:
                    resource_id = result['id']
                elif isinstance(result, tuple) and len(result) > 0 and isinstance(result[0], dict) and 'id' in result[0]:
                    resource_id = result[0]['id']
                
                # Log the action
                log_activity(
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    status='success'
                )
                
                return result
            except Exception as e:
                # Log the failure
                log_activity(
                    action=action,
                    resource_type=resource_type,
                    details=str(e),
                    status='failure'
                )
                raise
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator
