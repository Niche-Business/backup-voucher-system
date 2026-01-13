import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const VCSEVerificationAdmin = ({ apiCall }) => {
  const { t } = useTranslation();
  const [pendingVCSEs, setPendingVCSEs] = useState([]);
  const [stats, setStats] = useState({ pending: 0, active: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedVCSE, setSelectedVCSE] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingVCSEs();
    loadStats();
  }, []);

  const loadPendingVCSEs = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/admin/vcse-verifications/pending');
      setPendingVCSEs(data.pending_vcses || []);
    } catch (error) {
      setMessage('t('vcfseVerification.error_loading') + ': '' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiCall('/admin/vcse-verifications/stats');
      setStats(data);
    } catch (error) {
      console.error('t('vcfseVerification.error_loading_stats') + ':'', error);
    }
  };

  const handleApprove = async (vcse) => {
    if (!confirm(`Approve ${vcse.organization_name}?\n\nThis will grant them access to the VCFSE portal.`)) {
      return;
    }

    try {
      const result = await apiCall(`/admin/vcse-verifications/${vcse.id}/approve`, {
        method: 'POST'
      });
      setMessage(`✅ ${t('vcfseVerification.approved_success', { name: vcse.organization_name, email: vcse.email })}`);
      loadPendingVCSEs();
      loadStats();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('t('vcfseVerification.error_approving') + ': '' + error.message);
    }
  };

  const handleRejectClick = (vcse) => {
    setSelectedVCSE(vcse);
    setRejectionReason(t('vcfseVerification.default_rejection_reason'));
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert(t('vcfseVerification.provide_reason'));
      return;
    }

    try {
      const result = await apiCall(`/admin/vcse-verifications/${selectedVCSE.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });
      setMessage(`❌ ${t('vcfseVerification.rejected_success', { name: selectedVCSE.organization_name })}`);
      setShowRejectModal(false);
      setSelectedVCSE(null);
      setRejectionReason('');
      loadPendingVCSEs();
      loadStats();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('t('vcfseVerification.error_rejecting') + ': '' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.na');
    return new Date(dateString).toLocaleString();
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '30px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '30px'
    },
    statCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#4CAF50',
      margin: '10px 0'
    },
    statLabel: {
      color: '#666',
      fontSize: '18px'
    },
    vcseCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0'
    },
    vcseHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '15px',
      paddingBottom: '15px',
      borderBottom: '2px solid #f0f0f0'
    },
    vcseTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '5px'
    },
    vcseSubtitle: {
      color: '#666',
      fontSize: '18px'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      marginBottom: '15px'
    },
    detailItem: {
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px'
    },
    detailLabel: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '5px',
      fontWeight: '600'
    },
    detailValue: {
      fontSize: '18px',
      color: '#333'
    },
    charityBox: {
      backgroundColor: '#e8f5e9',
      padding: '15px',
      borderRadius: '8px',
      borderLeft: '4px solid #4CAF50',
      marginBottom: '15px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '15px'
    },
    approveButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: 'bold',
      flex: 1
    },
    rejectButton: {
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: 'bold',
      flex: 1
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '500px',
      width: '90%'
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      marginTop: '10px'
    },
    message: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      border: '1px solid #4CAF50'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🔍 VCFSE Verification Queue</h1>
        <p style={{color: '#666'}}>Review and approve VCFSE organization registrations</p>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Pending Verification</div>
          <div style={{...styles.statNumber, color: '#ff9800'}}>{stats.pending}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active VCSEs</div>
          <div style={{...styles.statNumber, color: '#4CAF50'}}>{stats.active}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Rejected</div>
          <div style={{...styles.statNumber, color: '#f44336'}}>{stats.rejected}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Registrations</div>
          <div style={{...styles.statNumber, color: '#2196F3'}}>{stats.total}</div>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <p>Loading pending verifications...</p>
        </div>
      ) : pendingVCSEs.length === 0 ? (
        <div style={{...styles.vcseCard, textAlign: 'center', padding: '40px'}}>
          <h3>✅ No Pending Verifications</h3>
          <p style={{color: '#666'}}>All VCFSE registrations have been processed</p>
        </div>
      ) : (
        pendingVCSEs.map(vcse => (
          <div key={vcse.id} style={styles.vcseCard}>
            <div style={styles.vcseHeader}>
              <div>
                <div style={styles.vcseTitle}>{vcse.organization_name}</div>
                <div style={styles.vcseSubtitle}>
                  {vcse.first_name} {vcse.last_name} • {vcse.email}
                </div>
                <div style={{...styles.vcseSubtitle, fontSize: '16px', marginTop: '5px'}}>
                  Registered: {formatDate(vcse.created_at)}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fff3e0',
                color: '#f57c00',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                PENDING
              </div>
            </div>

            <div style={styles.charityBox}>
              <div style={{fontSize: '16px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px'}}>
                🏛️ CHARITY COMMISSION DETAILS
              </div>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#1b5e20'}}>
                {vcse.charity_commission_number}
              </div>
              <div style={{fontSize: '16px', color: '#666', marginTop: '5px'}}>
                ⚠️ Verify this number at{' '}
                <a
                  href={`https://register-of-charities.charitycommission.gov.uk/charity-search?p_p_id=uk_gov_ccew_onereg_charitydetails_web_portlet_CharityDetailsPortlet&p_p_lifecycle=1&p_p_state=normal&_uk_gov_ccew_onereg_charitydetails_web_portlet_CharityDetailsPortlet_javax.portlet.action=searchCharitiesAction&_uk_gov_ccew_onereg_charitydetails_web_portlet_CharityDetailsPortlet_searchValue=${vcse.charity_commission_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: '#4CAF50', fontWeight: 'bold'}}
                >
                  Charity Commission Register
                </a>
              </div>
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>📧 Email</div>
                <div style={styles.detailValue}>{vcse.email}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>📞 Phone</div>
                <div style={styles.detailValue}>{vcse.phone || 'Not provided'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>📍 Address</div>
                <div style={styles.detailValue}>{vcse.address || 'Not provided'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>🏙️ City / Postcode</div>
                <div style={styles.detailValue}>
                  {vcse.city || t('common.na')} {vcse.postcode ? `• ${vcse.postcode}` : ''}
                </div>
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button
                onClick={() => handleApprove(vcse)}
                style={styles.approveButton}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                ✅ Approve & Send Login Link
              </button>
              <button
                onClick={() => handleRejectClick(vcse)}
                style={styles.rejectButton}
                onMouseOver={(e) => e.target.style.backgroundColor = '#da190b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
              >
                ❌ Reject Application
              </button>
            </div>
          </div>
        ))
      )}

      {showRejectModal && (
        <div style={styles.modal} onClick={() => setShowRejectModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Reject VCFSE Application</h2>
            <p><strong>Organization:</strong> {selectedVCSE?.organization_name}</p>
            <p><strong>Charity Number:</strong> {selectedVCSE?.charity_commission_number}</p>
            
            <label style={{display: 'block', marginTop: '20px', fontWeight: 'bold'}}>
              Rejection Reason:
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              style={styles.textarea}
            />
            
            <div style={{...styles.buttonGroup, marginTop: '20px'}}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{...styles.approveButton, backgroundColor: '#999'}}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                style={styles.rejectButton}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VCSEVerificationAdmin;
