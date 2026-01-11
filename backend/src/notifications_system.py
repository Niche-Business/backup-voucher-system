"""
Notifications System for BAK UP E-Voucher Platform
Handles real-time notifications for new items posted by shops
"""

from flask import Blueprint, jsonify, request, session
from flask_socketio import emit, join_room, leave_room
from datetime import datetime

# Blueprint for notifications API
notifications_bp = Blueprint('notifications', __name__)

# Global references (will be set during initialization)
_db = None
_Notification = None
_NotificationPreference = None
_User = None
_socketio = None


def init_notifications_system(db, Notification, NotificationPreference, User, socketio):
    """Initialize the notifications system with database models"""
    global _db, _Notification, _NotificationPreference, _User, _socketio
    _db = db
    _Notification = Notification
    _NotificationPreference = NotificationPreference
    _User = User
    _socketio = socketio


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
        notification = _Notification(
            type=notification_type,
            shop_id=shop_id,
            item_id=item_id,
            target_group=target_group,
            message=message,
            item_name=item_name,
            shop_name=shop_name,
            quantity=quantity
        )
        _db.session.add(notification)
        _db.session.commit()
        
        return notification
    except Exception as e:
        _db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return None


@notifications_bp.route('/api/notifications', methods=['GET'])
def get_user_notifications():
    """Get all notifications for the current user based on their user type"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = _User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Determine target group based on user type
        if user.user_type == 'vcse':
            # VCFSEs see both discounted and free items
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'vcse') | 
                (_Notification.target_group == 'all')
            ).order_by(_Notification.created_at.desc()).limit(50).all()
        elif user.user_type == 'school':
            # Schools see only discounted items
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'school') | 
                (_Notification.target_group == 'all'),
                _Notification.type == 'discounted_item'
            ).order_by(_Notification.created_at.desc()).limit(50).all()
        elif user.user_type == 'recipient':
            # Recipients see only discounted items
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'recipient') | 
                (_Notification.target_group == 'all'),
                _Notification.type == 'discounted_item'
            ).order_by(_Notification.created_at.desc()).limit(50).all()
        elif user.user_type == 'admin':
            # Admins see ALL notifications
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'admin') | 
                (_Notification.target_group == 'all')
            ).order_by(_Notification.created_at.desc()).limit(50).all()
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
        
        notification = _Notification.query.get(notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        _db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        _db.session.rollback()
        return jsonify({'error': f'Failed to mark notification as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = _User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Determine target group based on user type
        if user.user_type == 'vcse':
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'vcse') | 
                (_Notification.target_group == 'all'),
                _Notification.is_read == False
            ).all()
        elif user.user_type == 'school':
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'school') | 
                (_Notification.target_group == 'all'),
                _Notification.type == 'discounted_item',
                _Notification.is_read == False
            ).all()
        elif user.user_type == 'recipient':
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'recipient') | 
                (_Notification.target_group == 'all'),
                _Notification.type == 'discounted_item',
                _Notification.is_read == False
            ).all()
        elif user.user_type == 'admin':
            notifications = _Notification.query.filter(
                (_Notification.target_group == 'admin') | 
                (_Notification.target_group == 'all'),
                _Notification.is_read == False
            ).all()
        else:
            notifications = []
        
        for notification in notifications:
            notification.is_read = True
        
        _db.session.commit()
        
        return jsonify({'message': f'Marked {len(notifications)} notifications as read'}), 200
        
    except Exception as e:
        _db.session.rollback()
        return jsonify({'error': f'Failed to mark notifications as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/preferences', methods=['GET'])
def get_notification_preferences():
    """Get notification preferences for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        preferences = _NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Create default preferences
            preferences = _NotificationPreference(
                user_id=user_id,
                sound_enabled=True,
                email_enabled=True
            )
            _db.session.add(preferences)
            _db.session.commit()
        
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
        
        preferences = _NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            preferences = _NotificationPreference(user_id=user_id)
            _db.session.add(preferences)
        
        if 'sound_enabled' in data:
            preferences.sound_enabled = data['sound_enabled']
        if 'email_enabled' in data:
            preferences.email_enabled = data['email_enabled']
        
        preferences.updated_at = datetime.utcnow()
        _db.session.commit()
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': preferences.to_dict()
        }), 200
        
    except Exception as e:
        _db.session.rollback()
        return jsonify({'error': f'Failed to update preferences: {str(e)}'}), 500


def init_socketio(socketio_instance):
    """Initialize WebSocket event handlers"""
    
    @socketio_instance.on('connect')
    def handle_connect():
        """Handle client connection"""
        user_id = session.get('user_id')
        if user_id:
            user = _User.query.get(user_id)
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
            user = _User.query.get(user_id)
            if user:
                room = f"{user.user_type}_room"
                leave_room(room)
    
    return socketio_instance


