"""
Email service for BAK UP E-Voucher System using SendGrid
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

class EmailService:
    def __init__(self):
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@bakup.com')
        self.app_url = os.environ.get('APP_URL', 'https://backup-voucher-system.onrender.com')
        
    def send_email(self, to_email, subject, html_content):
        """Send an email using SendGrid"""
        if not self.api_key:
            print(f"⚠️  SendGrid API key not configured. Email not sent to {to_email}")
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
        subject = f"Your BAK UP Voucher Code: {voucher_code}"
        
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
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Supporting communities through digital food vouchers.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(recipient_email, subject, html_content)
    
    def send_surplus_food_alert_email(self, vcse_email, vcse_name, item_name, quantity, vendor_name, vendor_address):
        """Send email alert when surplus food is posted"""
        subject = f"🍎 New Surplus Food Available: {item_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .item-box {{
                    background-color: #fff;
                    border-left: 4px solid #FF9800;
                    padding: 15px;
                    margin: 15px 0;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #FF9800;
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
                    <h1>🍎 New Surplus Food Available!</h1>
                </div>
                <div class="content">
                    <p>Dear {vcse_name},</p>
                    
                    <p>A local food shop has posted surplus food that you can collect for free!</p>
                    
                    <div class="item-box">
                        <h3>{item_name}</h3>
                        <p><strong>Quantity:</strong> {quantity}</p>
                        <p><strong>Vendor:</strong> {vendor_name}</p>
                        <p><strong>Location:</strong> {vendor_address}</p>
                    </div>
                    
                    <p><strong>Act fast!</strong> Surplus food is available on a first-come, first-served basis.</p>
                    
                    <p style="text-align: center;">
                        <a href="{self.app_url}/vcse" class="button">Claim This Item</a>
                    </p>
                    
                    <p>Log in to your VCFSE portal to claim this item and arrange collection.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Reducing food waste, supporting communities.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(vcse_email, subject, html_content)
    
    def send_collection_confirmation_email(self, vendor_email, vendor_name, item_name, vcse_name, vcse_contact):
        """Send email to vendor when VCFSE claims surplus item"""
        subject = f"✅ Surplus Item Claimed: {item_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-box {{
                    background-color: #fff;
                    border-left: 4px solid #4CAF50;
                    padding: 15px;
                    margin: 15px 0;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Your Surplus Item Has Been Claimed!</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Great news! Your surplus food item has been claimed by a VCFSE organization.</p>
                    
                    <div class="info-box">
                        <h3>{item_name}</h3>
                        <p><strong>Claimed by:</strong> {vcse_name}</p>
                        <p><strong>Contact:</strong> {vcse_contact}</p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Prepare the item for collection</li>
                        <li>Wait for the VCFSE representative to arrive</li>
                        <li>Verify their identity and organization</li>
                        <li>Hand over the surplus food</li>
                    </ol>
                    
                    <p>Thank you for reducing food waste and supporting your local community! 🌍</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Together, we're making a difference.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(vendor_email, subject, html_content)
    
    def send_redemption_receipt_email(self, recipient_email, recipient_name, voucher_code, amount_spent, remaining_balance, vendor_name):
        """Send email receipt after voucher redemption"""
        subject = f"Receipt: Voucher Used at {vendor_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .receipt-box {{
                    background-color: #fff;
                    border: 1px solid #ddd;
                    padding: 20px;
                    margin: 15px 0;
                }}
                .amount {{ font-size: 24px; font-weight: bold; }}
                .spent {{ color: #F44336; }}
                .remaining {{ color: #4CAF50; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧾 Voucher Receipt</h1>
                </div>
                <div class="content">
                    <p>Dear {recipient_name},</p>
                    
                    <p>Your voucher has been successfully used at <strong>{vendor_name}</strong>.</p>
                    
                    <div class="receipt-box">
                        <p><strong>Voucher Code:</strong> {voucher_code}</p>
                        <p><strong>Vendor:</strong> {vendor_name}</p>
                        <hr>
                        <p class="amount spent">Amount Spent: £{amount_spent:.2f}</p>
                        <p class="amount remaining">Remaining Balance: £{remaining_balance:.2f}</p>
                    </div>
                    
                    <p>You can continue using your voucher until the balance reaches zero.</p>
                    
                    <p>Thank you for using BAK UP!</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Supporting communities through digital food vouchers.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(recipient_email, subject, html_content)
    
    def send_payout_request_notification(self, vendor_name, shop_name, amount):
        """Send notification to admin when vendor requests payout"""
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@bakup.com')
        subject = f"New Payout Request from {vendor_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .payout-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
                .amount {{ font-size: 24px; color: #667eea; font-weight: bold; margin: 10px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏦 New Payout Request</h1>
                </div>
                <div class="content">
                    <p>Dear Admin,</p>
                    
                    <p>A new payout request has been submitted and requires your review.</p>
                    
                    <div class="payout-box">
                        <p><strong>Vendor:</strong> {vendor_name}</p>
                        <p><strong>Shop:</strong> {shop_name}</p>
                        <p class="amount">Amount Requested: £{amount:.2f}</p>
                    </div>
                    
                    <p>Please log in to the admin portal to review and process this request.</p>
                    
                    <a href="{self.app_url}/admin" class="button">Review Payout Request</a>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Supporting communities through digital food vouchers.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(admin_email, subject, html_content)
    
    def send_payout_status_notification(self, vendor_email, vendor_name, shop_name, amount, status, admin_notes=''):
        """Send notification to vendor when payout is approved/rejected"""
        status_text = 'Approved' if status == 'approved' else 'Rejected'
        status_color = '#4CAF50' if status == 'approved' else '#f44336'
        status_icon = '✅' if status == 'approved' else '❌'
        
        subject = f"Payout Request {status_text} - {shop_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .status-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {status_color}; }}
                .status {{ font-size: 24px; color: {status_color}; font-weight: bold; margin: 10px 0; }}
                .notes {{ background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{status_icon} Payout Request {status_text}</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Your payout request has been reviewed by our admin team.</p>
                    
                    <div class="status-box">
                        <p><strong>Shop:</strong> {shop_name}</p>
                        <p><strong>Amount:</strong> £{amount:.2f}</p>
                        <p class="status">Status: {status_text}</p>
                    </div>
                    
                    {f'<div class="notes"><strong>Admin Notes:</strong><br>{admin_notes}</div>' if admin_notes else ''}
                    
                    <p>{'Your payment will be processed shortly and transferred to your registered bank account.' if status == 'approved' else 'If you have questions about this decision, please contact our support team.'}</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Supporting communities through digital food vouchers.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(vendor_email, subject, html_content)
    
    def send_payout_paid_notification(self, vendor_email, vendor_name, shop_name, amount):
        """Send notification to vendor when payment is completed"""
        subject = f"Payment Completed - £{amount:.2f}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .payment-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }}
                .amount {{ font-size: 28px; color: #4CAF50; font-weight: bold; margin: 15px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 Payment Completed</h1>
                </div>
                <div class="content">
                    <p>Dear {vendor_name},</p>
                    
                    <p>Great news! Your payout has been successfully processed.</p>
                    
                    <div class="payment-box">
                        <p><strong>Shop:</strong> {shop_name}</p>
                        <p class="amount">£{amount:.2f}</p>
                        <p style="color: #666; font-size: 14px;">The funds have been transferred to your registered bank account.</p>
                    </div>
                    
                    <p>Please allow 3-5 business days for the payment to appear in your account.</p>
                    
                    <p>Thank you for being part of the BAK UP community!</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from BAK UP Voucher System</p>
                    <p>© 2025 BAK UP. Supporting communities through digital food vouchers.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(vendor_email, subject, html_content)

# Create a singleton instance
email_service = EmailService()
