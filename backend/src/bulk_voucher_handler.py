"""
Bulk Voucher Issuance Handler
Handles CSV upload and bulk voucher creation for VCFSE organizations
"""

import csv
import io
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import secrets

def parse_csv_recipients(csv_file):
    """
    Parse CSV file and extract recipient information
    Expected columns: first_name, last_name, email, phone, address, voucher_value
    """
    try:
        # Read CSV file
        csv_data = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        recipients = []
        errors = []
        line_number = 1  # Start from 1 (header is line 0)
        
        for row in csv_reader:
            line_number += 1
            
            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'phone', 'voucher_value']
            missing_fields = [field for field in required_fields if not row.get(field)]
            
            if missing_fields:
                errors.append({
                    'line': line_number,
                    'error': f'Missing required fields: {", ".join(missing_fields)}',
                    'data': row
                })
                continue
            
            # Validate email format
            email = row.get('email', '').strip()
            if '@' not in email:
                errors.append({
                    'line': line_number,
                    'error': 'Invalid email format',
                    'data': row
                })
                continue
            
            # Validate voucher value
            try:
                voucher_value = float(row.get('voucher_value', 0))
                if voucher_value <= 0:
                    raise ValueError('Voucher value must be positive')
            except ValueError as e:
                errors.append({
                    'line': line_number,
                    'error': f'Invalid voucher value: {str(e)}',
                    'data': row
                })
                continue
            
            # Add valid recipient
            recipients.append({
                'first_name': row.get('first_name', '').strip(),
                'last_name': row.get('last_name', '').strip(),
                'email': email,
                'phone': row.get('phone', '').strip(),
                'address': row.get('address', '').strip(),
                'voucher_value': voucher_value,
                'line_number': line_number
            })
        
        return {
            'success': True,
            'recipients': recipients,
            'errors': errors,
            'total_count': len(recipients),
            'error_count': len(errors)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to parse CSV: {str(e)}',
            'recipients': [],
            'errors': []
        }


def create_bulk_vouchers(db, User, Voucher, recipients, issuer_id, expiry_days=30, selected_shops=None):
    """
    Create vouchers for multiple recipients
    Returns success/failure results for each recipient
    """
    from flask import current_app
    
    results = {
        'successful': [],
        'failed': [],
        'total_value': 0,
        'success_count': 0,
        'failure_count': 0
    }
    
    issuer = User.query.get(issuer_id)
    if not issuer:
        return {'error': 'Issuer not found'}
    
    # Calculate total required balance
    total_required = sum(r['voucher_value'] for r in recipients)
    
    if issuer.allocated_balance < total_required:
        return {
            'error': f'Insufficient balance. Required: £{total_required:.2f}, Available: £{issuer.allocated_balance:.2f}'
        }
    
    # Process each recipient
    for recipient_data in recipients:
        try:
            # Find or create recipient
            recipient = User.query.filter_by(email=recipient_data['email']).first()
            
            if not recipient:
                # Create new recipient account
                temp_password = secrets.token_urlsafe(12)
                recipient = User(
                    email=recipient_data['email'],
                    password_hash=generate_password_hash(temp_password),
                    first_name=recipient_data['first_name'],
                    last_name=recipient_data['last_name'],
                    phone=recipient_data['phone'],
                    address=recipient_data.get('address', ''),
                    user_type='recipient',
                    is_verified=True,
                    is_active=True
                )
                db.session.add(recipient)
                db.session.flush()
            
            # Generate voucher code
            voucher_code = generate_voucher_code()
            
            # Calculate expiry date
            expiry_date = datetime.utcnow().date() + timedelta(days=expiry_days)
            
            # Create voucher
            import json
            vendor_restrictions = None
            if selected_shops and selected_shops != 'all':
                vendor_restrictions = json.dumps(selected_shops)
            
            voucher = Voucher(
                code=voucher_code,
                value=recipient_data['voucher_value'],
                recipient_id=recipient.id,
                issued_by=issuer_id,
                expiry_date=expiry_date,
                status='active',
                vendor_restrictions=vendor_restrictions,
                original_recipient_id=recipient.id,
                reassignment_count=0
            )
            
            db.session.add(voucher)
            
            # Deduct from issuer balance
            issuer.allocated_balance -= recipient_data['voucher_value']
            
            results['successful'].append({
                'line_number': recipient_data.get('line_number'),
                'email': recipient_data['email'],
                'name': f"{recipient_data['first_name']} {recipient_data['last_name']}",
                'voucher_code': voucher_code,
                'value': recipient_data['voucher_value']
            })
            
            results['total_value'] += recipient_data['voucher_value']
            results['success_count'] += 1
            
        except Exception as e:
            results['failed'].append({
                'line_number': recipient_data.get('line_number'),
                'email': recipient_data['email'],
                'name': f"{recipient_data['first_name']} {recipient_data['last_name']}",
                'error': str(e)
            })
            results['failure_count'] += 1
    
    # Commit all changes
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to commit vouchers: {str(e)}'}
    
    return results


def generate_voucher_code():
    """Generate a unique 10-character voucher code"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
