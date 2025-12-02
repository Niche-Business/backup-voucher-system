"""
Notifications System for BAK UP E-Voucher Platform
Handles real-time notifications for new items posted by shops
"""

from flask import Blueprint, jsonify, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
from models import db

# Notification Model
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # 'discounted_item' or 'free_item'
    shop_id = db.Column(db.Integer, db.ForeignKey('vendor_shops.id'), nullable=False)
    item_id = db.Column(db.Integer, nullable=True)  # Reference to SurplusItem
    target_group = db.Column(db.String(50), nullable=False)  # 'recipient', 'vcse', 'school', 'all'
    message = db.Column(db.Text, nullable=False)
    item_name = db.Column(db.String(200))
    shop_name = db.Column(db.String(200))
    quantity = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # For user-specific notifications
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'shop_id': self.shop_id,
            'item_id': self.item_id,
            'target_group': self.target_group,
            'message': self.message,
            'item_name': self.item_name,
            'shop_name': self.shop_name,
            'quantity': self.quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_read': self.is_read
        }


# User Notification Preferences Model
class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    sound_enabled = db.Column(db.Boolean, default=True)
    email_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'sound_enabled': self.sound_enabled,
            'email_enabled': self.email_enabled
        }


# Blueprint for notifications API
notifications_bp = Blueprint('notifications', __name__)


def create_notification(notification_type, shop_id, item_id, target_group, message, item_name, shop_name, quantity):
    """
    Create a new notification and broadcast it via WebSocket
    
    Args:
        notification_type: 'discounted_item' or 'free_item'
        shop_id: ID of the shop posting the item
        item_id: ID of the item
        target_group: 'recipient', 'vcse', 'school', or 'all'
        message: Notification message text
        item_name: Name of the item
        shop_name: Name of the shop
        quantity: Quantity available
    """
    try:
        notification = Notification(
            type=notification_type,
            shop_id=shop_id,
            item_id=item_id,
            target_group=target_group,
            message=message,
            item_name=item_name,
            shop_name=shop_name,
            quantity=quantity
        )
        db.session.add(notification)
        db.session.commit()
        
        return notification
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return None


@notifications_bp.route('/api/notifications', methods=['GET'])
def get_user_notifications():
    """Get all notifications for the current user based on their user type"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        from models import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Determine target group based on user type
        if user.user_type == 'vcse':
            # VCSEs see both discounted and free items
            notifications = Notification.query.filter(
                (Notification.target_group == 'vcse') | 
                (Notification.target_group == 'all')
            ).order_by(Notification.created_at.desc()).limit(50).all()
        elif user.user_type == 'school':
            # Schools see only discounted items
            notifications = Notification.query.filter(
                (Notification.target_group == 'school') | 
                (Notification.target_group == 'all'),
                Notification.type == 'discounted_item'
            ).order_by(Notification.created_at.desc()).limit(50).all()
        elif user.user_type == 'recipient':
            # Recipients see only discounted items
            notifications = Notification.query.filter(
                (Notification.target_group == 'recipient') | 
                (Notification.target_group == 'all'),
                Notification.type == 'discounted_item'
            ).order_by(Notification.created_at.desc()).limit(50).all()
        else:
            notifications = []
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'unread_count': len([n for n in notifications if not n.is_read])
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get notifications: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        notification = Notification.query.get(notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark notification as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        from models import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Determine target group based on user type
        if user.user_type == 'vcse':
            notifications = Notification.query.filter(
                (Notification.target_group == 'vcse') | 
                (Notification.target_group == 'all'),
                Notification.is_read == False
            ).all()
        elif user.user_type == 'school':
            notifications = Notification.query.filter(
                (Notification.target_group == 'school') | 
                (Notification.target_group == 'all'),
                Notification.type == 'discounted_item',
                Notification.is_read == False
            ).all()
        elif user.user_type == 'recipient':
            notifications = Notification.query.filter(
                (Notification.target_group == 'recipient') | 
                (Notification.target_group == 'all'),
                Notification.type == 'discounted_item',
                Notification.is_read == False
            ).all()
        else:
            notifications = []
        
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        return jsonify({'message': f'Marked {len(notifications)} notifications as read'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark notifications as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/preferences', methods=['GET'])
def get_notification_preferences():
    """Get notification preferences for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Create default preferences
            preferences = NotificationPreference(
                user_id=user_id,
                sound_enabled=True,
                email_enabled=True
            )
            db.session.add(preferences)
            db.session.commit()
        
        return jsonify(preferences.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get preferences: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/preferences', methods=['POST'])
def update_notification_preferences():
    """Update notification preferences for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json()
        
        preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            preferences = NotificationPreference(user_id=user_id)
            db.session.add(preferences)
        
        if 'sound_enabled' in data:
            preferences.sound_enabled = data['sound_enabled']
        if 'email_enabled' in data:
            preferences.email_enabled = data['email_enabled']
        
        preferences.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': preferences.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update preferences: {str(e)}'}), 500


def init_socketio(socketio_instance):
    """Initialize WebSocket event handlers"""
    
    @socketio_instance.on('connect')
    def handle_connect():
        """Handle client connection"""
        user_id = session.get('user_id')
        if user_id:
            from models import User
            user = User.query.get(user_id)
            if user:
                # Join room based on user type
                room = f"{user.user_type}_room"
                join_room(room)
                emit('connected', {'message': f'Connected to {room}'})
    
    @socketio_instance.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        user_id = session.get('user_id')
        if user_id:
            from models import User
            user = User.query.get(user_id)
            if user:
                room = f"{user.user_type}_room"
                leave_room(room)
    
    return socketio_instance


def broadcast_new_item_notification(socketio_instance, item_type, shop_id, item_id, item_name, shop_name, quantity):
    """
    Broadcast a new item notification to appropriate user groups via WebSocket
    
    Args:
        socketio_instance: Flask-SocketIO instance
        item_type: 'discount' or 'free'
        shop_id: ID of the shop
        item_id: ID of the item
        item_name: Name of the item
        shop_name: Name of the shop
        quantity: Quantity available
    """
    try:
        if item_type == 'discount':
            # Discounted items go to recipients, schools, and VCSEs
            notification_type = 'discounted_item'
            target_groups = ['recipient', 'school', 'vcse']
            message = f"New discounted item available: {item_name} at {shop_name}"
        else:  # free
            # Free items go only to VCSEs
            notification_type = 'free_item'
            target_groups = ['vcse']
            message = f"New free item available for collection: {item_name} at {shop_name}"
        
        # Create notification in database
        for target_group in target_groups:
            notification = create_notification(
                notification_type=notification_type,
                shop_id=shop_id,
                item_id=item_id,
                target_group=target_group,
                message=message,
                item_name=item_name,
                shop_name=shop_name,
                quantity=quantity
            )
            
            if notification:
                # Broadcast via WebSocket to the appropriate room
                room = f"{target_group}_room"
                socketio_instance.emit('new_item_notification', notification.to_dict(), room=room)
        
        return True
    except Exception as e:
        print(f"Error broadcasting notification: {str(e)}")
        return False
