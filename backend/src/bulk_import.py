"""
Bulk Voucher Import System
Allows admins to import multiple vouchers via CSV file
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
import csv
import io
import logging
from datetime import datetime
from decimal import Decimal
import os

logger = logging.getLogger(__name__)

bulk_import_bp = Blueprint('bulk_import', __name__)

# Global variables (will be initialized)
db = None
User = None
Voucher = None
email_service = None

ALLOWED_EXTENSIONS = {'csv', 'txt'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_voucher_data(row, row_number):
    """
    Validate a single voucher row
    
    Args:
        row: Dictionary containing voucher data
        row_number: Row number in CSV (for error reporting)
    
    Returns:
        dict: {
            'valid': bool,
            'errors': list of error messages,
            'warnings': list of warning messages,
            'data': cleaned data dictionary
        }
    """
    errors = []
    warnings = []
    data = {}
    
    # Required fields
    required_fields = ['recipient_email', 'amount', 'expiry_date']
    
    for field in required_fields:
        if field not in row or not row[field].strip():
            errors.append(f"Row {row_number}: Missing required field '{field}'")
    
    if errors:
        return {'valid': False, 'errors': errors, 'warnings': warnings, 'data': None}
    
    # Validate recipient email
    email = row['recipient_email'].strip().lower()
    if '@' not in email or '.' not in email:
        errors.append(f"Row {row_number}: Invalid email format '{email}'")
    else:
        data['recipient_email'] = email
    
    # Validate amount
    try:
        amount = Decimal(row['amount'].strip())
        if amount <= 0:
            errors.append(f"Row {row_number}: Amount must be positive (got {amount})")
        elif amount > 10000:
            warnings.append(f"Row {row_number}: Large amount detected (£{amount})")
        data['amount'] = float(amount)
    except (ValueError, TypeError):
        errors.append(f"Row {row_number}: Invalid amount '{row['amount']}'")
    
    # Validate expiry date
    try:
        expiry_str = row['expiry_date'].strip()
        # Try multiple date formats
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
            try:
                expiry_date = datetime.strptime(expiry_str, fmt)
                break
            except ValueError:
                continue
        else:
            raise ValueError("No valid date format found")
        
        # Check if date is in the future
        if expiry_date <= datetime.utcnow():
            errors.append(f"Row {row_number}: Expiry date must be in the future")
        
        data['expiry_date'] = expiry_date
    except (ValueError, TypeError):
        errors.append(f"Row {row_number}: Invalid date format '{row['expiry_date']}'. Use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY")
    
    # Optional fields
    data['description'] = row.get('description', '').strip()[:500]  # Limit to 500 chars
    data['category'] = row.get('category', 'General').strip()
    data['vendor_restrictions'] = row.get('vendor_restrictions', '').strip()
    
    # Validate category
    valid_categories = ['Food', 'Clothing', 'Education', 'Healthcare', 'General', 'Other']
    if data['category'] and data['category'] not in valid_categories:
        warnings.append(f"Row {row_number}: Unknown category '{data['category']}', using 'General'")
        data['category'] = 'General'
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'data': data
    }


def parse_csv_file(file_content):
    """
    Parse CSV file content
    
    Args:
        file_content: File content as string
    
    Returns:
        dict: {
            'success': bool,
            'rows': list of parsed rows,
            'errors': list of parsing errors
        }
    """
    try:
        # Detect delimiter
        sample = file_content[:1024]
        sniffer = csv.Sniffer()
        try:
            dialect = sniffer.sniff(sample, delimiters=',;\t')
        except:
            dialect = csv.excel
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(file_content), dialect=dialect)
        
        rows = []
        errors = []
        
        # Validate headers
        required_headers = {'recipient_email', 'amount', 'expiry_date'}
        optional_headers = {'description', 'category', 'vendor_restrictions'}
        
        if not reader.fieldnames:
            return {
                'success': False,
                'rows': [],
                'errors': ['CSV file is empty or has no headers']
            }
        
        headers = set(h.lower().strip() for h in reader.fieldnames if h)
        missing_headers = required_headers - headers
        
        if missing_headers:
            return {
                'success': False,
                'rows': [],
                'errors': [f"Missing required columns: {', '.join(missing_headers)}"]
            }
        
        # Parse rows
        for i, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
            # Normalize keys
            normalized_row = {k.lower().strip(): v for k, v in row.items() if k}
            
            # Skip empty rows
            if not any(normalized_row.values()):
                continue
            
            rows.append({
                'row_number': i,
                'data': normalized_row
            })
        
        if not rows:
            return {
                'success': False,
                'rows': [],
                'errors': ['CSV file contains no data rows']
            }
        
        return {
            'success': True,
            'rows': rows,
            'errors': []
        }
    
    except Exception as e:
        logger.error(f"Error parsing CSV: {str(e)}")
        return {
            'success': False,
            'rows': [],
            'errors': [f'Error parsing CSV file: {str(e)}']
        }


@bulk_import_bp.route('/api/admin/bulk-import/validate', methods=['POST'])
def validate_import():
    """
    Validate CSV file without importing
    Returns validation results and preview
    """
    try:
        # Check admin authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only CSV files are allowed'}), 400
        
        # Read file content
        try:
            file_content = file.read().decode('utf-8')
        except UnicodeDecodeError:
            try:
                file.seek(0)
                file_content = file.read().decode('latin-1')
            except:
                return jsonify({'error': 'Unable to read file. Please ensure it is a valid CSV file'}), 400
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB'}), 400
        
        # Parse CSV
        parse_result = parse_csv_file(file_content)
        
        if not parse_result['success']:
            return jsonify({
                'valid': False,
                'errors': parse_result['errors']
            }), 400
        
        # Validate each row
        validation_results = []
        total_errors = 0
        total_warnings = 0
        valid_count = 0
        
        for row_info in parse_result['rows']:
            result = validate_voucher_data(row_info['data'], row_info['row_number'])
            
            validation_results.append({
                'row_number': row_info['row_number'],
                'valid': result['valid'],
                'errors': result['errors'],
                'warnings': result['warnings'],
                'data': result['data']
            })
            
            if result['valid']:
                valid_count += 1
            
            total_errors += len(result['errors'])
            total_warnings += len(result['warnings'])
        
        # Check for duplicate emails in file
        emails = [r['data']['recipient_email'] for r in validation_results if r['valid']]
        duplicate_emails = set([e for e in emails if emails.count(e) > 1])
        
        if duplicate_emails:
            total_warnings += len(duplicate_emails)
            for result in validation_results:
                if result['valid'] and result['data']['recipient_email'] in duplicate_emails:
                    result['warnings'].append('Duplicate email in file - only first occurrence will be imported')
        
        return jsonify({
            'valid': total_errors == 0,
            'summary': {
                'total_rows': len(validation_results),
                'valid_rows': valid_count,
                'invalid_rows': len(validation_results) - valid_count,
                'total_errors': total_errors,
                'total_warnings': total_warnings
            },
            'results': validation_results[:100],  # Limit preview to 100 rows
            'has_more': len(validation_results) > 100
        }), 200
    
    except Exception as e:
        logger.error(f"Error validating import: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@bulk_import_bp.route('/api/admin/bulk-import/execute', methods=['POST'])
def execute_import():
    """
    Execute bulk import after validation
    Creates vouchers and sends notifications
    """
    try:
        # Check admin authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only CSV files are allowed'}), 400
        
        # Get options
        send_notifications = request.form.get('send_notifications', 'true').lower() == 'true'
        skip_duplicates = request.form.get('skip_duplicates', 'true').lower() == 'true'
        
        # Read file content
        try:
            file_content = file.read().decode('utf-8')
        except UnicodeDecodeError:
            try:
                file.seek(0)
                file_content = file.read().decode('latin-1')
            except:
                return jsonify({'error': 'Unable to read file. Please ensure it is a valid CSV file'}), 400
        
        # Parse CSV
        parse_result = parse_csv_file(file_content)
        
        if not parse_result['success']:
            return jsonify({
                'success': False,
                'errors': parse_result['errors']
            }), 400
        
        # Validate each row
        validation_results = []
        
        for row_info in parse_result['rows']:
            result = validate_voucher_data(row_info['data'], row_info['row_number'])
            if result['valid']:
                validation_results.append(result)
        
        if not validation_results:
            return jsonify({
                'success': False,
                'error': 'No valid rows to import'
            }), 400
        
        # Track processed emails to avoid duplicates
        processed_emails = set()
        
        # Import vouchers
        created_vouchers = []
        skipped_vouchers = []
        failed_vouchers = []
        
        for result in validation_results:
            try:
                data = result['data']
                email = data['recipient_email']
                
                # Check for duplicates in file
                if skip_duplicates and email in processed_emails:
                    skipped_vouchers.append({
                        'email': email,
                        'reason': 'Duplicate email in file'
                    })
                    continue
                
                processed_emails.add(email)
                
                # Find or create recipient
                recipient = User.query.filter_by(email=email).first()
                
                if not recipient:
                    # Create new recipient user
                    recipient = User(
                        email=email,
                        user_type='recipient',
                        name=email.split('@')[0],  # Use email prefix as name
                        verified=False
                    )
                    recipient.set_password('TempPass123!')  # Temporary password
                    db.session.add(recipient)
                    db.session.flush()  # Get user ID
                
                # Create voucher
                voucher = Voucher(
                    recipient_id=recipient.id,
                    amount=data['amount'],
                    expiry_date=data['expiry_date'],
                    description=data['description'] or f"Voucher imported on {datetime.utcnow().strftime('%Y-%m-%d')}",
                    category=data['category'] or 'General',
                    status='active',
                    created_at=datetime.utcnow()
                )
                
                db.session.add(voucher)
                db.session.flush()  # Get voucher ID
                
                created_vouchers.append({
                    'voucher_id': voucher.id,
                    'recipient_email': email,
                    'amount': data['amount'],
                    'expiry_date': data['expiry_date'].strftime('%Y-%m-%d')
                })
                
                # Send notification email
                if send_notifications and email_service:
                    try:
                        email_service.send_email(
                            to_email=email,
                            subject='New Voucher Received - BAK UP E-Voucher System',
                            html_content=f"""
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2563eb;">New Voucher Received</h2>
                                <p>Dear {recipient.name},</p>
                                <p>You have received a new voucher:</p>
                                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p><strong>Amount:</strong> £{data['amount']:.2f}</p>
                                    <p><strong>Category:</strong> {data['category']}</p>
                                    <p><strong>Expiry Date:</strong> {data['expiry_date'].strftime('%d %B %Y')}</p>
                                    {f"<p><strong>Description:</strong> {data['description']}</p>" if data['description'] else ""}
                                </div>
                                <p>Please log in to your account to view and use your voucher.</p>
                                <p>Best regards,<br>BAK UP Team</p>
                            </div>
                            """
                        )
                    except Exception as e:
                        logger.error(f"Failed to send notification to {email}: {str(e)}")
            
            except Exception as e:
                logger.error(f"Failed to create voucher for {data['recipient_email']}: {str(e)}")
                failed_vouchers.append({
                    'email': data['recipient_email'],
                    'reason': str(e)
                })
                continue
        
        # Commit all changes
        try:
            db.session.commit()
            
            return jsonify({
                'success': True,
                'summary': {
                    'created': len(created_vouchers),
                    'skipped': len(skipped_vouchers),
                    'failed': len(failed_vouchers),
                    'notifications_sent': len(created_vouchers) if send_notifications else 0
                },
                'created_vouchers': created_vouchers,
                'skipped_vouchers': skipped_vouchers,
                'failed_vouchers': failed_vouchers
            }), 200
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to commit import: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to save vouchers: {str(e)}'
            }), 500
    
    except Exception as e:
        logger.error(f"Error executing import: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@bulk_import_bp.route('/api/admin/bulk-import/template', methods=['GET'])
def download_template():
    """
    Download CSV template for bulk import
    """
    try:
        # Create CSV template
        template = """recipient_email,amount,expiry_date,description,category,vendor_restrictions
example@email.com,50.00,2025-12-31,Christmas voucher,Food,
another@email.com,25.50,2025-06-30,Summer voucher,General,Vendor1;Vendor2
"""
        
        return template, 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=voucher_import_template.csv'
        }
    
    except Exception as e:
        logger.error(f"Error generating template: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


def init_bulk_import(database, user_model, voucher_model, email_svc=None):
    """
    Initialize bulk import system
    
    Args:
        database: SQLAlchemy database instance
        user_model: User model class
        voucher_model: Voucher model class
        email_svc: Email service instance (optional)
    """
    global db, User, Voucher, email_service
    
    db = database
    User = user_model
    Voucher = voucher_model
    email_service = email_svc
    
    logger.info("Bulk import system initialized")
