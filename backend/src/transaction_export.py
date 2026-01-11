"""
Transaction Export Module
Handles CSV/Excel export of vouchers, transactions, and reports
"""

import csv
import io
from datetime import datetime

def export_vouchers_csv(vouchers, User):
    """
    Export vouchers to CSV format
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Voucher Code',
        'Value (£)',
        'Status',
        'Issued Date',
        'Expiry Date',
        'Recipient Name',
        'Recipient Email',
        'Recipient Phone',
        'Issuer Organization',
        'Redeemed At',
        'Redeemed By',
        'Remaining Balance (£)'
    ])
    
    # Write data rows
    for voucher in vouchers:
        recipient = User.query.get(voucher.recipient_id) if voucher.recipient_id else None
        issuer = User.query.get(voucher.issued_by) if voucher.issued_by else None
        redeemer = User.query.get(voucher.redeemed_by) if hasattr(voucher, 'redeemed_by') and voucher.redeemed_by else None
        
        writer.writerow([
            voucher.code,
            f"{voucher.value:.2f}",
            voucher.status,
            voucher.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(voucher, 'created_at') else '',
            voucher.expiry_date.strftime('%Y-%m-%d') if voucher.expiry_date else '',
            f"{recipient.first_name} {recipient.last_name}" if recipient else '',
            recipient.email if recipient else '',
            recipient.phone if recipient else '',
            issuer.organization_name if issuer else '',
            voucher.redeemed_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(voucher, 'redeemed_at') and voucher.redeemed_at else '',
            redeemer.organization_name if redeemer else '',
            f"{voucher.value:.2f}" if voucher.status == 'active' else '0.00'
        ])
    
    return output.getvalue()


def export_surplus_items_csv(surplus_items, User):
    """
    Export surplus food items to CSV format
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Item Name',
        'Quantity',
        'Posted Date',
        'Expiry Date',
        'Status',
        'Vendor Name',
        'Vendor Address',
        'Claimed By',
        'Claimed Date'
    ])
    
    # Write data rows
    for item in surplus_items:
        vendor = User.query.get(item.vendor_id) if item.vendor_id else None
        claimer = User.query.get(item.claimed_by) if hasattr(item, 'claimed_by') and item.claimed_by else None
        
        writer.writerow([
            item.item_name,
            item.quantity,
            item.posted_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(item, 'posted_at') else '',
            item.expiry_date.strftime('%Y-%m-%d') if hasattr(item, 'expiry_date') and item.expiry_date else '',
            item.status,
            vendor.organization_name if vendor else '',
            vendor.address if vendor else '',
            claimer.organization_name if claimer else '',
            item.claimed_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(item, 'claimed_at') and item.claimed_at else ''
        ])
    
    return output.getvalue()


