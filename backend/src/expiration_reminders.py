"""
Voucher Expiration Reminder System
Automatically sends email reminders to recipients about expiring vouchers
"""

from datetime import datetime, timedelta
from flask import Blueprint
import logging

expiration_bp = Blueprint('expiration', __name__)
logger = logging.getLogger(__name__)

# Global references (will be set during initialization)
db = None
Voucher = None
User = None
email_service = None


def init_expiration_reminders(app_db, voucher_model, user_model, email_svc):
    """Initialize the expiration reminders system with database models"""
    global db, Voucher, User, email_service
    db = app_db
    Voucher = voucher_model
    User = user_model
    email_service = email_svc
    logger.info("Expiration reminders system initialized")


def check_and_send_expiration_reminders():
    """
    Check for vouchers expiring soon and send reminder emails
    This function should be called periodically (e.g., daily via cron job)
    
    Sends reminders for vouchers expiring in:
    - 7 days
    - 3 days
    - 1 day
    """
    if not all([db, Voucher, User, email_service]):
        logger.error("Expiration reminders system not properly initialized")
        return {
            'success': False,
            'error': 'System not initialized'
        }
    
    try:
        now = datetime.utcnow()
        reminders_sent = 0
        
        # Define reminder thresholds
        reminder_periods = [
            {'days': 7, 'label': '7 days'},
            {'days': 3, 'label': '3 days'},
            {'days': 1, 'label': '1 day (tomorrow)'}
        ]
        
        for period in reminder_periods:
            # Calculate the target expiry date
            target_date_start = now + timedelta(days=period['days'])
            target_date_end = target_date_start + timedelta(hours=23, minutes=59, seconds=59)
            
            # Find active vouchers expiring within this window
            expiring_vouchers = Voucher.query.filter(
                Voucher.status == 'active',
                Voucher.expiry_date >= target_date_start,
                Voucher.expiry_date <= target_date_end
            ).all()
            
            logger.info(f"Found {len(expiring_vouchers)} vouchers expiring in {period['label']}")
            
            # Group vouchers by recipient
            vouchers_by_recipient = {}
            for voucher in expiring_vouchers:
                recipient_id = voucher.recipient_id
                if recipient_id not in vouchers_by_recipient:
                    vouchers_by_recipient[recipient_id] = []
                vouchers_by_recipient[recipient_id].append(voucher)
            
            # Send reminder emails to each recipient
            for recipient_id, vouchers in vouchers_by_recipient.items():
                recipient = User.query.get(recipient_id)
                if not recipient or not recipient.email:
                    logger.warning(f"Recipient {recipient_id} not found or has no email")
                    continue
                
                # Send reminder email
                success = send_expiration_reminder_email(
                    recipient=recipient,
                    vouchers=vouchers,
                    days_until_expiry=period['days']
                )
                
                if success:
                    reminders_sent += 1
                    logger.info(f"Sent {period['label']} reminder to {recipient.email} for {len(vouchers)} voucher(s)")
        
        return {
            'success': True,
            'reminders_sent': reminders_sent,
            'message': f'Successfully sent {reminders_sent} expiration reminder(s)'
        }
    
    except Exception as e:
        logger.error(f"Error in check_and_send_expiration_reminders: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def send_expiration_reminder_email(recipient, vouchers, days_until_expiry):
    """
    Send an expiration reminder email to a recipient
    
    Args:
        recipient: User object for the recipient
        vouchers: List of Voucher objects expiring soon
        days_until_expiry: Number of days until vouchers expire
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Calculate total value
        total_value = sum(v.value for v in vouchers)
        
        # Determine urgency level
        if days_until_expiry == 1:
            urgency = "URGENT"
            time_phrase = "tomorrow"
        elif days_until_expiry == 3:
            urgency = "Important"
            time_phrase = "in 3 days"
        else:
            urgency = "Reminder"
            time_phrase = "in 7 days"
        
        # Build voucher list for email
        voucher_list_html = ""
        for voucher in vouchers:
            voucher_list_html += f"""
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">{voucher.code}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">£{voucher.value:.2f}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">{voucher.expiry_date.strftime('%d %B %Y')}</td>
            </tr>
            """
        
        # Email subject
        subject = f"{urgency}: Your BAK UP voucher(s) expire {time_phrase}"
        
        # Email body (HTML)
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 20px; }}
                .urgent {{ background-color: #f44336; }}
                .important {{ background-color: #FF9800; }}
                .voucher-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .cta-button {{ display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header {'urgent' if days_until_expiry == 1 else 'important' if days_until_expiry == 3 else ''}">
                    <h1>⏰ Voucher Expiration Reminder</h1>
                </div>
                <div class="content">
                    <p>Dear {recipient.first_name},</p>
                    
                    <p><strong>This is {urgency.lower()} reminder that you have {len(vouchers)} voucher(s) worth £{total_value:.2f} expiring {time_phrase}.</strong></p>
                    
                    <p>Please use your voucher(s) before they expire to avoid losing this valuable support.</p>
                    
                    <h3>Your Expiring Vouchers:</h3>
                    <table class="voucher-table">
                        <thead>
                            <tr style="background-color: #4CAF50; color: white;">
                                <th style="padding: 10px; border: 1px solid #ddd;">Voucher Code</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Value</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {voucher_list_html}
                        </tbody>
                    </table>
                    
                    <h3>How to Use Your Vouchers:</h3>
                    <ol>
                        <li>Visit any participating local shop</li>
                        <li>Show your voucher code to the vendor</li>
                        <li>The vendor will validate and redeem your voucher</li>
                        <li>Select items up to your voucher value</li>
                    </ol>
                    
                    <p style="text-align: center;">
                        <a href="https://backup-voucher-system-1.onrender.com" class="cta-button">
                            View My Vouchers
                        </a>
                    </p>
                    
                    <p><strong>Need help?</strong> Contact us at prince@bakupcic.co.uk or call 01933698347</p>
                </div>
                <div class="footer">
                    <p>This is an automated reminder from BAK UP E-Voucher System</p>
                    <p>BAK UP CIC | Enterprise Centre, Warth Park, Raunds NN9 6GR</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        Voucher Expiration Reminder
        
        Dear {recipient.first_name},
        
        This is {urgency.lower()} reminder that you have {len(vouchers)} voucher(s) worth £{total_value:.2f} expiring {time_phrase}.
        
        Your Expiring Vouchers:
        """
        
        for voucher in vouchers:
            text_body += f"\n- Code: {voucher.code} | Value: £{voucher.value:.2f} | Expires: {voucher.expiry_date.strftime('%d %B %Y')}"
        
        text_body += """
        
        How to Use Your Vouchers:
        1. Visit any participating local shop
        2. Show your voucher code to the vendor
        3. The vendor will validate and redeem your voucher
        4. Select items up to your voucher value
        
        Need help? Contact us at prince@bakupcic.co.uk or call 01933698347
        
        ---
        BAK UP CIC | Enterprise Centre, Warth Park, Raunds NN9 6GR
        """
        
        # Send email using the email service
        result = email_service.send_email(
            to_email=recipient.email,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )
        
        return result.get('success', False)
    
    except Exception as e:
        logger.error(f"Error sending expiration reminder to {recipient.email}: {str(e)}")
        return False


@expiration_bp.route('/api/admin/trigger-expiration-check', methods=['POST'])
def trigger_expiration_check():
    """
    Admin endpoint to manually trigger expiration reminder check
    This can be called manually or set up as a cron job
    """
    from flask import jsonify, session
    
    # Check if user is admin
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Forbidden - Admin access required'}), 403
    
    # Run the expiration check
    result = check_and_send_expiration_reminders()
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@expiration_bp.route('/api/admin/expiring-vouchers-preview', methods=['GET'])
def get_expiring_vouchers_preview():
    """
    Get a preview of vouchers that will expire soon (for admin dashboard)
    """
    from flask import jsonify, session, request
    
    # Check if user is admin
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Forbidden - Admin access required'}), 403
    
    try:
        days = int(request.args.get('days', 7))  # Default to 7 days
        now = datetime.utcnow()
        target_date = now + timedelta(days=days)
        
        # Find active vouchers expiring within the specified days
        expiring_vouchers = Voucher.query.filter(
            Voucher.status == 'active',
            Voucher.expiry_date >= now,
            Voucher.expiry_date <= target_date
        ).all()
        
        # Group by recipient
        vouchers_by_recipient = {}
        for voucher in expiring_vouchers:
            recipient_id = voucher.recipient_id
            if recipient_id not in vouchers_by_recipient:
                recipient = User.query.get(recipient_id)
                vouchers_by_recipient[recipient_id] = {
                    'recipient_name': f"{recipient.first_name} {recipient.last_name}" if recipient else "Unknown",
                    'recipient_email': recipient.email if recipient else "N/A",
                    'vouchers': []
                }
            
            vouchers_by_recipient[recipient_id]['vouchers'].append({
                'code': voucher.code,
                'value': float(voucher.value),
                'expiry_date': voucher.expiry_date.strftime('%Y-%m-%d'),
                'days_until_expiry': (voucher.expiry_date - now).days
            })
        
        return jsonify({
            'success': True,
            'total_vouchers': len(expiring_vouchers),
            'total_recipients': len(vouchers_by_recipient),
            'data': list(vouchers_by_recipient.values())
        }), 200
    
    except Exception as e:
        logger.error(f"Error in get_expiring_vouchers_preview: {str(e)}")
        return jsonify({'error': str(e)}), 500
