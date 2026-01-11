import { useState } from 'react'

/**
 * MobileNavTabs - Responsive navigation component
 * Shows tabs horizontally on desktop, hamburger menu on mobile
 * 
 * Props:
 * - tabs: Array of {label, value, icon} objects
 * - activeTab: Current active tab value
 * - onTabChange: Callback function when tab changes
 * - backgroundColor: Header background color (default: '#9C27B0')
 */
export default function MobileNavTabs({ tabs, activeTab, onTabChange, backgroundColor = '#9C27B0' }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const styles = {
    tabsContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    tab: {
      padding: '12px 20px',
      backgroundColor: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      color: '#666'
    },
    activeTab: {
      padding: '12px 20px',
      backgroundColor: backgroundColor,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      color: 'white'
    },
    mobileMenuButton: {
      backgroundColor: 'transparent',
      border: '2px solid white',
      borderRadius: '50%',
      width: '48px',
      height: '48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      cursor: 'pointer',
      padding: '8px'
    },
    hamburgerLine: {
      width: '24px',
      height: '3px',
      backgroundColor: 'white',
      borderRadius: '2px'
    },
    mobileMenuDropdown: {
      position: 'absolute',
      top: '60px',
      right: '0',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '220px',
      zIndex: 1000,
      overflow: 'hidden'
    },
    mobileMenuItem: {
      width: '100%',
      padding: '15px 20px',
      backgroundColor: 'transparent',
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderBottom: '1px solid #eee'
    },
    mobileMenuItemActive: {
      width: '100%',
      padding: '15px 20px',
      backgroundColor: '#f0f0f0',
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '18px',
      color: backgroundColor,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderBottom: '1px solid #eee',
      fontWeight: 'bold'
    }
  }

  // Desktop tabs view
  const desktopTabs = (
    <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => {
            onTabChange(tab.value)
            setShowMobileMenu(false)
          }}
          style={activeTab === tab.value ? styles.activeTab : styles.tab}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )

  // Mobile menu button and dropdown
  const mobileMenu = (
    <div style={{position: 'relative'}}>
      <button 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        style={styles.mobileMenuButton}
      >
        <div style={styles.hamburgerLine}></div>
        <div style={styles.hamburgerLine}></div>
        <div style={styles.hamburgerLine}></div>
      </button>

      {showMobileMenu && (
        <div style={styles.mobileMenuDropdown}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => {
                onTabChange(tab.value)
                setShowMobileMenu(false)
              }}
              style={activeTab === tab.value ? styles.mobileMenuItemActive : styles.mobileMenuItem}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = activeTab === tab.value ? '#f0f0f0' : 'transparent'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-tabs-nav {
            display: none !important;
          }
          .mobile-menu-nav {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-tabs-nav {
            display: flex !important;
          }
          .mobile-menu-nav {
            display: none !important;
          }
        }
      `}</style>

      {/* Desktop tabs */}
      <div className="desktop-tabs-nav">
        {desktopTabs}
      </div>

      {/* Mobile menu */}
      <div className="mobile-menu-nav">
        {mobileMenu}
      </div>
    </>
  )
}
