"""
VCSE Verification System for Admin Portal
Handles approval/rejection of VCSE organization registrations
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime

def init_vcse_verification(app, db, User, email_service):
    """Initialize VCSE verification endpoints"""
    
    @app.route('/api/admin/vcse-verifications/pending', methods=['GET'])
    def get_pending_vcse_verifications():
        """Get all VCSE registrations pending verification"""
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            admin = User.query.get(user_id)
            if not admin or admin.user_type != 'admin':
                return jsonify({'error': 'Unauthorized - Admin access required'}), 403
            
            # Get all VCSE users with PENDING_VERIFICATION status
            pending_vcses = User.query.filter_by(
                user_type='vcse',
                account_status='PENDING_VERIFICATION'
            ).order_by(User.created_at.desc()).all()
            
            vcse_list = []
            for vcse in pending_vcses:
                vcse_list.append({
                    'id': vcse.id,
                    'email': vcse.email,
                    'first_name': vcse.first_name,
                    'last_name': vcse.last_name,
                    'organization_name': vcse.organization_name,
                    'charity_commission_number': vcse.charity_commission_number,
                    'phone': vcse.phone,
                    'address': vcse.address,
                    'city': vcse.city,
                    'postcode': vcse.postcode,
                    'created_at': vcse.created_at.isoformat() if vcse.created_at else None,
                    'account_status': vcse.account_status
                })
            
            return jsonify({
                'pending_vcses': vcse_list,
                'count': len(vcse_list)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to fetch pending verifications: {str(e)}'}), 500
    
    @app.route('/api/admin/vcse-verifications/<int:vcse_id>/approve', methods=['POST'])
    def approve_vcse_verification(vcse_id):
        """Approve a VCSE organization registration"""
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            admin = User.query.get(user_id)
            if not admin or admin.user_type != 'admin':
                return jsonify({'error': 'Unauthorized - Admin access required'}), 403
            
            # Get the VCSE user
            vcse = User.query.get(vcse_id)
            if not vcse:
                return jsonify({'error': 'VCSE user not found'}), 404
            
            if vcse.user_type != 'vcse':
                return jsonify({'error': 'User is not a VCSE organization'}), 400
            
            if vcse.account_status != 'PENDING_VERIFICATION':
                return jsonify({'error': f'VCSE account is not pending verification (current status: {vcse.account_status})'}), 400
            
            # Update VCSE account status
            vcse.account_status = 'ACTIVE'
            vcse.verified_at = datetime.utcnow()
            vcse.verified_by_admin_id = user_id
            vcse.rejection_reason = None  # Clear any previous rejection reason
            
            db.session.commit()
            
            # Send approval email
            try:
                login_url = f"{email_service.app_url}"
                email_service.send_vcse_approval_email(
                    user_email=vcse.email,
                    user_name=f"{vcse.first_name} {vcse.last_name}",
                    organization_name=vcse.organization_name,
                    login_url=login_url
                )
            except Exception as email_error:
                print(f"Warning: Could not send approval email: {email_error}")
            
            return jsonify({
                'message': f'VCSE organization {vcse.organization_name} has been approved',
                'vcse_id': vcse.id,
                'organization_name': vcse.organization_name,
                'email': vcse.email,
                'account_status': 'ACTIVE'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to approve VCSE: {str(e)}'}), 500
    
    @app.route('/api/admin/vcse-verifications/<int:vcse_id>/reject', methods=['POST'])
    def reject_vcse_verification(vcse_id):
        """Reject a VCSE organization registration"""
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            admin = User.query.get(user_id)
            if not admin or admin.user_type != 'admin':
                return jsonify({'error': 'Unauthorized - Admin access required'}), 403
            
            data = request.get_json()
            rejection_reason = data.get('rejection_reason', 'Details do not match Charity Commission records')
            
            # Get the VCSE user
            vcse = User.query.get(vcse_id)
            if not vcse:
                return jsonify({'error': 'VCSE user not found'}), 404
            
            if vcse.user_type != 'vcse':
                return jsonify({'error': 'User is not a VCSE organization'}), 400
            
            if vcse.account_status != 'PENDING_VERIFICATION':
                return jsonify({'error': f'VCSE account is not pending verification (current status: {vcse.account_status})'}), 400
            
            # Update VCSE account status
            vcse.account_status = 'REJECTED'
            vcse.rejection_reason = rejection_reason
            vcse.verified_at = datetime.utcnow()
            vcse.verified_by_admin_id = user_id
            
            db.session.commit()
            
            # Send rejection email
            try:
                email_service.send_vcse_rejection_email(
                    user_email=vcse.email,
                    user_name=f"{vcse.first_name} {vcse.last_name}",
                    organization_name=vcse.organization_name,
                    rejection_reason=rejection_reason
                )
            except Exception as email_error:
                print(f"Warning: Could not send rejection email: {email_error}")
            
            return jsonify({
                'message': f'VCSE organization {vcse.organization_name} has been rejected',
                'vcse_id': vcse.id,
                'organization_name': vcse.organization_name,
                'email': vcse.email,
                'account_status': 'REJECTED',
                'rejection_reason': rejection_reason
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to reject VCSE: {str(e)}'}), 500
    
    @app.route('/api/admin/vcse-verifications/stats', methods=['GET'])
    def get_vcse_verification_stats():
        """Get statistics about VCSE verifications"""
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Not authenticated'}), 401
            
            admin = User.query.get(user_id)
            if not admin or admin.user_type != 'admin':
                return jsonify({'error': 'Unauthorized - Admin access required'}), 403
            
            pending_count = User.query.filter_by(
                user_type='vcse',
                account_status='PENDING_VERIFICATION'
            ).count()
            
            active_count = User.query.filter_by(
                user_type='vcse',
                account_status='ACTIVE'
            ).count()
            
            rejected_count = User.query.filter_by(
                user_type='vcse',
                account_status='REJECTED'
            ).count()
            
            return jsonify({
                'pending': pending_count,
                'active': active_count,
                'rejected': rejected_count,
                'total': pending_count + active_count + rejected_count
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500
    
    print("✓ VCSE Verification endpoints initialized")
