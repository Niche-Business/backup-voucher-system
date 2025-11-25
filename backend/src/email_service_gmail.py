"""
Gmail SMTP Email Service for BAK UP E-Voucher System
This service uses Gmail SMTP instead of SendGrid for easier setup
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    def __init__(self):
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        self.smtp_user = os.environ.get('GMAIL_USER')
        self.smtp_password = os.environ.get('GMAIL_APP_PASSWORD')
        self.from_email = os.environ.get('FROM_EMAIL', self.smtp_user)
        self.app_url = os.environ.get('APP_URL', 'https://backup-voucher-system.onrender.com')
        self.enabled = bool(self.smtp_user and self.smtp_password)
        
        if not self.enabled:
            print("⚠️  Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.")
        
    def send_email(self, to_email, subject, html_content):
        """Send an email using Gmail SMTP"""
        if not self.enabled:
            print(f"⚠️  Email not sent to {to_email} (SMTP not configured)")
            print(f"   Subject: {subject}")
            return False
            
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"BAK UP E-Voucher System <{self.from_email}>"
            message['To'] = to_email
            message['Subject'] = subject
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            # Connect to Gmail SMTP server
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
            
            print(f"✓ Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user_email, user_name, user_type):
        """Send welcome email to new users"""
        user_type_names = {
            'recipient': 'Voucher Recipient',
            'vendor': 'Food Vendor',
            'vcse': 'VCSE Organization',
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
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to BAK UP! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Thank you for joining the BAK UP E-Voucher System as a <strong>{role_name}</strong>.</p>
                    
                    <p>Your account has been successfully created and you can now access all the features available to you.</p>
                    
                    <h3>What's Next?</h3>
                    <ul>
                        <li>Log in to your dashboard</li>
                        <li>Complete your profile information</li>
                        <li>Start using the platform</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="{self.app_url}" class="button">Go to Dashboard</a>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                </div>
                <div class="footer">
                    <p>This email was sent by BAK UP E-Voucher System<br>
                    Connecting surplus food with those who need it most</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            subject=f"Welcome to BAK UP - Your {role_name} Account is Ready!",
            html_content=html_content
        )
    
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
                .header {{ background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .warning {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>We received a request to reset your password for your BAK UP account.</p>
                    
                    <p>Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset My Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul style="margin: 10px 0;">
                            <li>This link will expire in <strong>1 hour</strong></li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Your password will remain unchanged</li>
                        </ul>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #2196F3; font-size: 12px;">{reset_link}</p>
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                </div>
                <div class="footer">
                    <p>This email was sent by BAK UP E-Voucher System<br>
                    If you didn't request a password reset, please contact support immediately.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            subject="Reset Your BAK UP Password",
            html_content=html_content
        )

    def send_voucher_issued_email(self, recipient_email, recipient_name, voucher_code, amount, issuer_name):
        """Send email when a voucher is issued"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .voucher-code {{ 
                    background-color: #fff; 
                    border: 2px dashed #4CAF50; 
                    padding: 20px; 
                    text-align: center; 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #4CAF50;
                    margin: 20px 0;
                }}
                .amount {{ font-size: 24px; color: #FF9800; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Your BAK UP Voucher is Ready!</h1>
                </div>
                <div class="content">
                    <p>Dear {recipient_name},</p>
                    
                    <p>You have received a food voucher from <strong>{issuer_name}</strong>.</p>
                    
                    <div class="voucher-code">{voucher_code}</div>
                    
                    <p style="text-align: center;">
                        <span class="amount">£{amount:.2f}</span>
                    </p>
                    
                    <h3>How to Use Your Voucher:</h3>
                    <ol>
                        <li>Visit any participating local food shop</li>
                        <li>Select the items you need</li>
                        <li>Show your voucher code at checkout</li>
                        <li>The amount will be deducted from your voucher balance</li>
                    </ol>
                    
                    <p style="text-align: center;">
                        <a href="{self.app_url}" class="button">View Your Voucher</a>
                    </p>
                    
                    <p><strong>Important:</strong> Keep this code safe and only share it with authorized vendors.</p>
                </div>
                <div class="footer">
                    <p>BAK UP E-Voucher System - Connecting surplus food with those who need it most</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=recipient_email,
            subject=f"Your BAK UP Voucher Code: {voucher_code}",
            html_content=html_content
        )

    def send_redemption_receipt_email(self, recipient_email, recipient_name, voucher_code, amount_spent, remaining_balance, vendor_name):
        """Send email when voucher is redeemed"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .receipt {{ background-color: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; }}
                .amount {{ font-size: 20px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Voucher Redeemed</h1>
                </div>
                <div class="content">
                    <p>Dear {recipient_name},</p>
                    
                    <p>Your voucher has been successfully redeemed at <strong>{vendor_name}</strong>.</p>
                    
                    <div class="receipt">
                        <p><strong>Voucher Code:</strong> {voucher_code}</p>
                        <p><strong>Amount Spent:</strong> <span class="amount" style="color: #f44336;">-£{amount_spent:.2f}</span></p>
                        <p><strong>Remaining Balance:</strong> <span class="amount" style="color: #4CAF50;">£{remaining_balance:.2f}</span></p>
                        <p><strong>Vendor:</strong> {vendor_name}</p>
                    </div>
                    
                    <p>Thank you for using BAK UP!</p>
                </div>
                <div class="footer">
                    <p>BAK UP E-Voucher System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=recipient_email,
            subject="BAK UP Voucher Redeemed",
            html_content=html_content
        )

    def send_payout_request_notification(self, vendor_name, shop_name, amount):
        """Send notification to admin when payout is requested"""
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@bakup.com')
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .amount {{ font-size: 24px; font-weight: bold; color: #FF9800; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 New Payout Request</h1>
                </div>
                <div class="content">
                    <p>A new payout request has been submitted:</p>
                    
                    <p><strong>Vendor:</strong> {vendor_name}</p>
                    <p><strong>Shop:</strong> {shop_name}</p>
                    <p><strong>Amount:</strong> <span class="amount">£{amount:.2f}</span></p>
                    
                    <p>Please review and process this request in the admin dashboard.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=admin_email,
            subject=f"New Payout Request from {vendor_name}",
            html_content=html_content
        )

    def send_payout_status_notification(self, vendor_email, vendor_name, shop_name, amount, status, admin_notes=''):
        """Send notification to vendor when payout status changes"""
        status_colors = {
            'approved': '#4CAF50',
            'rejected': '#f44336',
            'pending': '#FF9800'
        }
        
        status_text = {
            'approved': '✓ Approved',
            'rejected': '✗ Rejected',
            'pending': '⏳ Pending'
        }
        
        color = status_colors.get(status, '#666')
        status_display = status_text.get(status, status.title())
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: {color}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .amount {{ font-size: 24px; font-weight: bold; color: {color}; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{status_display}</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Your payout request has been <strong>{status}</strong>.</p>
                    
                    <p><strong>Shop:</strong> {shop_name}</p>
                    <p><strong>Amount:</strong> <span class="amount">£{amount:.2f}</span></p>
                    
                    {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=vendor_email,
            subject=f"Payout Request {status.title()} - {shop_name}",
            html_content=html_content
        )

    def send_payout_paid_notification(self, vendor_email, vendor_name, shop_name, amount):
        """Send notification when payout is marked as paid"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .amount {{ font-size: 24px; font-weight: bold; color: #4CAF50; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Sent!</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Great news! Your payout has been processed and sent.</p>
                    
                    <p><strong>Shop:</strong> {shop_name}</p>
                    <p><strong>Amount:</strong> <span class="amount">£{amount:.2f}</span></p>
                    
                    <p>The payment should arrive in your account within 2-3 business days.</p>
                    
                    <p>Thank you for being part of BAK UP!</p>
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=vendor_email,
            subject=f"Payment Sent - £{amount:.2f}",
            html_content=html_content
        )

# Create global instance
email_service = EmailService()
