import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [permissionBlocked, setPermissionBlocked] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome'
    if (userAgent.includes('Firefox')) return 'firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari'
    if (userAgent.includes('Edg')) return 'edge'
    return 'unknown'
  }

  const getCameraSettingsUrl = () => {
    const browser = getBrowserInfo()
    switch(browser) {
      case 'chrome':
        return 'chrome://settings/content/camera'
      case 'firefox':
        return 'about:preferences#privacy'
      case 'edge':
        return 'edge://settings/content/camera'
      default:
        return null
    }
  }

  const startScanner = async () => {
    try {
      setError('')
      setShowInstructions(false)
      setPermissionBlocked(false)
      
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Scanning error (ignore, happens frequently)
        }
      )
      setScanning(true)
      setCameraEnabled(true)
    } catch (err) {
      console.error('QR Scanner error:', err)
      setCameraEnabled(false)
      setScanning(false)
      
      // Check if permission was denied
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionBlocked(true)
        setError('Camera permission is blocked in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.')
      } else {
        setError('Failed to start camera.')
      }
    }
  }

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      }
      setScanning(false)
      setCameraEnabled(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  const handleEnableCamera = () => {
    setShowInstructions(false)
    startScanner()
  }

  const openCameraSettings = () => {
    const url = getCameraSettingsUrl()
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <h3 style={{margin: 0}}>📷 Scan QR Code</h3>
          <button 
            onClick={handleClose}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Initial instructions */}
        {showInstructions && !cameraEnabled && (
          <div style={{marginBottom: '20px'}}>
            {/* Prominent manual entry recommendation */}
            <div style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '32px', marginBottom: '10px'}}>💡</div>
              <h3 style={{margin: '0 0 10px 0'}}>Recommended: Use Manual Entry</h3>
              <p style={{margin: '0', fontSize: '14px', lineHeight: '1.6'}}>
                Close this window and type the voucher code manually. It's faster and more reliable!
              </p>
              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'white',
                  color: '#4CAF50',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '15px',
                  width: '100%'
                }}
              >
                ✓ Use Manual Entry Instead
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              margin: '20px 0',
              color: '#999',
              fontSize: '14px'
            }}>
              — OR —
            </div>

            {/* QR scanner option */}
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{margin: '0 0 15px 0', color: '#1976d2'}}>📱 Try QR Scanner:</h4>
              <ol style={{margin: '0', paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px'}}>
                <li>Click "Enable Camera" below</li>
                <li>Your browser will ask for permission</li>
                <li>Click "Allow" when prompted</li>
                <li>Point camera at QR code</li>
              </ol>
            </div>

            <button
              onClick={handleEnableCamera}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <span style={{fontSize: '24px'}}>📷</span>
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Error message with browser-specific help */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{fontWeight: 'bold', marginBottom: '10px', fontSize: '16px'}}>⚠️ Camera Access Failed</div>
            <div style={{marginBottom: '15px'}}>{error}</div>
            
            {permissionBlocked && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#fff3e0',
                borderRadius: '5px',
                color: '#e65100'
              }}>
                <strong>🔧 Your browser has blocked camera access.</strong>
                <p style={{margin: '10px 0'}}>To fix this:</p>
                <ol style={{margin: '10px 0 10px 20px', padding: 0, lineHeight: '1.8'}}>
                  <li>Look for a <strong>camera icon 📷</strong> or <strong>lock icon 🔒</strong> in your browser's address bar (top left)</li>
                  <li>Click it and change camera permission to <strong>"Allow"</strong></li>
                  <li>Refresh this page and try again</li>
                </ol>
                
                {getCameraSettingsUrl() && (
                  <button
                    onClick={openCameraSettings}
                    style={{
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: '10px'
                    }}
                  >
                    ⚙️ Open Browser Camera Settings
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleEnableCamera}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                marginTop: '15px'
              }}
            >
              🔄 Try Again
            </button>

            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#4CAF50',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'white',
                  color: '#4CAF50',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ✓ Use Manual Entry Instead (Recommended)
              </button>
            </div>
          </div>
        )}

        {/* Camera view */}
        <div 
          id="qr-reader" 
          style={{
            width: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            display: cameraEnabled ? 'block' : 'none'
          }}
        ></div>

        {/* Scanning status */}
        {cameraEnabled && !error && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px'}}>
              ✅ Camera Active
            </div>
            <div style={{fontSize: '14px', color: '#1b5e20'}}>
              {scanning ? '📱 Position the QR code within the frame' : '⏳ Initializing camera...'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
