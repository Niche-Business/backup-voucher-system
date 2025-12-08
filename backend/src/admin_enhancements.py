"""
Admin Portal Enhancement Endpoints
Provides advanced search, transaction filtering, broadcast messaging, and fund allocation
"""

from flask import jsonify, request, session
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, func
import json

def init_admin_enhancements(app, db, User, VendorShop, Voucher, Transaction, email_service):
    """
    Initialize admin enhancement routes
    """
    
    # ============================================
    # 1. GLOBAL SEARCH CAPABILITY
    # ============================================
    
    @app.route('/api/admin/global-search', methods=['GET'])
    def admin_global_search():
        """
        Universal search across VCFSE, Schools, and Local Shops
        Supports search by: name, email, town, ID, registration number
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get search query
            query = request.args.get('q', '').strip()
            if not query or len(query) < 2:
                return jsonify({'results': [], 'message': 'Search query too short'}), 200
            
            # Search across VCFSE Organizations
            vcse_results = User.query.filter(
                and_(
                    User.user_type == 'vcse',
                    or_(
                        User.organization_name.ilike(f'%{query}%'),
                        User.email.ilike(f'%{query}%'),
                        User.city.ilike(f'%{query}%'),
                        User.charity_commission_number.ilike(f'%{query}%'),
                        User.first_name.ilike(f'%{query}%'),
                        User.last_name.ilike(f'%{query}%')
                    )
                )
            ).all()
            
            # Search across Schools/Care Organizations
            school_results = User.query.filter(
                and_(
                    User.user_type == 'school',
                    or_(
                        User.organization_name.ilike(f'%{query}%'),
                        User.email.ilike(f'%{query}%'),
                        User.city.ilike(f'%{query}%'),
                        User.first_name.ilike(f'%{query}%'),
                        User.last_name.ilike(f'%{query}%')
                    )
                )
            ).all()
            
            # Search across Local Shops
            shop_results = VendorShop.query.filter(
                or_(
                    VendorShop.shop_name.ilike(f'%{query}%'),
                    VendorShop.city.ilike(f'%{query}%'),
                    VendorShop.town.ilike(f'%{query}%'),
                    VendorShop.postcode.ilike(f'%{query}%')
                )
            ).all()
            
            # Format results
            results = {
                'vcse': [{
                    'id': org.id,
                    'type': 'vcse',
                    'name': org.organization_name,
                    'email': org.email,
                    'city': org.city,
                    'charity_number': org.charity_commission_number,
                    'balance': float(org.balance) if org.balance else 0.0,
                    'contact': f"{org.first_name} {org.last_name}",
                    'created_at': org.created_at.isoformat() if org.created_at else None
                } for org in vcse_results],
                
                'schools': [{
                    'id': school.id,
                    'type': 'school',
                    'name': school.organization_name,
                    'email': school.email,
                    'city': school.city,
                    'balance': float(school.balance) if school.balance else 0.0,
                    'contact': f"{school.first_name} {school.last_name}",
                    'created_at': school.created_at.isoformat() if school.created_at else None
                } for school in school_results],
                
                'shops': [{
                    'id': shop.id,
                    'type': 'shop',
                    'name': shop.shop_name,
                    'town': shop.town,
                    'city': shop.city,
                    'address': shop.address,
                    'postcode': shop.postcode,
                    'phone': shop.phone,
                    'vendor_id': shop.vendor_id,
                    'created_at': shop.created_at.isoformat() if shop.created_at else None
                } for shop in shop_results]
            }
            
            total_results = len(results['vcse']) + len(results['schools']) + len(results['shops'])
            
            return jsonify({
                'results': results,
                'total_count': total_results,
                'query': query
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Search failed: {str(e)}'}), 500
    
    
    # ============================================
    # 2. TRANSACTION & SHOP DATA SEARCH
    # ============================================
    
    @app.route('/api/admin/transactions/search', methods=['GET'])
    def admin_transaction_search():
        """
        Advanced transaction search with multiple filters
        Filters: shop_name, shop_id, town, date_range, transaction_type, recipient_name, voucher_id
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get filter parameters
            shop_name = request.args.get('shop_name', '').strip()
            shop_id = request.args.get('shop_id', '').strip()
            town = request.args.get('town', '').strip()
            start_date = request.args.get('start_date', '').strip()
            end_date = request.args.get('end_date', '').strip()
            transaction_type = request.args.get('transaction_type', '').strip()
            recipient_name = request.args.get('recipient_name', '').strip()
            voucher_id = request.args.get('voucher_id', '').strip()
            
            # Build query
            query = Voucher.query
            
            # Apply filters
            if voucher_id:
                query = query.filter(Voucher.id == int(voucher_id))
            
            if transaction_type and transaction_type != 'all':
                query = query.filter(Voucher.status == transaction_type)
            
            if start_date:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Voucher.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(Voucher.created_at < end_dt)
            
            # Get all matching vouchers
            vouchers = query.order_by(Voucher.created_at.desc()).all()
            
            # Filter by shop, town, or recipient (requires joining with related tables)
            filtered_transactions = []
            for voucher in vouchers:
                # Get recipient info
                recipient = User.query.get(voucher.recipient_id) if voucher.recipient_id else None
                recipient_full_name = f"{recipient.first_name} {recipient.last_name}" if recipient else 'N/A'
                
                # Filter by recipient name
                if recipient_name and recipient_name.lower() not in recipient_full_name.lower():
                    continue
                
                # Get shop info (from redeemed_at_shop_id)
                shop = None
                shop_town = None
                shop_name_str = 'N/A'
                
                if voucher.redeemed_at_shop_id:
                    shop = VendorShop.query.get(voucher.redeemed_at_shop_id)
                    if shop:
                        shop_name_str = shop.shop_name
                        shop_town = shop.town
                
                # Filter by shop name
                if shop_name and shop_name.lower() not in shop_name_str.lower():
                    continue
                
                # Filter by shop ID
                if shop_id and str(voucher.redeemed_at_shop_id) != shop_id:
                    continue
                
                # Filter by town
                if town and (not shop_town or town.lower() not in shop_town.lower()):
                    continue
                
                # Get issuer info
                issuer = User.query.get(voucher.issued_by_user_id) if voucher.issued_by_user_id else None
                issuer_name = issuer.organization_name if issuer else 'N/A'
                
                filtered_transactions.append({
                    'transaction_id': voucher.id,
                    'voucher_code': voucher.code,
                    'shop_name': shop_name_str,
                    'shop_id': voucher.redeemed_at_shop_id,
                    'town': shop_town,
                    'recipient_name': recipient_full_name,
                    'recipient_id': voucher.recipient_id,
                    'amount': float(voucher.value),
                    'date': voucher.created_at.isoformat() if voucher.created_at else None,
                    'redeemed_date': voucher.redeemed_at.isoformat() if voucher.redeemed_at else None,
                    'status': voucher.status,
                    'issued_by': issuer_name,
                    'expiry_date': voucher.expiry_date.isoformat() if voucher.expiry_date else None
                })
            
            return jsonify({
                'transactions': filtered_transactions,
                'total_count': len(filtered_transactions),
                'filters_applied': {
                    'shop_name': shop_name,
                    'shop_id': shop_id,
                    'town': town,
                    'start_date': start_date,
                    'end_date': end_date,
                    'transaction_type': transaction_type,
                    'recipient_name': recipient_name,
                    'voucher_id': voucher_id
                }
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Transaction search failed: {str(e)}'}), 500
    
    
    @app.route('/api/admin/transactions/export', methods=['POST'])
    def admin_export_transactions():
        """
        Export transaction data to CSV/PDF/XLSX
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            transactions = data.get('transactions', [])
            export_format = data.get('format', 'csv')  # csv, pdf, xlsx
            
            # For now, return the data - frontend can handle export
            # In production, you might want to generate files server-side
            
            return jsonify({
                'message': 'Export data prepared',
                'format': export_format,
                'data': transactions,
                'count': len(transactions)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Export failed: {str(e)}'}), 500
    
    
    # ============================================
    # 3. ADMIN BROADCAST MESSAGING
    # ============================================
    
    @app.route('/api/admin/broadcast', methods=['POST'])
    def admin_broadcast_message():
        """
        Send broadcast messages to selected user groups
        Supports: VCFSE, Schools, Shops, Recipients (optional)
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            title = data.get('title', '').strip()
            body = data.get('body', '').strip()
            audiences = data.get('audiences', [])  # ['vcse', 'school', 'vendor', 'recipient']
            
            if not title or not body:
                return jsonify({'error': 'Title and body are required'}), 400
            
            if not audiences:
                return jsonify({'error': 'At least one audience must be selected'}), 400
            
            # Get recipients based on audience selection
            recipients = []
            
            if 'vcse' in audiences:
                vcse_users = User.query.filter_by(user_type='vcse', is_active=True).all()
                recipients.extend(vcse_users)
            
            if 'school' in audiences:
                school_users = User.query.filter_by(user_type='school', is_active=True).all()
                recipients.extend(school_users)
            
            if 'vendor' in audiences:
                vendor_users = User.query.filter_by(user_type='vendor', is_active=True).all()
                recipients.extend(vendor_users)
            
            if 'recipient' in audiences:
                recipient_users = User.query.filter_by(user_type='recipient', is_active=True).all()
                recipients.extend(recipient_users)
            
            if not recipients:
                return jsonify({'error': 'No recipients found for selected audiences'}), 400
            
            # Send emails
            sent_count = 0
            failed_count = 0
            
            for recipient in recipients:
                try:
                    # Send email using email service
                    email_result = email_service.send_broadcast_message(
                        recipient.email,
                        f"{recipient.first_name} {recipient.last_name}",
                        title,
                        body
                    )
                    
                    if email_result:
                        sent_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    print(f"Failed to send to {recipient.email}: {str(e)}")
                    failed_count += 1
            
            return jsonify({
                'message': 'Broadcast sent successfully',
                'sent_count': sent_count,
                'failed_count': failed_count,
                'total_recipients': len(recipients),
                'audiences': audiences
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Broadcast failed: {str(e)}'}), 500
    
    
    # ============================================
    # 4. ADMIN FUND ALLOCATION
    # ============================================
    
    @app.route('/api/admin/allocate-funds', methods=['POST'])
    def admin_allocate_funds():
        """
        Allocate funds to VCSE Organizations or Schools
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            organization_id = data.get('organization_id')
            organization_type = data.get('organization_type')  # 'vcse' or 'school'
            amount = data.get('amount')
            notes = data.get('notes', '')
            
            # Validate inputs
            if not organization_id or not organization_type or not amount:
                return jsonify({'error': 'Organization ID, type, and amount are required'}), 400
            
            try:
                amount = float(amount)
                if amount <= 0:
                    return jsonify({'error': 'Amount must be greater than 0'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid amount'}), 400
            
            # Get organization
            organization = User.query.get(organization_id)
            if not organization:
                return jsonify({'error': 'Organization not found'}), 404
            
            if organization.user_type not in ['vcse', 'school']:
                return jsonify({'error': 'Invalid organization type'}), 400
            
            # Get current balance
            current_balance = float(organization.balance) if organization.balance else 0.0
            
            # Allocate funds
            organization.balance = current_balance + amount
            organization.allocated_balance = float(organization.allocated_balance or 0.0) + amount
            
            # Create transaction record (if Transaction model exists)
            try:
                # Log the allocation
                allocation_record = {
                    'admin_id': user_id,
                    'organization_id': organization_id,
                    'organization_type': organization_type,
                    'amount': amount,
                    'notes': notes,
                    'timestamp': datetime.utcnow().isoformat()
                }
                # You might want to create a FundAllocation model to store these records
            except:
                pass
            
            db.session.commit()
            
            # Send notification email
            try:
                email_service.send_fund_allocation_notification(
                    organization.email,
                    f"{organization.first_name} {organization.last_name}",
                    organization.organization_name,
                    amount,
                    organization.balance
                )
            except Exception as e:
                print(f"Failed to send allocation email: {str(e)}")
            
            return jsonify({
                'message': 'Funds allocated successfully',
                'organization': {
                    'id': organization.id,
                    'name': organization.organization_name,
                    'type': organization.user_type,
                    'previous_balance': current_balance,
                    'allocated_amount': amount,
                    'new_balance': float(organization.balance)
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Fund allocation failed: {str(e)}'}), 500
    
    
    @app.route('/api/admin/allocation-history', methods=['GET'])
    def admin_get_allocation_history():
        """
        Get fund allocation history
        """
        try:
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(user_id)
            if not user or user.user_type != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get all organizations with allocated funds
            organizations = User.query.filter(
                and_(
                    User.user_type.in_(['vcse', 'school']),
                    User.allocated_balance > 0
                )
            ).all()
            
            history = [{
                'id': org.id,
                'name': org.organization_name,
                'type': org.user_type,
                'total_allocated': float(org.allocated_balance) if org.allocated_balance else 0.0,
                'current_balance': float(org.balance) if org.balance else 0.0,
                'email': org.email,
                'created_at': org.created_at.isoformat() if org.created_at else None
            } for org in organizations]
            
            return jsonify({
                'history': history,
                'total_count': len(history)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to get allocation history: {str(e)}'}), 500
    
    
    return app