def broadcast_new_item_notification(socketio_instance, item_type, shop_id, item_id, item_name, shop_name, quantity, item_description='', shop_address=''):
    """
    Broadcast a new item notification to appropriate user groups via WebSocket and Email
    
    Args:
        socketio_instance: Flask-SocketIO instance
        item_type: 'discount' or 'free'
        shop_id: ID of the shop
        item_id: ID of the item
        item_name: Name of the item
        shop_name: Name of the shop
        quantity: Quantity available
        item_description: Description of the item (optional)
        shop_address: Address of the shop (optional)
    """
    print(f"\n🔔 === NOTIFICATION BROADCAST STARTED ===")
    print(f"Item: {item_name} | Type: {item_type} | Shop: {shop_name}")
    
    try:
        from email_service import email_service
        print(f"✅ Email service imported successfully")
        
        if item_type == 'discount':
            # Discounted items go to recipients, schools, VCFSEs, and admins
            notification_type = 'discounted_item'
            target_groups = ['recipient', 'school', 'vcse', 'admin']
            message = f"New discounted item available: {item_name} at {shop_name}"
        else:  # free
            # Free items go to VCFSEs and admins immediately
            # Recipients get notified after 5 hours if item is still available
            notification_type = 'free_item'
            target_groups = ['vcse', 'admin']
            message = f"New free item available for collection: {item_name} at {shop_name}"
            
            # Schedule delayed notification for recipients (5 hours later)
            import threading
            def send_delayed_recipient_notification():
                import time
                time.sleep(5 * 60 * 60)  # Wait 5 hours
                
                # Check if item is still available
                from models import SurplusItem as _SurplusItem
                item = _SurplusItem.query.get(item_id)
                if item and item.status == 'available':
                    # Send notification to recipients and schools
                    recipient_message = f"Free item now available for recipients: {item_name} at {shop_name}"
                    
                    for recipient_group in ['recipient', 'school']:
                        recipient_notification = create_notification(
                            notification_type='free_item_delayed',
                            shop_id=shop_id,
                            item_id=item_id,
                            target_group=recipient_group,
                            message=recipient_message,
                            item_name=item_name,
                            shop_name=shop_name,
                            quantity=quantity
                        )
                        
                        if recipient_notification:
                            # Broadcast via WebSocket
                            room = f"{recipient_group}_room"
                            try:
                                socketio_instance.emit('new_item_notification', recipient_notification.to_dict(), room=room)
                            except:
                                pass
                            
                            # Send emails
                            users = _User.query.filter_by(user_type=recipient_group).all()
                            for user in users:
                                pref = _NotificationPreference.query.filter_by(user_id=user.id).first()
                                if not pref or pref.email_enabled:
                                    try:
                                        user_name = user.first_name or user.email.split('@')[0]
                                        email_service.send_new_item_notification(
                                            user_email=user.email,
                                            user_name=user_name,
                                            item_name=item_name,
                                            item_type='free',
                                            quantity=quantity,
                                            shop_name=shop_name,
                                            shop_address=shop_address,
                                            item_description=item_description
                                        )
                                    except:
                                        pass
            
            # Start delayed notification thread
            delayed_thread = threading.Thread(target=send_delayed_recipient_notification)
            delayed_thread.daemon = True
            delayed_thread.start()
        
        print(f"📢 Target groups: {', '.join(target_groups)}")
        print(f"📝 Message: {message}")
        
        # Create notification in database and send to users
        total_notifications_created = 0
        total_emails_sent = 0
        total_websocket_broadcasts = 0
        
        for target_group in target_groups:
            print(f"\n👥 Processing target group: {target_group}")
            
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
                total_notifications_created += 1
                print(f"✅ Database notification created (ID: {notification.id})")
                
                # Broadcast via WebSocket to the appropriate room
                room = f"{target_group}_room"
                try:
                    socketio_instance.emit('new_item_notification', notification.to_dict(), room=room)
                    total_websocket_broadcasts += 1
                    print(f"📡 WebSocket broadcast sent to room: {room}")
                except Exception as ws_error:
                    print(f"❌ WebSocket broadcast failed for {room}: {str(ws_error)}")
                
                # Send email notifications to users in this group
                # Get all users of this type who have email notifications enabled
                users = _User.query.filter_by(user_type=target_group).all()
                print(f"📊 Found {len(users)} users in group '{target_group}'")
                
                for user in users:
                    # Check if user has email notifications enabled (default: True)
                    pref = _NotificationPreference.query.filter_by(user_id=user.id).first()
                    if not pref or pref.email_enabled:
                        try:
                            user_name = user.first_name or user.email.split('@')[0]
                            print(f"  📧 Sending email to: {user.email} ({user_name})")
                            email_service.send_new_item_notification(
                                user_email=user.email,
                                user_name=user_name,
                                item_name=item_name,
                                item_type=item_type,
                                quantity=quantity,
                                shop_name=shop_name,
                                shop_address=shop_address,
                                item_description=item_description
                            )
                            total_emails_sent += 1
                            print(f"  ✅ Email sent successfully to {user.email}")
                        except Exception as email_error:
                            print(f"  ❌ Failed to send email to {user.email}: {str(email_error)}")
                    else:
                        print(f"  ⏭️ Skipping {user.email} (email notifications disabled)")
            else:
                print(f"❌ Failed to create notification for group: {target_group}")
        
        print(f"\n🎯 === NOTIFICATION BROADCAST SUMMARY ===")
        print(f"📦 Database notifications created: {total_notifications_created}")
        print(f"📡 WebSocket broadcasts sent: {total_websocket_broadcasts}")
        print(f"📧 Emails sent: {total_emails_sent}")
        print(f"✅ Broadcast completed successfully\n")
        
        return True
    except Exception as e:
        print(f"\n❌❌❌ ERROR broadcasting notification: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

