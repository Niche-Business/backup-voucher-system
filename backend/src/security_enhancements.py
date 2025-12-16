"""
Security Enhancements
Implements rate limiting, CSRF protection, and other security measures
"""

from flask import request, jsonify, session
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import secrets
import logging

logger = logging.getLogger(__name__)

# In-memory rate limiting storage (for production, use Redis)
rate_limit_storage = {}

# CSRF token storage
csrf_tokens = {}


def clean_old_entries():
    """Clean up old rate limit entries to prevent memory leaks"""
    global rate_limit_storage
    current_time = datetime.utcnow()
    
    # Remove entries older than 1 hour
    keys_to_remove = []
    for key, data in rate_limit_storage.items():
        if 'reset_time' in data and data['reset_time'] < current_time:
            keys_to_remove.append(key)
    
    for key in keys_to_remove:
        del rate_limit_storage[key]


def get_client_identifier():
    """
    Get a unique identifier for the client
    Uses IP address and user agent hash
    """
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    
    # Create hash of IP + user agent
    identifier = hashlib.sha256(f"{ip}{user_agent}".encode()).hexdigest()
    return identifier


def rate_limit(max_requests=100, window_seconds=3600, key_prefix='general'):
    """
    Rate limiting decorator
    
    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
        key_prefix: Prefix for the rate limit key (to separate different endpoints)
    
    Usage:
        @rate_limit(max_requests=5, window_seconds=60, key_prefix='login')
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Clean old entries periodically
            if len(rate_limit_storage) > 1000:
                clean_old_entries()
            
            # Get client identifier
            client_id = get_client_identifier()
            key = f"{key_prefix}:{client_id}"
            
            current_time = datetime.utcnow()
            
            # Get or create rate limit data
            if key not in rate_limit_storage:
                rate_limit_storage[key] = {
                    'count': 0,
                    'reset_time': current_time + timedelta(seconds=window_seconds)
                }
            
            rate_data = rate_limit_storage[key]
            
            # Check if window has expired
            if current_time > rate_data['reset_time']:
                rate_data['count'] = 0
                rate_data['reset_time'] = current_time + timedelta(seconds=window_seconds)
            
            # Check if limit exceeded
            if rate_data['count'] >= max_requests:
                remaining_time = (rate_data['reset_time'] - current_time).seconds
                logger.warning(f"Rate limit exceeded for {client_id} on {key_prefix}")
                
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Please try again in {remaining_time} seconds.',
                    'retry_after': remaining_time
                }), 429
            
            # Increment counter
            rate_data['count'] += 1
            
            # Add rate limit headers to response
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple):
                response_obj, status_code = response[0], response[1]
            else:
                response_obj = response
                status_code = 200
            
            # If response is a Flask response object, add headers
            if hasattr(response_obj, 'headers'):
                response_obj.headers['X-RateLimit-Limit'] = str(max_requests)
                response_obj.headers['X-RateLimit-Remaining'] = str(max_requests - rate_data['count'])
                response_obj.headers['X-RateLimit-Reset'] = str(int(rate_data['reset_time'].timestamp()))
            
            return response
        
        return wrapper
    return decorator


def generate_csrf_token():
    """Generate a new CSRF token"""
    token = secrets.token_urlsafe(32)
    csrf_tokens[token] = {
        'created_at': datetime.utcnow(),
        'user_id': session.get('user_id')
    }
    
    # Clean old tokens (older than 1 hour)
    current_time = datetime.utcnow()
    tokens_to_remove = []
    for t, data in csrf_tokens.items():
        if current_time - data['created_at'] > timedelta(hours=1):
            tokens_to_remove.append(t)
    
    for t in tokens_to_remove:
        del csrf_tokens[t]
    
    return token


def validate_csrf_token(token):
    """Validate a CSRF token"""
    if not token or token not in csrf_tokens:
        return False
    
    token_data = csrf_tokens[token]
    
    # Check if token is expired (1 hour)
    if datetime.utcnow() - token_data['created_at'] > timedelta(hours=1):
        del csrf_tokens[token]
        return False
    
    # Check if token belongs to current user
    if token_data['user_id'] != session.get('user_id'):
        return False
    
    return True


def csrf_protect(f):
    """
    CSRF protection decorator
    Validates CSRF token for POST, PUT, DELETE requests
    
    Usage:
        @csrf_protect
        def create_voucher():
            ...
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Only check for state-changing methods
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            # Get token from header or form data
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
            
            if not token:
                logger.warning(f"CSRF token missing for {request.endpoint}")
                return jsonify({
                    'error': 'CSRF token missing',
                    'message': 'CSRF token is required for this request'
                }), 403
            
            if not validate_csrf_token(token):
                logger.warning(f"Invalid CSRF token for {request.endpoint}")
                return jsonify({
                    'error': 'Invalid CSRF token',
                    'message': 'CSRF token is invalid or expired'
                }), 403
        
        return f(*args, **kwargs)
    
    return wrapper