def export_users_csv(users):
    """
    Export users to CSV format
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'User Type',
        'Organization/Name',
        'Email',
        'Phone',
        'Address',
        'Registration Date',
        'Status',
        'Allocated Balance (£)',
        'Total Vouchers Issued',
        'Total Vouchers Received'
    ])
    
    # Write data rows
    for user in users:
        if user.user_type == 'recipient':
            name = f"{user.first_name} {user.last_name}"
        else:
            name = user.organization_name if hasattr(user, 'organization_name') else user.email
        
        writer.writerow([
            user.user_type.upper(),
            name,
            user.email,
            user.phone if hasattr(user, 'phone') else '',
            user.address if hasattr(user, 'address') else '',
            user.created_at.strftime('%Y-%m-%d') if hasattr(user, 'created_at') else '',
            'Active' if user.is_active else 'Inactive',
            f"{user.allocated_balance:.2f}" if hasattr(user, 'allocated_balance') else '0.00',
            '',  # Would need to query vouchers
            ''   # Would need to query vouchers
        ])
    
    return output.getvalue()


def generate_financial_report_csv(Voucher, User, start_date=None, end_date=None):
    """
    Generate comprehensive financial report
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Title and date range
    writer.writerow(['BAK UP Financial Report'])
    writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    if start_date:
        writer.writerow(['Start Date:', start_date.strftime('%Y-%m-%d')])
    if end_date:
        writer.writerow(['End Date:', end_date.strftime('%Y-%m-%d')])
    writer.writerow([])
    
    # Query vouchers
    query = Voucher.query
    if start_date and hasattr(Voucher, 'created_at'):
        query = query.filter(Voucher.created_at >= start_date)
    if end_date and hasattr(Voucher, 'created_at'):
        query = query.filter(Voucher.created_at <= end_date)
    
    vouchers = query.all()
    
    # Summary statistics
    writer.writerow(['SUMMARY STATISTICS'])
    writer.writerow([])
    
    total_issued = len(vouchers)
    total_value = sum(float(v.value) for v in vouchers)
    active_vouchers = [v for v in vouchers if v.status == 'active']
    redeemed_vouchers = [v for v in vouchers if v.status == 'redeemed']
    expired_vouchers = [v for v in vouchers if v.status == 'expired']
    
    writer.writerow(['Total Vouchers Issued:', total_issued])
    writer.writerow(['Total Value Issued:', f"£{total_value:.2f}"])
    writer.writerow(['Active Vouchers:', len(active_vouchers)])
    writer.writerow(['Redeemed Vouchers:', len(redeemed_vouchers)])
    writer.writerow(['Expired Vouchers:', len(expired_vouchers)])
    writer.writerow([])
    
    # By issuer breakdown
    writer.writerow(['BREAKDOWN BY ISSUER'])
    writer.writerow(['Organization', 'Vouchers Issued', 'Total Value (£)'])
    
    issuer_stats = {}
    for voucher in vouchers:
        issuer = User.query.get(voucher.issued_by) if voucher.issued_by else None
        if issuer:
            org_name = issuer.organization_name if hasattr(issuer, 'organization_name') else issuer.email
            if org_name not in issuer_stats:
                issuer_stats[org_name] = {'count': 0, 'value': 0}
            issuer_stats[org_name]['count'] += 1
            issuer_stats[org_name]['value'] += float(voucher.value)
    
    for org_name, stats in issuer_stats.items():
        writer.writerow([org_name, stats['count'], f"£{stats['value']:.2f}"])
    
    writer.writerow([])
    
    # Detailed transactions
    writer.writerow(['DETAILED TRANSACTIONS'])
    writer.writerow([
        'Date',
        'Voucher Code',
        'Value (£)',
        'Status',
        'Issuer',
        'Recipient',
        'Redeemed By'
    ])
    
    for voucher in vouchers:
        issuer = User.query.get(voucher.issued_by) if voucher.issued_by else None
        recipient = User.query.get(voucher.recipient_id) if voucher.recipient_id else None
        redeemer = User.query.get(voucher.redeemed_by) if hasattr(voucher, 'redeemed_by') and voucher.redeemed_by else None
        
        writer.writerow([
            voucher.created_at.strftime('%Y-%m-%d') if hasattr(voucher, 'created_at') else '',
            voucher.code,
            f"{voucher.value:.2f}",
            voucher.status,
            issuer.organization_name if issuer and hasattr(issuer, 'organization_name') else '',
            f"{recipient.first_name} {recipient.last_name}" if recipient else '',
            redeemer.organization_name if redeemer and hasattr(redeemer, 'organization_name') else ''
        ])
    
    return output.getvalue()


def export_impact_report_csv(Voucher, SurplusItem, User):
    """
    Generate impact report showing social and environmental impact
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Title
    writer.writerow(['BAK UP Impact Report'])
    writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow([])
    
    # Voucher impact
    writer.writerow(['VOUCHER PROGRAM IMPACT'])
    writer.writerow([])
    
    all_vouchers = Voucher.query.all()
    unique_recipients = len(set(v.recipient_id for v in all_vouchers if v.recipient_id))
    total_value_distributed = sum(float(v.value) for v in all_vouchers)
    
    writer.writerow(['Total Families Served:', unique_recipients])
    writer.writerow(['Total Value Distributed:', f"£{total_value_distributed:.2f}"])
    writer.writerow(['Total Vouchers Issued:', len(all_vouchers)])
    writer.writerow([])
    
    # Surplus food impact
    writer.writerow(['SURPLUS FOOD PROGRAM IMPACT'])
    writer.writerow([])
    
    all_surplus = SurplusItem.query.all() if SurplusItem else []
    total_items_posted = len(all_surplus)
    claimed_items = [s for s in all_surplus if s.status == 'claimed']
    
    writer.writerow(['Total Surplus Items Posted:', total_items_posted])
    writer.writerow(['Total Items Claimed:', len(claimed_items)])
    writer.writerow(['Food Waste Prevented:', f"{len(claimed_items)} items"])
    writer.writerow([])
    
    # Participating organizations
    writer.writerow(['PARTICIPATING ORGANIZATIONS'])
    writer.writerow([])
    
    vcse_orgs = User.query.filter_by(user_type='vcse').count()
    vendors = User.query.filter_by(user_type='vendor').count()
    schools = User.query.filter_by(user_type='school').count()
    
    writer.writerow(['VCFSE Organizations:', vcse_orgs])
    writer.writerow(['Local Food Shops:', vendors])
    writer.writerow(['Schools:', schools])
    
    return output.getvalue()
