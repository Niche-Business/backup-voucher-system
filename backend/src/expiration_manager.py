"""
Voucher Expiration Management System
Handles automated expiration checks and alerts
"""

from datetime import datetime, timedelta
from sqlalchemy import and_

def check_and_expire_vouchers(db, Voucher):
    """
    Check all active vouchers and mark expired ones
    Returns count of expired vouchers
    """
    try:
        today = datetime.utcnow().date()
        
        # Find all active vouchers that have passed their expiry date
        expired_vouchers = Voucher.query.filter(
            and_(
                Voucher.status == 'active',
                Voucher.expiry_date < today
            )
        ).all()
        
        count = 0
        for voucher in expired_vouchers:
            voucher.status = 'expired'
            count += 1
        
        if count > 0:
            db.session.commit()
        
        return {
            'success': True,
            'expired_count': count
        }
        
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'error': str(e)
        }


def get_expiring_soon_vouchers(Voucher, User, days_ahead=7):
    """
    Get vouchers expiring within the specified number of days
    Returns list of vouchers with recipient information
    """
    try:
        today = datetime.utcnow().date()
        future_date = today + timedelta(days=days_ahead)
        
        expiring_vouchers = Voucher.query.filter(
            and_(
                Voucher.status == 'active',
                Voucher.expiry_date >= today,
                Voucher.expiry_date <= future_date
            )
        ).all()
        
        results = []
        for voucher in expiring_vouchers:
            recipient = User.query.get(voucher.recipient_id) if voucher.recipient_id else None
            issuer = User.query.get(voucher.issued_by) if voucher.issued_by else None
            
            days_remaining = (voucher.expiry_date - today).days
            
            results.append({
                'voucher_code': voucher.code,
                'value': float(voucher.value),
                'expiry_date': voucher.expiry_date.isoformat(),
                'days_remaining': days_remaining,
                'recipient': {
                    'id': recipient.id if recipient else None,
                    'name': f"{recipient.first_name} {recipient.last_name}" if recipient else 'Unknown',
                    'email': recipient.email if recipient else None,
                    'phone': recipient.phone if recipient else None
                } if recipient else None,
                'issuer': {
                    'id': issuer.id if issuer else None,
                    'name': issuer.organization_name if issuer else 'Unknown'
                } if issuer else None
            })
        
        return {
            'success': True,
            'vouchers': results,
            'count': len(results)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'vouchers': [],
            'count': 0
        }


def send_expiration_alerts(vouchers, sms_service, email_service):
    """
    Send SMS and email alerts for expiring vouchers
    """
    sent_count = 0
    failed_count = 0
    
    for voucher_info in vouchers:
        recipient = voucher_info.get('recipient')
        if not recipient:
            continue
        
        try:
            days_remaining = voucher_info['days_remaining']
            voucher_code = voucher_info['voucher_code']
            value = voucher_info['value']
            
            # Send SMS alert
            if recipient.get('phone'):
                sms_message = f"""BAK UP Voucher Expiring Soon!

Your voucher {voucher_code} (\u00a3{value:.2f}) expires in {days_remaining} day{'s' if days_remaining != 1 else ''}.

Please use it before {voucher_info['expiry_date']}.

BAK UP Team"""
                
                sms_result = sms_service.send_sms(recipient['phone'], sms_message)
                if sms_result.get('success'):
                    sent_count += 1
            
            # Send email alert
            if recipient.get('email'):
                # Email sending would go here
                # email_service.send_expiration_alert_email(...)
                pass
                
        except Exception as e:
            print(f"Failed to send alert for voucher {voucher_info.get('voucher_code')}: {str(e)}")
            failed_count += 1
    
    return {
        'sent_count': sent_count,
        'failed_count': failed_count
    }


def get_expired_vouchers_report(Voucher, User, start_date=None, end_date=None):
    """
    Generate report of expired vouchers within date range
    """
    try:
        query = Voucher.query.filter(Voucher.status == 'expired')
        
        if start_date:
            query = query.filter(Voucher.expiry_date >= start_date)
        if end_date:
            query = query.filter(Voucher.expiry_date <= end_date)
        
        expired_vouchers = query.all()
        
        results = []
        total_value = 0
        
        for voucher in expired_vouchers:
            recipient = User.query.get(voucher.recipient_id) if voucher.recipient_id else None
            issuer = User.query.get(voucher.issued_by) if voucher.issued_by else None
            
            total_value += float(voucher.value)
            
            results.append({
                'voucher_code': voucher.code,
                'value': float(voucher.value),
                'issued_date': voucher.created_at.isoformat() if hasattr(voucher, 'created_at') else None,
                'expiry_date': voucher.expiry_date.isoformat(),
                'recipient_name': f"{recipient.first_name} {recipient.last_name}" if recipient else 'Unknown',
                'recipient_email': recipient.email if recipient else None,
                'issuer_name': issuer.organization_name if issuer else 'Unknown'
            })
        
        return {
            'success': True,
            'vouchers': results,
            'count': len(results),
            'total_value': total_value
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'vouchers': [],
            'count': 0,
            'total_value': 0
        }
