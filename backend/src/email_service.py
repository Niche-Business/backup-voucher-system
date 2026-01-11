"""
SendGrid Email Service for BAK UP E-Voucher System
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

class EmailService:
    def __init__(self):
        # Get SendGrid API key
        self.api_key = os.environ.get('SENDGRID_API_KEY', '').strip()
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@backup-voucher.com').strip()
        self.app_url = os.environ.get('APP_URL', 'https://backup-voucher-system-1.onrender.com')
        self.enabled = bool(self.api_key and len(self.api_key) > 20)
        
        if not self.enabled:
            print("⚠️  SendGrid not configured. Set SENDGRID_API_KEY environment variable.")
            print(f"   SENDGRID_API_KEY: {'SET' if self.api_key else 'NOT SET'}")
            print(f"   API Key Length: {len(self.api_key) if self.api_key else 0} characters")
        else:
            print("✓ SendGrid configured successfully")
            print(f"   From Email: {self.from_email}")
            print(f"   API Key Length: {len(self.api_key)} characters")
    
    def send_email(self, to_email, subject, html_content):
        """Send an email using SendGrid"""
        if not self.enabled:
            print(f"⚠️  Email not sent to {to_email} (SendGrid not configured)")
            print(f"   Subject: {subject}")
            return False
            
        try:
            message = Mail(
                from_email=Email(self.from_email, 'BAK UP E-Voucher System'),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            # SendGrid returns 202 for successful email acceptance
            if response.status_code == 202:
                print(f"✓ Email sent to {to_email}: {subject} (Status: {response.status_code})")
                return True
            else:
                print(f"✗ SendGrid returned error status {response.status_code} for {to_email}")
                print(f"   Response body: {response.body}")
                print(f"   Response headers: {response.headers}")
                return False
            
        except Exception as e:
            print(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user_email, user_name, user_type):
        """Send welcome email to new users"""
        user_type_names = {
            'recipient': 'Voucher Recipient',
            'vendor': 'Food Vendor',
            'vcse': 'VCFSE Organization',
            'school': 'School/Care Organization',
            'admin': 'Administrator'
        }
        
        role_name = user_type_names.get(user_type, 'User')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to BAK UP E-Voucher System!</h1>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Welcome to the BAK UP E-Voucher System! Your account has been successfully created as a <strong>{role_name}</strong>.</p>
                    <p>You can now log in to access your dashboard and start using the system.</p>
                    <a href="{self.app_url}" class="button">Go to Dashboard</a>
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    <p>Best regards,<br>BAK UP E-Voucher Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 BAK UP E-Voucher System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, f"Welcome to BAK UP E-Voucher System - {role_name}", html_content)
    
    def send_password_reset_email(self, user_email, user_name, reset_token):
        """Send password reset email with secure link"""
        reset_link = f"{self.app_url}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .warning {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>We received a request to reset your password for your BAK UP account.</p>
                    
                    <p>Click the button below to create a new password:</p>
                    <a href="{reset_link}" class="button">Reset Password</a>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px; font-family: monospace; font-size: 12px;">{reset_link}</p>
                    
                    <div class="warning">
                        <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
                        <ul style="margin: 10px 0 0 0;">
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                    </div>
                    
                    <p>Best regards,<br>BAK UP E-Voucher Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 BAK UP E-Voucher System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, "🔒 Password Reset Request - BAK UP E-Voucher System", html_content)
    
    def send_new_item_notification(self, user_email, user_name, item_name, item_type, quantity, shop_name, shop_address='', item_description=''):
        """Send notification email when new item is posted"""
        item_type_emoji = '🆓' if item_type == 'free' else '🎁'
        item_type_text = 'Free Item' if item_type == 'free' else 'Discounted Item'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
                .item-box {{ background-color: white; padding: 20px; border-left: 4px solid #FF9800; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{item_type_emoji} New {item_type_text} Available!</h1>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>A new {item_type_text.lower()} has just been posted and is available now!</p>
                    <div class="item-box">
                        <h2 style="margin-top: 0; color: #FF9800;">{item_name}</h2>
                        <p><strong>Shop:</strong> {shop_name}</p>
                        {f'<p><strong>Location:</strong> {shop_address}</p>' if shop_address else ''}
                        <p><strong>Quantity Available:</strong> {quantity}</p>
                        <p><strong>Type:</strong> {item_type_text}</p>
                        {f'<p><strong>Description:</strong> {item_description}</p>' if item_description else ''}
                    </div>
                    <p>Log in now to view details and place your order before it's gone!</p>
                    <a href="{self.app_url}" class="button">View Item Now</a>
                    <p>Best regards,<br>BAK UP E-Voucher Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 BAK UP E-Voucher System. All rights reserved.</p>
                    <p>You're receiving this email because you have notifications enabled in your account settings.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, f"🔔 New {item_type_text}: {item_name}", html_content)
    
    def send_voucher_issued_email(self, recipient_email, recipient_name, voucher_code, voucher_value, expiry_date):
        """Send email when voucher is issued to recipient"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
                .voucher-box {{ background-color: white; padding: 30px; border: 3px dashed #4CAF50; margin: 20px 0; text-align: center; }}
                .voucher-code {{ font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 3px; font-family: monospace; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Your Voucher is Ready!</h1>
                </div>
                <div class="content">
                    <p>Hello {recipient_name},</p>
                    <p>Great news! A new food voucher has been issued to you.</p>
                    <div class="voucher-box">
                        <p style="margin: 0; color: #666;">Your Voucher Code</p>
                        <div class="voucher-code">{voucher_code}</div>
                        <p style="margin: 10px 0 0 0;"><strong>Value:</strong> £{voucher_value:.2f}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Expires:</strong> {expiry_date}</p>
                    </div>
                    <p>You can use this voucher at any participating local food shop. Simply show your voucher code at checkout.</p>
                    <a href="{self.app_url}" class="button">View My Vouchers</a>
                    <p><strong>Important:</strong> Please use your voucher before the expiry date.</p>
                    <p>Best regards,<br>BAK UP E-Voucher Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 BAK UP E-Voucher System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(recipient_email, f"🎉 Your Food Voucher: £{voucher_value:.2f}", html_content)

# Create global instance
email_service = EmailService()
