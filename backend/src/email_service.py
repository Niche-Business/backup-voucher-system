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
        reset_link = f"{self.app_url}/#/reset-password?token={reset_token}"
        
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

# Create a singleton instance
email_service = EmailService()
