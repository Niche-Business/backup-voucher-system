"""
Analytics Dashboard Module
Provides comprehensive analytics data for the admin dashboard
"""

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from functools import wraps

analytics_bp = Blueprint('analytics', __name__)

def admin_required(f):
    """Decorator to ensure only admins can access analytics endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Import here to avoid circular imports
        from main import User
        from flask import session
        
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Forbidden - Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function


@analytics_bp.route('/api/analytics/overview', methods=['GET'])
@admin_required
def get_analytics_overview():
    """
    Get high-level overview metrics for the dashboard
    Returns: Total users, active vouchers, total funds, etc.
    """
    try:
        from main import db, User, Voucher
        
        # Time ranges
        now = datetime.utcnow()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        # Total users by role
        total_users = User.query.count()
        total_vcse = User.query.filter_by(role='vcse').count()
        total_schools = User.query.filter_by(role='school').count()
        total_vendors = User.query.filter_by(role='vendor').count()
        total_recipients = User.query.filter_by(role='recipient').count()
        
        # Voucher statistics
        total_vouchers = Voucher.query.count()
        active_vouchers = Voucher.query.filter_by(status='active').count()
        redeemed_vouchers = Voucher.query.filter_by(status='redeemed').count()
        expired_vouchers = Voucher.query.filter_by(status='expired').count()
        
        # Calculate total voucher value
        total_voucher_value = db.session.query(func.sum(Voucher.value)).filter_by(status='active').scalar() or 0
        redeemed_value = db.session.query(func.sum(Voucher.value)).filter_by(status='redeemed').scalar() or 0
        
        # Recent activity (last 30 days)
        recent_vouchers = Voucher.query.filter(Voucher.created_at >= last_30_days).count()
        recent_redemptions = Voucher.query.filter(
            and_(Voucher.status == 'redeemed', Voucher.redeemed_at >= last_30_days)
        ).count()
        
        # Wallet balances
        total_vcse_balance = db.session.query(func.sum(User.wallet_balance)).filter_by(role='vcse').scalar() or 0
        total_school_balance = db.session.query(func.sum(User.wallet_balance)).filter_by(role='school').scalar() or 0
        total_vendor_balance = db.session.query(func.sum(User.wallet_balance)).filter_by(role='vendor').scalar() or 0
        
        return jsonify({
            'success': True,
            'data': {
                'users': {
                    'total': total_users,
                    'vcse': total_vcse,
                    'schools': total_schools,
                    'vendors': total_vendors,
                    'recipients': total_recipients
                },
                'vouchers': {
                    'total': total_vouchers,
                    'active': active_vouchers,
                    'redeemed': redeemed_vouchers,
                    'expired': expired_vouchers,
                    'active_value': float(total_voucher_value),
                    'redeemed_value': float(redeemed_value)
                },
                'recent_activity': {
                    'vouchers_issued_30d': recent_vouchers,
                    'vouchers_redeemed_30d': recent_redemptions,
                    'redemption_rate': round((recent_redemptions / recent_vouchers * 100), 2) if recent_vouchers > 0 else 0
                },
                'wallet_balances': {
                    'vcse_total': float(total_vcse_balance),
                    'school_total': float(total_school_balance),
                    'vendor_total': float(total_vendor_balance),
                    'system_total': float(total_vcse_balance + total_school_balance + total_vendor_balance)
                }
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/voucher-trends', methods=['GET'])
@admin_required
def get_voucher_trends():
    """
    Get voucher issuance and redemption trends over time
    Query params: period (7d, 30d, 90d, 1y)
    """
    try:
        from main import db, Voucher
        
        period = request.args.get('period', '30d')
        
        # Determine date range
        now = datetime.utcnow()
        if period == '7d':
            start_date = now - timedelta(days=7)
            group_by_format = '%Y-%m-%d'
        elif period == '90d':
            start_date = now - timedelta(days=90)
            group_by_format = '%Y-%m-%d'
        elif period == '1y':
            start_date = now - timedelta(days=365)
            group_by_format = '%Y-%m'
        else:  # default 30d
            start_date = now - timedelta(days=30)
            group_by_format = '%Y-%m-%d'
        
        # Query vouchers issued by date
        issued_query = db.session.query(
            func.date_trunc('day', Voucher.created_at).label('date'),
            func.count(Voucher.id).label('count'),
            func.sum(Voucher.value).label('total_value')
        ).filter(
            Voucher.created_at >= start_date
        ).group_by('date').order_by('date').all()
        
        # Query vouchers redeemed by date
        redeemed_query = db.session.query(
            func.date_trunc('day', Voucher.redeemed_at).label('date'),
            func.count(Voucher.id).label('count'),
            func.sum(Voucher.value).label('total_value')
        ).filter(
            and_(Voucher.status == 'redeemed', Voucher.redeemed_at >= start_date)
        ).group_by('date').order_by('date').all()
        
        # Format results
        issued_data = [
            {
                'date': row.date.strftime('%Y-%m-%d'),
                'count': row.count,
                'value': float(row.total_value or 0)
            }
            for row in issued_query
        ]
        
        redeemed_data = [
            {
                'date': row.date.strftime('%Y-%m-%d'),
                'count': row.count,
                'value': float(row.total_value or 0)
            }
            for row in redeemed_query
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'issued': issued_data,
                'redeemed': redeemed_data
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/top-vendors', methods=['GET'])
@admin_required
def get_top_vendors():
    """
    Get top vendors by redemption count and value
    Query params: limit (default 10)
    """
    try:
        from main import db, Voucher, User, VendorShop
        
        limit = int(request.args.get('limit', 10))
        
        # Query top vendors by redemption count
        top_vendors = db.session.query(
            VendorShop.shop_name,
            VendorShop.town,
            func.count(Voucher.id).label('redemption_count'),
            func.sum(Voucher.value).label('total_value')
        ).join(
            Voucher, Voucher.redeemed_at_shop_id == VendorShop.id
        ).filter(
            Voucher.status == 'redeemed'
        ).group_by(
            VendorShop.id, VendorShop.shop_name, VendorShop.town
        ).order_by(
            func.count(Voucher.id).desc()
        ).limit(limit).all()
        
        vendors_data = [
            {
                'shop_name': row.shop_name,
                'town': row.town,
                'redemption_count': row.redemption_count,
                'total_value': float(row.total_value or 0)
            }
            for row in top_vendors
        ]
        
        return jsonify({
            'success': True,
            'data': vendors_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/geographic-distribution', methods=['GET'])
@admin_required
def get_geographic_distribution():
    """
    Get distribution of users and activity by geographic location
    """
    try:
        from main import db, User, VendorShop
        
        # Get distribution of VCFSEs by city
        vcse_by_city = db.session.query(
            User.city,
            func.count(User.id).label('count')
        ).filter(
            User.role == 'vcse'
        ).group_by(User.city).all()
        
        # Get distribution of schools by city
        schools_by_city = db.session.query(
            User.city,
            func.count(User.id).label('count')
        ).filter(
            User.role == 'school'
        ).group_by(User.city).all()
        
        # Get distribution of vendors by town
        vendors_by_town = db.session.query(
            VendorShop.town,
            func.count(VendorShop.id).label('count')
        ).group_by(VendorShop.town).all()
        
        return jsonify({
            'success': True,
            'data': {
                'vcse': [{'city': row.city, 'count': row.count} for row in vcse_by_city if row.city],
                'schools': [{'city': row.city, 'count': row.count} for row in schools_by_city if row.city],
                'vendors': [{'town': row.town, 'count': row.count} for row in vendors_by_town if row.town]
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/financial-summary', methods=['GET'])
@admin_required
def get_financial_summary():
    """
    Get comprehensive financial summary
    Query params: period (7d, 30d, 90d, 1y, all)
    """
    try:
        from main import db, Voucher, User
        
        period = request.args.get('period', '30d')
        
        # Determine date range
        now = datetime.utcnow()
        if period == '7d':
            start_date = now - timedelta(days=7)
        elif period == '90d':
            start_date = now - timedelta(days=90)
        elif period == '1y':
            start_date = now - timedelta(days=365)
        elif period == 'all':
            start_date = datetime(2000, 1, 1)  # Beginning of time
        else:  # default 30d
            start_date = now - timedelta(days=30)
        
        # Total vouchers issued (value)
        total_issued = db.session.query(func.sum(Voucher.value)).filter(
            Voucher.created_at >= start_date
        ).scalar() or 0
        
        # Total vouchers redeemed (value)
        total_redeemed = db.session.query(func.sum(Voucher.value)).filter(
            and_(Voucher.status == 'redeemed', Voucher.redeemed_at >= start_date)
        ).scalar() or 0
        
        # Outstanding voucher value (active vouchers)
        outstanding_value = db.session.query(func.sum(Voucher.value)).filter_by(status='active').scalar() or 0
        
        # Expired voucher value (lost funds)
        expired_value = db.session.query(func.sum(Voucher.value)).filter(
            and_(Voucher.status == 'expired', Voucher.expiry_date >= start_date)
        ).scalar() or 0
        
        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'total_issued': float(total_issued),
                'total_redeemed': float(total_redeemed),
                'outstanding': float(outstanding_value),
                'expired': float(expired_value),
                'redemption_rate': round((total_redeemed / total_issued * 100), 2) if total_issued > 0 else 0
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
