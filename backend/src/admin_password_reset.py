"""
Admin Password Reset Functionality
Allows admins to reset passwords for any user type
"""

def create_admin_password_reset_endpoint(app, db, User, generate_password_hash, session, request, jsonify):
    """Create admin password reset endpoint"""
    
    @app.route('/api/admin/reset-user-password', methods=['POST'])
    def admin_reset_user_password():
        """Admin can reset password for any user"""
        try:
            admin_id = session.get('user_id')
            
            if not admin_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            admin = User.query.get(admin_id)
            if not admin or admin.user_type != 'admin':
                return jsonify({'error': 'Only admins can reset user passwords'}), 403
            
            data = request.get_json()
            user_id = data.get('user_id')
            new_password = data.get('new_password')
            
            if not user_id or not new_password:
                return jsonify({'error': 'User ID and new password are required'}), 400
            
            if len(new_password) < 8:
                return jsonify({'error': 'New password must be at least 8 characters long'}), 400
            
            # Get the user to reset
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Update password
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            
            return jsonify({
                'message': f'Password reset successfully for {user.first_name} {user.last_name} ({user.email})',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': f'{user.first_name} {user.last_name}',
                    'user_type': user.user_type
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to reset password: {str(e)}'}), 500
