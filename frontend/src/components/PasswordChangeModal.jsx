import { useState } from 'react'

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  })
  
  if (!response.ok && response.status !== 401) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  inputWrapper: {
    position: 'relative',
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    fontSize: '18px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxSizing: 'border-box'
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '22px',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '10px'
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '18px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}

export default function PasswordChangeModal({ onClose }) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage('Error: New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setMessage('Error: Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const data = await apiCall('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      })
      setMessage('Success: ' + data.message)
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>🔒 Change Password</h2>
        
        {message && (
          <div style={{
            backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
            color: message.includes('Error') ? '#c62828' : '#2e7d32',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              Current Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                style={styles.input}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              New Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                style={styles.input}
                required
                minLength="8"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small style={{color: '#666'}}>Minimum 8 characters</small>
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              Confirm New Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                style={styles.input}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
