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
            print(f"   GMAIL_USER: {'SET' if self.smtp_user else 'NOT SET'}")
            print(f"   GMAIL_APP_PASSWORD: {'SET' if self.smtp_password else 'NOT SET'}")
        else:
            print("✓ Gmail SMTP configured successfully")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   SMTP User: {self.smtp_user}")
            print(f"   From Email: {self.from_email}")
            print(f"   App Password Length: {len(self.smtp_password) if self.smtp_password else 0} characters")
            # Test SMTP connection
            self._test_smtp_connection()
        
    def _test_smtp_connection(self):
        """Test SMTP connection on startup"""
        try:
            print("   Testing SMTP connection...")
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
            print("✓ SMTP connection test successful!")
        except smtplib.SMTPAuthenticationError as e:
            print(f"✗ SMTP Authentication FAILED: {str(e)}")
            print("   Please check your GMAIL_USER and GMAIL_APP_PASSWORD")
            self.enabled = False
        except Exception as e:
            print(f"✗ SMTP connection test FAILED: {str(e)}")
            self.enabled = False
    
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

    def send_batch_vouchers_email(self, recipient_email, recipient_name, voucher_codes, voucher_amounts, total_amount, issuer_name):
        """Send email when multiple vouchers are issued (for amounts > £50)"""
        
        # Build voucher codes table
        voucher_rows = ""
        for i, (code, amount) in enumerate(zip(voucher_codes, voucher_amounts), 1):
            voucher_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{i}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #4CAF50;">{code}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">£{amount:.2f}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .summary {{ 
                    background-color: #fff; 
                    border: 2px solid #4CAF50; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0;
                    border-radius: 10px;
                }}
                .total-amount {{ font-size: 32px; color: #FF9800; font-weight: bold; }}
                .voucher-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background-color: #fff;
                }}
                .voucher-table th {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }}
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
                .info-box {{
                    background-color: #E3F2FD;
                    border-left: 4px solid #2196F3;
                    padding: 15px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Your BAK UP Vouchers are Ready!</h1>
                </div>
                <div class="content">
                    <p>Dear {recipient_name},</p>
                    
                    <p>You have received <strong>{len(voucher_codes)} vouchers</strong> from <strong>{issuer_name}</strong>.</p>
                    
                    <div class="summary">
                        <div style="font-size: 18px; color: #666; margin-bottom: 10px;">Total Value</div>
                        <div class="total-amount">£{total_amount:.2f}</div>
                        <div style="font-size: 14px; color: #666; margin-top: 10px;">Split into {len(voucher_codes)} vouchers (max £50 each)</div>
                    </div>
                    
                    <h3>Your Voucher Codes:</h3>
                    <table class="voucher-table">
                        <thead>
                            <tr>
                                <th style="text-align: center;">#</th>
                                <th>Voucher Code</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {voucher_rows}
                        </tbody>
                    </table>
                    
                    <div class="info-box">
                        <strong>💡 Why multiple vouchers?</strong><br>
                        To make it easier to manage and redeem, your total amount has been split into multiple vouchers of £50 or less. You can use each voucher separately at participating shops.
                    </div>
                    
                    <h3>How to Use Your Vouchers:</h3>
                    <ol>
                        <li>Visit any participating local food shop</li>
                        <li>Select the items you need</li>
                        <li>Show one of your voucher codes at checkout</li>
                        <li>The amount will be deducted from that voucher</li>
                        <li>Use your other vouchers on future visits</li>
                    </ol>
                    
                    <p style="text-align: center;">
                        <a href="{self.app_url}" class="button">View All Your Vouchers</a>
                    </p>
                    
                    <p><strong>Important:</strong> Keep these codes safe and only share them with authorized vendors. Each code can be used independently.</p>
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
            subject=f"Your {len(voucher_codes)} BAK UP Vouchers (£{total_amount:.2f} Total)",
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

    def send_broadcast_message(self, recipient_email, recipient_name, title, body):
        """Send broadcast message from admin to users"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .message-body {{ background: white; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📢 Important Announcement</h1>
                    <h2 style="margin-top: 10px; font-weight: normal;">{title}</h2>
                </div>
                <div class="content">
                    <p>Dear {recipient_name},</p>
                    
                    <div class="message-body">
                        {body.replace(chr(10), '<br>')}
                    </div>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                    
                    <div class="footer">
                        <p>BAK UP CIC | Northamptonshire Community E-Voucher Scheme</p>
                        <p>Email: admin@bakupcic.co.uk | Phone: 01933698347</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=recipient_email,
            subject=f"BAK UP Announcement: {title}",
            html_content=html_content
        )

    def send_fund_allocation_notification(self, organization_email, contact_name, organization_name, amount, new_balance):
        """Send notification when admin allocates funds to an organization"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .amount-box {{ background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #4CAF50; }}
                .amount {{ font-size: 32px; font-weight: bold; color: #4CAF50; }}
                .balance {{ font-size: 18px; color: #666; margin-top: 10px; }}
                .cta-button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 Funds Allocated!</h1>
                </div>
                <div class="content">
                    <p>Dear {contact_name},</p>
                    
                    <p>Great news! BAK UP CIC has allocated funds to <strong>{organization_name}</strong>.</p>
                    
                    <div class="amount-box">
                        <p style="margin: 0; color: #666;">Allocated Amount</p>
                        <div class="amount">£{amount:.2f}</div>
                        <div class="balance">New Balance: £{new_balance:.2f}</div>
                    </div>
                    
                    <p>These funds are now available in your account and can be used to issue vouchers to families in need.</p>
                    
                    <p style="text-align: center;">
                        <a href="{self.app_url}" class="cta-button">Access Your Dashboard</a>
                    </p>
                    
                    <p>Thank you for your continued partnership in supporting our community!</p>
                    
                    <p>Best regards,<br>
                    <strong>The BAK UP Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=organization_email,
            subject=f"Funds Allocated - £{amount:.2f}",
            html_content=html_content
        )

    def send_vcse_verification_pending_email(self, user_email, user_name, organization_name, charity_number):
        """Send email to VCFSE organization when registration is pending verification"""
        subject = "VCFSE Registration – Verification in Progress"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .info-box {{ background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌿 BAK UP CIC</h1>
                    <p>Northamptonshire Community E-Voucher Scheme</p>
                </div>
                <div class="content">
                    <h2>Thank you for registering, {user_name}!</h2>
                    
                    <p>We have received your VCFSE organization registration for the Community E-Voucher Scheme.</p>
                    
                    <div class="info-box">
                        <strong>Organization Details Submitted:</strong><br>
                        <strong>Name:</strong> {organization_name}<br>
                        <strong>Charity Commission Number:</strong> {charity_number}
                    </div>
                    
                    <h3>What happens next?</h3>
                    <p>We are currently reviewing your Charity Commission Registration Number and organization details to confirm eligibility.</p>
                    
                    <ul>
                        <li><strong>Verification Time:</strong> Typically 1–2 hours during business hours</li>
                        <li><strong>Verification Process:</strong> We will check your details against the Charity Commission database</li>
                        <li><strong>Next Steps:</strong> Once verified, you will receive an email with your login activation link</li>
                    </ul>
                    
                    <div class="info-box">
                        <strong>⚠️ Important:</strong> If the information provided does not match the Charity Commission database, access cannot be granted. Please ensure all details are accurate.
                    </div>
                    
                    <p>If you have any questions, please contact us:</p>
                    <ul>
                        <li><strong>Email:</strong> admin@bakupcic.co.uk</li>
                        <li><strong>Phone:</strong> 01933698347</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>BAK UP CIC - Charity Company Registration Number: 12994374</p>
                    <p>This is an automated email. Please do not reply directly to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def send_vcse_approval_email(self, user_email, user_name, organization_name, login_url):
        """Send email to VCFSE organization when account is approved"""
        subject = "✅ VCFSE Account Approved – Welcome to BAK UP E-Voucher Scheme"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .success-box {{ background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; text-align: center; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to BAK UP!</h1>
                    <p>Northamptonshire Community E-Voucher Scheme</p>
                </div>
                <div class="content">
                    <div class="success-box">
                        <h2 style="color: #4CAF50; margin: 0;">✅ Your Account Has Been Approved!</h2>
                    </div>
                    
                    <p>Dear {user_name},</p>
                    
                    <p>Congratulations! Your VCFSE organization <strong>{organization_name}</strong> has been successfully verified and approved to join the Community E-Voucher Scheme.</p>
                    
                    <p>You can now access your VCFSE portal to:</p>
                    <ul>
                        <li>Issue vouchers to families in need</li>
                        <li>Manage your organization's voucher allocation</li>
                        <li>Access free food items from local shops</li>
                        <li>Track voucher usage and impact</li>
                        <li>Collaborate with other VCFSE organizations</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="{login_url}" class="button">Login to Your Account</a>
                    </div>
                    
                    <p>If you need any assistance getting started, please don't hesitate to contact us:</p>
                    <ul>
                        <li><strong>Email:</strong> admin@bakupcic.co.uk</li>
                        <li><strong>Phone:</strong> 01933698347</li>
                    </ul>
                    
                    <p>Thank you for joining us in supporting families across Northamptonshire!</p>
                </div>
                <div class="footer">
                    <p>BAK UP CIC - Charity Company Registration Number: 12994374</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def send_vcse_rejection_email(self, user_email, user_name, organization_name, rejection_reason):
        """Send email to VCFSE organization when account is rejected"""
        subject = "VCFSE Registration Update"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .warning-box {{ background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BAK UP CIC</h1>
                    <p>VCFSE Registration Update</p>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <p>Thank you for your interest in joining the Community E-Voucher Scheme as a VCFSE organization.</p>
                    
                    <div class="warning-box">
                        <strong>Application Status:</strong> Unfortunately, we are unable to approve your registration at this time.
                    </div>
                    
                    <p><strong>Reason:</strong></p>
                    <p>{rejection_reason}</p>
                    
                    <p>If you believe this is an error or would like to discuss this further, please contact us:</p>
                    <ul>
                        <li><strong>Email:</strong> admin@bakupcic.co.uk</li>
                        <li><strong>Phone:</strong> 01933698347</li>
                    </ul>
                    
                    <p>We appreciate your understanding.</p>
                </div>
                <div class="footer">
                    <p>BAK UP CIC - Charity Company Registration Number: 12994374</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)


# Create global instance
email_service = EmailService()
