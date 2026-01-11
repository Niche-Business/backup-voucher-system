"""
Test Email Service to prevent regression of password reset functionality
"""
import unittest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestEmailService(unittest.TestCase):
    """Test email service has all required methods"""
    
    def test_email_service_has_password_reset_method(self):
        """Verify send_password_reset_email method exists"""
        from email_service import EmailService
        
        # Create instance
        service = EmailService()
        
        # Check method exists
        self.assertTrue(
            hasattr(service, 'send_password_reset_email'),
            "EmailService MUST have send_password_reset_email method"
        )
        
        # Check it's callable
        self.assertTrue(
            callable(getattr(service, 'send_password_reset_email')),
            "send_password_reset_email MUST be callable"
        )
    
    def test_email_service_has_all_required_methods(self):
        """Verify all required email methods exist"""
        from email_service import EmailService
        
        service = EmailService()
        
        required_methods = [
            'send_email',
            'send_welcome_email',
            'send_password_reset_email',
            'send_new_item_notification',
            'send_voucher_issued_email'
        ]
        
        for method_name in required_methods:
            with self.subTest(method=method_name):
                self.assertTrue(
                    hasattr(service, method_name),
                    f"EmailService MUST have {method_name} method"
                )
                self.assertTrue(
                    callable(getattr(service, method_name)),
                    f"{method_name} MUST be callable"
                )
    
    def test_password_reset_method_signature(self):
        """Verify send_password_reset_email has correct parameters"""
        from email_service import EmailService
        import inspect
        
        service = EmailService()
        method = getattr(service, 'send_password_reset_email')
        
        # Get method signature
        sig = inspect.signature(method)
        params = list(sig.parameters.keys())
        
        # Check required parameters
        required_params = ['user_email', 'user_name', 'reset_token']
        for param in required_params:
            self.assertIn(
                param,
                params,
                f"send_password_reset_email MUST have parameter: {param}"
            )

if __name__ == '__main__':
    unittest.main()
