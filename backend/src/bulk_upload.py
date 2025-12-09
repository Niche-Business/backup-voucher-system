"""
Bulk recipient upload functionality for VCFSE and Schools
"""
from flask import Blueprint, request, jsonify, session, send_file
from werkzeug.security import generate_password_hash
import csv
import io
import secrets
from datetime import datetime

bulk_upload_bp = Blueprint('bulk_upload', __name__)

def parse_csv_recipients(csv_file):
    """Parse CSV file and validate recipient data"""
    try:
        # Read CSV content
        stream = io.StringIO(csv_file.stream.read().decode("UTF8"), newline=None)
        csv_reader = csv.DictReader(stream)
        
        recipients = []
        errors = []
        row_num = 1  # Start from 1 (header is row 0)
        
        required_fields = ['email', 'first_name', 'last_name']
        
        for row in csv_reader:
            row_num += 1
            row_errors = []
            
            # Validate required fields
            for field in required_fields:
                if not row.get(field) or not row.get(field).strip():
                    row_errors.append(f"Missing {field}")
            
            # Validate email format
            email = row.get('email', '').strip()
            if email and '@' not in email:
                row_errors.append("Invalid email format")
            
            if row_errors:
                errors.append({
                    'row': row_num,
                    'errors': row_errors,
                    'data': row
                })
            else:
                recipients.append({
                    'email': email.lower(),
                    'first_name': row.get('first_name', '').strip(),
                    'last_name': row.get('last_name', '').strip(),
                    'phone': row.get('phone', '').strip(),
                    'address': row.get('address', '').strip(),
                    'city': row.get('city', '').strip(),
                    'postcode': row.get('postcode', '').strip(),
                    'row': row_num
                })
        
        return {
            'success': True,
            'recipients': recipients,
            'errors': errors,
            'total_rows': row_num - 1
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to parse CSV: {str(e)}'
        }

@bulk_upload_bp.route('/api/vcse/bulk-upload-recipients', methods=['POST'])
def vcse_bulk_upload_recipients():
    """VCFSE organizations can bulk upload recipients via CSV"""
    from main import db, User, email_service
    
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user or user.user_type not in ['vcse', 'school']:
            return jsonify({'error': 'Only VCFSE organizations and schools can bulk upload recipients'}), 403
        
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Parse CSV
        parse_result = parse_csv_recipients(file)
        
        if not parse_result['success']:
            return jsonify({'error': parse_result['error']}), 400
        
        if parse_result['errors']:
            return jsonify({
                'error': 'CSV contains validation errors',
                'validation_errors': parse_result['errors'],
                'valid_count': len(parse_result['recipients']),
                'error_count': len(parse_result['errors'])
            }), 400
        
        # Check for duplicate emails in database
        recipients_data = parse_result['recipients']
        emails = [r['email'] for r in recipients_data]
        existing_users = User.query.filter(User.email.in_(emails)).all()
        existing_emails = {u.email for u in existing_users}
        
        duplicates = []
        new_recipients = []
        
        for recipient_data in recipients_data:
            if recipient_data['email'] in existing_emails:
                duplicates.append({
                    'row': recipient_data['row'],
                    'email': recipient_data['email'],
                    'reason': 'Email already registered'
                })
            else:
                new_recipients.append(recipient_data)
        
        if not new_recipients:
            return jsonify({
                'error': 'No new recipients to add',
                'duplicates': duplicates
            }), 400
        
        # Create recipients
        created_recipients = []
        failed_recipients = []
        
        for recipient_data in new_recipients:
            try:
                # Generate random password
                temp_password = secrets.token_urlsafe(12)
                verification_token = secrets.token_urlsafe(32)
                
                # Create recipient user
                recipient = User(
                    email=recipient_data['email'],
                    password_hash=generate_password_hash(temp_password),
                    first_name=recipient_data['first_name'],
                    last_name=recipient_data['last_name'],
                    phone=recipient_data.get('phone', ''),
                    address=recipient_data.get('address', ''),
                    city=recipient_data.get('city', ''),
                    postcode=recipient_data.get('postcode', ''),
                    user_type='recipient',
                    verification_token=verification_token,
                    is_verified=False,
                    account_status='ACTIVE'
                )
                
                db.session.add(recipient)
                db.session.flush()  # Get the ID without committing
                
                # Send welcome email with credentials
                try:
                    email_service.send_welcome_email(
                        recipient.email,
                        recipient.first_name,
                        temp_password,
                        verification_token
                    )
                except Exception as email_error:
                    print(f"Failed to send welcome email to {recipient.email}: {email_error}")
                    # Continue anyway - user can reset password
                
                created_recipients.append({
                    'id': recipient.id,
                    'email': recipient.email,
                    'name': f"{recipient.first_name} {recipient.last_name}",
                    'row': recipient_data['row']
                })
                
            except Exception as e:
                failed_recipients.append({
                    'row': recipient_data['row'],
                    'email': recipient_data['email'],
                    'error': str(e)
                })
        
        # Commit all successful creations
        if created_recipients:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully created {len(created_recipients)} recipients',
            'created': created_recipients,
            'duplicates': duplicates,
            'failed': failed_recipients,
            'summary': {
                'total_rows': parse_result['total_rows'],
                'created': len(created_recipients),
                'duplicates': len(duplicates),
                'failed': len(failed_recipients)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Bulk upload failed: {str(e)}'}), 500

@bulk_upload_bp.route('/api/vcse/download-recipient-template', methods=['GET'])
def download_recipient_template():
    """Download CSV template for bulk recipient upload"""
    try:
        # Create CSV template
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['email', 'first_name', 'last_name', 'phone', 'address', 'city', 'postcode'])
        
        # Write example rows
        writer.writerow([
            'john.doe@example.com',
            'John',
            'Doe',
            '07123456789',
            '123 Main Street',
            'Northampton',
            'NN1 1AA'
        ])
        writer.writerow([
            'jane.smith@example.com',
            'Jane',
            'Smith',
            '07987654321',
            '456 High Street',
            'Kettering',
            'NN16 8AA'
        ])
        
        # Convert to bytes
        output.seek(0)
        
        # Create BytesIO object for send_file
        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8'))
        mem.seek(0)
        
        return send_file(
            mem,
            mimetype='text/csv',
            as_attachment=True,
            download_name='recipient_upload_template.csv'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate template: {str(e)}'}), 500
