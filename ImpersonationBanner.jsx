/**
 * Impersonation Banner Component
 * Displays when a super admin is impersonating another user
 * Shows at the top of all pages during impersonation
 */

import React from 'react';

export function ImpersonationBanner({ targetUser, onExitImpersonation }) {
  const getUserTypeLabel = (userType) => {
    const labels = {
      'recipient': 'Recipient',
      'vendor': 'Vendor',
      'vcse': 'VCSE Organization',
      'school': 'School/Care Organization',
      'admin': 'Administrator'
    };
    return labels[userType] || userType;
  };

  const getUserTypeIcon = (userType) => {
    const icons = {
      'recipient': '👤',
      'vendor': '🏪',
      'vcse': '🤝',
      'school': '🏫',
      'admin': '⚙️'
    };
    return icons[userType] || '👤';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ff9800',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      fontWeight: 'bold',
      fontSize: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>👁️</span>
        <div>
          <div style={{ fontSize: '16px' }}>
            <strong>IMPERSONATION MODE</strong>
          </div>
          <div style={{ fontSize: '13px', opacity: 0.95, marginTop: '2px' }}>
            Viewing as: <strong>{targetUser.name}</strong> {getUserTypeIcon(targetUser.user_type)} ({getUserTypeLabel(targetUser.user_type)})
          </div>
        </div>
      </div>
      
      <button
        onClick={onExitImpersonation}
        style={{
          backgroundColor: 'white',
          color: '#ff9800',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ← Exit Impersonation
      </button>
    </div>
  );
}

export default ImpersonationBanner;
