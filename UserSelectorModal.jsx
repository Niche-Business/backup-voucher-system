/**
 * User Selector Modal Component
 * Allows super admin to select which user to impersonate
 */

import React, { useState, useEffect } from 'react';

export function UserSelectorModal({ isOpen, onClose, onSelectUser, users, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  if (!isOpen) return null;

  const getUserTypeLabel = (userType) => {
    const labels = {
      'recipient': 'Recipient',
      'vendor': 'Vendor',
      'vcse': 'VCSE Organization',
      'school': 'School/Care',
      'admin': 'Administrator'
    };
    return labels[userType] || userType;
  };

  const getUserTypeColor = (userType) => {
    const colors = {
      'recipient': '#4CAF50',
      'vendor': '#2196F3',
      'vcse': '#9C27B0',
      'school': '#FF9800',
      'admin': '#F44336'
    };
    return colors[userType] || '#757575';
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

  // Filter users based on search query and type filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.organization_name && user.organization_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Group users by type
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    if (!acc[user.user_type]) {
      acc[user.user_type] = [];
    }
    acc[user.user_type].push(user);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>👁️ Switch User</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Select a user to impersonate for testing
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px 10px'
            }}
          >
            ×
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '5px',
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['all', 'recipient', 'vendor', 'vcse', 'school', 'admin'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '8px 16px',
                  border: filterType === type ? '2px solid #1976d2' : '2px solid #e0e0e0',
                  borderRadius: '20px',
                  backgroundColor: filterType === type ? '#e3f2fd' : 'white',
                  color: filterType === type ? '#1976d2' : '#666',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: filterType === type ? 'bold' : 'normal'
                }}
              >
                {type === 'all' ? 'All Users' : getUserTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
              <p>No users found</p>
            </div>
          ) : (
            Object.entries(groupedUsers).map(([userType, typeUsers]) => (
              <div key={userType} style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '14px',
                  color: '#666',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  {getUserTypeIcon(userType)} {getUserTypeLabel(userType)} ({typeUsers.length})
                </h3>
                
                {typeUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    style={{
                      padding: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'white'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = getUserTypeColor(user.user_type);
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>
                          {getUserTypeIcon(user.user_type)} {user.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          📧 {user.email}
                        </div>
                        {user.organization_name && (
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
                            🏢 {user.organization_name}
                          </div>
                        )}
                        {user.phone && (
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
                            📱 {user.phone}
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '15px',
                        backgroundColor: getUserTypeColor(user.user_type),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getUserTypeLabel(user.user_type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>{filteredUsers.length}</strong> user{filteredUsers.length !== 1 ? 's' : ''} available for impersonation
        </div>
      </div>
    </div>
  );
}

export default UserSelectorModal;
