import { useState, useEffect } from 'react'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true

    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Don't show prompt if already installed
    if (standalone) {
      return
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after 30 seconds on first visit
      // Or immediately if user has visited before
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 30000) // 30 seconds
      } else {
        // Show immediately on subsequent visits
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show custom prompt after delay
    if (ios && !standalone) {
      const hasSeenIOSPrompt = localStorage.getItem('pwa-ios-prompt-seen')
      if (!hasSeenIOSPrompt) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 30000) // 30 seconds
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
    
    // Mark as seen
    localStorage.setItem('pwa-prompt-seen', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-seen', 'true')
    
    if (isIOS) {
      localStorage.setItem('pwa-ios-prompt-seen', 'true')
    }
  }

  // Don't render if already installed
  if (isStandalone) {
    return null
  }

  // Don't render if prompt shouldn't be shown
  if (!showPrompt) {
    return null
  }

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        zIndex: 10000,
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src="/icon-192.png" alt="BAK UP" style={{ width: '40px', height: '40px', marginRight: '12px', borderRadius: '8px' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>Install BAK UP</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Add to Home Screen</p>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#555', margin: '10px 0' }}>
              Install this app on your iPhone: tap <span style={{ 
                display: 'inline-block', 
                padding: '2px 6px', 
                backgroundColor: '#007AFF', 
                color: 'white', 
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>Share</span> and then <strong>Add to Home Screen</strong>.
            </p>
            <div style={{ fontSize: '24px', textAlign: 'center', margin: '10px 0' }}>
              📱 ➜ ⬆️ ➜ ➕
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              marginLeft: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Android/Chrome Install Prompt
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      padding: '20px',
      zIndex: 10000,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img src="/icon-192.png" alt="BAK UP" style={{ width: '50px', height: '50px', marginRight: '15px', borderRadius: '10px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>Install BAK UP</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Install this app for quick access and offline use
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
          <button
            onClick={handleDismiss}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Not Now
          </button>
          <button
            onClick={handleInstallClick}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
            }}
          >
            Install
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 600px) {
          div[style*="bottom: 20px"] {
            left: 10px !important;
            right: 10px !important;
            bottom: 10px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PWAInstallPrompt
