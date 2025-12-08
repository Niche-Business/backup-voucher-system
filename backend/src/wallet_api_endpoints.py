"""
Wallet System API Endpoints for Schools/Care Organizations
These endpoints should be added to main.py
"""

# ============================================================================
# WALLET MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/school/wallet/balance', methods=['GET'])
def get_school_wallet_balance():
    """Get current wallet balance and summary for school/care organization"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        # Get transaction summary
        transactions = WalletTransaction.query.filter_by(user_id=user_id).all()
        
        total_credits = sum(t.amount for t in transactions if t.transaction_type == 'credit')
        total_debits = sum(t.amount for t in transactions if t.transaction_type == 'debit')
        total_allocations = sum(t.amount for t in transactions if t.transaction_type == 'allocation')
        
        # Get voucher statistics
        vouchers_issued = Voucher.query.filter_by(
            issued_by_user_id=user_id,
            deducted_from_wallet=True
        ).all()
        
        total_vouchers_value = sum(v.value for v in vouchers_issued)
        active_vouchers_value = sum(v.value for v in vouchers_issued if v.status == 'active')
        redeemed_vouchers_value = sum(v.value for v in vouchers_issued if v.status == 'redeemed')
        
        return jsonify({
            'current_balance': float(user.balance),
            'allocated_balance': float(user.allocated_balance),
            'total_credits': float(total_credits),
            'total_debits': float(total_debits),
            'total_allocations': float(total_allocations),
            'total_transactions': len(transactions),
            'voucher_stats': {
                'total_issued': len(vouchers_issued),
                'total_value': float(total_vouchers_value),
                'active_value': float(active_vouchers_value),
                'redeemed_value': float(redeemed_vouchers_value)
            },
            'last_transaction': transactions[-1].created_at.isoformat() if transactions else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/school/wallet/transactions', methods=['GET'])
def get_school_wallet_transactions():
    """Get wallet transaction history for school/care organization"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        # Get query parameters for filtering
        transaction_type = request.args.get('type')  # credit, debit, allocation
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = WalletTransaction.query.filter_by(user_id=user_id)
        
        if transaction_type:
            query = query.filter_by(transaction_type=transaction_type)
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results
        transactions = query.order_by(WalletTransaction.created_at.desc()).limit(limit).offset(offset).all()
        
        transactions_data = []
        for t in transactions:
            transactions_data.append({
                'id': t.id,
                'transaction_type': t.transaction_type,
                'amount': float(t.amount),
                'balance_before': float(t.balance_before),
                'balance_after': float(t.balance_after),
                'description': t.description,
                'reference': t.reference,
                'payment_method': t.payment_method,
                'payment_reference': t.payment_reference,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
                'created_by': t.created_by
            })
        
        return jsonify({
            'transactions': transactions_data,
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/school/wallet/add-funds', methods=['POST'])
def school_add_funds():
    """
    DEPRECATED: This endpoint is no longer available.
    Schools and Care Organizations must use Stripe payment integration to load funds.
    Use /api/payment/create-checkout-session instead.
    """
    return jsonify({
        'error': 'Manual fund loading is not allowed',
        'message': 'Schools and Care Organizations must load funds via debit/credit card payment',
        'redirect': '/api/payment/create-checkout-session'
    }), 403


@app.route('/api/school/vouchers/issue', methods=['POST'])
def school_issue_voucher():
    """Issue a voucher from school/care organization wallet"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        data = request.json
        voucher_value = float(data.get('value', 0))
        recipient_email = data.get('recipient_email')
        expiry_days = int(data.get('expiry_days', 90))
        assign_shop_method = data.get('assign_shop_method', 'recipient_to_choose')
        shop_id = data.get('shop_id')  # For specific shop assignment
        
        # Validation
        if voucher_value <= 0:
            return jsonify({'error': 'Voucher value must be greater than 0'}), 400
        
        # Check wallet balance
        if user.balance < voucher_value:
            return jsonify({
                'error': 'Insufficient balance',
                'current_balance': float(user.balance),
                'required': float(voucher_value),
                'shortfall': float(voucher_value - user.balance)
            }), 400
        
        # Find or create recipient
        recipient = None
        if recipient_email:
            recipient = User.query.filter_by(email=recipient_email).first()
            if not recipient:
                return jsonify({'error': f'Recipient not found: {recipient_email}'}), 404
        
        # Generate unique voucher code
        import random
        import string
        voucher_code = 'BAK' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
        
        # Calculate expiry date
        from datetime import timedelta
        expiry_date = (datetime.utcnow() + timedelta(days=expiry_days)).date()
        
        # Create wallet transaction (debit)
        balance_before = user.balance
        balance_after = balance_before - voucher_value
        
        wallet_transaction = WalletTransaction(
            user_id=user_id,
            transaction_type='debit',
            amount=voucher_value,
            balance_before=balance_before,
            balance_after=balance_after,
            description=f'Voucher issued: {voucher_code}',
            reference=voucher_code,
            payment_method='wallet_deduction',
            status='completed',
            created_by=user_id
        )
        
        db.session.add(wallet_transaction)
        db.session.flush()  # Get transaction ID
        
        # Create voucher
        voucher = Voucher(
            code=voucher_code,
            value=voucher_value,
            recipient_id=recipient.id if recipient else None,
            issued_by=user_id,
            issued_by_user_id=user_id,
            expiry_date=expiry_date,
            status='active',
            assign_shop_method=assign_shop_method,
            deducted_from_wallet=True,
            wallet_transaction_id=wallet_transaction.id
        )
        
        if assign_shop_method == 'specific_shop' and shop_id:
            voucher.recipient_selected_shop_id = shop_id
        
        # Update user balance
        user.balance = balance_after
        
        db.session.add(voucher)
        db.session.commit()
        
        # Generate claim link
        claim_link = f"{request.host_url}claim-voucher?code={voucher_code}"
        
        # TODO: Send email to recipient
        
        return jsonify({
            'message': 'Voucher issued successfully',
            'voucher_code': voucher_code,
            'voucher_id': voucher.id,
            'claim_link': claim_link,
            'new_balance': float(balance_after),
            'amount_deducted': float(voucher_value),
            'transaction_id': wallet_transaction.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/school/vouchers', methods=['GET'])
def get_school_vouchers():
    """Get all vouchers issued by school/care organization"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        # Get query parameters
        status = request.args.get('status')  # active, redeemed, expired
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = Voucher.query.filter_by(issued_by_user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results
        vouchers = query.order_by(Voucher.created_at.desc()).limit(limit).offset(offset).all()
        
        vouchers_data = []
        for v in vouchers:
            vouchers_data.append({
                'id': v.id,
                'code': v.code,
                'value': float(v.value),
                'status': v.status,
                'recipient_email': v.recipient.email if v.recipient else None,
                'recipient_name': f"{v.recipient.first_name} {v.recipient.last_name}" if v.recipient else None,
                'expiry_date': v.expiry_date.isoformat(),
                'created_at': v.created_at.isoformat(),
                'redeemed_at': v.redeemed_at.isoformat() if v.redeemed_at else None,
                'deducted_from_wallet': v.deducted_from_wallet,
                'assign_shop_method': v.assign_shop_method
            })
        
        return jsonify({
            'vouchers': vouchers_data,
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/school/reports/funds-summary', methods=['GET'])
def get_school_funds_summary():
    """Get funds in/out summary for school/care organization"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        from datetime import timedelta
        
        # Get date range from query params
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get transactions in date range
        transactions = WalletTransaction.query.filter(
            WalletTransaction.user_id == user_id,
            WalletTransaction.created_at >= start_date
        ).all()
        
        # Calculate summary
        funds_in = sum(t.amount for t in transactions if t.transaction_type in ['credit', 'allocation'])
        funds_out = sum(t.amount for t in transactions if t.transaction_type == 'debit')
        
        # Group by date for chart data
        daily_summary = {}
        for t in transactions:
            date_key = t.created_at.date().isoformat()
            if date_key not in daily_summary:
                daily_summary[date_key] = {'credits': 0, 'debits': 0}
            
            if t.transaction_type in ['credit', 'allocation']:
                daily_summary[date_key]['credits'] += t.amount
            elif t.transaction_type == 'debit':
                daily_summary[date_key]['debits'] += t.amount
        
        return jsonify({
            'period_days': days,
            'start_date': start_date.isoformat(),
            'end_date': datetime.utcnow().isoformat(),
            'total_funds_in': float(funds_in),
            'total_funds_out': float(funds_out),
            'net_change': float(funds_in - funds_out),
            'current_balance': float(user.balance),
            'daily_summary': daily_summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/school/reports/voucher-spend', methods=['GET'])
def get_school_voucher_spend():
    """Get voucher spend analysis for school/care organization"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type not in ['school', 'vcse']:
        return jsonify({'error': 'Unauthorized - School/VCSE access only'}), 403
    
    try:
        from datetime import timedelta
        
        # Get date range
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get vouchers issued in date range
        vouchers = Voucher.query.filter(
            Voucher.issued_by_user_id == user_id,
            Voucher.created_at >= start_date,
            Voucher.deducted_from_wallet == True
        ).all()
        
        # Calculate statistics
        total_issued = len(vouchers)
        total_value = sum(v.value for v in vouchers)
        active_vouchers = [v for v in vouchers if v.status == 'active']
        redeemed_vouchers = [v for v in vouchers if v.status == 'redeemed']
        expired_vouchers = [v for v in vouchers if v.status == 'expired']
        
        return jsonify({
            'period_days': days,
            'start_date': start_date.isoformat(),
            'end_date': datetime.utcnow().isoformat(),
            'total_vouchers_issued': total_issued,
            'total_value_issued': float(total_value),
            'active_vouchers': {
                'count': len(active_vouchers),
                'value': float(sum(v.value for v in active_vouchers))
            },
            'redeemed_vouchers': {
                'count': len(redeemed_vouchers),
                'value': float(sum(v.value for v in redeemed_vouchers))
            },
            'expired_vouchers': {
                'count': len(expired_vouchers),
                'value': float(sum(v.value for v in expired_vouchers))
            },
            'redemption_rate': (len(redeemed_vouchers) / total_issued * 100) if total_issued > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ADMIN ENDPOINTS FOR SCHOOL WALLET MANAGEMENT
# ============================================================================

@app.route('/api/admin/school/<int:school_id>/allocate-funds', methods=['POST'])
def admin_allocate_funds_to_school():
    """Admin allocates funds to school/care organization"""
    admin_id = session.get('user_id')
    if not admin_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    admin_user = User.query.get(admin_id)
    if not admin_user or admin_user.user_type != 'admin':
        return jsonify({'error': 'Unauthorized - Admin access only'}), 403
    
    try:
        data = request.json
        amount = float(data.get('amount', 0))
        description = data.get('description', 'Admin allocation')
        
        # Validation
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Get school user
        school_user = User.query.get(school_id)
        if not school_user or school_user.user_type not in ['school', 'vcse']:
            return jsonify({'error': 'School/VCSE not found'}), 404
        
        # Create wallet transaction
        balance_before = school_user.balance
        balance_after = balance_before + amount
        
        transaction = WalletTransaction(
            user_id=school_id,
            transaction_type='allocation',
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description,
            payment_method='admin_allocation',
            status='completed',
            created_by=admin_id
        )
        
        # Update school balance
        school_user.balance = balance_after
        school_user.allocated_balance += amount
        
        db.session.add(transaction)
        db.session.commit()
        
        # TODO: Send notification email to school
        
        return jsonify({
            'message': 'Funds allocated successfully',
            'transaction_id': transaction.id,
            'new_balance': float(balance_after),
            'amount_allocated': float(amount)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
