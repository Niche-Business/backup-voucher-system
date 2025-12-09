import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [voucherTrends, setVoucherTrends] = useState(null);
  const [topVendors, setTopVendors] = useState(null);
  const [geoDistribution, setGeoDistribution] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load all analytics data in parallel
      const [overviewRes, trendsRes, vendorsRes, geoRes, financialRes] = await Promise.all([
        apiCall('/api/analytics/overview'),
        apiCall(`/api/analytics/voucher-trends?period=${selectedPeriod}`),
        apiCall('/api/analytics/top-vendors?limit=10'),
        apiCall('/api/analytics/geographic-distribution'),
        apiCall(`/api/analytics/financial-summary?period=${selectedPeriod}`)
      ]);

      setOverview(overviewRes.data);
      setVoucherTrends(trendsRes.data);
      setTopVendors(vendorsRes.data);
      setGeoDistribution(geoRes.data);
      setFinancialSummary(financialRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>📊 Loading Analytics...</div>
        <div style={{ fontSize: '16px', color: '#666' }}>Please wait while we gather the data</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '24px', color: '#e74c3c' }}>⚠️ Failed to Load Analytics</div>
        <button onClick={loadAnalyticsData} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const voucherTrendChartData = voucherTrends ? {
    labels: voucherTrends.issued.map(d => d.date),
    datasets: [
      {
        label: 'Vouchers Issued',
        data: voucherTrends.issued.map(d => d.count),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Vouchers Redeemed',
        data: voucherTrends.redeemed.map(d => d.count),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const userDistributionData = overview ? {
    labels: ['VCFSE', 'Schools', 'Vendors', 'Recipients'],
    datasets: [{
      data: [overview.users.vcse, overview.users.schools, overview.users.vendors, overview.users.recipients],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const voucherStatusData = overview ? {
    labels: ['Active', 'Redeemed', 'Expired'],
    datasets: [{
      data: [overview.vouchers.active, overview.vouchers.redeemed, overview.vouchers.expired],
      backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const topVendorsChartData = topVendors ? {
    labels: topVendors.map(v => v.shop_name),
    datasets: [{
      label: 'Redemptions',
      data: topVendors.map(v => v.redemption_count),
      backgroundColor: '#FF9800',
      borderColor: '#F57C00',
      borderWidth: 1
    }]
  } : null;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>📊 Analytics Dashboard</h2>
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Time Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ padding: '8px 15px', fontSize: '14px', borderRadius: '5px', border: '1px solid #ddd' }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <MetricCard 
          title="Total Users" 
          value={overview.users.total} 
          icon="👥" 
          color="#4CAF50"
        />
        <MetricCard 
          title="Active Vouchers" 
          value={overview.vouchers.active} 
          subtitle={`£${overview.vouchers.active_value.toFixed(2)}`}
          icon="🎫" 
          color="#2196F3"
        />
        <MetricCard 
          title="Redeemed Vouchers" 
          value={overview.vouchers.redeemed} 
          subtitle={`£${overview.vouchers.redeemed_value.toFixed(2)}`}
          icon="✅" 
          color="#FF9800"
        />
        <MetricCard 
          title="Redemption Rate" 
          value={`${overview.recent_activity.redemption_rate}%`} 
          subtitle={`Last ${selectedPeriod}`}
          icon="📈" 
          color="#9C27B0"
        />
      </div>

      {/* Financial Summary */}
      {financialSummary && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>💰 Financial Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <FinancialMetric label="Total Issued" value={`£${financialSummary.total_issued.toFixed(2)}`} />
            <FinancialMetric label="Total Redeemed" value={`£${financialSummary.total_redeemed.toFixed(2)}`} />
            <FinancialMetric label="Outstanding" value={`£${financialSummary.outstanding.toFixed(2)}`} />
            <FinancialMetric label="Expired" value={`£${financialSummary.expired.toFixed(2)}`} color="#F44336" />
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Voucher Trends */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📈 Voucher Trends</h3>
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
        {/* Top Vendors */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>🏪 Top 10 Vendors by Redemptions</h3>
          {topVendorsChartData && (
            <Bar 
              data={topVendorsChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          )}
        </div>

        {/* Voucher Status */}
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
      </div>

      {/* Wallet Balances */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>💳 Wallet Balances</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <FinancialMetric label="VCFSE Total" value={`£${overview.wallet_balances.vcse_total.toFixed(2)}`} color="#4CAF50" />
          <FinancialMetric label="Schools Total" value={`£${overview.wallet_balances.school_total.toFixed(2)}`} color="#2196F3" />
          <FinancialMetric label="Vendors Total" value={`£${overview.wallet_balances.vendor_total.toFixed(2)}`} color="#FF9800" />
          <FinancialMetric label="System Total" value={`£${overview.wallet_balances.system_total.toFixed(2)}`} color="#9C27B0" />
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
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: color }}>{value}</div>
          {subtitle && <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: '36px' }}>{icon}</div>
      </div>
    </div>
  );
}

function FinancialMetric({ label, value, color = '#333' }) {
  return (
    <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

export default AnalyticsDashboard;
