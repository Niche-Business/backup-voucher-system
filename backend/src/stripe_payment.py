# Stripe Payment Integration for VCFSE Self-Service Fund Loading
import stripe
import os
from datetime import datetime

# Initialize Stripe with API key from environment
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')

def get_publishable_key():
    """
    Get Stripe publishable key from environment
    
    Returns:
        str: Stripe publishable key
    """
    return os.getenv('STRIPE_PUBLISHABLE_KEY', '')

def create_payment_intent(amount, vcse_id, vcse_email, description="Fund Loading"):
    """
    Create a Stripe Payment Intent for VCFSE fund loading
    
    Args:
        amount: Amount in pounds (will be converted to pence)
        vcse_id: ID of the VCFSE organization
        vcse_email: Email of the VCFSE organization
        description: Payment description
    
    Returns:
        dict: Payment intent details including client_secret
    """
    try:
        # Convert pounds to pence (Stripe uses smallest currency unit)
        amount_in_pence = int(float(amount) * 100)
        
        # Create Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=amount_in_pence,
            currency='gbp',
            description=description,
            metadata={
                'vcse_id': vcse_id,
                'vcse_email': vcse_email,
                'purpose': 'fund_loading',
                'timestamp': datetime.now().isoformat()
            },
            automatic_payment_methods={
                'enabled': True,
            }
        )
        
        return {
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': amount,
            'status': intent.status
        }
    
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")
    except Exception as e:
        raise Exception(f"Payment intent creation failed: {str(e)}")


def verify_payment(payment_intent_id):
    """
    Verify a payment has been completed successfully
    
    Args:
        payment_intent_id: Stripe Payment Intent ID
    
    Returns:
        dict: Payment verification details
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        return {
            'verified': intent.status == 'succeeded',
            'amount': intent.amount / 100,  # Convert pence back to pounds
            'vcse_id': intent.metadata.get('vcse_id'),
            'status': intent.status,
            'payment_method': intent.payment_method
        }
    
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe verification error: {str(e)}")
    except Exception as e:
        raise Exception(f"Payment verification failed: {str(e)}")


def get_payment_methods(customer_id=None):
    """
    Retrieve saved payment methods for a customer
    
    Args:
        customer_id: Stripe customer ID (optional)
    
    Returns:
        list: List of payment methods
    """
    try:
        if not customer_id:
            return []
        
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )
        
        return [{
            'id': pm.id,
            'brand': pm.card.brand,
            'last4': pm.card.last4,
            'exp_month': pm.card.exp_month,
            'exp_year': pm.card.exp_year
        } for pm in payment_methods.data]
    
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to retrieve payment methods: {str(e)}")
