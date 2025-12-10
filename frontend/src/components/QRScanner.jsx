import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError('')
      setShowInstructions(false)
      
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Successfully scanned
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
      
      // Provide detailed error message based on error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please check your browser settings to allow camera access for this site.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please use manual voucher code entry instead.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps and try again.')
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not support required settings. Please use manual voucher code entry instead.')
      } else {
        setError('Failed to start camera. Please use manual voucher code entry instead.')
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

        {/* Show instructions before camera is enabled */}
        {showInstructions && !cameraEnabled && (
          <div style={{marginBottom: '20px'}}>
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{margin: '0 0 15px 0', color: '#1976d2'}}>📋 How to Scan QR Codes:</h4>
              <ol style={{margin: '0', paddingLeft: '20px', lineHeight: '1.8'}}>
                <li><strong>Click "Enable Camera"</strong> button below</li>
                <li><strong>Allow camera access</strong> when your browser asks</li>
                <li><strong>Point your camera</strong> at the customer's QR code</li>
                <li><strong>Code will scan automatically</strong> when detected</li>
              </ol>
            </div>

            <button
              onClick={handleEnableCamera}
              style={{
                backgroundColor: '#4CAF50',
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
                gap: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              <span style={{fontSize: '24px'}}>📷</span>
              <span>Enable Camera</span>
            </button>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <strong>⚠️ Important:</strong> Your browser will ask for permission to use the camera. 
              Please click <strong>"Allow"</strong> when prompted.
            </div>

            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <strong>💡 Alternative:</strong> Close this window and manually type the voucher code instead.
            </div>
          </div>
        )}

        {/* Show error message if camera fails */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{fontWeight: 'bold', marginBottom: '8px', fontSize: '16px'}}>⚠️ Camera Access Failed</div>
            <div style={{marginBottom: '15px'}}>{error}</div>
            
            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#fff3e0',
              borderRadius: '5px',
              color: '#e65100'
            }}>
              <strong>🔧 How to Fix:</strong>
              <ol style={{margin: '10px 0 0 20px', padding: 0, lineHeight: '1.8'}}>
                <li>Look for a <strong>camera icon 📷</strong> or <strong>lock icon 🔒</strong> in your browser's address bar</li>
                <li>Click it and select <strong>"Allow"</strong> for camera access</li>
                <li>Refresh this page and try again</li>
              </ol>
            </div>

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
              padding: '12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '5px',
              color: '#01579b',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              📝 Or close this and use manual voucher code entry
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
