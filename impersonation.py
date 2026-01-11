"""
Impersonation System for Super Admin
Allows super admins to view the system as other users for testing/support
This feature is ONLY available to super_admin user type, not regular admins
"""

from flask import session, jsonify
from datetime import datetime, timedelta
from functools import wraps
import logging

logger = logging.getLogger(__name__)

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
        try:
            # Verify super admin
            super_admin = User.query.get(super_admin_id)
            if not super_admin or super_admin.user_type != 'super_admin':
                logger.warning(f"Unauthorized impersonation attempt by user {super_admin_id}")
                return {'success': False, 'error': 'Unauthorized: Only super admins can impersonate users'}
            
            # Verify target user exists
            target_user = User.query.get(target_user_id)
            if not target_user:
                logger.warning(f"Impersonation attempt for non-existent user {target_user_id}")
                return {'success': False, 'error': 'Target user not found'}
            
            # Prevent impersonating other super admins
            if target_user.user_type == 'super_admin':
                logger.warning(f"Attempt to impersonate another super admin by {super_admin_id}")
                return {'success': False, 'error': 'Cannot impersonate other super admins'}
            
            # Check if already impersonating
            if session.get('impersonating'):
                logger.info(f"User {super_admin_id} ending previous impersonation before starting new one")
                ImpersonationManager.end_impersonation(db, ImpersonationLog)
            
            # Store original user info in session
            session['original_user_id'] = super_admin_id
            session['original_user_type'] = super_admin.user_type
            session['original_user_email'] = super_admin.email
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
            
            logger.info(f"Super admin {super_admin_id} started impersonating user {target_user_id} ({target_user.user_type})")
            
            return {
                'success': True,
                'target_user': {
                    'id': target_user.id,
                    'name': f"{target_user.first_name} {target_user.last_name}",
                    'email': target_user.email,
                    'user_type': target_user.user_type
                }
            }
        except Exception as e:
            logger.error(f"Error starting impersonation: {str(e)}")
            db.session.rollback()
            return {'success': False, 'error': f'Failed to start impersonation: {str(e)}'}
    
    @staticmethod
    def end_impersonation(db, ImpersonationLog):
        """
        End current impersonation and return to super admin
        
        Returns:
            dict: Success status and message
        """
        try:
            if not session.get('impersonating'):
                return {'success': False, 'error': 'Not currently impersonating'}
            
            # Update impersonation log
            log_id = session.get('impersonation_log_id')
            if log_id:
                log_entry = ImpersonationLog.query.get(log_id)
                if log_entry:
                    log_entry.ended_at = datetime.utcnow()
                    duration = (log_entry.ended_at - log_entry.started_at).total_seconds()
                    logger.info(f"Impersonation ended after {duration:.0f} seconds")
                    db.session.commit()
            
            # Restore original user
            original_user_id = session.get('original_user_id')
            original_user_type = session.get('original_user_type')
            
            logger.info(f"Restoring session for super admin {original_user_id}")
            
            session['user_id'] = original_user_id
            session['user_type'] = original_user_type
            
            # Clear impersonation flags
            session.pop('original_user_id', None)
            session.pop('original_user_type', None)
            session.pop('original_user_email', None)
            session.pop('impersonating', None)
            session.pop('impersonation_started_at', None)
            session.pop('impersonation_log_id', None)
            
            return {'success': True, 'message': 'Impersonation ended successfully'}
        except Exception as e:
            logger.error(f"Error ending impersonation: {str(e)}")
            db.session.rollback()
            return {'success': False, 'error': f'Failed to end impersonation: {str(e)}'}
    
    @staticmethod
    def get_status(db=None, User=None):
        """
        Get current impersonation status
        
        Returns:
            dict: Impersonation status information
        """
        if not session.get('impersonating'):
            return {'impersonating': False}
        
        status = {
            'impersonating': True,
            'original_user_id': session.get('original_user_id'),
            'original_user_email': session.get('original_user_email'),
            'current_user_id': session.get('user_id'),
            'current_user_type': session.get('user_type'),
            'started_at': session.get('impersonation_started_at')
        }
        
        # If db and User model provided, get user details
        if db and User:
            try:
                current_user = User.query.get(session.get('user_id'))
                if current_user:
                    status['current_user_name'] = f"{current_user.first_name} {current_user.last_name}"
                    status['current_user_email'] = current_user.email
            except Exception as e:
                logger.error(f"Error getting user details for impersonation status: {str(e)}")
        
        return status
    
    @staticmethod
    def require_super_admin(f):
        """
        Decorator to require super admin access
        This checks the ORIGINAL user type, not the impersonated one
        """
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if user is super admin (considering impersonation)
            if session.get('impersonating'):
                # If impersonating, check original user type
                if session.get('original_user_type') != 'super_admin':
                    logger.warning(f"Non-super-admin attempted to access super admin endpoint")
                    return jsonify({'error': 'Super admin access required'}), 403
            else:
                # Not impersonating, check current user type
                if session.get('user_type') != 'super_admin':
                    logger.warning(f"Non-super-admin attempted to access super admin endpoint")
                    return jsonify({'error': 'Super admin access required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    
    @staticmethod
    def is_super_admin():
        """
        Check if current user is a super admin (considering impersonation)
        
        Returns:
            bool: True if super admin, False otherwise
        """
        if session.get('impersonating'):
            return session.get('original_user_type') == 'super_admin'
        else:
            return session.get('user_type') == 'super_admin'
    
    @staticmethod
    def check_impersonation_timeout(max_duration_hours=2):
        """
        Check if impersonation has exceeded maximum duration
        Automatically ends impersonation if timeout exceeded
        
        Args:
            max_duration_hours: Maximum allowed duration in hours (default: 2)
            
        Returns:
            bool: True if timed out and ended, False otherwise
        """
        if not session.get('impersonating'):
            return False
        
        started_at_str = session.get('impersonation_started_at')
        if not started_at_str:
            return False
        
        try:
            started_at = datetime.fromisoformat(started_at_str)
            duration = datetime.utcnow() - started_at
            
            if duration > timedelta(hours=max_duration_hours):
                logger.warning(f"Impersonation timeout exceeded ({duration.total_seconds()/3600:.1f} hours)")
                # Note: This would need db and ImpersonationLog to actually end
                # In practice, this should be called from a route that has access to these
                return True
        except Exception as e:
            logger.error(f"Error checking impersonation timeout: {str(e)}")
        
        return False


def init_impersonation_routes(app, db, User, ImpersonationLog):
    """
    Initialize impersonation API routes
    
    Args:
        app: Flask app instance
        db: Database instance
        User: User model
        ImpersonationLog: ImpersonationLog model
    """
    
    @app.route('/api/admin/impersonate', methods=['POST'])
    @ImpersonationManager.require_super_admin
    def start_impersonation():
        """Start impersonating a user (super admin only)"""
        from flask import request
        
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
        status = ImpersonationManager.get_status(db, User)
        return jsonify(status), 200

    @app.route('/api/admin/users-list', methods=['GET'])
    @ImpersonationManager.require_super_admin
    def get_users_list():
        """Get list of users for impersonation (super admin only)"""
        try:
            # Get all users except super admins
            users = User.query.filter(User.user_type != 'super_admin').order_by(User.first_name).all()
            
            users_list = [{
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'user_type': user.user_type,
                'phone': user.phone,
                'organization_name': user.organization_name,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None
            } for user in users]
            
            return jsonify({'users': users_list, 'count': len(users_list)}), 200
        except Exception as e:
            logger.error(f"Error getting users list: {str(e)}")
            return jsonify({'error': 'Failed to load users list'}), 500

    @app.route('/api/admin/impersonation-logs', methods=['GET'])
    @ImpersonationManager.require_super_admin
    def get_impersonation_logs():
        """Get impersonation audit logs (super admin only)"""
        try:
            from flask import request
            limit = request.args.get('limit', 100, type=int)
            
            logs = ImpersonationLog.query.order_by(ImpersonationLog.started_at.desc()).limit(limit).all()
            
            logs_list = [{
                'id': log.id,
                'super_admin': f"{log.super_admin.first_name} {log.super_admin.last_name}",
                'super_admin_email': log.super_admin.email,
                'target_user': f"{log.target_user.first_name} {log.target_user.last_name}",
                'target_user_email': log.target_user.email,
                'target_user_type': log.target_user.user_type,
                'started_at': log.started_at.isoformat(),
                'ended_at': log.ended_at.isoformat() if log.ended_at else None,
                'duration_minutes': round((log.ended_at - log.started_at).total_seconds() / 60, 1) if log.ended_at else None,
                'reason': log.reason,
                'is_active': log.ended_at is None
            } for log in logs]
            
            return jsonify({'logs': logs_list, 'count': len(logs_list)}), 200
        except Exception as e:
            logger.error(f"Error getting impersonation logs: {str(e)}")
            return jsonify({'error': 'Failed to load impersonation logs'}), 500
    
    logger.info("Impersonation routes initialized")
