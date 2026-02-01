#!/usr/bin/env python3
"""
GitHub Webhook Auto-Deploy Script for BAK UP CIC E-Voucher System
This script listens for GitHub webhook events and automatically deploys updates
"""
from flask import Flask, request, jsonify
import subprocess
import hmac
import hashlib
import os
import logging
import json
from datetime import datetime

app = Flask(__name__)

# Configuration
REPO_PATH = '/home/backupse/domains/bakupservices.co.uk/public_html/evoucher.backup'
DEPLOY_PATH = '/home/backupse/domains/bakupservices.co.uk/public_html/evoucher'
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'bakup_webhook_secret_2024')
LOG_FILE = '/var/log/github_webhook.log'

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

def verify_signature(payload_body, signature_header):
    """Verify that the payload was sent from GitHub by validating SHA256"""
    if not signature_header:
        logging.warning("No signature header provided")
        return False
    
    hash_object = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    )
    expected_signature = "sha256=" + hash_object.hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

def run_command(command, cwd=None):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            timeout=300
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def deploy():
    """Execute deployment steps"""
    logging.info("=" * 80)
    logging.info("Starting deployment process...")
    
    steps = [
        ("Pulling latest code from GitHub", f"cd {REPO_PATH} && git pull origin master"),
        ("Installing backend dependencies", f"cd {REPO_PATH}/backend && pip3 install -r requirements.txt"),
        ("Building frontend", f"cd {REPO_PATH}/frontend && npm install && npm run build"),
        ("Copying built files to production", f"cp -r {REPO_PATH}/frontend/dist/* {DEPLOY_PATH}/"),
        ("Restarting backend service", "systemctl restart evoucher"),
    ]
    
    for step_name, command in steps:
        logging.info(f"Step: {step_name}")
        success, stdout, stderr = run_command(command)
        
        if success:
            logging.info(f"✓ {step_name} completed successfully")
            if stdout:
                logging.debug(f"Output: {stdout}")
        else:
            # Backend dependencies installation is optional (may fail if psycopg2 needs pg_config)
            if "Installing backend dependencies" in step_name:
                logging.warning(f"⚠ {step_name} failed (non-critical)")
                logging.warning(f"Error: {stderr}")
            else:
                logging.error(f"✗ {step_name} failed")
                logging.error(f"Error: {stderr}")
                return False, f"Deployment failed at step: {step_name}"
    
    logging.info("Deployment completed successfully!")
    logging.info("=" * 80)
    return True, "Deployment successful"

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle GitHub webhook events"""
    
    # Get the raw payload body
    payload_body = request.get_data()
    
    # Get signature
    signature = request.headers.get('X-Hub-Signature-256')
    
    # Verify signature
    if not verify_signature(payload_body, signature):
        logging.warning("Invalid webhook signature")
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Get event type
    event = request.headers.get('X-GitHub-Event')
    
    logging.info(f"Received {event} event from GitHub")
    
    # Handle ping event
    if event == 'ping':
        logging.info("Ping event received - webhook is working!")
        return jsonify({'status': 'pong', 'message': 'Webhook is configured correctly'}), 200
    
    # Parse payload for push events
    if event == 'push':
        try:
            logging.info(f"Payload body type: {type(payload_body)}, length: {len(payload_body)}")
            logging.info(f"First 100 chars: {payload_body[:100]}")
            payload = json.loads(payload_body.decode('utf-8'))
        except Exception as e:
            logging.error(f"Failed to parse JSON payload: {e}")
            logging.error(f"Payload body: {payload_body}")
            return jsonify({'error': 'Invalid JSON payload'}), 400
        
        ref = payload.get('ref', '')
        if ref == 'refs/heads/master':
            logging.info("Push to master detected, starting deployment...")
            success, message = deploy()
            
            if success:
                return jsonify({'status': 'success', 'message': message}), 200
            else:
                return jsonify({'status': 'error', 'message': message}), 500
        else:
            logging.info(f"Push to {ref}, ignoring (not master)")
            return jsonify({'status': 'ignored', 'message': 'Not master branch'}), 200
    
    return jsonify({'status': 'ignored', 'message': 'Not a push event'}), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    logging.info("Starting GitHub webhook server...")
    app.run(host='0.0.0.0', port=9000, debug=False)
