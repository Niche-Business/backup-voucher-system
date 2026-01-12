# Redemption Request Approval Endpoints
# These endpoints handle recipient approval/rejection of redemption requests

@app.route('/api/recipient/redemption-requests', methods=['GET'])
def get_recipient_redemption_requests():
    """Get all pending redemption requests for the logged-in recipient"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(user_id)
        if not user or user.user_type != 'recipient':
            return jsonify({'error': 'Recipient access required'}), 403
        
        # Get all pending requests for this recipient
        requests = RedemptionRequest.query.filter_by(
            recipient_id=user_id,
            status='pending'
        ).order_by(RedemptionRequest.created_at.desc()).all()
        
        # Auto-expire requests older than 5 minutes
        from datetime import datetime
        now = datetime.now()
        expired_count = 0
        
        for req in requests:
            if req.expires_at and now > req.expires_at:
                req.status = 'expired'
                expired_count += 1
        
        if expired_count > 0:
            db.session.commit()
        
        # Re-query to get only active pending requests
        active_requests = [r for r in requests if r.status == 'pending']
        
        # Format response
        requests_data = []
        for req in active_requests:
            vendor = User.query.get(req.vendor_id)
            shop = VendorShop.query.get(req.shop_id)
            voucher = Voucher.query.get(req.voucher_id)
            
            requests_data.append({
                'id': req.id,
                'amount': float(req.amount),
                'voucher_code': voucher.code if voucher else 'N/A',
                'current_voucher_balance': float(voucher.value) if voucher else 0.0,
                'remaining_after': round(float(voucher.value) - float(req.amount), 2) if voucher else 0.0,
                'shop_name': shop.shop_name if shop else 'Unknown Shop',
                'shop_address': shop.address if shop else 'N/A',
                'vendor_name': f"{vendor.first_name} {vendor.last_name}" if vendor else 'Unknown Vendor',
                'created_at': req.created_at.isoformat() if req.created_at else None,
                'expires_at': req.expires_at.isoformat() if req.expires_at else None,
                'time_remaining_seconds': int((req.expires_at - now).total_seconds()) if req.expires_at and req.expires_at > now else 0
            })
        
        return jsonify({
            'requests': requests_data,
            'total': len(requests_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch redemption requests: {str(e)}'}), 500


@app.route('/api/recipient/redemption-requests/<int:request_id>/respond', methods=['POST'])
def respond_to_redemption_request(request_id):
    """Recipient approves or rejects a redemption request"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(user_id)
        if not user or user.user_type != 'recipient':
            return jsonify({'error': 'Recipient access required'}), 403
        
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        rejection_reason = data.get('reason', '')
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400
        
        # Get redemption request
        redemption_req = RedemptionRequest.query.get(request_id)
        
        if not redemption_req:
            return jsonify({'error': 'Redemption request not found'}), 404
        
        # Verify this request belongs to the logged-in recipient
        if redemption_req.recipient_id != user_id:
            return jsonify({'error': 'Unauthorized to respond to this request'}), 403
        
        # Check if request is still pending
        if redemption_req.status != 'pending':
            return jsonify({'error': f'Request is no longer pending (status: {redemption_req.status})'}), 400
        
        # Check if request has expired
        from datetime import datetime
        if redemption_req.expires_at and datetime.now() > redemption_req.expires_at:
            redemption_req.status = 'expired'
            db.session.commit()
            return jsonify({'error': 'Request has expired'}), 400
        
        # Get voucher
        voucher = Voucher.query.get(redemption_req.voucher_id)
        if not voucher:
            return jsonify({'error': 'Voucher not found'}), 404
        
        # Get vendor and shop
        vendor = User.query.get(redemption_req.vendor_id)
        shop = VendorShop.query.get(redemption_req.shop_id)
        
        if action == 'approve':
            # Process redemption
            current_voucher_value = float(voucher.value)
            redemption_amount = float(redemption_req.amount)
            
            # Validate amount still valid
            if redemption_amount > current_voucher_value:
                return jsonify({'error': f'Redemption amount £{redemption_amount:.2f} exceeds current voucher balance £{current_voucher_value:.2f}'}), 400
            
            # Deduct amount from voucher
            new_voucher_balance = round(current_voucher_value - redemption_amount, 2)
            voucher.value = new_voucher_balance
            
            # Mark as fully redeemed if balance is zero
            if new_voucher_balance <= 0:
                voucher.status = 'redeemed'
                voucher.redeemed_at = datetime.now()
            
            voucher.redeemed_by_vendor = redemption_req.vendor_id
            voucher.redeemed_at_shop_id = redemption_req.shop_id
            
            # Update vendor balance
            if vendor:
                current_balance = float(vendor.balance) if vendor.balance else 0.0
                vendor.balance = round(current_balance + redemption_amount, 2)
            
            # Update request status
            redemption_req.status = 'approved'
            redemption_req.responded_at = datetime.now()
            
            db.session.commit()
            
            # Send notifications
            from notifications_system import broadcast_redemption_approved_notification
            broadcast_redemption_approved_notification(
                vendor_id=vendor.id if vendor else None,
                recipient_id=user_id,
                shop_name=shop.shop_name if shop else 'Shop',
                amount=redemption_amount,
                voucher_code=voucher.code,
                new_balance=new_voucher_balance
            )
            
            # Send SMS to vendor
            if vendor and vendor.phone:
                approval_sms = f"""BAK UP Redemption Approved\n\nYour redemption request for £{redemption_amount:.2f} has been approved by the recipient.\n\nVoucher: {voucher.code}\nNew balance: £{vendor.balance:.2f}\n\nBAK UP Team"""
                sms_service.send_sms(vendor.phone, approval_sms)
            
            # Send email receipt to recipient
            if user.email:
                email_service.send_redemption_receipt_email(
                    user.email,
                    f"{user.first_name} {user.last_name}",
                    voucher.code,
                    redemption_amount,
                    new_voucher_balance,
                    shop.shop_name if shop else 'Local Shop'
                )
            
            return jsonify({
                'message': 'Redemption approved successfully',
                'voucher_code': voucher.code,
                'redeemed_amount': redemption_amount,
                'remaining_balance': new_voucher_balance,
                'shop_name': shop.shop_name if shop else 'N/A'
            }), 200
            
        else:  # action == 'reject'
            # Reject redemption request
            redemption_req.status = 'rejected'
            redemption_req.responded_at = datetime.now()
            redemption_req.rejection_reason = rejection_reason
            
            db.session.commit()
            
            # Send notification to vendor
            from notifications_system import broadcast_redemption_rejected_notification
            broadcast_redemption_rejected_notification(
                vendor_id=vendor.id if vendor else None,
                shop_name=shop.shop_name if shop else 'Shop',
                amount=redemption_req.amount,
                voucher_code=voucher.code,
                reason=rejection_reason
            )
            
            # Send SMS to vendor
            if vendor and vendor.phone:
                rejection_sms = f"""BAK UP Redemption Rejected\n\nYour redemption request for £{redemption_req.amount:.2f} was rejected by the recipient.\n\nVoucher: {voucher.code}\n"""
                if rejection_reason:
                    rejection_sms += f"Reason: {rejection_reason}\n\n"
                rejection_sms += "BAK UP Team"
                sms_service.send_sms(vendor.phone, rejection_sms)
            
            return jsonify({
                'message': 'Redemption request rejected',
                'voucher_code': voucher.code,
                'amount': float(redemption_req.amount)
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to respond to redemption request: {str(e)}'}), 500
