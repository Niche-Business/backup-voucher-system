import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError('')
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
    } catch (err) {
      console.error('QR Scanner error:', err)
      
      // Provide detailed error message based on error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please enable camera access in your browser settings and try again.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please use manual voucher code entry instead.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps and try again.')
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not support required settings. Please use manual voucher code entry instead.')
      } else {
        setError('Failed to start camera. Please use manual voucher code entry below instead.')
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
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
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
        width: '100%'
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

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '15px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{fontWeight: 'bold', marginBottom: '8px'}}>⚠️ Camera Access Issue</div>
            <div style={{marginBottom: '10px'}}>{error}</div>
            
            {error.includes('permission') && (
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#fff3e0', color: '#e65100', borderRadius: '5px'}}>
                <strong>🔧 How to Enable Camera:</strong>
                <ol style={{margin: '8px 0 0 20px', padding: 0}}>
                  <li>Look for a camera icon in your browser's address bar</li>
                  <li>Click it and select "Allow" or "Always allow"</li>
                  <li>Refresh this page and try again</li>
                </ol>
                <div style={{marginTop: '8px', fontStyle: 'italic'}}>Or close this and use manual voucher code entry instead.</div>
              </div>
            )}
            
            {error.includes('No camera') && (
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', color: '#01579b', borderRadius: '5px'}}>
                <strong>📝 Alternative:</strong> Close this window and manually type the voucher code in the input field below.
              </div>
            )}
          </div>
        )}

        <div 
          id="qr-reader" 
          style={{
            width: '100%',
            borderRadius: '10px',
            overflow: 'hidden'
          }}
        ></div>

        <p style={{textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '14px'}}>
          {scanning ? 'Position the QR code within the frame' : 'Initializing camera...'}
        </p>
      </div>
    </div>
  )
}
