"""
SMS Service Module for BAK UP Voucher System
Handles SMS notifications via Twilio
"""

import os

# Try to import Twilio, but don't fail if it's not available
try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    Client = None
    TwilioRestException = Exception

class SMSService:
    """Service for sending SMS notifications via Twilio"""
    
    def __init__(self):
        """Initialize Twilio client with credentials from environment variables"""
        self.account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        self.auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        self.from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        # Check if Twilio library is available
        if not TWILIO_AVAILABLE:
            self.client = None
            self.enabled = False
            print("WARNING: Twilio library not installed. SMS service disabled.")
            return
        
        # Initialize client only if credentials are available
        if self.account_sid and self.auth_token and self.from_number:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("WARNING: Twilio credentials not configured. SMS service disabled.")
    
    def send_sms(self, to_number, message):
        """
        Send SMS to a phone number
        
        Args:
            to_number (str): Recipient phone number (E.164 format recommended, e.g., +447123456789)
            message (str): SMS message content (max 1600 characters)
        
        Returns:
            dict: Result with 'success' boolean and 'message' or 'error'
        """
        if not self.enabled:
            return {
                'success': False,
                'error': 'SMS service not configured'
            }
        
        # Validate phone number format
        if not to_number:
            return {
                'success': False,
                'error': 'Phone number is required'
            }
        
        # Ensure phone number starts with + (E.164 format)
        if not to_number.startswith('+'):
            # Assume UK number if no country code
            to_number = '+44' + to_number.lstrip('0')
        
        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            return {
                'success': True,
                'message_sid': message_obj.sid,
                'status': message_obj.status
            }
        
        except TwilioRestException as e:
            error_msg = e.msg if hasattr(e, 'msg') else str(e)
            print(f"Twilio error: {error_msg}")
            return {
                'success': False,
                'error': f'Failed to send SMS: {error_msg}'
            }
        
        except Exception as e:
            print(f"SMS error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to send SMS: {str(e)}'
            }
    
    def send_voucher_code(self, phone_number, voucher_code, recipient_name, value):
        """
        Send voucher code via SMS
        
        Args:
            phone_number (str): Recipient phone number
            voucher_code (str): Voucher code
            recipient_name (str): Recipient name
            value (float): Voucher value
        """
        message = f"""BAK UP Voucher

Hello {recipient_name},

Your food voucher code: {voucher_code}
Value: £{value:.2f}

Show this code at participating vendors to redeem.

Thank you,
BAK UP Team"""
        
        return self.send_sms(phone_number, message)
    
    def send_surplus_alert(self, phone_number, vcse_name, vendor_name, item_name, quantity):
        """
        Send surplus food alert to VCFSE
        
        Args:
            phone_number (str): VCFSE contact phone number
            vcse_name (str): VCFSE organization name
            vendor_name (str): Vendor shop name
            item_name (str): Surplus item name
            quantity (int): Available quantity
        """
        message = f"""BAK UP - Surplus Food Alert

Hello {vcse_name},

New surplus food available:
- Item: {item_name}
- Quantity: {quantity}
- Vendor: {vendor_name}

Log in to claim: https://backup-voucher-system.onrender.com/vcse

BAK UP Team"""
        
        return self.send_sms(phone_number, message)
    
    def send_collection_notification(self, phone_number, vendor_name, vcse_name, item_name, quantity):
        """
        Send collection notification to vendor when VCFSE claims surplus
        
        Args:
            phone_number (str): Vendor contact phone number
            vendor_name (str): Vendor shop name
            vcse_name (str): VCFSE organization name
            item_name (str): Surplus item name
            quantity (int): Claimed quantity
        """
        message = f"""BAK UP - Collection Notice

Hello {vendor_name},

{vcse_name} has claimed:
- Item: {item_name}
- Quantity: {quantity}

Please prepare for collection.

BAK UP Team"""
        
        return self.send_sms(phone_number, message)
    
    def send_voucher_redemption_alert(self, phone_number, vendor_name, voucher_code, value):
        """
        Send redemption notification to vendor
        
        Args:
            phone_number (str): Vendor contact phone number
            vendor_name (str): Vendor shop name
            voucher_code (str): Redeemed voucher code
            value (float): Voucher value
        """
        message = f"""BAK UP - Voucher Redeemed

Hello {vendor_name},

Voucher {voucher_code} (£{value:.2f}) has been redeemed at your shop.

Check your dashboard for details.

BAK UP Team"""
        
        return self.send_sms(phone_number, message)
    
    def send_password_reset_code(self, phone_number, user_name, reset_code):
        """
        Send password reset code via SMS
        
        Args:
            phone_number (str): User phone number
            user_name (str): User name
            reset_code (str): Password reset code
        """
        message = f"""BAK UP - Password Reset

Hello {user_name},

Your password reset code: {reset_code}

This code expires in 15 minutes.

If you didn't request this, please ignore.

BAK UP Team"""
        
        return self.send_sms(phone_number, message)

# Create global SMS service instance
sms_service = SMSService()
