import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const PWAInstallPrompt = () => {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPlatform, setShowPlatform] = useState(null) // 'ios' or 'android' or null (auto-detect)

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

    // Reduced delay for better UX: 5 seconds instead of 30
    const promptDelay = 5000

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after delay on first visit
      // Or immediately if user has visited before
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true)
        }, promptDelay)
      } else {
        // Show immediately on subsequent visits
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt after delay since there's no beforeinstallprompt event
    if (ios) {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true)
        }, promptDelay)
      } else {
        setShowPrompt(true)
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

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-seen', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-seen', 'true')
  }

  if (!showPrompt) {
    return null
  }

  // Determine which platform instructions to show
  const displayPlatform = showPlatform || (isIOS ? 'ios' : 'android')
  
  // Common styles
  const containerStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    right: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    padding: '20px',
    zIndex: 10000
  }

  const toggleButtonStyle = (isActive) => ({
    flex: 1,
    padding: '8px 12px',
    backgroundColor: isActive ? '#4CAF50' : 'transparent',
    color: isActive ? 'white' : '#666',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  })

  // iOS Install Instructions
  if (displayPlatform === 'ios') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src="/icon-192.png" alt="BAK UP" style={{ width: '40px', height: '40px', marginRight: '12px', borderRadius: '8px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>Install BAK UP</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Add to Home Screen</p>
              </div>
            </div>
            
            {/* Platform Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '4px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
              <button onClick={() => setShowPlatform('ios')} style={toggleButtonStyle(true)}>
                {t('landing.pwa.iphoneTab')}
              </button>
              <button onClick={() => setShowPlatform('android')} style={toggleButtonStyle(false)}>
                {t('landing.pwa.androidTab')}
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#555', margin: '10px 0 15px 0', lineHeight: '1.5' }}>
              {t('landing.pwa.iosInstructions')}
            </p>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>1️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.iosStep1') }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>2️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.iosStep2') }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>3️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.iosStep3') }} />
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: '10px' }}>
              {t('landing.pwa.iosNote')}
            </div>
          </div>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', padding: '0', marginLeft: '10px' }}>
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Android Install Instructions
  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <img src="/icon-192.png" alt="BAK UP" style={{ width: '40px', height: '40px', marginRight: '12px', borderRadius: '8px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>{t('landing.pwa.install')}</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>{t('landing.pwa.addToHomeScreen')}</p>
            </div>
          </div>
          
          {/* Platform Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '4px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
              <button onClick={() => setShowPlatform('ios')} style={toggleButtonStyle(false)}>
                {t('landing.pwa.iphoneTab')}
              </button>
              <button onClick={() => setShowPlatform('android')} style={toggleButtonStyle(true)}>
                {t('landing.pwa.androidTab')}
              </button>
          </div>

            <p style={{ fontSize: '14px', color: '#555', margin: '10px 0 15px 0', lineHeight: '1.5' }}>
              {t('landing.pwa.androidInstructions')}
            </p>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>1️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.androidStep1') }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>2️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.androidStep2') }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '24px', marginRight: '12px', minWidth: '30px', textAlign: 'center' }}>3️⃣</div>
                <div style={{ fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: t('landing.pwa.androidStep3') }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleDismiss} style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', flex: 1 }}>
              {t('landing.pwa.notNow')}
            </button>
            <button onClick={handleInstallClick} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)', flex: 1 }}>
              {t('landing.pwa.installButton')}
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', padding: '0', marginLeft: '10px' }}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
