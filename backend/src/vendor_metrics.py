"""
Vendor Performance Metrics
Provides analytics and performance tracking for vendors
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
import logging

logger = logging.getLogger(__name__)

vendor_metrics_bp = Blueprint('vendor_metrics', __name__)

# Global variables (will be initialized)
db = None
User = None
Voucher = None
SurplusItem = None
Transaction = None
VendorShop = None

@vendor_metrics_bp.route('/api/vendor/metrics/overview', methods=['GET'])
def get_vendor_overview():
    """
    Get overview metrics for a specific vendor
    """
    try:
        # Check authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Allow vendors and admins
        if user.user_type not in ['vendor', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor ID (for admins, get from query param)
        vendor_id = session['user_id']
        if user.user_type == 'admin':
            vendor_id = request.args.get('vendor_id', type=int)
            if not vendor_id:
                return jsonify({'error': 'vendor_id required for admin'}), 400
        
        vendor = User.query.get(vendor_id)
        if not vendor or vendor.user_type != 'vendor':
            return jsonify({'error': 'Vendor not found'}), 404
        
        # Get time period
        period = request.args.get('period', 'month')  # week, month, quarter, year, all
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:  # all
            start_date = datetime(2020, 1, 1)
        
        # Get voucher redemption statistics
        redeemed_vouchers = Voucher.query.filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date
        ).all()
        
        total_vouchers_redeemed = len(redeemed_vouchers)
        total_revenue = sum(v.value for v in redeemed_vouchers)
        
        # Get Food To Go statistics
        togo_items = SurplusItem.query.filter(
            SurplusItem.vendor_id == vendor_id,
            SurplusItem.posted_at >= start_date
        ).all()
        
        total_togo_items = len(togo_items)
        claimed_togo_items = len([i for i in togo_items if i.status in ['claimed', 'collected']])
        collected_togo_items = len([i for i in togo_items if i.status == 'collected'])
        
        # Calculate claim rate
        claim_rate = (claimed_togo_items / total_togo_items * 100) if total_togo_items > 0 else 0
        collection_rate = (collected_togo_items / claimed_togo_items * 100) if claimed_togo_items > 0 else 0
        
        # Get shop count
        shop_count = VendorShop.query.filter_by(vendor_id=vendor_id, is_active=True).count()
        
        # Calculate average transaction value
        avg_transaction_value = total_revenue / total_vouchers_redeemed if total_vouchers_redeemed > 0 else 0
        
        # Get unique customers
        unique_customers = len(set(v.recipient_id for v in redeemed_vouchers if v.recipient_id))
        
        # Calculate trends (compare with previous period)
        previous_start = start_date - (end_date - start_date)
        previous_redeemed = Voucher.query.filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= previous_start,
            Voucher.redeemed_at < start_date
        ).count()
        
        voucher_trend = ((total_vouchers_redeemed - previous_redeemed) / previous_redeemed * 100) if previous_redeemed > 0 else 0
        
        return jsonify({
            'vendor_id': vendor_id,
            'vendor_name': vendor.shop_name or vendor.organization_name,
            'period': period,
            'date_range': {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d')
            },
            'metrics': {
                'total_vouchers_redeemed': total_vouchers_redeemed,
                'total_revenue': round(total_revenue, 2),
                'average_transaction_value': round(avg_transaction_value, 2),
                'unique_customers': unique_customers,
                'shop_count': shop_count,
                'voucher_trend': round(voucher_trend, 1)
            },
            'food_to_go': {
                'total_items_posted': total_togo_items,
                'items_claimed': claimed_togo_items,
                'items_collected': collected_togo_items,
                'claim_rate': round(claim_rate, 1),
                'collection_rate': round(collection_rate, 1)
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting vendor overview: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@vendor_metrics_bp.route('/api/vendor/metrics/revenue-trend', methods=['GET'])
def get_revenue_trend():
    """
    Get revenue trend over time for a vendor
    """
    try:
        # Check authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Allow vendors and admins
        if user.user_type not in ['vendor', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor ID
        vendor_id = session['user_id']
        if user.user_type == 'admin':
            vendor_id = request.args.get('vendor_id', type=int)
            if not vendor_id:
                return jsonify({'error': 'vendor_id required for admin'}), 400
        
        # Get parameters
        period = request.args.get('period', 'month')  # week, month, quarter, year
        group_by = request.args.get('group_by', 'day')  # day, week, month
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        else:  # year
            start_date = end_date - timedelta(days=365)
        
        # Get redeemed vouchers
        vouchers = Voucher.query.filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date
        ).all()
        
        # Group by time period
        trend_data = {}
        
        for voucher in vouchers:
            if group_by == 'day':
                key = voucher.redeemed_at.strftime('%Y-%m-%d')
            elif group_by == 'week':
                # Get start of week (Monday)
                week_start = voucher.redeemed_at - timedelta(days=voucher.redeemed_at.weekday())
                key = week_start.strftime('%Y-%m-%d')
            else:  # month
                key = voucher.redeemed_at.strftime('%Y-%m')
            
            if key not in trend_data:
                trend_data[key] = {
                    'date': key,
                    'revenue': 0,
                    'voucher_count': 0
                }
            
            trend_data[key]['revenue'] += voucher.value
            trend_data[key]['voucher_count'] += 1
        
        # Sort by date
        sorted_data = sorted(trend_data.values(), key=lambda x: x['date'])
        
        # Round revenue values
        for item in sorted_data:
            item['revenue'] = round(item['revenue'], 2)
        
        return jsonify({
            'period': period,
            'group_by': group_by,
            'data': sorted_data
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting revenue trend: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@vendor_metrics_bp.route('/api/vendor/metrics/top-customers', methods=['GET'])
def get_top_customers():
    """
    Get top customers by redemption value for a vendor
    """
    try:
        # Check authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Allow vendors and admins
        if user.user_type not in ['vendor', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor ID
        vendor_id = session['user_id']
        if user.user_type == 'admin':
            vendor_id = request.args.get('vendor_id', type=int)
            if not vendor_id:
                return jsonify({'error': 'vendor_id required for admin'}), 400
        
        # Get parameters
        limit = request.args.get('limit', 10, type=int)
        period = request.args.get('period', 'month')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:  # all
            start_date = datetime(2020, 1, 1)
        
        # Get customer statistics
        customer_stats = db.session.query(
            Voucher.recipient_id,
            func.count(Voucher.id).label('voucher_count'),
            func.sum(Voucher.value).label('total_spent')
        ).filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date,
            Voucher.recipient_id.isnot(None)
        ).group_by(
            Voucher.recipient_id
        ).order_by(
            func.sum(Voucher.value).desc()
        ).limit(limit).all()
        
        # Get customer details
        top_customers = []
        for stat in customer_stats:
            customer = User.query.get(stat.recipient_id)
            if customer:
                top_customers.append({
                    'customer_id': customer.id,
                    'customer_name': f"{customer.first_name} {customer.last_name}",
                    'customer_email': customer.email,
                    'voucher_count': stat.voucher_count,
                    'total_spent': round(float(stat.total_spent), 2),
                    'average_transaction': round(float(stat.total_spent) / stat.voucher_count, 2)
                })
        
        return jsonify({
            'period': period,
            'top_customers': top_customers
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting top customers: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@vendor_metrics_bp.route('/api/vendor/metrics/category-breakdown', methods=['GET'])
def get_category_breakdown():
    """
    Get breakdown of Food To Go items by category
    """
    try:
        # Check authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Allow vendors and admins
        if user.user_type not in ['vendor', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor ID
        vendor_id = session['user_id']
        if user.user_type == 'admin':
            vendor_id = request.args.get('vendor_id', type=int)
            if not vendor_id:
                return jsonify({'error': 'vendor_id required for admin'}), 400
        
        # Get parameters
        period = request.args.get('period', 'month')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:  # all
            start_date = datetime(2020, 1, 1)
        
        # Get category statistics
        category_stats = db.session.query(
            SurplusItem.category,
            func.count(SurplusItem.id).label('total_items'),
            func.sum(func.case([(SurplusItem.status == 'claimed', 1)], else_=0)).label('claimed_items'),
            func.sum(func.case([(SurplusItem.status == 'collected', 1)], else_=0)).label('collected_items')
        ).filter(
            SurplusItem.vendor_id == vendor_id,
            SurplusItem.posted_at >= start_date
        ).group_by(
            SurplusItem.category
        ).all()
        
        # Format results
        categories = []
        for stat in category_stats:
            total = stat.total_items or 0
            claimed = stat.claimed_items or 0
            collected = stat.collected_items or 0
            
            categories.append({
                'category': stat.category or 'Uncategorized',
                'total_items': total,
                'claimed_items': claimed,
                'collected_items': collected,
                'claim_rate': round((claimed / total * 100) if total > 0 else 0, 1),
                'collection_rate': round((collected / claimed * 100) if claimed > 0 else 0, 1)
            })
        
        return jsonify({
            'period': period,
            'categories': categories
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting category breakdown: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@vendor_metrics_bp.route('/api/vendor/metrics/performance-score', methods=['GET'])
def get_performance_score():
    """
    Calculate overall performance score for a vendor
    Based on multiple factors: redemption rate, customer satisfaction, Food To Go engagement
    """
    try:
        # Check authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Allow vendors and admins
        if user.user_type not in ['vendor', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor ID
        vendor_id = session['user_id']
        if user.user_type == 'admin':
            vendor_id = request.args.get('vendor_id', type=int)
            if not vendor_id:
                return jsonify({'error': 'vendor_id required for admin'}), 400
        
        # Calculate date range (last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # 1. Voucher Redemption Activity (40 points)
        redeemed_count = Voucher.query.filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date
        ).count()
        
        # Score based on redemptions (0-40 points)
        # 0 redemptions = 0 points, 50+ redemptions = 40 points
        redemption_score = min(40, (redeemed_count / 50) * 40)
        
        # 2. Food To Go Engagement (30 points)
        togo_items = SurplusItem.query.filter(
            SurplusItem.vendor_id == vendor_id,
            SurplusItem.posted_at >= start_date
        ).all()
        
        total_togo = len(togo_items)
        collected_togo = len([i for i in togo_items if i.status == 'collected'])
        
        # Score based on items posted and collection rate
        posting_score = min(15, (total_togo / 20) * 15)  # 0-15 points
        collection_score = (collected_togo / total_togo * 15) if total_togo > 0 else 0  # 0-15 points
        togo_score = posting_score + collection_score
        
        # 3. Customer Diversity (15 points)
        unique_customers = db.session.query(
            func.count(func.distinct(Voucher.recipient_id))
        ).filter(
            Voucher.redeemed_by_vendor == vendor_id,
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date
        ).scalar()
        
        # Score based on unique customers (0-15 points)
        # 0 customers = 0 points, 30+ customers = 15 points
        customer_score = min(15, (unique_customers / 30) * 15)
        
        # 4. Consistency (15 points)
        # Check if vendor has activity in at least 3 of the last 4 weeks
        weeks_with_activity = 0
        for week in range(4):
            week_start = end_date - timedelta(days=(week + 1) * 7)
            week_end = end_date - timedelta(days=week * 7)
            
            activity = Voucher.query.filter(
                Voucher.redeemed_by_vendor == vendor_id,
                Voucher.status == 'redeemed',
                Voucher.redeemed_at >= week_start,
                Voucher.redeemed_at < week_end
            ).count()
            
            if activity > 0:
                weeks_with_activity += 1
        
        consistency_score = (weeks_with_activity / 4) * 15
        
        # Calculate total score
        total_score = redemption_score + togo_score + customer_score + consistency_score
        
        # Determine rating
        if total_score >= 90:
            rating = 'Excellent'
        elif total_score >= 75:
            rating = 'Very Good'
        elif total_score >= 60:
            rating = 'Good'
        elif total_score >= 40:
            rating = 'Fair'
        else:
            rating = 'Needs Improvement'
        
        return jsonify({
            'vendor_id': vendor_id,
            'period': 'last_30_days',
            'total_score': round(total_score, 1),
            'rating': rating,
            'breakdown': {
                'redemption_activity': {
                    'score': round(redemption_score, 1),
                    'max_score': 40,
                    'redemptions': redeemed_count
                },
                'food_to_go_engagement': {
                    'score': round(togo_score, 1),
                    'max_score': 30,
                    'items_posted': total_togo,
                    'items_collected': collected_togo
                },
                'customer_diversity': {
                    'score': round(customer_score, 1),
                    'max_score': 15,
                    'unique_customers': unique_customers
                },
                'consistency': {
                    'score': round(consistency_score, 1),
                    'max_score': 15,
                    'weeks_with_activity': weeks_with_activity
                }
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error calculating performance score: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@vendor_metrics_bp.route('/api/admin/metrics/vendor-comparison', methods=['GET'])
def get_vendor_comparison():
    """
    Compare performance of all vendors (Admin only)
    """
    try:
        # Check admin authentication
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get parameters
        period = request.args.get('period', 'month')
        limit = request.args.get('limit', 20, type=int)
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:  # all
            start_date = datetime(2020, 1, 1)
        
        # Get vendor statistics
        vendor_stats = db.session.query(
            Voucher.redeemed_by_vendor,
            func.count(Voucher.id).label('voucher_count'),
            func.sum(Voucher.value).label('total_revenue'),
            func.count(func.distinct(Voucher.recipient_id)).label('unique_customers')
        ).filter(
            Voucher.status == 'redeemed',
            Voucher.redeemed_at >= start_date,
            Voucher.redeemed_by_vendor.isnot(None)
        ).group_by(
            Voucher.redeemed_by_vendor
        ).order_by(
            func.sum(Voucher.value).desc()
        ).limit(limit).all()
        
        # Get vendor details and Food To Go stats
        vendors = []
        for stat in vendor_stats:
            vendor = User.query.get(stat.redeemed_by_vendor)
            if vendor:
                # Get Food To Go stats
                togo_count = SurplusItem.query.filter(
                    SurplusItem.vendor_id == vendor.id,
                    SurplusItem.posted_at >= start_date
                ).count()
                
                vendors.append({
                    'vendor_id': vendor.id,
                    'vendor_name': vendor.shop_name or vendor.organization_name,
                    'voucher_count': stat.voucher_count,
                    'total_revenue': round(float(stat.total_revenue), 2),
                    'unique_customers': stat.unique_customers,
                    'average_transaction': round(float(stat.total_revenue) / stat.voucher_count, 2),
                    'togo_items_posted': togo_count
                })
        
        return jsonify({
            'period': period,
            'vendors': vendors
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting vendor comparison: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


def init_vendor_metrics(database, user_model, voucher_model, surplus_model, transaction_model, shop_model):
    """
    Initialize vendor metrics system
    
    Args:
        database: SQLAlchemy database instance
        user_model: User model class
        voucher_model: Voucher model class
        surplus_model: SurplusItem model class
        transaction_model: Transaction model class
        shop_model: VendorShop model class
    """
    global db, User, Voucher, SurplusItem, Transaction, VendorShop
    
    db = database
    User = user_model
    Voucher = voucher_model
    SurplusItem = surplus_model
    Transaction = transaction_model
    VendorShop = shop_model
    
    logger.info("Vendor metrics system initialized")
