import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsDashboard({ apiCall }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load analytics data from admin endpoint
      const data = await apiCall('/admin/analytics');
      console.log('Analytics data loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '28px', marginBottom: '20px' }}>📊 Loading Analytics...</div>
        <div style={{ fontSize: '20px', color: '#666' }}>Please wait while we gather the data</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '28px', color: '#e74c3c', marginBottom: '20px' }}>⚠️ Failed to Load Analytics</div>
        <div style={{ fontSize: '20px', color: '#666', marginBottom: '20px' }}>
          {error || 'Unable to load analytics data'}
        </div>
        <button 
          onClick={loadAnalyticsData} 
          style={{ 
            padding: '12px 24px', 
            fontSize: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Prepare chart data from analytics
  const voucherTrendChartData = analytics.issuance_trend ? {
    labels: analytics.issuance_trend.map(d => d.date),
    datasets: [
      {
        label: 'Vouchers Issued',
        data: analytics.issuance_trend.map(d => d.count),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const userDistributionData = analytics.users ? {
    labels: ['VCFSE', 'Schools', 'Vendors', 'Recipients'],
    datasets: [{
      data: [
        analytics.users.vcses || 0, 
        analytics.users.schools || 0, 
        analytics.users.vendors || 0, 
        analytics.users.recipients || 0
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const voucherStatusData = analytics.status_breakdown ? {
    labels: ['Active', 'Redeemed', 'Expired'],
    datasets: [{
      data: [
        analytics.status_breakdown.active || 0,
        analytics.status_breakdown.redeemed || 0,
        analytics.status_breakdown.expired || 0
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const valueByStatusData = analytics.value_by_status ? {
    labels: ['Active Value', 'Redeemed Value', 'Expired Value'],
    datasets: [{
      data: [
        analytics.value_by_status.active || 0,
        analytics.value_by_status.redeemed || 0,
        analytics.value_by_status.expired || 0
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>📊 {t('common.systemAnalyticsDashboard')}</h2>
        <button 
          onClick={loadAnalyticsData}
          style={{
            padding: '8px 16px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 {t('common.refresh')}
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <MetricCard 
          title={t('common.totalUsers')} 
          value={analytics.users?.total || 0} 
          icon="👥" 
          color="#4CAF50"
          subtitle={`${analytics.users?.recipients || 0} ${t('common.recipients').toLowerCase()}`}
        />
        <MetricCard 
          title={t('common.totalVouchers')} 
          value={analytics.total_vouchers || 0} 
          subtitle={`£${(analytics.total_value || 0).toFixed(2)} ${t('common.totalValue').toLowerCase()}`}
          icon="🎫" 
          color="#2196F3"
        />
        <MetricCard 
          title={t('common.activeVouchers')} 
          value={analytics.active_vouchers || 0} 
          subtitle={`£${(analytics.value_by_status?.active || 0).toFixed(2)}`}
          icon="✅" 
          color="#4CAF50"
        />
        <MetricCard 
          title={t('common.redemptionRate')} 
          value={`${analytics.vouchers?.redemption_rate || 0}%`} 
          subtitle={`${analytics.redeemed_vouchers || 0} ${t('common.redeemed').toLowerCase()}`}
          icon="📈" 
          color="#9C27B0"
        />
      </div>

      {/* System Overview */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>🌐 {t('common.systemOverview')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <FinancialMetric label={t('common.vcfseOrganizations')} value={analytics.users?.vcses || 0} />
          <FinancialMetric label={t('common.schools')} value={analytics.users?.schools || 0} />
          <FinancialMetric label={t('common.vendors')} value={analytics.users?.vendors || 0} />
          <FinancialMetric label={t('common.recipients')} value={analytics.users?.recipients || 0} />
        </div>
      </div>

      {/* Marketplace Stats */}
      {analytics.marketplace && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>🏪 {t('common.marketplaceStatistics')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <FinancialMetric label={t('common.activeShops')} value={analytics.marketplace.total_shops || 0} color="#4CAF50" />
            <FinancialMetric label={t('common.totalItems')} value={analytics.marketplace.total_items || 0} color="#2196F3" />
            <FinancialMetric label={t('common.availableItems')} value={analytics.marketplace.available_items || 0} color="#FF9800" />
            <FinancialMetric label={t('common.claimedItems')} value={analytics.marketplace.claimed_items || 0} color="#9C27B0" />
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>💰 Financial Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <FinancialMetric label="Total Value Issued" value={`£${(analytics.total_value || 0).toFixed(2)}`} color="#4CAF50" />
          <FinancialMetric label="Active Value" value={`£${(analytics.value_by_status?.active || 0).toFixed(2)}`} color="#2196F3" />
          <FinancialMetric label="Redeemed Value" value={`£${(analytics.value_by_status?.redeemed || 0).toFixed(2)}`} color="#FF9800" />
          <FinancialMetric label="Expired Value" value={`£${(analytics.value_by_status?.expired || 0).toFixed(2)}`} color="#F44336" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Voucher Issuance Trend */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📈 Voucher Issuance Trend (Last 30 Days)</h3>
          {voucherTrendChartData && (
            <Line 
              data={voucherTrendChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          )}
        </div>

        {/* User Distribution */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>👥 User Distribution</h3>
          {userDistributionData && (
            <Doughnut 
              data={userDistributionData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Voucher Status Distribution */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>🎫 Voucher Status Distribution</h3>
          {voucherStatusData && (
            <Pie 
              data={voucherStatusData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          )}
        </div>

        {/* Value by Status */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>💷 Value Distribution by Status</h3>
          {valueByStatusData && (
            <Doughnut 
              data={valueByStatusData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '10px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>{value}</div>
          {subtitle && <div style={{ fontSize: '16px', color: '#999', marginTop: '4px' }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: '40px' }}>{icon}</div>
      </div>
    </div>
  );
}

function FinancialMetric({ label, value, color = '#333' }) {
  return (
    <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

export default AnalyticsDashboard;
