import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Notification Bell Component
export function NotificationBell({ apiCall, userType }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to notification server');
      // Join the appropriate room based on user type
      socket.emit('join_room', { user_type: userType });
      console.log(`Joined ${userType} room for notifications`);
    });

    socket.on('new_item_notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Add notification to list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play sound if enabled
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
      
      // Show browser notification if permitted (check if Notification API exists)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Item Available', {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    socketRef.current = socket;

    // Load existing notifications
    loadNotifications();
    
    // Load notification preferences
    loadPreferences();

    // Request browser notification permission (check if Notification API exists)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Update sound when soundEnabled changes
  useEffect(() => {
    if (soundEnabled !== null) {
      savePreferences();
    }
  }, [soundEnabled]);

  const loadNotifications = async () => {
    try {
      const response = await apiCall('/api/notifications', 'GET');
      if (response.notifications) {
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await apiCall('/api/notifications/preferences', 'GET');
      if (response.sound_enabled !== undefined) {
        setSoundEnabled(response.sound_enabled);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      await apiCall('/api/notifications/preferences', 'POST', {
        sound_enabled: soundEnabled
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiCall('/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getNotificationIcon = (type) => {
    if (type === 'discounted_item') return '🎁';
    if (type === 'free_item') return '🆓';
    return '🔔';
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          padding: '8px',
          color: 'white'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '350px',
            maxHeight: '500px',
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            zIndex: 1000,
            overflow: 'hidden',
            marginTop: '8px'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              Notifications
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px'
                }}
                title="Settings"
              >
                ⚙️
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#4CAF50',
                    fontWeight: 'bold'
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div
              style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>Enable notification sound</span>
              </label>
            </div>
          )}

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    // Mark as read
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    // Navigate to item (close dropdown first)
                    setShowDropdown(false);
                    // Trigger navigation based on user type
                    if (notification.item_type === 'free') {
                      // Free items - navigate to VCFSE To Go tab
                      window.location.hash = '#vcfse-togo';
                    } else {
                      // Discounted items - navigate to Browse To Go tab
                      window.location.hash = '#browse-togo';
                    }
                  }}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: notification.is_read ? 'white' : '#e8f5e9',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#e8f5e9'}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: '0 0 5px 0',
                          fontSize: '14px',
                          fontWeight: notification.is_read ? 'normal' : 'bold',
                          color: '#333'
                        }}
                      >
                        {notification.message}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          color: '#666'
                        }}
                      >
                        <span>{notification.shop_name}</span>
                        <span>{formatTime(notification.created_at)}</span>
                      </div>
                      {notification.quantity && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                          Quantity: {notification.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden audio element for notification sound */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyy3ksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Ik2CBlou+3nn00QDFC"
        preload="auto"
      />

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

export default NotificationBell;
