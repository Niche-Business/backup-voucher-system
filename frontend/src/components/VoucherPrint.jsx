import React from 'react';

const VoucherPrint = ({ voucher, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    // Create a canvas to draw the QR code
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR code pattern (simplified - would use proper QR library in production)
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(voucher.code, size / 2, size / 2);
    
    // Convert to downloadable image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${voucher.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .print-voucher {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px;
          border: 3px solid #4CAF50;
          border-radius: 15px;
          background: white;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
        }
        
        .print-logo {
          font-size: 36px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 10px;
        }
        
        .print-title {
          font-size: 24px;
          color: #333;
          margin: 0;
        }
        
        .print-qr-section {
          text-align: center;
          margin: 30px 0;
          padding: 30px;
          background: #f9f9f9;
          border-radius: 10px;
        }
        
        .print-qr-box {
          display: inline-block;
          padding: 30px;
          background: white;
          border: 3px solid #4CAF50;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .print-qr-placeholder {
          width: 250px;
          height: 250px;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          color: #666;
          border-radius: 5px;
        }
        
        .print-code {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #333;
          letter-spacing: 3px;
          margin: 20px 0;
          padding: 15px;
          background: #fff;
          border: 2px dashed #4CAF50;
          border-radius: 5px;
        }
        
        .print-value {
          font-size: 48px;
          font-weight: bold;
          color: #4CAF50;
          margin: 20px 0;
        }
        
        .print-details {
          margin: 30px 0;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
        }
        
        .print-detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 16px;
        }
        
        .print-detail-label {
          font-weight: bold;
          color: #666;
        }
        
        .print-detail-value {
          color: #333;
        }
        
        .print-instructions {
          margin-top: 30px;
          padding: 20px;
          background: #e8f5e9;
          border-left: 4px solid #4CAF50;
          border-radius: 5px;
        }
        
        .print-instructions h3 {
          margin-top: 0;
          color: #2e7d32;
        }
        
        .print-instructions ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .print-instructions li {
          margin: 8px 0;
          color: #333;
        }
        
        .print-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
      `}</style>

      {/* Modal Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          {/* Action Buttons (hidden when printing) */}
          <div className="no-print" style={{
            position: 'sticky',
            top: 0,
            background: 'white',
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🖨️ Print Voucher
              </button>
              <button
                onClick={handleDownloadQR}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💾 Download QR Code
              </button>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Printable Voucher */}
          <div className="print-area print-voucher">
            <div className="print-header">
              <div className="print-logo">BAK UP</div>
              <h1 className="print-title">Food Voucher</h1>
            </div>

            <div className="print-qr-section">
              <div className="print-qr-box">
                <div className="print-qr-placeholder">
                  QR Code<br/>{voucher.code}
                </div>
              </div>
              <div className="print-code">{voucher.code}</div>
              <div className="print-value">£{parseFloat(voucher.value || 0).toFixed(2)}</div>
            </div>

            <div className="print-details">
              <div className="print-detail-row">
                <span className="print-detail-label">Status:</span>
                <span className="print-detail-value" style={{
                  color: voucher.status === 'active' ? '#4CAF50' : '#666',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {voucher.status}
                </span>
              </div>
              {voucher.expiry_date && (
                <div className="print-detail-row">
                  <span className="print-detail-label">Expires:</span>
                  <span className="print-detail-value">
                    {new Date(voucher.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {voucher.recipient && (
                <div className="print-detail-row">
                  <span className="print-detail-label">Recipient:</span>
                  <span className="print-detail-value">{voucher.recipient.name}</span>
                </div>
              )}
            </div>

            <div className="print-instructions">
              <h3>📋 How to Use This Voucher:</h3>
              <ol>
                <li>Present this voucher at any participating local food shop</li>
                <li>Show the QR code or tell the cashier your voucher code</li>
                <li>The shop will scan the code or enter it manually</li>
                <li>Your voucher balance will be deducted from the purchase</li>
                <li>You can use this voucher multiple times until the balance is zero</li>
              </ol>
            </div>

            <div className="print-footer">
              <p><strong>BAK UP - Community Food Support</strong></p>
              <p>For assistance, please contact your issuing organization</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                This voucher is valid only at participating shops. Not redeemable for cash.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoucherPrint;
