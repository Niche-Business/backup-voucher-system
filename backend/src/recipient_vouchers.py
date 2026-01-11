# Recipient Voucher Management Routes

@app.route('/api/recipient/vouchers', methods=['GET'])
def get_recipient_vouchers():
    """Get all vouchers assigned to the logged-in recipient"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(user_id)
        if not user or user.user_type != 'recipient':
            return jsonify({'error': 'Recipient access required'}), 403
        
        # Get all vouchers for this recipient
        vouchers = Voucher.query.filter_by(recipient_id=user_id).order_by(
            Voucher.created_at.desc()
        ).all()
        
        vouchers_data = []
        for voucher in vouchers:
            issued_by_user = User.query.get(voucher.issued_by)
            redeemed_vendor = User.query.get(voucher.redeemed_by_vendor) if voucher.redeemed_by_vendor else None
            
            vouchers_data.append({
                'id': voucher.id,
                'code': voucher.code,
                'value': float(voucher.value),
                'status': voucher.status,
                'expiry_date': voucher.expiry_date.isoformat() if voucher.expiry_date else None,
                'created_at': voucher.created_at.isoformat() if voucher.created_at else None,
                'redeemed_at': voucher.redeemed_at.isoformat() if voucher.redeemed_at else None,
                'issued_by': {
                    'name': issued_by_user.organization_name or f"{issued_by_user.first_name} {issued_by_user.last_name}",
                    'type': issued_by_user.user_type
                } if issued_by_user else None,
                'redeemed_by': {
                    'name': redeemed_vendor.shop_name or f"{redeemed_vendor.first_name} {redeemed_vendor.last_name}"
                } if redeemed_vendor else None,
                'vendor_restrictions': voucher.vendor_restrictions
            })
        
        # Calculate summary statistics
        active_vouchers = [v for v in vouchers if v.status == 'active']
        redeemed_vouchers = [v for v in vouchers if v.status == 'redeemed']
        expired_vouchers = [v for v in vouchers if v.status == 'expired']
        
        total_value = sum(float(v.value) for v in active_vouchers)
        total_redeemed = sum(float(v.value) for v in redeemed_vouchers)
        
        return jsonify({
            'vouchers': vouchers_data,
            'summary': {
                'total_vouchers': len(vouchers),
                'active_count': len(active_vouchers),
                'redeemed_count': len(redeemed_vouchers),
                'expired_count': len(expired_vouchers),
                'total_active_value': total_value,
                'total_redeemed_value': total_redeemed
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get vouchers: {str(e)}'}), 500


@app.route('/api/recipient/vouchers/<int:voucher_id>/qr', methods=['GET'])
def get_voucher_qr_code(voucher_id):
    """Generate QR code for a voucher"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        voucher = Voucher.query.get(voucher_id)
        if not voucher or voucher.recipient_id != user_id:
            return jsonify({'error': 'Voucher not found'}), 404
        
        # Generate QR code data (voucher code + validation token)
        import hashlib
        import time
        timestamp = int(time.time())
        validation_token = hashlib.sha256(f"{voucher.code}{timestamp}{voucher.id}".encode()).hexdigest()[:16]
        
        qr_data = {
            'voucher_code': voucher.code,
            'voucher_id': voucher.id,
            'value': float(voucher.value),
            'token': validation_token,
            'timestamp': timestamp
        }
        
        return jsonify({
            'qr_data': qr_data,
            'qr_string': f"BAKUP-{voucher.code}-{validation_token}"
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate QR code: {str(e)}'}), 500