def require_https(f):
    """
    Decorator to require HTTPS for sensitive endpoints
    
    Usage:
        @require_https
        def login():
            ...
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Check if request is HTTPS
        if not request.is_secure and request.headers.get('X-Forwarded-Proto') != 'https':
            # Allow in development mode
            if request.host.startswith('localhost') or request.host.startswith('127.0.0.1'):
                return f(*args, **kwargs)
            
            logger.warning(f"HTTPS required for {request.endpoint}")
            return jsonify({
                'error': 'HTTPS required',
                'message': 'This endpoint requires a secure HTTPS connection'
            }), 403
        
        return f(*args, **kwargs)
    
    return wrapper


def sanitize_input(text, max_length=1000):
    """
    Sanitize user input to prevent XSS and injection attacks
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized text
    """
    if not text:
        return text
    
    # Convert to string
    text = str(text)
    
    # Truncate to max length
    text = text[:max_length]
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}', '[', ']']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # Remove SQL keywords (basic protection)
    sql_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'UNION', 'EXEC', 'EXECUTE']
    for keyword in sql_keywords:
        text = text.replace(keyword, '')
        text = text.replace(keyword.lower(), '')
    
    return text.strip()


def validate_email(email):
    """
    Validate email format
    
    Args:
        email: Email address to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    import re
    
    if not email:
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    return bool(re.match(pattern, email))


def validate_phone(phone):
    """
    Validate phone number format
    
    Args:
        phone: Phone number to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    import re
    
    if not phone:
        return False
    
    # Remove common separators
    phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    
    # Check if it's a valid UK phone number
    pattern = r'^(\+44|0)[1-9]\d{9,10}$'
    
    return bool(re.match(pattern, phone))


def check_password_strength(password):
    """
    Check password strength
    
    Args:
        password: Password to check
    
    Returns:
        dict: {
            'valid': bool,
            'score': int (0-100),
            'issues': list of strings
        }
    """
    if not password:
        return {
            'valid': False,
            'score': 0,
            'issues': ['Password is required']
        }
    
    issues = []
    score = 0
    
    # Length check
    if len(password) < 8:
        issues.append('Password must be at least 8 characters long')
    else:
        score += 25
    
    # Uppercase check
    if not any(c.isupper() for c in password):
        issues.append('Password must contain at least one uppercase letter')
    else:
        score += 25
    
    # Lowercase check
    if not any(c.islower() for c in password):
        issues.append('Password must contain at least one lowercase letter')
    else:
        score += 25
    
    # Number check
    if not any(c.isdigit() for c in password):
        issues.append('Password must contain at least one number')
    else:
        score += 25
    
    # Special character check (bonus)
    special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if any(c in special_chars for c in password):
        score += 10
    
    # Length bonus
    if len(password) >= 12:
        score += 10
    
    return {
        'valid': len(issues) == 0,
        'score': min(score, 100),
        'issues': issues
    }


# Security headers middleware
def add_security_headers(response):
    """
    Add security headers to response
    Should be called in after_request hook
    """
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Strict transport security (HTTPS only)
    if request.is_secure or request.headers.get('X-Forwarded-Proto') == 'https':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Content Security Policy - Allow Stripe, WebSocket connections, and other necessary external resources
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com; connect-src 'self' https://api.stripe.com wss: ws:;"
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response


def init_security_enhancements(app):
    """
    Initialize security enhancements for the Flask app
    
    Args:
        app: Flask application instance
    """
    # Add security headers to all responses
    @app.after_request
    def apply_security_headers(response):
        return add_security_headers(response)
    
    # Add CSRF token generation endpoint
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        token = generate_csrf_token()
        return jsonify({'csrf_token': token}), 200
    
    logger.info("Security enhancements initialized")
    
    return app
