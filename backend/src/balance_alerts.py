"""
Balance Alert System
Monitors VCFSE organization balances and sends alerts when low
"""

def check_low_balances(User, threshold=50.0):
    """
    Check all VCFSE organizations for low balances
    Returns list of organizations below threshold
    """
    try:
        vcse_orgs = User.query.filter_by(user_type='vcse').all()
        
        low_balance_orgs = []
        
        for org in vcse_orgs:
            if hasattr(org, 'allocated_balance') and org.allocated_balance < threshold:
                low_balance_orgs.append({
                    'id': org.id,
                    'name': org.organization_name if hasattr(org, 'organization_name') else org.email,
                    'email': org.email,
                    'phone': org.phone if hasattr(org, 'phone') else None,
                    'current_balance': float(org.allocated_balance),
                    'threshold': threshold
                })
        
        return {
            'success': True,
            'organizations': low_balance_orgs,
            'count': len(low_balance_orgs)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'organizations': [],
            'count': 0
        }


def send_low_balance_alerts(organizations, sms_service, email_service, admin_email=None):
    """
    Send alerts to VCFSE organizations and admin about low balances
    """
    sent_count = 0
    failed_count = 0
    
    for org in organizations:
        try:
            balance = org['current_balance']
            org_name = org['name']
            
            # Send SMS to organization
            if org.get('phone'):
                sms_message = f"""BAK UP Low Balance Alert

Your organization's balance is low: \u00a3{balance:.2f}

Please contact the administrator to add more funds to continue issuing vouchers.

BAK UP Team"""
                
                sms_result = sms_service.send_sms(org['phone'], sms_message)
                if sms_result.get('success'):
                    sent_count += 1
            
            # Send email to organization
            if org.get('email'):
                # Email would go here
                pass
            
            # Notify admin
            if admin_email:
                admin_message = f"""Low Balance Alert

Organization: {org_name}
Current Balance: \u00a3{balance:.2f}
Threshold: \u00a3{org['threshold']:.2f}

Please add funds to this organization's account."""
                
                # Send email to admin
                # email_service.send_admin_alert(admin_email, admin_message)
                pass
                
        except Exception as e:
            print(f"Failed to send alert for {org.get('name')}: {str(e)}")
            failed_count += 1
    
    return {
        'sent_count': sent_count,
        'failed_count': failed_count
    }


def get_balance_summary(User):
    """
    Get balance summary for all VCFSE organizations
    """
    try:
        vcse_orgs = User.query.filter_by(user_type='vcse').all()
        
        summary = {
            'total_organizations': len(vcse_orgs),
            'total_allocated': 0,
            'organizations': []
        }
        
        for org in vcse_orgs:
            balance = float(org.allocated_balance) if hasattr(org, 'allocated_balance') else 0
            summary['total_allocated'] += balance
            
            summary['organizations'].append({
                'id': org.id,
                'name': org.organization_name if hasattr(org, 'organization_name') else org.email,
                'balance': balance,
                'status': 'low' if balance < 50 else 'normal'
            })
        
        # Sort by balance (lowest first)
        summary['organizations'].sort(key=lambda x: x['balance'])
        
        return {
            'success': True,
            'summary': summary
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
