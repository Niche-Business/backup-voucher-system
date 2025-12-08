import React, { useState, useEffect, Component } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import LandingPage from './LandingPage'
import LanguageSelector from './components/LanguageSelector'
import { GlobalSearchTab, TransactionSearchTab, BroadcastTab, FundAllocationTab } from './AdminEnhancements'
import VCSEVerificationAdmin from './VCSEVerificationAdmin'
import { NotificationBell } from './NotificationSystem'
import PasswordChangeModal from './components/PasswordChangeModal'
import QRScanner from './components/QRScanner'
import VoucherPrint from './components/VoucherPrint'
import Pagination from './components/Pagination'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { QRCodeSVG } from 'qrcode.react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '100px auto',
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <p style={{ fontSize: '18px', color: '#555', marginBottom: '30px' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🏠 Go to Home
          </button>
          {this.state.error && (
            <details style={{ marginTop: '30px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#7f8c8d' }}>Technical Details</summary>
              <pre style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#e74c3c'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// API Helper Function
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

function App() {
  const { t, i18n } = useTranslation()
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // RTL support for Arabic
  useEffect(() => {
    const isRTL = i18n.language === 'ar'
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  useEffect(() => {
    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const resetToken = urlParams.get('token')
    const pathname = window.location.pathname
    
    if (resetToken && pathname.includes('reset-password')) {
      setCurrentView('reset-password')
      setLoading(false)
      return
    }
    
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const data = await apiCall('/check-auth')
      if (data.authenticated && data.user) {
        // Map backend user_type to frontend userType
        setUser({
          id: data.user.id,
          email: data.user.email,
          userType: data.user.user_type,
          name: `${data.user.first_name} ${data.user.last_name}`,
          balance: data.user.balance,
          organizationName: data.user.organization_name,
          shopName: data.user.shop_name
        })
        setCurrentView('dashboard')
      }
    } catch (error) {
      console.log('Not authenticated')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (email, password) => {
    try {
      const data = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      if (data.user && data.user.user_type) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          userType: data.user.user_type,
          name: `${data.user.first_name} ${data.user.last_name}`
        })
        setCurrentView('dashboard')
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleLogout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setCurrentView('home')
    }
  }

  const handleRegister = async (formData) => {
    try {
      console.log('[REGISTER] Starting registration...', formData)
      // Convert camelCase to snake_case for backend
      const backendData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        user_type: formData.userType,
        organization_name: formData.organizationName || '',
        charity_commission_number: formData.charityCommissionNumber || '',
        shop_name: formData.shopName || '',
        shop_category: formData.shopCategory || '',
        address: formData.address || '',
        postcode: formData.postcode || '',
        city: formData.city || '',
        town: formData.town || ''
      }
      
      console.log('[REGISTER] Calling API with data:', backendData)
      const data = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(backendData)
      })
      
      console.log('[REGISTER] API response:', data)
      if (data.message) {
        return { success: true, message: data.message }
      } else {
        // If no message but no error, consider it a success
        return { success: true, message: 'Registration successful!' }
      }
    } catch (error) {
      console.error('[REGISTER] Error:', error)
      return { success: false, error: error.message }
    }
  }

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <h2>Loading...</h2>
    </div>
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      {currentView === 'home' && <LandingPage onNavigate={setCurrentView} />}
      {currentView === 'login' && <LoginPage onLogin={handleLogin} onNavigate={setCurrentView} />}
      {currentView === 'admin-login' && <AdminLoginPage onLogin={handleLogin} onNavigate={setCurrentView} />}
      {currentView === 'register' && <RegisterPage onRegister={handleRegister} onNavigate={setCurrentView} />}
      {currentView === 'forgot-password' && <ForgotPasswordPage onNavigate={setCurrentView} />}
      {currentView === 'reset-password' && <ResetPasswordPage token={new URLSearchParams(window.location.search).get('token')} onNavigate={setCurrentView} />}
      {currentView === 'dashboard' && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
      <PWAInstallPrompt />
    </div>
  )
}

// Home Page Component
function HomePage({ onNavigate }) {
  return (
    <div style={{backgroundColor: '#4CAF50', color: 'white', padding: '60px 20px', textAlign: 'center'}}>
      <h1 style={{fontSize: '48px', marginBottom: '20px'}}>BAK UP E-Voucher System</h1>
      <p style={{fontSize: '20px', marginBottom: '40px'}}>Reducing waste, supporting communities, strengthening local economies</p>
      <div style={{display: 'flex', gap: '20px', justifyContent: 'center'}}>
        <button onClick={() => onNavigate('login')} style={styles.primaryButton}>Sign In</button>
        <button onClick={() => onNavigate('register')} style={styles.secondaryButton}>Register</button>
      </div>
      
      <div style={{marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '80px auto 0'}}>
        <FeatureCard icon="🎫" title="Digital Vouchers" description="Recipients receive digital vouchers via text or email to redeem at local shops" />
        <FeatureCard icon="🏪" title="Local Shops" description="Partner shops accept vouchers and notify about Food to Go Items available for collection" />
        <FeatureCard icon="🤝" title="VCFSE Organizations" description="Charities issue vouchers and collect Food to Go Items to support communities" />
        <FeatureCard icon="📊" title="Impact Tracking" description="Comprehensive reporting for admins and VCFSE organizations to measure community impact" />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', color: '#333'}}>
      <div style={{fontSize: '48px', marginBottom: '15px'}}>{icon}</div>
      <h3 style={{marginBottom: '10px'}}>{title}</h3>
      <p style={{color: '#666', lineHeight: '1.6'}}>{description}</p>
    </div>
  )
}

// Login Page Component
function LoginPage({ onLogin, onNavigate }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await onLogin(email, password)
      
      if (!result.success) {
        setError(result.error || 'Login failed')
        setLoading(false)
      }
      // If successful, loading will stop when dashboard loads
    } catch (error) {
      setError(t('login.loginFailed'))
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>{t('login.title')}</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('login.emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              style={styles.input}
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('login.passwordLabel')}</label>
            <div style={{position: 'relative'}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', marginBottom: '15px'}}>
            {loading ? t('login.signingIn') : t('login.signInButton')}
          </button>
        </form>
        
        <div style={{textAlign: 'center'}}>
          <p>{t('login.noAccount')} <button onClick={() => onNavigate('register')} style={styles.linkButton}>{t('login.registerLink')}</button></p>
          <p><button onClick={() => onNavigate('forgot-password')} style={styles.linkButton}>{t('login.forgotPassword')}</button></p>
          <button onClick={() => onNavigate('home')} style={styles.linkButton}>{t('login.backToHome')}</button>
        </div>
        
        <div style={{marginTop: '25px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4CAF50'}}>
          <p style={{margin: '0 0 8px 0', fontSize: '0.9em', lineHeight: '1.5', color: '#333'}}>
            <strong>🌿 {t('login.aboutTitle')}</strong>
          </p>
          <p style={{margin: 0, fontSize: '0.85em', lineHeight: '1.5', color: '#555'}}>
            {t('login.aboutText')}
          </p>
        </div>
      </div>
    </div>
  )
}

// Admin Login Page Component
function AdminLoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await onLogin(email, password)
      
      if (!result.success) {
        setError(result.error || 'Login failed')
        setLoading(false)
      }
    } catch (error) {
      setError(t('login.loginFailed'))
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#1976d2'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <div style={{fontSize: '48px', marginBottom: '10px'}}>🔐</div>
          <h2>Administrator Access</h2>
          <p style={{color: '#666', fontSize: '0.9em'}}>Authorized personnel only</p>
        </div>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bakup.com"
              required
              style={styles.input}
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Password</label>
            <div style={{position: 'relative'}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', marginBottom: '15px', backgroundColor: '#1976d2'}}>
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>
        
        <div style={{textAlign: 'center'}}>
          <button onClick={() => onNavigate('home')} style={styles.linkButton}>← Back to Home</button>
        </div>
      </div>
    </div>
  )
}

// Forgot Password Page Component
function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message + ' Please check your email.')
        setEmail('')
      } else {
        setError(data.error || 'Failed to send reset link')
      }
    } catch (error) {
      setError('Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>Forgot Password</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        {message && <div style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', opacity: loading ? 0.6 : 1}}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '20px'}}>
          <button onClick={() => onNavigate('login')} style={styles.linkButton}>Back to Login</button>
        </div>
      </div>
    </div>
  )
}

// Reset Password Page Component
function ResetPasswordPage({ token, onNavigate }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to login...')
        setTimeout(() => onNavigate('login'), 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>Reset Password</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        {message && <div style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>New Password</label>
            <div style={{position: 'relative'}}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm Password</label>
            <div style={{position: 'relative'}}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={styles.input}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666'
              }}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', opacity: loading ? 0.6 : 1}}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Register Page Component  
function RegisterPage({ onRegister, onNavigate }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'recipient',
    organizationName: '',
    charityCommissionNumber: '',
    shopName: '',
    shopCategory: '',
    address: '',
    postcode: '',
    city: '',
    town: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    // Use functional update to ensure we have the latest state
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }
    
    setLoading(true)
    const result = await onRegister(formData)
    
    if (result.success) {
      setSuccess(result.message || t('register.registrationSuccess'))
      setTimeout(() => onNavigate('login'), 2000)
    } else {
      setError(result.error || t('register.registrationFailed'))
    }
    setLoading(false)
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50', padding: '20px'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '500px', maxWidth: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>{t('register.title')}</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        {success && <div style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.userTypeLabel')}</label>
            <select 
              id="register-usertype-select"
              name="userType" 
              value={formData.userType} 
              onChange={handleChange}
              style={styles.input} 
              required
            >
              <option value="recipient">{t('register.userTypes.recipient')}</option>
                <option value="vendor">{t('register.userTypes.vendor')}</option>
              <option value="vcse">{t('register.userTypes.vcse')}</option>
              <option value="school">{t('register.userTypes.school')}</option>
            </select>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.firstNameLabel')}</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={styles.input} required />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.lastNameLabel')}</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={styles.input} required />
            </div>
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.emailLabel')}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.phoneLabel')}</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.passwordLabel')}</label>
              <div style={{position: 'relative'}}>
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} style={styles.input} required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.confirmPasswordLabel')}</label>
              <div style={{position: 'relative'}}>
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={styles.input} required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>
          
          {/* VCFSE Organization Fields */}
          {formData.userType === 'vcse' && (
            <>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.organizationNameLabel')}</label>
                <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} style={styles.input} required />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.charityNumberLabel')} <span style={{color: '#f44336'}}>*</span></label>
                <input 
                  type="text" 
                  name="charityCommissionNumber" 
                  value={formData.charityCommissionNumber || ''} 
                  onChange={handleChange} 
                  placeholder={t('register.charityNumberPlaceholder')} 
                  style={styles.input} 
                  required 
                />
                <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                  ⚠️ {t('register.charityWarning')}
                </small>
              </div>
            </>
          )}
          
          {/* School/Care Organization Fields */}
          {formData.userType === 'school' && (
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.schoolNameLabel')}</label>
              <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} style={styles.input} required />
            </div>
          )}
          
          {/* Vendor Fields */}
          {formData.userType === 'vendor' && (
            <>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.shopNameLabel')}</label>
                <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} style={styles.input} required />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.shopCategoryLabel')}</label>
                <select name="shopCategory" value={formData.shopCategory} onChange={handleChange} style={styles.input} required>
                  <option value="">Select a category</option>
                  <option value="African">African</option>
                  <option value="Caribbean">Caribbean</option>
                  <option value="Mixed African & Caribbean">Mixed African & Caribbean</option>
                  <option value="Indian/South Asian">Indian/South Asian</option>
                  <option value="Eastern European">Eastern European</option>
                  <option value="Middle Eastern">Middle Eastern</option>
                </select>
              </div>
            </>
          )}
          
          {/* Common Address Fields */}
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.addressLabel')}</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.postcodeLabel')}</label>
              <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} style={styles.input} required />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.cityLabel')} <span style={{fontSize: '12px', color: '#666'}}>(Optional for towns)</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} style={styles.input} placeholder={t('register.townPlaceholder')} />
            </div>
          </div>
          
          {/* Vendor Town Dropdown */}
          {formData.userType === 'vendor' && (
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('register.townLabel')}</label>
              <select name="town" value={formData.town || ''} onChange={handleChange} style={styles.input} required>
                <option value="">Select your town</option>
                <optgroup label="North Northamptonshire">
                  <option value="Wellingborough">Wellingborough</option>
                  <option value="Kettering">Kettering</option>
                  <option value="Corby">Corby</option>
                </optgroup>
                <optgroup label="East Northamptonshire">
                  <option value="Rushden">Rushden</option>
                  <option value="Higham Ferrers">Higham Ferrers</option>
                  <option value="Raunds">Raunds</option>
                  <option value="Irthlingborough">Irthlingborough</option>
                  <option value="Oundle">Oundle</option>
                  <option value="Thrapston">Thrapston</option>
                </optgroup>
                <optgroup label="West Northamptonshire">
                  <option value="Northampton">Northampton</option>
                  <option value="Daventry">Daventry</option>
                  <option value="Brackley">Brackley</option>
                  <option value="Towcester">Towcester</option>
                </optgroup>
              </select>
            </div>
          )}
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', marginBottom: '15px'}}>
            {loading ? t('register.registering') : t('register.registerButton')}
          </button>
        </form>
        
        <div style={{textAlign: 'center'}}>
          <p>{t('register.haveAccount')} <button onClick={() => onNavigate('login')} style={styles.linkButton}>{t('register.signInLink')}</button></p>
          <button onClick={() => onNavigate('home')} style={styles.linkButton}>{t('register.backToHome')}</button>
        </div>
        
        <div style={{marginTop: '25px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4CAF50'}}>
          <p style={{margin: '0 0 8px 0', fontSize: '0.9em', lineHeight: '1.5', color: '#333'}}>
            <strong>🤝 Join the Northamptonshire Community E-Voucher Scheme</strong>
          </p>
          <p style={{margin: 0, fontSize: '0.85em', lineHeight: '1.5', color: '#555'}}>
            Led by BAK UP CIC, our scheme provides dignified support through flexible vouchers, respects cultural preferences, and strengthens local economies. Together, we're building a more inclusive and sustainable community.
          </p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Router Component
function Dashboard({ user, onLogout }) {
  console.log('Dashboard received user:', user)
  console.log('User type:', user.userType)
  if (user.userType === 'admin') return <AdminDashboard user={user} onLogout={onLogout} />
  if (user.userType === 'vcse') return <VCSEDashboard user={user} onLogout={onLogout} />
  if (user.userType === 'vendor') return <VendorDashboard user={user} onLogout={onLogout} />
  if (user.userType === 'recipient') return <RecipientDashboard user={user} onLogout={onLogout} />
  if (user.userType === 'school') return <SchoolDashboard user={user} onLogout={onLogout} />
  return <div>Unknown user type</div>
}

// ADMIN DASHBOARD
function AdminDashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [vcseOrgs, setVcseOrgs] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedVcse, setSelectedVcse] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [organizationType, setOrganizationType] = useState('vcse')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [vendorShops, setVendorShops] = useState([])
  const [toGoItems, setToGoItems] = useState([])
  const [recipients, setRecipients] = useState([])
  const [editingSchool, setEditingSchool] = useState(null)
  const [editingVcse, setEditingVcse] = useState(null)
  const [editingShop, setEditingShop] = useState(null)
  const [editingRecipient, setEditingRecipient] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('')
  const [recipientSortBy, setRecipientSortBy] = useState('name')
  const [voucherSearchQuery, setVoucherSearchQuery] = useState('')
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('all')
  const [voucherSortBy, setVoucherSortBy] = useState('recent')
  const [recipientPage, setRecipientPage] = useState(1)
  const [voucherPage, setVoucherPage] = useState(1)
  const [shopPage, setShopPage] = useState(1)
  const itemsPerPage = 12
  const [payoutRequests, setPayoutRequests] = useState([])
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('all')
  const [payoutSummary, setPayoutSummary] = useState(null)

  useEffect(() => {
    loadVcseOrgs()
    loadSchools()
    loadVouchers()
    loadVendorShops()
    loadToGoItems()
    loadRecipients()
    loadPayoutRequests()
  }, [])

  const loadVcseOrgs = async () => {
    try {
      const data = await apiCall('/admin/vcse-organizations')
      setVcseOrgs(data)
    } catch (error) {
      console.error('Failed to load VCFSE organizations:', error)
    }
  }

  const loadSchools = async () => {
    try {
      const data = await apiCall('/admin/schools')
      setSchools(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load schools:', error)
    }
  }

  const loadVouchers = async () => {
    try {
      const data = await apiCall('/admin/vouchers')
      setVouchers(data.vouchers || [])
    } catch (error) {
      console.error('Failed to load vouchers:', error)
    }
  }

  const loadVendorShops = async () => {
    try {
      const data = await apiCall('/admin/shops')
      setVendorShops(data.shops || [])
    } catch (error) {
      console.error('Failed to load local shops:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/admin/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load Food to Go Items:', error)
    }
  }

  const loadRecipients = async () => {
    try {
      const data = await apiCall('/admin/recipients')
      setRecipients(data || [])
    } catch (error) {
      console.error('Failed to load recipients:', error)
    }
  }

  const loadPayoutRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (payoutStatusFilter !== 'all') params.append('status', payoutStatusFilter)
      
      const data = await apiCall(`/admin/payout/requests?${params.toString()}`)
      setPayoutRequests(data.payouts || [])
      setPayoutSummary(data.summary || null)
    } catch (error) {
      console.error('Failed to load payout requests:', error)
    }
  }

  const handleReviewPayout = async (payoutId, action, adminNotes = '') => {
    if (!window.confirm(t(`payout.confirm${action === 'approve' ? 'Approve' : 'Reject'}`))) {
      return
    }
    
    try {
      await apiCall(`/admin/payout/${payoutId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, admin_notes: adminNotes })
      })
      alert(t(`payout.payout${action === 'approve' ? 'Approved' : 'Rejected'}`))
      loadPayoutRequests()
    } catch (error) {
      alert('Failed to review payout: ' + error.message)
    }
  }

  const handleMarkPaid = async (payoutId) => {
    if (!window.confirm(t('payout.confirmMarkPaid'))) {
      return
    }
    
    try {
      await apiCall(`/admin/payout/${payoutId}/mark-paid`, {
        method: 'POST'
      })
      alert(t('payout.payoutMarkedPaid'))
      loadPayoutRequests()
    } catch (error) {
      alert('Failed to mark payout as paid: ' + error.message)
    }
  }

  const handleAllocateFunds = async (e) => {
    e.preventDefault()
    try {
      const requestBody = {
        amount: parseFloat(amount),
        notes
      }
      
      if (organizationType === 'vcse') {
        requestBody.vcse_id = parseInt(selectedVcse)
      } else {
        requestBody.school_id = parseInt(selectedSchool)
      }
      
      await apiCall('/admin/allocate-funds', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      setMessage('Funds allocated successfully!')
      setAmount('')
      setNotes('')
      loadVcseOrgs()
      loadSchools()  // Reload schools to show updated balance
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleEditSchool = (school) => {
    setEditingSchool(school.id)
    setEditFormData({
      organization_name: school.organization_name,
      first_name: school.first_name,
      last_name: school.last_name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      postcode: school.postcode,
      allocated_balance: school.allocated_balance
    })
  }

  const handleSaveSchool = async () => {
    try {
      await apiCall(`/admin/schools/${editingSchool}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      })
      alert('School updated successfully')
      setEditingSchool(null)
      setEditFormData({})
      loadSchools()
    } catch (error) {
      alert('Error updating school: ' + error.message)
    }
  }

  const handleEditVcse = (vcse) => {
    setEditingVcse(vcse.id)
    setEditFormData({
      name: vcse.name,
      email: vcse.email,
      charity_commission_number: vcse.charity_commission_number,
      allocated_balance: vcse.allocated_balance
    })
  }

  const handleSaveVcse = async () => {
    try {
      await apiCall(`/admin/vcse/${editingVcse}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      })
      alert('VCFSE organization updated successfully')
      setEditingVcse(null)
      setEditFormData({})
      loadVcseOrgs()
    } catch (error) {
      alert('Error updating VCFSE organization: ' + error.message)
    }
  }

  const handleEditShop = (shop) => {
    setEditingShop(shop.id)
    setEditFormData({
      shop_name: shop.shop_name,
      address: shop.address,
      city: shop.city,
      postcode: shop.postcode,
      phone: shop.phone
    })
  }

  const handleSaveShop = async () => {
    try {
      await apiCall(`/admin/shops/${editingShop}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      })
      alert('Shop updated successfully')
      setEditingShop(null)
      setEditFormData({})
      loadVendorShops()
    } catch (error) {
      alert('Error updating shop: ' + error.message)
    }
  }

  const handleDeleteShop = async (shopId, shopName) => {
    if (!confirm(`Are you sure you want to delete "${shopName}"?`)) return
    
    try {
      await apiCall(`/admin/shops/${shopId}`, {
        method: 'DELETE'
      })
      alert('Shop deleted successfully')
      loadVendorShops()
    } catch (error) {
      alert('Error deleting shop: ' + error.message)
    }
  }

  const handleSaveRecipient = async (recipientId) => {
    try {
      await apiCall(`/admin/recipient/${recipientId}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      })
      alert('Recipient updated successfully')
      setEditingRecipient(null)
      setEditFormData({})
      loadRecipients()
    } catch (error) {
      alert('Error updating recipient: ' + error.message)
    }
  }

  const handleDeleteRecipient = async (recipientId) => {
    if (!confirm('Are you sure you want to deactivate this recipient account?')) return
    
    try {
      await apiCall(`/admin/recipient/${recipientId}`, {
        method: 'DELETE'
      })
      alert('Recipient account deactivated successfully')
      loadRecipients()
    } catch (error) {
      alert('Error deactivating recipient: ' + error.message)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#1976d2', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <LanguageSelector />
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.overview')}</button>
          <button onClick={() => setActiveTab('search')} style={activeTab === 'search' ? styles.activeTab : styles.tab}>🔍 Global Search</button>
          <button onClick={() => setActiveTab('transactions')} style={activeTab === 'transactions' ? styles.activeTab : styles.tab}>📊 Transactions</button>
          <button onClick={() => setActiveTab('broadcast')} style={activeTab === 'broadcast' ? styles.activeTab : styles.tab}>📢 Broadcast</button>
          <button onClick={() => setActiveTab('funding')} style={activeTab === 'funding' ? styles.activeTab : styles.tab}>💰 Fund Allocation</button>
          <button onClick={() => setActiveTab('vcse-verification')} style={activeTab === 'vcse-verification' ? styles.activeTab : styles.tab}>🔍 VCSE Verification</button>
          <button onClick={() => setActiveTab('vcse')} style={activeTab === 'vcse' ? styles.activeTab : styles.tab}>🤝 VCSE Organisations</button>
          <button onClick={() => setActiveTab('recipients')} style={activeTab === 'recipients' ? styles.activeTab : styles.tab}>👥 Recipients</button>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.voucherManagement')}</button>
          <button onClick={() => setActiveTab('schools')} style={activeTab === 'schools' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.schoolsOrgs')}</button>
          <button onClick={() => setActiveTab('shops')} style={activeTab === 'shops' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.localShops')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.allToGo')}</button>
          <button onClick={() => setActiveTab('payouts')} style={activeTab === 'payouts' ? styles.activeTab : styles.tab}>💰 {t('payout.managePayout')}</button>
          <button onClick={() => setActiveTab('reports')} style={activeTab === 'reports' ? styles.activeTab : styles.tab}>📊 Reports</button>
          <button onClick={() => setActiveTab('settings')} style={activeTab === 'settings' ? styles.activeTab : styles.tab}>⚙️ {t('dashboard.tabs.settings')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <h2>📊 Admin Dashboard Overview</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>🎫</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#1976d2'}}>{vouchers.length}</div>
                <div style={{color: '#666'}}>Total Vouchers</div>
              </div>
              
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>💰</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#4CAF50'}}>
                  £{vouchers.filter(v => v.status === 'active').reduce((sum, v) => sum + parseFloat(v.value || 0), 0).toFixed(2)}
                </div>
                <div style={{color: '#666'}}>Active Value</div>
              </div>
              
              <div 
                onClick={() => setActiveTab('vcse')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>🤝</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#9C27B0'}}>{vcseOrgs.length}</div>
                <div style={{color: '#666'}}>VCFSE Organizations</div>
              </div>
              
              <div 
                onClick={() => setActiveTab('schools')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>🎓</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#FF9800'}}>{schools.length}</div>
                <div style={{color: '#666'}}>Schools/Care Orgs</div>
              </div>
              
              <div 
                onClick={() => setActiveTab('recipients')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>👥</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#00BCD4'}}>{recipients.length}</div>
                <div style={{color: '#666'}}>Recipients</div>
              </div>
              
              <div 
                onClick={() => setActiveTab('shops')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', marginBottom: '10px'}}>🏪</div>
                <div style={{fontSize: '28px', fontWeight: 'bold', color: '#F44336'}}>{vendorShops.length}</div>
                <div style={{color: '#666'}}>Local Shops</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <GlobalSearchTab apiCall={apiCall} />
        )}
        
        {activeTab === 'transactions' && (
          <TransactionSearchTab apiCall={apiCall} />
        )}
        
        {activeTab === 'broadcast' && (
          <BroadcastTab apiCall={apiCall} />
        )}
        
        {activeTab === 'funding' && (
          <FundAllocationTab 
            apiCall={apiCall} 
            vcseOrgs={vcseOrgs} 
            schools={schools}
            loadVcseOrgs={loadVcseOrgs}
            loadSchools={loadSchools}
          />
        )}
        
        {activeTab === 'vcse-verification' && (
          <VCSEVerificationAdmin apiCall={apiCall} />
        )}
        
        {activeTab === 'funding_old' && (
          <div>
            <h2>💰 {t('admin.fundAllocation')}</h2>
            {message && <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
            
            <form onSubmit={handleAllocateFunds} style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.organizationType')}</label>
                <select value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} style={styles.input}>
                  <option value="vcse">{t('admin.vcseOrganization')}</option>
                  <option value="school">{t('admin.schoolOrganization')}</option>
                </select>
              </div>
              
              {organizationType === 'vcse' ? (
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.selectVCSE')}</label>
                  <select value={selectedVcse} onChange={(e) => setSelectedVcse(e.target.value)} style={styles.input} required>
                    <option value="">{t('admin.chooseOrganization')}</option>
                    {vcseOrgs.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} - Allocated: £{org.allocated_balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.selectSchool')}</label>
                  <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} style={styles.input} required>
                    <option value="">{t('admin.chooseOrganization')}</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.organization_name} - Allocated: £{(school.allocated_balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.amount')}</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 1000.00" style={styles.input} required />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.notes')}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{...styles.input, minHeight: '80px'}} />
              </div>
              
              <button type="submit" style={styles.primaryButton}>💸 {t('admin.allocateFunds')}</button>
            </form>
          </div>
        )}
        
        {activeTab === 'vcse' && (
          <div>
            <h3>🤝 {t('admin.vcseOrganizations')} ({vcseOrgs.length})</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {vcseOrgs.map(org => (
                <div key={org.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                  {editingVcse === org.id ? (
                    <div>
                      <div style={{marginBottom: '10px'}}>
                        <label>{t('admin.organizationName')}:</label><br />
                        <input 
                          type="text" 
                          value={editFormData.name || ''} 
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <label>{t('admin.email')}:</label><br />
                        <input 
                          type="email" 
                          value={editFormData.email || ''} 
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <label>{t('admin.charityNumber')}:</label><br />
                        <input 
                          type="text" 
                          value={editFormData.charity_commission_number || ''} 
                          onChange={(e) => setEditFormData({...editFormData, charity_commission_number: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <label>{t('admin.allocatedBalance')}:</label><br />
                        <input 
                          type="number" 
                          step="0.01"
                          value={editFormData.allocated_balance || ''} 
                          onChange={(e) => setEditFormData({...editFormData, allocated_balance: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{marginBottom: '10px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107'}}>
                        <label style={{fontWeight: 'bold', color: '#856404'}}>🔐 {t('admin.resetPassword')}:</label><br />
                        <input 
                          type="text" 
                          placeholder="Enter new password (leave blank to keep current)"
                          value={editFormData.new_password || ''} 
                          onChange={(e) => setEditFormData({...editFormData, new_password: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={handleSaveVcse} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>{t('admin.save')}</button>
                        <button onClick={() => { setEditingVcse(null); setEditFormData({}) }} style={{...styles.primaryButton, backgroundColor: '#757575'}}>{t('admin.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div style={{flex: 1}}>
                        <strong>{org.name}</strong> ({org.email})<br />
                        {org.charity_commission_number && (
                          <span style={{color: '#666', fontSize: '14px'}}>
                            {t('admin.charityNumber')}: <strong>{org.charity_commission_number}</strong><br />
                          </span>
                        )}
                        {t('admin.allocatedBalance')}: £{org.allocated_balance.toFixed(2)}
                      </div>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button 
                          onClick={() => handleEditVcse(org)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✏️ {t('admin.edit')}
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
                              try {
                                await apiCall(`/admin/vcse/${org.id}`, { method: 'DELETE' })
                                alert('VCFSE organization deleted successfully')
                                loadVcseOrgs()
                              } catch (error) {
                                alert('Error deleting VCFSE organization: ' + error.message)
                              }
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🗑️ {t('admin.delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'recipients' && (
          <div>
            <h2>👥 Recipients ({recipients.length})</h2>
            
            {/* Search and Filter Bar */}
            <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>🔍 Search Recipients</label>
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={recipientSearchQuery || ''}
                    onChange={(e) => setRecipientSearchQuery(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>📊 Sort By</label>
                  <select
                    value={recipientSortBy || 'name'}
                    onChange={(e) => setRecipientSortBy(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="email">Email (A-Z)</option>
                    <option value="vouchers">Most Vouchers</option>
                    <option value="value">Highest Value</option>
                    <option value="recent">Most Recent</option>
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-end'}}>
                  <button
                    onClick={() => {
                      setRecipientSearchQuery('')
                      setRecipientSortBy('name')
                    }}
                    style={{...styles.secondaryButton, width: '100%'}}
                  >
                    ✖️ Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {(() => {
                const filteredRecipients = recipients
                  .filter(recipient => {
                      if (!recipientSearchQuery) return true
                      const query = recipientSearchQuery.toLowerCase()
                      return (
                        (recipient.first_name + ' ' + recipient.last_name).toLowerCase().includes(query) ||
                        recipient.email.toLowerCase().includes(query) ||
                        (recipient.phone && recipient.phone.toLowerCase().includes(query))
                      )
                    })
                    .sort((a, b) => {
                      if (recipientSortBy === 'name') {
                        return (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name)
                      } else if (recipientSortBy === 'email') {
                        return a.email.localeCompare(b.email)
                      } else if (recipientSortBy === 'vouchers') {
                        return (b.total_vouchers || 0) - (a.total_vouchers || 0)
                      } else if (recipientSortBy === 'value') {
                        return (b.active_value || 0) - (a.active_value || 0)
                      } else if (recipientSortBy === 'recent') {
                        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
                      }
                      return 0
                    })
                
                const totalRecipients = filteredRecipients.length
                const startIndex = (recipientPage - 1) * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex)
                
                return (
                  <>
                    {totalRecipients === 0 ? (
                      <p>No recipients found</p>
                    ) : (
                      <>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                          {paginatedRecipients.map(recipient => (
                    <div key={recipient.id} style={{padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      {editingRecipient === recipient.id ? (
                        <div>
                          <h3 style={{margin: '0 0 15px 0', color: '#1976d2'}}>Edit Recipient</h3>
                          <div style={{marginBottom: '10px'}}>
                            <label>Name:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Email:</label><br />
                            <input 
                              type="email" 
                              value={editFormData.email || ''} 
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Phone:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.phone || ''} 
                              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Address:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.address || ''} 
                              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>City:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.city || ''} 
                              onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Postcode:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.postcode || ''} 
                              onChange={(e) => setEditFormData({...editFormData, postcode: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
                            <label style={{fontWeight: 'bold'}}>🔑 Reset Password (Optional):</label><br />
                            <input 
                              type="text" 
                              value={editFormData.reset_password || ''} 
                              onChange={(e) => setEditFormData({...editFormData, reset_password: e.target.value})}
                              placeholder="Enter new password (leave blank to keep current)"
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '10px'}}>
                            <button 
                              onClick={() => handleSaveRecipient(recipient.id)}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingRecipient(null)}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#757575',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 style={{margin: '0 0 10px 0', color: '#1976d2'}}>{recipient.name}</h3>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📧 Email:</strong> {recipient.email}
                          </p>
                          {recipient.phone && (
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              <strong>📞 Phone:</strong> {recipient.phone}
                            </p>
                          )}
                          {recipient.address && (
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              <strong>📍 Address:</strong> {recipient.address}, {recipient.city} {recipient.postcode}
                            </p>
                          )}
                          <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                            <p style={{margin: '5px 0', fontSize: '14px', fontWeight: 'bold'}}>
                              🎫 Total Vouchers: {recipient.total_vouchers}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              ✅ Active: {recipient.active_vouchers} | ✓ Redeemed: {recipient.redeemed_vouchers}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '14px', fontWeight: 'bold', color: '#4CAF50'}}>
                              💰 Active Value: £{recipient.total_active_value.toFixed(2)}
                            </p>
                          </div>
                          <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                            <button 
                              onClick={() => {
                                setEditingRecipient(recipient.id);
                                setEditFormData({
                                  name: recipient.name,
                                  email: recipient.email,
                                  phone: recipient.phone || '',
                                  address: recipient.address || '',
                                  city: recipient.city || '',
                                  postcode: recipient.postcode || '',
                                  reset_password: ''
                                });
                              }}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteRecipient(recipient.id)}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                          ))}
                        </div>
                        
                        <Pagination
                          currentPage={recipientPage}
                          totalItems={totalRecipients}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setRecipientPage}
                        />
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
        
        {activeTab === 'vouchers' && (
          <div>
            <h2>{t('admin.allVouchers')} ({vouchers.length})</h2>
            
            {/* Search and Filter Bar */}
            <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>🔍 Search Vouchers</label>
                  <input
                    type="text"
                    placeholder="Search by code, recipient..."
                    value={voucherSearchQuery || ''}
                    onChange={(e) => setVoucherSearchQuery(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>📋 Status Filter</label>
                  <select
                    value={voucherStatusFilter || 'all'}
                    onChange={(e) => setVoucherStatusFilter(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>📊 Sort By</label>
                  <select
                    value={voucherSortBy || 'recent'}
                    onChange={(e) => setVoucherSortBy(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="value_high">Highest Value</option>
                    <option value="value_low">Lowest Value</option>
                    <option value="expiry">Expiring Soon</option>
                    <option value="code">Code (A-Z)</option>
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-end'}}>
                  <button
                    onClick={() => {
                      setVoucherSearchQuery('')
                      setVoucherStatusFilter('all')
                      setVoucherSortBy('recent')
                    }}
                    style={{...styles.secondaryButton, width: '100%'}}
                  >
                    ✖️ Clear Filters
                  </button>
                </div>
              </div>
            </div>
                      <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {(() => {
                const filteredVouchers = vouchers
                  .filter(voucher => {     // Status filter
                    if (voucherStatusFilter !== 'all' && voucher.status !== voucherStatusFilter) return false
                    // Search filter
                    if (voucherSearchQuery) {
                      const query = voucherSearchQuery.toLowerCase()
                      return (
                        voucher.code.toLowerCase().includes(query) ||
                        (voucher.recipient?.name || '').toLowerCase().includes(query) ||
                        (voucher.recipient?.email || '').toLowerCase().includes(query)
                      )
                    }
                    return true
                  })
                  .sort((a, b) => {
                    if (voucherSortBy === 'recent') {
                      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
                    } else if (voucherSortBy === 'value_high') {
                      return b.value - a.value
                    } else if (voucherSortBy === 'value_low') {
                      return a.value - b.value
                    } else if (voucherSortBy === 'expiry') {
                      return new Date(a.expiry_date) - new Date(b.expiry_date)
                    } else if (voucherSortBy === 'code') {
                      return a.code.localeCompare(b.code)
                    }
                    return 0
                  })
                
                const totalVouchers = filteredVouchers.length
                const startIndex = (voucherPage - 1) * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const paginatedVouchers = filteredVouchers.slice(startIndex, endIndex)
                
                return (
                  <>
                    {totalVouchers === 0 ? (
                      <p>No vouchers found</p>
                    ) : (
                      <>
                        <div>
                          {paginatedVouchers.map(voucher => (
                  <div key={voucher.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                    <strong>Code: {voucher.code}</strong> - £{voucher.value.toFixed(2)}<br />
                    Status: <span style={{color: voucher.status === 'active' ? '#2e7d32' : '#757575', fontWeight: 'bold'}}>{voucher.status.toUpperCase()}</span><br />
                    {voucher.recipient && (
                      <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px'}}>
                        <strong>📋 Recipient Details:</strong><br />
                        Name: {voucher.recipient.name}<br />
                        Email: {voucher.recipient.email}<br />
                        Phone: {voucher.recipient.phone}<br />
                        Address: {voucher.recipient.address}
                      </div>
                    )}<br />
                    Issued by: {voucher.issued_by?.name || 'N/A'} ({voucher.issued_by?.organization || 'N/A'})<br />
                    Expires: {new Date(voucher.expiry_date).toLocaleDateString()}
                  </div>
                          ))}
                        </div>
                        
                        <Pagination
                          currentPage={voucherPage}
                          totalItems={totalVouchers}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setVoucherPage}
                        />
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
        
        {activeTab === 'shops' && (
          <div>
            <h2>🏪 {t('admin.localShops')} ({vendorShops.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {(() => {
                const totalShops = vendorShops.length
                const startIndex = (shopPage - 1) * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const paginatedShops = vendorShops.slice(startIndex, endIndex)
                
                return (
                  <>
                    {totalShops === 0 ? (
                      <p>{t('admin.noShops')}</p>
                    ) : (
                      <>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                          {paginatedShops.map(shop => (
                    <div key={shop.id} style={{padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      {editingShop === shop.id ? (
                        <div>
                          <h3 style={{margin: '0 0 15px 0', color: '#1976d2'}}>Edit Shop</h3>
                          <div style={{marginBottom: '10px'}}>
                            <label>Shop Name:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.shop_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, shop_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Address:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.address || ''} 
                              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>City:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.city || ''} 
                              onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Postcode:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.postcode || ''} 
                              onChange={(e) => setEditFormData({...editFormData, postcode: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Town:</label><br />
                            <select
                              value={editFormData.town || ''}
                              onChange={(e) => setEditFormData({...editFormData, town: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            >
                              <option value="">Select town</option>
                              <optgroup label="North Northamptonshire">
                                <option value="Wellingborough">Wellingborough</option>
                                <option value="Kettering">Kettering</option>
                                <option value="Corby">Corby</option>
                              </optgroup>
                              <optgroup label="East Northamptonshire">
                                <option value="Rushden">Rushden</option>
                                <option value="Higham Ferrers">Higham Ferrers</option>
                                <option value="Raunds">Raunds</option>
                                <option value="Irthlingborough">Irthlingborough</option>
                                <option value="Oundle">Oundle</option>
                                <option value="Thrapston">Thrapston</option>
                              </optgroup>
                              <optgroup label="West Northamptonshire">
                                <option value="Northampton">Northampton</option>
                                <option value="Daventry">Daventry</option>
                                <option value="Brackley">Brackley</option>
                                <option value="Towcester">Towcester</option>
                              </optgroup>
                            </select>
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Phone:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.phone || ''} 
                              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '10px'}}>
                            <button onClick={handleSaveShop} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>Save</button>
                            <button onClick={() => { setEditingShop(null); setEditFormData({}) }} style={{...styles.primaryButton, backgroundColor: '#757575'}}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 style={{margin: '0 0 10px 0', color: '#1976d2'}}>{shop.shop_name}</h3>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📍 Address:</strong> {shop.address}, {shop.city} {shop.postcode}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📞 Phone:</strong> {shop.phone}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                             <strong>👤 Shop Owner:</strong> {shop.vendor_name}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📧 Email:</strong> {shop.vendor_email}
                          </p>
                          <p style={{margin: '10px 0 0 0', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', fontWeight: 'bold', color: '#1976d2'}}>
                            🍎 Food to Go Items: {shop.to_go_items_count}
                          </p>
                          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                            <button 
                              onClick={() => handleEditShop(shop)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                flex: 1
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteShop(shop.id, shop.shop_name)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                flex: 1
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                          ))}
                        </div>
                        
                        <Pagination
                          currentPage={shopPage}
                          totalItems={totalShops}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setShopPage}
                        />
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
        
        {activeTab === 'schools' && (
          <div>
            <h2>🎓 {t('admin.schoolsOrganizations')} ({schools.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {schools.length === 0 ? (
                <p>{t('admin.noSchools')}</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {schools.map(school => (
                    <div key={school.id} style={{padding: '20px', border: '2px solid #9C27B0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      {editingSchool === school.id ? (
                        <div>
                          <h3 style={{margin: '0 0 15px 0', color: '#9C27B0'}}>{t('admin.editSchool')}</h3>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.organizationName')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.organization_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, organization_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.firstName')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.first_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.lastName')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.last_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.email')}:</label><br />
                            <input 
                              type="email" 
                              value={editFormData.email || ''} 
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.phone')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.phone || ''} 
                              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.address')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.address || ''} 
                              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.city')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.city || ''} 
                              onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.postcode')}:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.postcode || ''} 
                              onChange={(e) => setEditFormData({...editFormData, postcode: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>{t('admin.allocatedBalance')}:</label><br />
                            <input 
                              type="number" 
                              step="0.01"
                              value={editFormData.allocated_balance || ''} 
                              onChange={(e) => setEditFormData({...editFormData, allocated_balance: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107'}}>
                            <label style={{fontWeight: 'bold', color: '#856404'}}>🔐 {t('admin.resetPassword')}:</label><br />
                            <input 
                              type="text" 
                              placeholder="Enter new password (leave blank to keep current)"
                              value={editFormData.new_password || ''} 
                              onChange={(e) => setEditFormData({...editFormData, new_password: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ffc107'}}
                            />
                            <small style={{color: '#856404', display: 'block', marginTop: '5px'}}>⚠️ Only fill this if you want to change the password</small>
                          </div>
                          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                            <button onClick={handleSaveSchool} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>{t('admin.save')}</button>
                            <button onClick={() => { setEditingSchool(null); setEditFormData({}) }} style={{...styles.primaryButton, backgroundColor: '#757575'}}>{t('admin.cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 style={{margin: '0 0 10px 0', color: '#9C27B0'}}>{school.organization_name}</h3>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>👤 Contact:</strong> {school.first_name} {school.last_name}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📧 Email:</strong> {school.email}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📞 Phone:</strong> {school.phone}
                          </p>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>📍 Address:</strong> {school.address}, {school.city} {school.postcode}
                          </p>
                          <div style={{marginTop: '15px', padding: '15px', backgroundColor: '#E1BEE7', borderRadius: '8px'}}>
                            <p style={{margin: '0', fontWeight: 'bold', fontSize: '18px', color: '#6A1B9A'}}>
                              💰 {t('admin.allocatedBalance')}: £{(school.allocated_balance || 0).toFixed(2)}
                            </p>
                          </div>
                          <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#F3E5F5', borderRadius: '8px'}}>
                            <p style={{margin: '0', fontSize: '12px', color: '#6A1B9A', fontStyle: 'italic'}}>
                              🎯 Supporting families from underrepresented communities
                            </p>
                          </div>
                          <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                            <button 
                              onClick={() => handleEditSchool(school)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                            >
                              ✒️ Edit
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete ${school.organization_name}?`)) {
                                  try {
                                    await apiCall(`/admin/schools/${school.id}`, { method: 'DELETE' })
                                    alert('School deleted successfully')
                                    loadSchools()
                                  } catch (error) {
                                    alert('Error deleting school: ' + error.message)
                                  }
                                }
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              🗑️ {t('admin.delete')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>🍎 {t('dashboard.headings.allToGoItems')} ({toGoItems.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <p>{t('admin.noToGoItems')}</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px'}}>
                  {toGoItems.map(item => (
                    <div key={item.id} style={{padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: item.status === 'available' ? '#f1f8e9' : '#fafafa'}}>
                      <h4 style={{margin: '0 0 10px 0', color: '#2e7d32'}}>{item.item_name}</h4>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Quantity:</strong> {item.quantity} {item.unit}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Price:</strong> £{item.price.toFixed(2)} per {item.unit}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Category:</strong> {item.category}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Status:</strong> <span style={{color: item.status === 'available' ? '#2e7d32' : '#757575', fontWeight: 'bold'}}>{item.status.toUpperCase()}</span>
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Description:</strong> {item.description || 'N/A'}
                      </p>
                      <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                        <p style={{margin: '2px 0', fontSize: '13px'}}><strong>🏪 Shop:</strong> {item.shop_name}</p>
                        <p style={{margin: '2px 0', fontSize: '13px'}}><strong>📍 Location:</strong> {item.shop_address}</p>
                         <p style={{margin: '2px 0', fontSize: '13px'}}><strong>👤 Shop Owner:</strong> {item.vendor_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div>
            <h2>📊 System Reports & Analytics</h2>
            <p style={{marginBottom: '30px', color: '#666'}}>Generate comprehensive reports for system oversight and compliance</p>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px'}}>
              <h3 style={{marginTop: 0}}>📄 Generate System Report</h3>
              <p style={{color: '#666', marginBottom: '20px'}}>Comprehensive report including all vouchers, organizations, and transactions</p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>From Date</label>
                  <input 
                    type="date" 
                    id="adminReportDateFrom"
                    style={styles.input}
                    defaultValue={new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>To Date</label>
                  <input 
                    type="date" 
                    id="adminReportDateTo"
                    style={styles.input}
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button
                  onClick={async () => {
                    try {
                      const dateFrom = document.getElementById('adminReportDateFrom').value
                      const dateTo = document.getElementById('adminReportDateTo').value
                      
                      const response = await fetch('/api/admin/reports/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ date_from: dateFrom, date_to: dateTo })
                      })
                      
                      if (response.ok) {
                        const data = await response.json()
                        alert('Report generated successfully!')
                        console.log('Admin Report Data:', data)
                      } else {
                        alert('Failed to generate report')
                      }
                    } catch (error) {
                      alert('Error generating report: ' + error.message)
                    }
                  }}
                  style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}
                >
                  📊 Generate Report
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const dateFrom = document.getElementById('adminReportDateFrom').value
                      const dateTo = document.getElementById('adminReportDateTo').value
                      
                      const response = await fetch(`/api/admin/export/financial-report?start_date=${dateFrom}&end_date=${dateTo}`, {
                        credentials: 'include'
                      })
                      
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `financial_report_${dateFrom}_to_${dateTo}.csv`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } else {
                        alert('Failed to download financial report')
                      }
                    } catch (error) {
                      alert('Error downloading report: ' + error.message)
                    }
                  }}
                  style={{...styles.primaryButton, backgroundColor: '#2196F3'}}
                >
                  💰 Download Financial Report (CSV)
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/export/impact-report', {
                        credentials: 'include'
                      })
                      
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `impact_report_${new Date().toISOString().split('T')[0]}.csv`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } else {
                        alert('Failed to download impact report')
                      }
                    } catch (error) {
                      alert('Error downloading report: ' + error.message)
                    }
                  }}
                  style={{...styles.primaryButton, backgroundColor: '#FF9800'}}
                >
                  🌍 Download Impact Report (CSV)
                </button>
              </div>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
              <h3 style={{marginTop: 0}}>📅 Expired Vouchers Report</h3>
              <p style={{color: '#666', marginBottom: '20px'}}>Track expired vouchers and identify trends</p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>From Date</label>
                  <input 
                    type="date" 
                    id="expiredReportDateFrom"
                    style={styles.input}
                    defaultValue={new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>To Date</label>
                  <input 
                    type="date" 
                    id="expiredReportDateTo"
                    style={styles.input}
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <button
                onClick={async () => {
                  try {
                    const dateFrom = document.getElementById('expiredReportDateFrom').value
                    const dateTo = document.getElementById('expiredReportDateTo').value
                    
                    const response = await fetch(`/api/admin/expired-report?start_date=${dateFrom}&end_date=${dateTo}`, {
                      credentials: 'include'
                    })
                    
                    if (response.ok) {
                      const data = await response.json()
                      alert(`Expired Vouchers Report:\n\nTotal Expired: ${data.total_expired}\nTotal Value Lost: £${data.total_value_lost}\n\nCheck console for details.`)
                      console.log('Expired Vouchers Report:', data)
                    } else {
                      alert('Failed to generate expired vouchers report')
                    }
                  } catch (error) {
                    alert('Error generating report: ' + error.message)
                  }
                }}
                style={{...styles.primaryButton, backgroundColor: '#f44336'}}
              >
                📅 Generate Expired Vouchers Report
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div>
            <h2>💰 {t('payout.managePayout')}</h2>
            
            {payoutSummary && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#2196F3'}}>{payoutSummary.pending}</div>
                  <div style={{color: '#666'}}>{t('payout.pending')}</div>
                  <div style={{fontSize: '20px', color: '#2196F3', marginTop: '5px'}}>£{payoutSummary.total_amount_pending.toFixed(2)}</div>
                </div>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#FF9800'}}>{payoutSummary.approved}</div>
                  <div style={{color: '#666'}}>{t('payout.approved')}</div>
                  <div style={{fontSize: '20px', color: '#FF9800', marginTop: '5px'}}>£{payoutSummary.total_amount_approved.toFixed(2)}</div>
                </div>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#4CAF50'}}>{payoutSummary.paid}</div>
                  <div style={{color: '#666'}}>{t('payout.paid')}</div>
                  <div style={{fontSize: '20px', color: '#4CAF50', marginTop: '5px'}}>£{payoutSummary.total_amount_paid.toFixed(2)}</div>
                </div>
              </div>
            )}

            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '10px'}}>
              <label style={{marginRight: '10px', fontWeight: 'bold'}}>{t('payout.filterByStatus')}:</label>
              <select
                value={payoutStatusFilter}
                onChange={(e) => {
                  setPayoutStatusFilter(e.target.value)
                  setTimeout(() => loadPayoutRequests(), 100)
                }}
                style={{padding: '8px 15px', borderRadius: '5px', border: '1px solid #ddd'}}
              >
                <option value="all">{t('payout.allStatuses')}</option>
                <option value="pending">{t('payout.pending')}</option>
                <option value="approved">{t('payout.approved')}</option>
                <option value="rejected">{t('payout.rejected')}</option>
                <option value="paid">{t('payout.paid')}</option>
              </select>
            </div>

            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {payoutRequests.length === 0 ? (
                <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>{t('payout.noPayoutRequests')}</p>
              ) : (
                <div style={{display: 'grid', gap: '20px'}}>
                  {payoutRequests.map(payout => (
                    <div key={payout.id} style={{
                      padding: '25px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px'}}>
                        <div>
                          <div style={{fontSize: '28px', fontWeight: 'bold', color: '#4CAF50'}}>£{payout.amount.toFixed(2)}</div>
                          <div style={{fontSize: '16px', fontWeight: 'bold', marginTop: '5px'}}>{payout.vendor_name}</div>
                          <div style={{fontSize: '14px', color: '#666'}}>{payout.shop_name}</div>
                        </div>
                        <div style={{
                          padding: '8px 20px',
                          borderRadius: '25px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            payout.status === 'paid' ? '#e8f5e9' :
                            payout.status === 'approved' ? '#fff3e0' :
                            payout.status === 'rejected' ? '#ffebee' : '#e3f2fd',
                          color: 
                            payout.status === 'paid' ? '#2e7d32' :
                            payout.status === 'approved' ? '#e65100' :
                            payout.status === 'rejected' ? '#c62828' : '#1565c0'
                        }}>
                          {payout.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                        <div>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.bankName')}:</strong> {payout.bank_name}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.accountNumber')}:</strong> {payout.account_number}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.sortCode')}:</strong> {payout.sort_code}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.accountHolderName')}:</strong> {payout.account_holder_name}</p>
                        </div>
                        <div>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.vendorName')}:</strong> {payout.vendor_name}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>Email:</strong> {payout.vendor_email}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>Phone:</strong> {payout.vendor_phone}</p>
                          <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}><strong>{t('payout.requestedAt')}:</strong> {new Date(payout.requested_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {payout.notes && (
                        <div style={{marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                          <strong>Vendor Notes:</strong>
                          <p style={{margin: '5px 0'}}>{payout.notes}</p>
                        </div>
                      )}

                      {payout.status === 'pending' && (
                        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                          <button
                            onClick={() => {
                              const notes = prompt('Admin notes (optional):') || ''
                              handleReviewPayout(payout.id, 'approve', notes)
                            }}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✅ {t('payout.approve')}
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Reason for rejection:') || ''
                              handleReviewPayout(payout.id, 'reject', notes)
                            }}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            ❌ {t('payout.reject')}
                          </button>
                        </div>
                      )}

                      {payout.status === 'approved' && (
                        <button
                          onClick={() => handleMarkPaid(payout.id)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '15px'
                          }}
                        >
                          💰 {t('payout.markAsPaid')}
                        </button>
                      )}

                      {payout.admin_notes && (
                        <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
                          <strong>{t('payout.adminNotes')}:</strong>
                          <p style={{margin: '5px 0'}}>{payout.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <AdminSettingsTab user={user} />
        )}
      </div>
    </div>
  )
}

// ADMIN SETTINGS TAB COMPONENT
function AdminSettingsTab({ user }) {
  const { t } = useTranslation()
  const [settingsTab, setSettingsTab] = useState('password')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [admins, setAdmins] = useState([])
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  })
  const [adminMessage, setAdminMessage] = useState('')
  const [loginStats, setLoginStats] = useState(null)

  useEffect(() => {
    if (settingsTab === 'admins') {
      loadAdmins()
    } else if (settingsTab === 'loginstats') {
      loadLoginStats()
    }
  }, [settingsTab])

  const loadLoginStats = async () => {
    try {
      const data = await apiCall('/admin/login-stats')
      setLoginStats(data)
    } catch (error) {
      console.error('Error loading login stats:', error)
    }
  }

  const loadAdmins = async () => {
    try {
      const data = await apiCall('/admin/admins')
      setAdmins(data.admins || [])
    } catch (error) {
      setAdminMessage(`Error: ${error.message}`)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMessage('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage('Error: New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage('Error: Password must be at least 8 characters long')
      return
    }

    try {
      const data = await apiCall('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      })
      setPasswordMessage('Success: ' + data.message)
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setPasswordMessage('Error: ' + error.message)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setAdminMessage('')

    try {
      const data = await apiCall('/admin/admins', {
        method: 'POST',
        body: JSON.stringify(newAdminForm)
      })
      setAdminMessage('Success: ' + data.message)
      setNewAdminForm({ email: '', password: '', first_name: '', last_name: '' })
      setShowCreateAdmin(false)
      loadAdmins()
    } catch (error) {
      setAdminMessage('Error: ' + error.message)
    }
  }

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to delete admin account: ${adminEmail}?`)) {
      return
    }

    try {
      const data = await apiCall(`/admin/admins/${adminId}`, {
        method: 'DELETE'
      })
      setAdminMessage('Success: ' + data.message)
      loadAdmins()
    } catch (error) {
      setAdminMessage('Error: ' + error.message)
    }
  }

  return (
    <div>
      <h2>⚙️ {t('dashboard.headings.settings')}</h2>
      
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
        <button 
          onClick={() => setSettingsTab('password')} 
          style={settingsTab === 'password' ? styles.activeTab : styles.tab}
        >
          🔒 {t('dashboard.buttons.changePassword')}
        </button>
        <button 
          onClick={() => setSettingsTab('admins')} 
          style={settingsTab === 'admins' ? styles.activeTab : styles.tab}
        >
          👥 {t('dashboard.buttons.manageAdmins')}
        </button>
        <button 
          onClick={() => setSettingsTab('loginstats')} 
          style={settingsTab === 'loginstats' ? styles.activeTab : styles.tab}
        >
          📊 {t('dashboard.buttons.loginStatistics')}
        </button>
      </div>

      {settingsTab === 'password' && (
        <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px'}}>
          <h3>{t('admin.changePassword')}</h3>
          {passwordMessage && (
            <div style={{
              backgroundColor: passwordMessage.includes('Error') ? '#ffebee' : '#e8f5e9',
              color: passwordMessage.includes('Error') ? '#c62828' : '#2e7d32',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {passwordMessage}
            </div>
          )}
          
          <form onSubmit={handlePasswordChange}>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.currentPassword')}</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.newPassword')}</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                style={styles.input}
                required
                minLength="8"
              />
              <small style={{color: '#666'}}>Minimum 8 characters</small>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.confirmPassword')}</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <button type="submit" style={styles.button}>{t('admin.changePassword')}</button>
          </form>
        </div>
      )}

      {settingsTab === 'admins' && (
        <div>
          {adminMessage && (
            <div style={{
              backgroundColor: adminMessage.includes('Error') ? '#ffebee' : '#e8f5e9',
              color: adminMessage.includes('Error') ? '#c62828' : '#2e7d32',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {adminMessage}
            </div>
          )}
          
          <div style={{marginBottom: '20px'}}>
            <button 
              onClick={() => setShowCreateAdmin(!showCreateAdmin)} 
              style={{...styles.button, backgroundColor: '#4CAF50'}}
            >
              {showCreateAdmin ? '✕ ' + t('admin.cancel') : '+ ' + t('admin.createAdmin')}
            </button>
          </div>

          {showCreateAdmin && (
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px', maxWidth: '600px'}}>
              <h3>{t('admin.createAdminAccount')}</h3>
              <form onSubmit={handleCreateAdmin}>
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.firstName')}</label>
                  <input
                    type="text"
                    value={newAdminForm.first_name}
                    onChange={(e) => setNewAdminForm({...newAdminForm, first_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.lastName')}</label>
                  <input
                    type="text"
                    value={newAdminForm.last_name}
                    onChange={(e) => setNewAdminForm({...newAdminForm, last_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.email')}</label>
                  <input
                    type="email"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('admin.password')}</label>
                  <input
                    type="password"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                    style={styles.input}
                    required
                    minLength="8"
                  />
                  <small style={{color: '#666'}}>Minimum 8 characters</small>
                </div>
                
                <button type="submit" style={styles.button}>{t('admin.createAdmin')}</button>
              </form>
            </div>
          )}

          <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
            <h3>{t('admin.adminAccounts')} ({admins.length})</h3>
            {admins.length === 0 ? (
              <p>{t('admin.noAdmins')}</p>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f5f5f5'}}>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>{t('admin.name')}</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>{t('admin.email')}</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>{t('admin.created')}</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>{t('admin.lastLogin')}</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>{t('admin.logins')}</th>
                      <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd'}}>{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{padding: '12px'}}>{admin.first_name} {admin.last_name}</td>
                        <td style={{padding: '12px'}}>{admin.email}</td>
                        <td style={{padding: '12px'}}>{admin.created_at || 'N/A'}</td>
                        <td style={{padding: '12px'}}>{admin.last_login || 'Never'}</td>
                        <td style={{padding: '12px'}}>{admin.login_count || 0}</td>
                        <td style={{padding: '12px', textAlign: 'center'}}>
                          {admin.id !== user.id ? (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                              style={{...styles.button, backgroundColor: '#f44336', padding: '8px 16px', fontSize: '14px'}}
                            >
                              {t('admin.delete')}
                            </button>
                          ) : (
                            <span style={{color: '#999', fontSize: '14px'}}>{t('admin.currentUser')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {settingsTab === 'loginstats' && (
        <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px'}}>
          <h3>📊 {t('admin.loginStatistics')}</h3>
          <p style={{color: '#666', marginBottom: '20px'}}>Track user activity and engagement across all portals</p>
          
          {loginStats ? (
            <div>
              {/* Summary Cards */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                <div style={{backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '10px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#4CAF50'}}>{loginStats.total_users}</div>
                  <div style={{color: '#666'}}>Total Users</div>
                </div>
                <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '10px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#2196F3'}}>{loginStats.active_users}</div>
                  <div style={{color: '#666'}}>Active Users (30 days)</div>
                </div>
                <div style={{backgroundColor: '#fff3e0', padding: '20px', borderRadius: '10px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#FF9800'}}>{loginStats.total_logins}</div>
                  <div style={{color: '#666'}}>Total Logins</div>
                </div>
              </div>
              
              {/* User Table */}
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f5f5f5'}}>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Name</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Email</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Role</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Last Login</th>
                      <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd'}}>Login Count</th>
                      <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginStats.users.map(u => (
                      <tr key={u.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{padding: '12px'}}>{u.first_name} {u.last_name}</td>
                        <td style={{padding: '12px', fontSize: '14px'}}>{u.email}</td>
                        <td style={{padding: '12px'}}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: u.role === 'admin' ? '#e8f5e9' : u.role === 'vcse' ? '#e3f2fd' : u.role === 'vendor' ? '#fff3e0' : '#f3e5f5',
                            color: u.role === 'admin' ? '#2e7d32' : u.role === 'vcse' ? '#1565c0' : u.role === 'vendor' ? '#e65100' : '#6a1b9a'
                          }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{padding: '12px'}}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                        <td style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>{u.login_count || 0}</td>
                        <td style={{padding: '12px', textAlign: 'center'}}>
                          {u.days_since_login === null ? (
                            <span style={{color: '#999'}}>Never logged in</span>
                          ) : u.days_since_login <= 7 ? (
                            <span style={{color: '#4CAF50', fontWeight: 'bold'}}>✓ Active</span>
                          ) : u.days_since_login <= 30 ? (
                            <span style={{color: '#FF9800'}}>⚠ Inactive</span>
                          ) : (
                            <span style={{color: '#f44336'}}>✗ Dormant</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>Loading statistics...</p>
          )}
        </div>
      )}
    </div>
  )
}

// FOOD TO GO ORDER CARD COMPONENT FOR VCSE
function ToGoOrderCard({ item, onOrderPlaced }) {
  const { t } = useTranslation()
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({
    client_name: '',
    client_mobile: '',
    client_email: '',
    quantity: 1
  })
  const [message, setMessage] = useState('')

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    try {
      await apiCall('/vcse/place-order', {
        method: 'POST',
        body: JSON.stringify({
          surplus_item_id: item.id,
          client_name: orderForm.client_name,
          client_mobile: orderForm.client_mobile,
          client_email: orderForm.client_email,
          quantity: orderForm.quantity
        })
      })
      setMessage('Order placed successfully!')
      setOrderForm({ client_name: '', client_mobile: '', client_email: '', quantity: 1 })
      setShowOrderForm(false)
      setTimeout(() => setMessage(''), 3000)
      if (onOrderPlaced) onOrderPlaced()
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '10px', padding: '15px', backgroundColor: '#fafafa'}}>
      {message && (
        <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '8px', borderRadius: '5px', marginBottom: '10px', fontSize: '14px'}}>
          {message}
        </div>
      )}
      
      <div style={{marginBottom: '10px'}}>
        <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>{item.item_name || item.title}</h3>
        <div style={{fontSize: '14px', color: '#666'}}>
          <div><strong>{t('product.shop')}</strong> {item.shop_name}</div>
          <div><strong>{t('product.category')}</strong> {item.category}</div>
          <div><strong>{t('product.available')}</strong> {item.quantity}</div>
          {item.expiry_date && <div><strong>{t('product.expiry')}</strong> {new Date(item.expiry_date).toLocaleDateString()}</div>}
          {item.description && <div style={{marginTop: '8px'}}>{item.description}</div>}
        </div>
      </div>
      
      {!showOrderForm ? (
        <button 
          onClick={() => setShowOrderForm(true)} 
          style={{...styles.primaryButton, width: '100%', backgroundColor: '#4CAF50'}}
        >
          📏 {t('buttons.orderForClient')}
        </button>
      ) : (
        <form onSubmit={handlePlaceOrder} style={{marginTop: '15px'}}>
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Client Full Name *</label>
            <input
              type="text"
              value={orderForm.client_name}
              onChange={(e) => setOrderForm({...orderForm, client_name: e.target.value})}
              placeholder="e.g., John Smith"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Mobile Number *</label>
            <input
              type="tel"
              value={orderForm.client_mobile}
              onChange={(e) => setOrderForm({...orderForm, client_mobile: e.target.value})}
              placeholder="e.g., 07700900000"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Email Address *</label>
            <input
              type="email"
              value={orderForm.client_email}
              onChange={(e) => setOrderForm({...orderForm, client_email: e.target.value})}
              placeholder="e.g., client@example.com"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Quantity</label>
            <select
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value)})}
              style={{...styles.input, fontSize: '14px'}}
            >
              {[...Array(Math.min(10, item.quantity))].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>
          
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={{...styles.primaryButton, flex: 1, fontSize: '14px'}}>
              ✅ Place Order
            </button>
            <button 
              type="button" 
              onClick={() => setShowOrderForm(false)} 
              style={{...styles.secondaryButton, flex: 1, fontSize: '14px'}}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// Payment Tab Component with Stripe Elements
function PaymentTab({ user, onBalanceUpdate }) {
  const [amount, setAmount] = useState('')
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  
  useEffect(() => {
    loadPaymentHistory()
  }, [])
  
  const loadPaymentHistory = async () => {
    try {
      const data = await apiCall('/payment/history?limit=20')
      setPaymentHistory(data.transactions || [])
    } catch (error) {
      console.error('Failed to load payment history:', error)
    }
  }
  
  const handleCreatePayment = async (e) => {
    e.preventDefault()
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10 || amountNum > 10000) {
      setMessage('Please enter an amount between £10 and £10,000')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const data = await apiCall('/payment/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: amountNum,
          description: 'Fund loading for voucher distribution'
        })
      })
      
      setClientSecret(data.client_secret)
      setPaymentIntentId(data.payment_intent_id)
      setShowPaymentForm(true)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePaymentSuccess = async () => {
    setMessage('Payment successful! Your balance has been updated.')
    setAmount('')
    setShowPaymentForm(false)
    setClientSecret('')
    setPaymentIntentId('')
    await loadPaymentHistory()
    if (onBalanceUpdate) {
      await onBalanceUpdate()
    }
  }
  
  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    setClientSecret('')
    setPaymentIntentId('')
    setMessage('Payment cancelled')
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'pending': return { bg: '#fff3e0', color: '#e65100' }
      case 'processing': return { bg: '#e3f2fd', color: '#1565c0' }
      case 'failed': return { bg: '#ffebee', color: '#c62828' }
      case 'cancelled': return { bg: '#f5f5f5', color: '#666' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }
  
  return (
    <div>
      <h2>💳 Load Funds</h2>
      <p style={{marginBottom: '20px', color: '#666'}}>Add funds to your account using a credit or debit card</p>
      
      {message && (
        <div style={{
          backgroundColor: message.includes('Error') || message.includes('cancelled') ? '#ffebee' : '#e8f5e9',
          color: message.includes('Error') || message.includes('cancelled') ? '#c62828' : '#2e7d32',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}
      
      {!showPaymentForm ? (
        <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px'}}>
          <h3 style={{marginTop: 0}}>Enter Amount</h3>
          <form onSubmit={handleCreatePayment}>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Amount (£)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (£10 - £10,000)"
                min="10"
                max="10000"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '18px',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }}
                required
                disabled={loading}
              />
              <p style={{fontSize: '14px', color: '#666', marginTop: '8px'}}>
                Minimum: £10 | Maximum: £10,000 per transaction
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryButton,
                width: '100%',
                fontSize: '18px',
                padding: '15px',
                backgroundColor: '#4CAF50'
              }}
            >
              {loading ? 'Processing...' : `Continue to Payment`}
            </button>
          </form>
          
          <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
            <p style={{margin: 0, fontSize: '14px', color: '#666'}}>
              🔒 <strong>Secure Payment:</strong> Your card details are processed securely by Stripe. We never store your card information.
            </p>
          </div>
        </div>
      ) : (
        <StripePaymentForm
          clientSecret={clientSecret}
          paymentIntentId={paymentIntentId}
          amount={parseFloat(amount)}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
      
      {/* Payment History */}
      <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px'}}>
        <h3 style={{marginTop: 0}}>Payment History</h3>
        
        {paymentHistory.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            <p>No payment history yet</p>
            <p style={{fontSize: '14px'}}>Your payment transactions will appear here</p>
          </div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                  <th style={{padding: '12px', textAlign: 'left'}}>Date</th>
                  <th style={{padding: '12px', textAlign: 'right'}}>Amount</th>
                  <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                  <th style={{padding: '12px', textAlign: 'left'}}>Description</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map(transaction => {
                  const statusStyle = getStatusColor(transaction.status)
                  return (
                    <tr key={transaction.id} style={{borderBottom: '1px solid #eee'}}>
                      <td style={{padding: '12px'}}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <br />
                        <span style={{fontSize: '12px', color: '#666'}}>
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px'}}>
                        £{transaction.amount.toFixed(2)}
                      </td>
                      <td style={{padding: '12px', textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{padding: '12px', fontSize: '14px', color: '#666'}}>
                        {transaction.description || 'Fund loading'}
                        {transaction.failure_reason && (
                          <div style={{color: '#c62828', fontSize: '12px', marginTop: '4px'}}>
                            {transaction.failure_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Stripe Payment Form Component
function StripePaymentForm({ clientSecret, paymentIntentId, amount, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      })
      
      if (stripeError) {
        setError(stripeError.message)
        setLoading(false)
        return
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Verify payment with backend
        try {
          await apiCall('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
              payment_intent_id: paymentIntentId
            })
          })
          
          onSuccess()
        } catch (verifyError) {
          setError(`Payment succeeded but verification failed: ${verifyError.message}`)
        }
      }
    } catch (err) {
      setError(`Payment failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px'}}>
      <h3 style={{marginTop: 0}}>💳 Enter Card Details</h3>
      <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
        <strong>Amount to pay:</strong> £{amount.toFixed(2)}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Card Information</label>
          <div style={{
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4'
                  }
                },
                invalid: {
                  color: '#9e2146'
                }
              }
            }} />
          </div>
        </div>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        <div style={{display: 'flex', gap: '10px'}}>
          <button
            type="submit"
            disabled={!stripe || loading}
            style={{
              ...styles.primaryButton,
              flex: 1,
              fontSize: '16px',
              padding: '15px',
              backgroundColor: '#4CAF50'
            }}
          >
            {loading ? 'Processing...' : `Pay £${amount.toFixed(2)}`}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              flex: 1,
              fontSize: '16px',
              padding: '15px',
              backgroundColor: '#f44336'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
      
      <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
        <p style={{margin: 0, fontSize: '14px', color: '#666'}}>
          🔒 <strong>Secure Payment:</strong> Powered by Stripe. Your payment information is encrypted and secure.
        </p>
      </div>
    </div>
  )
}

// VCSE DASHBOARD
function VCSEDashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [allocatedBalance, setAllocatedBalance] = useState(0)
  const [voucherForm, setVoucherForm] = useState({
    recipientFirstName: '',
    recipientLastName: '',
    recipientEmail: '',
    recipientDateOfBirth: '',
    recipientPhone: '',
    recipientAddress: '',
    value: '',
    expiryDays: '30'
  })
  const [message, setMessage] = useState('')
  const [toGoItems, setToGoItems] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [vendorShops, setVendorShops] = useState([])
  const [selectedShops, setSelectedShops] = useState('all')
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignVoucher, setReassignVoucher] = useState(null)
  const [reassignEmail, setReassignEmail] = useState('')
  const [reassignReason, setReassignReason] = useState('')

  useEffect(() => {
    loadBalance()
    loadToGoItems()
    loadVouchers()
    loadAnalytics()
    loadVendorShops()
  }, [])

  useEffect(() => {
    loadVouchers()
  }, [statusFilter, searchQuery])

  const loadBalance = async () => {
    try {
      const data = await apiCall('/vcse/balance')
      setAllocatedBalance(data.allocated_balance || 0)
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/vcse/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load Food to Go Items:', error)
    }
  }

  const loadVouchers = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const data = await apiCall(`/vcse/vouchers?${params.toString()}`)
      setVouchers(data.vouchers || [])
    } catch (error) {
      console.error('Failed to load vouchers:', error)
    }
  }

  const loadVendorShops = async () => {
    try {
      const data = await apiCall('/vendor/shops/all')
      setVendorShops(data || [])
    } catch (error) {
      console.error('Failed to load vendor shops:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const data = await apiCall('/vcse/analytics')
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const handleIssueVoucher = async (e) => {
    e.preventDefault()
    try {
      await apiCall('/vcse/issue-voucher', {
        method: 'POST',
        body: JSON.stringify({
          recipient_first_name: voucherForm.recipientFirstName,
          recipient_last_name: voucherForm.recipientLastName,
          recipient_email: voucherForm.recipientEmail,
          recipient_date_of_birth: voucherForm.recipientDateOfBirth,
          recipient_phone: voucherForm.recipientPhone,
          recipient_address: voucherForm.recipientAddress,
          value: parseFloat(voucherForm.value),
          expiry_days: parseInt(voucherForm.expiryDays),
          selected_shops: selectedShops === 'all' ? 'all' : selectedShops,
          assign_shop_method: voucherForm.assignShopMethod || 'none',
          specific_shop_id: voucherForm.assignShopMethod === 'specific_shop' ? parseInt(voucherForm.specificShopId) : null
        })
      })
      setMessage('Voucher issued successfully!')
      setVoucherForm({ 
        recipientFirstName: '',
        recipientLastName: '',
        recipientEmail: '',
        recipientDateOfBirth: '',
        recipientPhone: '',
        recipientAddress: '',
        value: '',
        expiryDays: '30'
      })
      setSelectedShops('all')
      loadBalance()
      loadVouchers()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleReassignVoucher = async (e) => {
    e.preventDefault()
    try {
      await apiCall('/voucher/reassign', {
        method: 'POST',
        body: JSON.stringify({
          voucher_id: reassignVoucher.id,
          new_recipient_email: reassignEmail,
          reason: reassignReason
        })
      })
      setMessage(`Voucher ${reassignVoucher.code} reassigned successfully!`)
      setShowReassignModal(false)
      setReassignVoucher(null)
      setReassignEmail('')
      setReassignReason('')
      loadVouchers()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#4CAF50', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <NotificationBell apiCall={apiCall} userType="vcse" />
          <LanguageSelector />
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#FF9800'}}>🔒 Password</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.overview')}</button>
          <button onClick={() => setActiveTab('payment')} style={activeTab === 'payment' ? styles.activeTab : styles.tab}>💳 {t('tabs.loadFunds')}</button>
          <button onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeTab : styles.tab}>📋 {t('tabs.voucherOrders')}</button>
          <button onClick={() => setActiveTab('reports')} style={activeTab === 'reports' ? styles.activeTab : styles.tab}>📈 {t('tabs.reports')}</button>
          <button onClick={() => setActiveTab('issue')} style={activeTab === 'issue' ? styles.activeTab : styles.tab}>{t('dashboard.issueVouchers')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.toGo')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              {/* Admin Allocated Balance */}
              <div style={{backgroundColor: '#e3f2fd', padding: '25px', borderRadius: '15px'}}>
                <h3 style={{marginTop: 0, color: '#1565c0'}}>💼 Admin Allocated Funds</h3>
                <p style={{fontSize: '14px', color: '#666'}}>Funds allocated by administrator</p>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center'}}>
                  <div style={{fontSize: '36px', fontWeight: 'bold', color: '#1976d2'}}>£{allocatedBalance.toFixed(2)}</div>
                </div>
              </div>
              
              {/* Self-Loaded Balance */}
              <div style={{backgroundColor: '#e8f5e9', padding: '25px', borderRadius: '15px'}}>
                <h3 style={{marginTop: 0, color: '#2e7d32'}}>💳 Self-Loaded Funds</h3>
                <p style={{fontSize: '14px', color: '#666'}}>Funds loaded via payment</p>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center'}}>
                  <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50'}}>£{(user.balance || 0).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => setActiveTab('payment')}
                  style={{...styles.primaryButton, width: '100%', marginTop: '15px', backgroundColor: '#4CAF50'}}
                >
                  💳 Load Funds
                </button>
              </div>
              
              {/* Total Balance */}
              <div style={{backgroundColor: '#fff3e0', padding: '25px', borderRadius: '15px'}}>
                <h3 style={{marginTop: 0, color: '#e65100'}}>💰 Total Available</h3>
                <p style={{fontSize: '14px', color: '#666'}}>Combined balance for vouchers</p>
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center'}}>
                  <div style={{fontSize: '36px', fontWeight: 'bold', color: '#FF9800'}}>£{((user.balance || 0) + allocatedBalance).toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
              <p style={{margin: 0, color: '#1565c0'}}>ℹ️ <strong>Note:</strong> You can load funds directly using a credit/debit card, or receive allocated funds from the administrator.</p>
            </div>
            
            <div style={{backgroundColor: '#e8f5e9', padding: '25px', borderRadius: '12px', marginTop: '20px', border: '2px solid #4CAF50'}}>
              <h3 style={{marginTop: 0, color: '#2e7d32'}}>🤝 Welcome to the Northamptonshire Community E-Voucher Scheme</h3>
              <p style={{margin: '10px 0', lineHeight: '1.6', color: '#333'}}>
                Thank you for partnering with <strong>BAK UP CIC</strong> to support families and individuals facing hardship across Northamptonshire. As a VCFSE organization, you are at the heart of our community-led approach to tackling food insecurity.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6', color: '#333'}}>
                Our E-Voucher system replaces traditional food parcels with <strong>flexible, dignified support</strong> that respects cultural preferences and gives families real choice. Every voucher you issue helps strengthen local economies by supporting participating shops and retailers.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6', fontSize: '0.95em', color: '#555'}}>
                🌟 Together, we're building a more inclusive, sustainable, and resilient community where everyone can thrive.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h2>📋 {t('tabs.voucherOrders')}</h2>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <div style={{flex: '1', minWidth: '200px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Filter by Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    style={styles.input}
                  >
                    <option value="all">All Vouchers</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div style={{flex: '2', minWidth: '300px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code, recipient name, or email..."
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <strong>Total Vouchers: {vouchers.length}</strong>
                <a 
                  href="/api/vcse/export-vouchers" 
                  download
                  style={{...styles.primaryButton, textDecoration: 'none', display: 'inline-block', backgroundColor: '#2e7d32'}}
                >
                  📄 Export to Excel
                </a>
              </div>
              
              {vouchers.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No vouchers found matching your criteria</p>
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                        <th style={{padding: '12px', textAlign: 'left'}}>Code</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Recipient</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Email</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Phone</th>
                        <th style={{padding: '12px', textAlign: 'right'}}>Value</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Issued</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Expiry</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Redeemed</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map(voucher => (
                        <tr key={voucher.id} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '12px', fontFamily: 'monospace', fontWeight: 'bold'}}>{voucher.code}</td>
                          <td style={{padding: '12px'}}>{voucher.recipient_name}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{voucher.recipient_email}</td>
                          <td style={{padding: '12px'}}>{voucher.recipient_phone}</td>
                          <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#4CAF50'}}>£{voucher.value.toFixed(2)}</td>
                          <td style={{padding: '12px', textAlign: 'center'}}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: voucher.status === 'active' ? '#e8f5e9' : voucher.status === 'redeemed' ? '#e3f2fd' : '#ffebee',
                              color: voucher.status === 'active' ? '#2e7d32' : voucher.status === 'redeemed' ? '#1565c0' : '#c62828'
                            }}>
                              {voucher.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{new Date(voucher.created_at).toLocaleDateString()}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{new Date(voucher.expiry_date).toLocaleDateString()}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{voucher.redeemed_date ? new Date(voucher.redeemed_date).toLocaleDateString() : '-'}</td>
                          <td style={{padding: '12px', textAlign: 'center'}}>
                            <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                              <a 
                                href={`/api/vcse/voucher-pdf/${voucher.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{...styles.primaryButton, fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-block', backgroundColor: '#1976d2'}}
                              >
                                📝 PDF
                              </a>
                              {(voucher.status === 'active' || voucher.status === 'expired') && voucher.reassignment_count < 3 && (
                                <button
                                  onClick={() => {
                                    setReassignVoucher(voucher)
                                    setShowReassignModal(true)
                                  }}
                                  style={{...styles.primaryButton, fontSize: '12px', padding: '6px 12px', backgroundColor: '#FF9800'}}
                                >
                                  🔄 Reassign
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div>
            <h2>📈 {t('tabs.reports')} & {t('dashboard.tabs.analytics', 'Analytics')}</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>Visual insights into your voucher distribution and impact</p>
            
            {!analytics ? (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <p>Loading analytics...</p>
              </div>
            ) : (
              <div>
                {/* Key Metrics Cards */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <div style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>Total Vouchers Issued</div>
                    <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50'}}>{analytics.total_vouchers}</div>
                  </div>
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <div style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>Total Value Distributed</div>
                    <div style={{fontSize: '36px', fontWeight: 'bold', color: '#1976d2'}}>£{analytics.total_value.toFixed(2)}</div>
                  </div>
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <div style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>Active Vouchers</div>
                    <div style={{fontSize: '36px', fontWeight: 'bold', color: '#2e7d32'}}>{analytics.active_vouchers}</div>
                  </div>
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <div style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>Redeemed Vouchers</div>
                    <div style={{fontSize: '36px', fontWeight: 'bold', color: '#1565c0'}}>{analytics.redeemed_vouchers}</div>
                  </div>
                </div>
                
                {/* Status Breakdown */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <h3 style={{marginTop: 0}}>Voucher Status Breakdown</h3>
                    <div style={{padding: '20px 0'}}>
                      <div style={{marginBottom: '15px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                          <span>🟢 Active</span>
                          <strong>{analytics.status_breakdown.active} ({analytics.total_vouchers > 0 ? ((analytics.status_breakdown.active / analytics.total_vouchers) * 100).toFixed(1) : 0}%)</strong>
                        </div>
                        <div style={{backgroundColor: '#e0e0e0', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                          <div style={{backgroundColor: '#4CAF50', height: '100%', width: `${analytics.total_vouchers > 0 ? (analytics.status_breakdown.active / analytics.total_vouchers) * 100 : 0}%`}}></div>
                        </div>
                      </div>
                      <div style={{marginBottom: '15px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                          <span>🔵 Redeemed</span>
                          <strong>{analytics.status_breakdown.redeemed} ({analytics.total_vouchers > 0 ? ((analytics.status_breakdown.redeemed / analytics.total_vouchers) * 100).toFixed(1) : 0}%)</strong>
                        </div>
                        <div style={{backgroundColor: '#e0e0e0', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                          <div style={{backgroundColor: '#2196F3', height: '100%', width: `${analytics.total_vouchers > 0 ? (analytics.status_breakdown.redeemed / analytics.total_vouchers) * 100 : 0}%`}}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                          <span>🔴 Expired</span>
                          <strong>{analytics.status_breakdown.expired} ({analytics.total_vouchers > 0 ? ((analytics.status_breakdown.expired / analytics.total_vouchers) * 100).toFixed(1) : 0}%)</strong>
                        </div>
                        <div style={{backgroundColor: '#e0e0e0', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                          <div style={{backgroundColor: '#f44336', height: '100%', width: `${analytics.total_vouchers > 0 ? (analytics.status_breakdown.expired / analytics.total_vouchers) * 100 : 0}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <h3 style={{marginTop: 0}}>Value by Status</h3>
                    <div style={{padding: '20px 0'}}>
                      <div style={{marginBottom: '20px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span>🟢 Active Value</span>
                          <strong style={{fontSize: '20px', color: '#4CAF50'}}>£{analytics.value_by_status.active.toFixed(2)}</strong>
                        </div>
                      </div>
                      <div style={{marginBottom: '20px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span>🔵 Redeemed Value</span>
                          <strong style={{fontSize: '20px', color: '#2196F3'}}>£{analytics.value_by_status.redeemed.toFixed(2)}</strong>
                        </div>
                      </div>
                      <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span>🔴 Expired Value</span>
                          <strong style={{fontSize: '20px', color: '#f44336'}}>£{analytics.value_by_status.expired.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Issuance Trend */}
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                  <h3 style={{marginTop: 0}}>Voucher Issuance Trend (Last 30 Days)</h3>
                  <div style={{overflowX: 'auto'}}>
                    <div style={{display: 'flex', alignItems: 'flex-end', height: '200px', gap: '4px', minWidth: '600px'}}>
                      {analytics.issuance_trend.map((day, idx) => {
                        const maxCount = Math.max(...analytics.issuance_trend.map(d => d.count), 1)
                        const height = (day.count / maxCount) * 180
                        return (
                          <div key={idx} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div 
                              style={{
                                backgroundColor: '#4CAF50',
                                width: '100%',
                                height: `${height}px`,
                                borderRadius: '4px 4px 0 0',
                                position: 'relative',
                                minHeight: day.count > 0 ? '2px' : '0'
                              }}
                              title={`${day.date}: ${day.count} vouchers`}
                            >
                              {day.count > 0 && (
                                <div style={{position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 'bold'}}>
                                  {day.count}
                                </div>
                              )}
                            </div>
                            {idx % 5 === 0 && (
                              <div style={{fontSize: '9px', marginTop: '5px', transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap'}}>
                                {new Date(day.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Report Generation Section */}
                <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '30px'}}>
                  <h3 style={{marginTop: 0}}>📄 Generate Detailed Report</h3>
                  <p style={{color: '#666', marginBottom: '20px'}}>Generate and download comprehensive reports for your funders and stakeholders</p>
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>From Date</label>
                      <input 
                        type="date" 
                        id="reportDateFrom"
                        style={styles.input}
                        defaultValue={new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>To Date</label>
                      <input 
                        type="date" 
                        id="reportDateTo"
                        style={styles.input}
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <button
                      onClick={async () => {
                        try {
                          const dateFrom = document.getElementById('reportDateFrom').value
                          const dateTo = document.getElementById('reportDateTo').value
                          
                          const response = await fetch('/api/vcse/reports/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ date_from: dateFrom, date_to: dateTo })
                          })
                          
                          if (response.ok) {
                            const data = await response.json()
                            alert('Report generated successfully! Check the console for details.')
                            console.log('Report Data:', data)
                          } else {
                            alert('Failed to generate report')
                          }
                        } catch (error) {
                          alert('Error generating report: ' + error.message)
                        }
                      }}
                      style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}
                    >
                      📊 Generate Report
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          const dateFrom = document.getElementById('reportDateFrom').value
                          const dateTo = document.getElementById('reportDateTo').value
                          
                          const response = await fetch(`/api/vcse/reports/pdf?date_from=${dateFrom}&date_to=${dateTo}`, {
                            credentials: 'include'
                          })
                          
                          if (response.ok) {
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `vcse_report_${dateFrom}_to_${dateTo}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          } else {
                            alert('Failed to download PDF report')
                          }
                        } catch (error) {
                          alert('Error downloading PDF: ' + error.message)
                        }
                      }}
                      style={{...styles.primaryButton, backgroundColor: '#f44336'}}
                    >
                      📥 Download PDF
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          const dateFrom = document.getElementById('reportDateFrom').value
                          const dateTo = document.getElementById('reportDateTo').value
                          
                          // Use the report data to create CSV
                          const response = await fetch('/api/vcse/reports/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ date_from: dateFrom, date_to: dateTo })
                          })
                          
                          if (response.ok) {
                            const data = await response.json()
                            const report = data.report
                            
                            // Create CSV content
                            let csv = 'VCFSE Organization Report\n\n'
                            csv += `Organization,${report.organization_name}\n`
                            csv += `Period,${report.date_from} to ${report.date_to}\n\n`
                            csv += 'Metric,Value\n'
                            csv += `Vouchers Issued,${report.vouchers_issued}\n`
                            csv += `Total Value Distributed,£${report.total_value_distributed}\n`
                            csv += `Active Vouchers,${report.active_vouchers}\n`
                            csv += `Redeemed Vouchers,${report.redeemed_vouchers}\n`
                            csv += `Families Supported,${report.families_supported}\n`
                            csv += `Surplus Items Claimed,${report.surplus_items_claimed}\n`
                            csv += `Surplus Items Collected,${report.surplus_items_collected}\n`
                            
                            // Download CSV
                            const blob = new Blob([csv], { type: 'text/csv' })
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `vcse_report_${dateFrom}_to_${dateTo}.csv`
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          } else {
                            alert('Failed to generate CSV report')
                          }
                        } catch (error) {
                          alert('Error generating CSV: ' + error.message)
                        }
                      }}
                      style={{...styles.primaryButton, backgroundColor: '#2196F3'}}
                    >
                      📥 Download Excel (CSV)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'issue' && (
          <div>
            <h2>Issue Vouchers</h2>
            <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <strong>💰 Allocated Funds from Admin: £{allocatedBalance.toFixed(2)}</strong>
              <p style={{margin: '10px 0 0'}}>Use these funds to issue vouchers to recipients</p>
            </div>
            
            {message && <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
            
            <form onSubmit={handleIssueVoucher} style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name</label>
                  <input
                    type="text"
                    value={voucherForm.recipientFirstName}
                    onChange={(e) => setVoucherForm({...voucherForm, recipientFirstName: e.target.value})}
                    placeholder="John"
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Surname</label>
                  <input
                    type="text"
                    value={voucherForm.recipientLastName}
                    onChange={(e) => setVoucherForm({...voucherForm, recipientLastName: e.target.value})}
                    placeholder="Smith"
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email Address</label>
                <input
                  type="email"
                  value={voucherForm.recipientEmail}
                  onChange={(e) => setVoucherForm({...voucherForm, recipientEmail: e.target.value})}
                  placeholder="recipient@example.com"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Date of Birth</label>
                <input
                  type="date"
                  value={voucherForm.recipientDateOfBirth}
                  onChange={(e) => setVoucherForm({...voucherForm, recipientDateOfBirth: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone Number</label>
                <input
                  type="tel"
                  value={voucherForm.recipientPhone}
                  onChange={(e) => setVoucherForm({...voucherForm, recipientPhone: e.target.value})}
                  placeholder="07700900000"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address</label>
                <input
                  type="text"
                  value={voucherForm.recipientAddress}
                  onChange={(e) => setVoucherForm({...voucherForm, recipientAddress: e.target.value})}
                  placeholder="Full address including postcode"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Voucher Value (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={voucherForm.value}
                  onChange={(e) => setVoucherForm({...voucherForm, value: e.target.value})}
                  placeholder="Enter amount"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Accepted At (Local Food Shops)</label>
                <select
                  value={selectedShops}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === 'all') {
                      setSelectedShops('all')
                    } else {
                      // For multi-select, we'd need a different UI, but for now single shop
                      setSelectedShops([parseInt(value)])
                    }
                  }}
                  style={styles.input}
                >
                  <option value="all">All Local Food Shops</option>
                  {vendorShops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.shop_name} - {shop.city}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                  Select which shop(s) can accept this voucher
                </small>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Expiry (Days)</label>
                <input
                  type="number"
                  value={voucherForm.expiryDays}
                  onChange={(e) => setVoucherForm({...voucherForm, expiryDays: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#1976d2'}}>
                  🎁 Food To Go at a Discount - Shop Assignment
                </label>
                <select
                  value={voucherForm.assignShopMethod || 'none'}
                  onChange={(e) => setVoucherForm({...voucherForm, assignShopMethod: e.target.value})}
                  style={styles.input}
                >
                  <option value="none">No shop assignment (regular voucher)</option>
                  <option value="recipient_choice">Recipient to choose shop</option>
                  <option value="specific_shop">Assign specific shop</option>
                </select>
                <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                  Choose how the shop will be assigned for discounted food items
                </small>
                
                {voucherForm.assignShopMethod === 'specific_shop' && (
                  <div style={{marginTop: '10px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Select Shop</label>
                    <select
                      value={voucherForm.specificShopId || ''}
                      onChange={(e) => setVoucherForm({...voucherForm, specificShopId: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="">-- Select a shop --</option>
                      {vendorShops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.shop_name} - {shop.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <button type="submit" style={styles.primaryButton}>Issue Voucher</button>
            </form>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>🛒️ {t('pages.foodToGoOrderTitle')}</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>{t('pages.foodToGoOrderDesc')}</p>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No Food to Go Items available at the moment</p>
                  <p style={{fontSize: '14px'}}>Check back later for surplus Food to Go Items from local shops</p>
                </div>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {toGoItems.map(item => (
                    <ToGoOrderCard key={item.id} item={item} onOrderPlaced={loadToGoItems} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'payment' && (
          <PaymentTab user={user} onBalanceUpdate={loadBalance} />
        )}
      </div>
      
      {/* Reassign Voucher Modal */}
      {showReassignModal && reassignVoucher && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{marginTop: 0}}>🔄 Reassign Voucher</h3>
            <div style={{backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
              <strong>Voucher Code:</strong> {reassignVoucher.code}<br />
              <strong>Value:</strong> £{reassignVoucher.value.toFixed(2)}<br />
              <strong>Current Recipient:</strong> {reassignVoucher.recipient.name}<br />
              <strong>Reassignments:</strong> {reassignVoucher.reassignment_count || 0} / 3
            </div>
            <form onSubmit={handleReassignVoucher}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>New Recipient Email</label>
                <input
                  type="email"
                  value={reassignEmail}
                  onChange={(e) => setReassignEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  style={styles.input}
                  required
                />
              </div>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Reason for Reassignment</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Why is this voucher being reassigned?"
                  style={{...styles.input, minHeight: '80px'}}
                  required
                />
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={() => {
                    setShowReassignModal(false)
                    setReassignVoucher(null)
                    setReassignEmail('')
                    setReassignReason('')
                  }}
                  style={{...styles.primaryButton, backgroundColor: '#757575'}}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{...styles.primaryButton, backgroundColor: '#FF9800'}}
                >
                  Reassign Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// VENDOR DASHBOARD - WITH FIXED SURPLUS COUNTER
// Force rebuild - Food to Go Items form with item_type field
function VendorDashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [shops, setShops] = useState([])
  const [toGoItems, setToGoItems] = useState([])
  const [toGoCount, setToGoCount] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [toGoForm, setToGoForm] = useState({
    shopName: '',
    shopAddress: '',
    itemName: '',
    quantity: '',
    category: 'Fresh Produce',
    description: '',
    expiry_date: '',
    item_type: 'free',  // 'free' or 'discount'
    price: '',
    original_price: ''
  })
  const [message, setMessage] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherValidation, setVoucherValidation] = useState(null)
  const [redemptionMessage, setRedemptionMessage] = useState('')
  const [editingShop, setEditingShop] = useState(null)
  const [shopEditForm, setShopEditForm] = useState({
    shop_name: '',
    address: '',
    postcode: '',
    city: '',
    phone: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [redemptionHistorySearch, setRedemptionHistorySearch] = useState('')
  const [redemptionHistoryFilter, setRedemptionHistoryFilter] = useState('all')
  const [payoutRequests, setPayoutRequests] = useState([])
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    shop_id: '',
    amount: '',
    bank_name: '',
    account_number: '',
    sort_code: '',
    account_holder_name: '',
    notes: ''
  })

  useEffect(() => {
    loadShops()
    loadToGoItems()
    loadPayoutHistory()
  }, [])

  // Payout shop dropdown - simple onChange handler (no polling needed)

  const loadShops = async () => {
    try {
      const data = await apiCall('/vendor/shops')
      setShops(data.shops || [])
      setTotalSales(data.total_sales || 0)
      // Auto-populate shop details from first shop
      if (data.shops && data.shops.length > 0) {
        const firstShop = data.shops[0]
        setToGoForm(prev => ({
          ...prev,
          shopId: firstShop.id.toString(),
          shopName: firstShop.shop_name,
          shopAddress: firstShop.address
        }))
      }
    } catch (error) {
      console.error('Failed to load shops:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/vendor/to-go-items')
      // Backend returns 'surplus_items', map to toGoItems
      setToGoItems(data.surplus_items || data.to_go_items || [])
      setToGoCount(data.total_count || 0)
    } catch (error) {
      console.error('Failed to load Food to Go Items:', error)
    }
  }

  const loadPayoutHistory = async () => {
    try {
      const data = await apiCall('/vendor/payout/history')
      setPayoutRequests(data.payouts || [])
    } catch (error) {
      console.error('Failed to load payout history:', error)
    }
  }

  const handlePayoutRequest = async (e) => {
    e.preventDefault()
    console.log('=== PAYOUT FORM SUBMISSION ==');
    console.log('payoutForm state:', payoutForm);
    console.log('shop_id:', payoutForm.shop_id, typeof payoutForm.shop_id);
    console.log('=============================');
    try {
      await apiCall('/vendor/payout/request', {
        method: 'POST',
        body: JSON.stringify(payoutForm)
      })
      alert(t('payout.payoutRequestSubmitted'))
      setShowPayoutForm(false)
      setPayoutForm({
        shop_id: '',
        amount: '',
        bank_name: '',
        account_number: '',
        sort_code: '',
        account_holder_name: '',
        notes: ''
      })
      loadPayoutHistory()
    } catch (error) {
      alert('Failed to submit payout request: ' + error.message)
    }
  }

  const handlePostToGo = async (e) => {
    e.preventDefault()
    try {
      await apiCall('/items/post', {
        method: 'POST',
        body: JSON.stringify({
          shop_name: toGoForm.shopName,
          shop_address: toGoForm.shopAddress,
          item_name: toGoForm.itemName,
          quantity: toGoForm.quantity,
          category: toGoForm.category,
          description: toGoForm.description,
          expiry_date: toGoForm.expiry_date,
          item_type: toGoForm.item_type,
          price: toGoForm.item_type === 'discount' ? toGoForm.price : null,
          original_price: toGoForm.item_type === 'discount' ? toGoForm.original_price : null
        })
      })
      setMessage('Food to Go Items posted successfully!')
      setToGoForm({ ...toGoForm, itemName: '', quantity: '', description: '', expiry_date: '', item_type: 'free', price: '', original_price: '' })
      loadToGoItems()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleEditShop = (shop) => {
    setEditingShop(shop.id)
    setShopEditForm({
      shop_name: shop.shop_name,
      address: shop.address,
      postcode: shop.postcode || '',
      city: shop.city || '',
      phone: shop.phone || ''
    })
  }

  const handleSaveShop = async () => {
    try {
      await apiCall(`/vendor/shops/${editingShop}`, {
        method: 'PUT',
        body: JSON.stringify(shopEditForm)
      })
      setMessage('Shop updated successfully!')
      setEditingShop(null)
      loadShops()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleDeleteShop = async (shopId) => {
    if (!confirm('Are you sure you want to delete this shop?')) return
    
    try {
      await apiCall(`/vendor/shops/${shopId}`, {
        method: 'DELETE'
      })
      setMessage('Shop deleted successfully!')
      loadShops()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await apiCall(`/vendor/surplus-items/${itemId}`, {
        method: 'DELETE'
      })
      setMessage('Item deleted successfully!')
      loadToGoItems()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      setRedemptionMessage('Please enter a voucher code')
      return
    }
    
    try {
      const data = await apiCall('/vendor/validate-voucher', {
        method: 'POST',
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      })
      
      if (data.valid) {
        setVoucherValidation(data.voucher)
        setRedemptionMessage('')
      } else {
        setVoucherValidation(null)
        setRedemptionMessage(data.error || 'Invalid voucher')
      }
    } catch (error) {
      setVoucherValidation(null)
      setRedemptionMessage('Error validating voucher: ' + error.message)
    }
  }

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) {
      setRedemptionMessage('Please enter a voucher code')
      return
    }
    
    try {
      const data = await apiCall('/vendor/redeem-voucher', {
        method: 'POST',
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      })
      
      setRedemptionMessage(`Success! Voucher £${data.voucher.value} redeemed. New balance: £${data.new_balance}`)
      setVoucherCode('')
      setVoucherValidation(null)
      setTimeout(() => setRedemptionMessage(''), 5000)
    } catch (error) {
      setRedemptionMessage('Error: ' + error.message)
      setTimeout(() => setRedemptionMessage(''), 5000)
    }
  }

  const handleQRScan = (scannedCode) => {
    setVoucherCode(scannedCode.toUpperCase())
    setShowQRScanner(false)
    setRedemptionMessage('QR code scanned! Click Validate or Redeem.')
    setTimeout(() => setRedemptionMessage(''), 3000)
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#FF9800', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <LanguageSelector />
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#1976d2'}}>🔒 {t('common.password')}</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.overview')}</button>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.redeemVouchers')}</button>
          <button onClick={() => setActiveTab('history')} style={activeTab === 'history' ? styles.activeTab : styles.tab}>📜 {t('shop.redemptionHistory')}</button>
          <button onClick={() => setActiveTab('payout')} style={activeTab === 'payout' ? styles.activeTab : styles.tab}>💰 {t('payout.requestPayout')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.toGo')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#4CAF50'}}>£{totalSales.toFixed(2)}</div>
                <div>💰 Total Sales</div>
              </div>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#FF9800'}}>{toGoCount}</div>
                <div>{t('shop.toGoPosted')}</div>
              </div>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#2196F3'}}>{shops.length}</div>
                <div>{t('shop.shopsRegistered')}</div>
              </div>
            </div>
            
            <div style={{backgroundColor: '#fff3e0', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '2px solid #FF9800'}}>
              <h3 style={{marginTop: 0, color: '#e65100'}}>🏪 Welcome to the Northamptonshire Community E-Voucher Scheme</h3>
              <p style={{margin: '10px 0', lineHeight: '1.6', color: '#333'}}>
                Thank you for joining <strong>BAK UP CIC</strong> as a participating shop or vendor! You are a vital partner in our community-led approach to supporting families facing hardship.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6', color: '#333'}}>
                By accepting e-vouchers, you provide families with <strong>dignity, choice, and access</strong> to culturally appropriate food and essentials. At the same time, you benefit from increased footfall and support for your local business.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6', fontSize: '0.95em', color: '#555'}}>
                ♻️ You can also help reduce waste by notifying us about surplus food and goods for redistribution, strengthening our circular economy.
              </p>
            </div>
            
            <h3>{t('shop.yourShops')}</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {shops.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <p style={{marginBottom: '20px', color: '#666'}}>{t('shop.noShopYet')}</p>
                  <button 
                    onClick={() => setActiveTab('create-shop')} 
                    style={{...styles.primaryButton, backgroundColor: '#FF9800'}}
                  >
                    ➕ {t('shop.createShopProfile')}
                  </button>
                </div>
              ) : (
                shops.map(shop => (
                  <div key={shop.id} style={{padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    {editingShop === shop.id ? (
                      <div style={{flex: 1}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.shopName')}</label>
                            <input
                              type="text"
                              value={shopEditForm.shop_name}
                              onChange={(e) => setShopEditForm({...shopEditForm, shop_name: e.target.value})}
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.phone')}</label>
                            <input
                              type="text"
                              value={shopEditForm.phone}
                              onChange={(e) => setShopEditForm({...shopEditForm, phone: e.target.value})}
                              style={styles.input}
                            />
                          </div>
                        </div>
                        <div style={{marginBottom: '15px'}}>
                          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.address')}</label>
                          <input
                            type="text"
                            value={shopEditForm.address}
                            onChange={(e) => setShopEditForm({...shopEditForm, address: e.target.value})}
                            style={styles.input}
                          />
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.cityCounty')}</label>
                            <input
                              type="text"
                              value={shopEditForm.city}
                              onChange={(e) => setShopEditForm({...shopEditForm, city: e.target.value})}
                              style={styles.input}
                              placeholder="e.g., London, Essex"
                            />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.postcode')}</label>
                            <input
                              type="text"
                              value={shopEditForm.postcode}
                              onChange={(e) => setShopEditForm({...shopEditForm, postcode: e.target.value})}
                              style={styles.input}
                              placeholder="e.g., SW1A 1AA"
                            />
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button onClick={handleSaveShop} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>💾 {t('shop.save')}</button>
                          <button onClick={() => setEditingShop(null)} style={{...styles.primaryButton, backgroundColor: '#757575'}}>{t('shop.cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{flex: 1}}>
                          <strong style={{fontSize: '18px', color: '#FF9800'}}>{shop.shop_name}</strong><br />
                          <span style={{color: '#666'}}>📍 {shop.address}</span><br />
                          <span style={{color: '#666'}}>🏙️ {shop.city} {shop.postcode}</span><br />
                          <span style={{color: '#666'}}>📞 {shop.phone}</span>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button onClick={() => handleEditShop(shop)} style={{...styles.primaryButton, backgroundColor: '#2196F3', padding: '8px 16px'}}>✏️ {t('shop.edit')}</button>
                          <button onClick={() => handleDeleteShop(shop.id)} style={{...styles.primaryButton, backgroundColor: '#f44336', padding: '8px 16px'}}>🗑️ {t('shop.delete')}</button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'vouchers' && (
          <div>
            <h2>🎫 {t('shop.redeemVouchers')}</h2>
            
            {/* Redemption Instructions */}
            <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px', maxWidth: '800px', margin: '0 auto 20px'}}>
              <h3 style={{marginTop: 0, color: '#1976d2', fontSize: '18px'}}>📝 How to Redeem Vouchers</h3>
              <ol style={{marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8'}}>
                <li><strong>Ask the customer for their voucher code</strong> - They should have received it via email or text message</li>
                <li><strong>Enter the voucher code</strong> in the field below (or scan the QR code if available)</li>
                <li><strong>Click "Validate"</strong> to check if the voucher is valid and see its value</li>
                <li><strong>Complete the transaction</strong> - Let the customer select items up to the voucher value</li>
                <li><strong>Click "Redeem"</strong> to complete the redemption - The voucher amount will be credited to your shop balance</li>
                <li><strong>Request payout</strong> - Once you have accumulated balance, you can request a payout to your bank account</li>
              </ol>
              <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '5px', fontSize: '14px'}}>
                💡 <strong>Tip:</strong> Always validate the voucher before completing the transaction to ensure it's active and has sufficient value.
              </div>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto'}}>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px'}}>{t('shop.enterVoucherCode')}</label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase())
                    setVoucherValidation(null)
                    setRedemptionMessage('')
                  }}
                  placeholder="e.g., VCHR-ABC123"
                  style={{
                    ...styles.input,
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
              
              <div style={{marginBottom: '20px', textAlign: 'center'}}>
                <button
                  onClick={() => setShowQRScanner(true)}
                  style={{
                    ...styles.primaryButton,
                    backgroundColor: '#9C27B0',
                    width: '100%',
                    fontSize: '16px'
                  }}
                >
                  📷 {t('shop.scanQRCode')}
                </button>
              </div>
              
              <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                <button 
                  onClick={handleValidateVoucher}
                  style={{
                    ...styles.primaryButton,
                    backgroundColor: '#2196F3',
                    flex: 1
                  }}
                >
                  🔍 {t('shop.validate')}
                </button>
                <button 
                  onClick={handleRedeemVoucher}
                  style={{
                    ...styles.primaryButton,
                    backgroundColor: '#4CAF50',
                    flex: 1
                  }}
                  disabled={!voucherCode.trim()}
                >
                  ✅ {t('shop.redeem')}
                </button>
              </div>
              
              {redemptionMessage && (
                <div style={{
                  backgroundColor: redemptionMessage.includes('Success') || redemptionMessage.includes('redeemed') ? '#e8f5e9' : '#ffebee',
                  color: redemptionMessage.includes('Success') || redemptionMessage.includes('redeemed') ? '#2e7d32' : '#c62828',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '20px',
                  fontWeight: 'bold'
                }}>
                  {redemptionMessage}
                </div>
              )}
              
              {voucherValidation && (
                <div style={{
                  border: '2px solid #4CAF50',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: '#f1f8f4'
                }}>
                  <h3 style={{margin: '0 0 15px 0', color: '#4CAF50'}}>✅ {t('shop.validVoucher')}</h3>
                  <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '15px'}}>
                    £{voucherValidation.value}
                  </div>
                  <div style={{marginBottom: '10px'}}>
                    <strong>{t('shop.code')}:</strong> <span style={{fontFamily: 'monospace'}}>{voucherValidation.code}</span>
                  </div>
                  {voucherValidation.recipient && (
                    <div>
                      <div style={{marginBottom: '5px'}}>
                        <strong>{t('shop.recipient')}:</strong> {voucherValidation.recipient.name}
                      </div>
                      <div style={{marginBottom: '5px'}}>
                        <strong>{t('shop.phone')}:</strong> {voucherValidation.recipient.phone}
                      </div>
                    </div>
                  )}
                  {voucherValidation.expiry_date && (
                    <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                      <strong>{t('shop.expires')}:</strong> {new Date(voucherValidation.expiry_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px'}}>
                <h4 style={{margin: '0 0 10px 0'}}>📊 {t('shop.howToRedeem')}</h4>
                <ol style={{margin: 0, paddingLeft: '20px'}}>
                  <li>{t('shop.step1')}</li>
                  <li>{t('shop.step2')}</li>
                  <li>{t('shop.step3')}</li>
                  <li>{t('shop.step4')}</li>
                  <li>{t('shop.step5')}</li>
                </ol>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>Post Food to Go Items</h2>
            {message && <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
            
            <form onSubmit={handlePostToGo} style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Name <span style={{color: '#4CAF50', fontSize: '12px'}}>(Auto-filled from your profile)</span></label>
                <input
                  type="text"
                  value={toGoForm.shopName}
                  readOnly
                  style={{...styles.input, backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Address <span style={{color: '#4CAF50', fontSize: '12px'}}>(Auto-filled from your profile)</span></label>
                <input
                  type="text"
                  value={toGoForm.shopAddress}
                  readOnly
                  style={{...styles.input, backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Item Name</label>
                <input
                  type="text"
                  value={toGoForm.itemName}
                  onChange={(e) => setToGoForm({...toGoForm, itemName: e.target.value})}
                  placeholder="e.g., Fresh Bread"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Quantity</label>
                <input
                  type="text"
                  value={toGoForm.quantity}
                  onChange={(e) => setToGoForm({...toGoForm, quantity: e.target.value})}
                  placeholder="e.g., 20 loaves"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Category</label>
                <select value={toGoForm.category} onChange={(e) => setToGoForm({...toGoForm, category: e.target.value})} style={styles.input} required>
                  <option>Fresh Produce</option>
                  <option>Bakery</option>
                  <option>Dairy</option>
                  <option>Meat & Fish</option>
                  <option>Packaged Foods</option>
                  <option>Non-Food Items</option>
                </select>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold'}}>Item Type</label>
                <div style={{display: 'flex', gap: '20px'}}>
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                    <input
                      type="radio"
                      value="free"
                      checked={toGoForm.item_type === 'free'}
                      onChange={(e) => setToGoForm({...toGoForm, item_type: e.target.value, price: '', original_price: ''})}
                      style={{marginRight: '8px'}}
                    />
                    <span>🆓 Free for VCFSE Collection</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                    <input
                      type="radio"
                      value="discount"
                      checked={toGoForm.item_type === 'discount'}
                      onChange={(e) => setToGoForm({...toGoForm, item_type: e.target.value})}
                      style={{marginRight: '8px'}}
                    />
                    <span>💰 Discounted for Recipients</span>
                  </label>
                </div>
                <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                  Free items can be collected by VCFSE organizations. Discounted items can be purchased by recipients.
                </small>
              </div>
              
              {toGoForm.item_type === 'discount' && (
                <>
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Discounted Price (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={toGoForm.price}
                      onChange={(e) => setToGoForm({...toGoForm, price: e.target.value})}
                      placeholder="e.g., 2.50"
                      style={styles.input}
                      required
                    />
                  </div>
                  
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Original Price (£) <span style={{color: '#999', fontWeight: 'normal'}}>(Optional)</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={toGoForm.original_price}
                      onChange={(e) => setToGoForm({...toGoForm, original_price: e.target.value})}
                      placeholder="e.g., 5.00"
                      style={styles.input}
                    />
                    <small style={{color: '#666', fontSize: '12px'}}>Show the original price to display discount percentage</small>
                  </div>
                </>
              )}
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Expiry/Best Before Date</label>
                <input
                  type="date"
                  value={toGoForm.expiry_date}
                  onChange={(e) => setToGoForm({...toGoForm, expiry_date: e.target.value})}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                />
                <small style={{color: '#666', fontSize: '12px'}}>Optional - When does this product expire?</small>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Description</label>
                <textarea
                  value={toGoForm.description}
                  onChange={(e) => setToGoForm({...toGoForm, description: e.target.value})}
                  placeholder="Additional details..."
                  style={{...styles.input, minHeight: '80px'}}
                />
              </div>
              
              <button type="submit" style={styles.primaryButton}>Post Food to Go Items Item</button>
            </form>
            
            <h3>Your Food to Go Items ({toGoCount})</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <p>No Food to Go Items posted yet</p>
              ) : (
                toGoItems.map(item => (
                  <div key={item.id} style={{padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                      <strong style={{fontSize: '18px', color: '#FF9800'}}>{item.item_name}</strong><br />
                      <span style={{color: '#666'}}>📦 Quantity: {item.quantity}</span><br />
                      <span style={{color: '#666'}}>🏷️ Category: {item.category}</span><br />
                      <span style={{color: '#666'}}>🏪 Shop: {item.shop_name}</span><br />
                      {item.expiry_date && <span style={{color: '#f44336'}}>⏰ Expires: {new Date(item.expiry_date).toLocaleDateString()}</span>}<br />
                      <span style={{color: item.status === 'available' ? '#4CAF50' : '#757575', fontWeight: 'bold'}}>Status: {item.status}</span><br />
                      {item.description && <p style={{color: '#666', marginTop: '10px'}}>{item.description}</p>}
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item.id)} 
                      style={{...styles.primaryButton, backgroundColor: '#f44336', padding: '8px 16px'}}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'create-shop' && (
          <div>
            <h2>➕ Create Shop Profile</h2>
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px'}}>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                try {
                  await apiCall('/vendor/shops', {
                    method: 'POST',
                    body: JSON.stringify({
                      shop_name: formData.get('shop_name'),
                      address: formData.get('address'),
                      city: formData.get('city'),
                      postcode: formData.get('postcode'),
                      phone: formData.get('phone')
                    })
                  })
                  setMessage('Shop created successfully!')
                  await loadShops()
                  setActiveTab('overview')
                } catch (error) {
                  setMessage('Error: ' + error.message)
                }
              }}>
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Name *</label>
                  <input
                    type="text"
                    name="shop_name"
                    placeholder="e.g., Fresh Foods Market"
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g., 123 High Street"
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>City *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g., London"
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Postcode *</label>
                  <input
                    type="text"
                    name="postcode"
                    placeholder="e.g., SW1A 1AA"
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g., 020 1234 5678"
                    style={styles.input}
                    required
                  />
                </div>
                
                {message && (
                  <div style={{
                    backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
                    color: message.includes('Error') ? '#c62828' : '#2e7d32',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px'
                  }}>{message}</div>
                )}
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="submit" style={{...styles.primaryButton, flex: 1}}>
                    Create Shop
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('overview')} 
                    style={{...styles.primaryButton, backgroundColor: '#757575', flex: 1}}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {activeTab === 'payout' && (
          <div>
            <h2>💰 {t('payout.requestPayout')}</h2>
            
            <div style={{marginBottom: '20px'}}>
              <button 
                onClick={() => setShowPayoutForm(!showPayoutForm)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPayoutForm ? t('common.cancel') : t('payout.requestPayment')}
              </button>
            </div>

            {showPayoutForm && (
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px'}}>
                <h3 style={{marginTop: 0}}>{t('payout.requestPayment')}</h3>
                <form onSubmit={handlePayoutRequest}>
                  <div style={{display: 'grid', gap: '15px'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('shop.shopName')}</label>
                      <select
                        id="payout-shop-select"
                        name="shop_id"
                        value={payoutForm.shop_id}
                        onChange={(e) => {
                          const shopId = parseInt(e.target.value) || '';
                          console.log('Shop selected:', shopId, typeof shopId);
                          setPayoutForm({...payoutForm, shop_id: shopId});
                        }}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        required
                      >
                        <option value="">Select Shop</option>
                        {shops.map(shop => (
                          <option key={shop.id} value={shop.id}>{shop.shop_name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.amount')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutForm.amount}
                        onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <h4 style={{marginTop: '10px', marginBottom: '5px'}}>{t('payout.bankDetails')}</h4>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.bankName')}</label>
                      <input
                        type="text"
                        value={payoutForm.bank_name}
                        onChange={(e) => setPayoutForm({...payoutForm, bank_name: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.accountNumber')}</label>
                      <input
                        type="text"
                        value={payoutForm.account_number}
                        onChange={(e) => setPayoutForm({...payoutForm, account_number: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.sortCode')}</label>
                      <input
                        type="text"
                        value={payoutForm.sort_code}
                        onChange={(e) => setPayoutForm({...payoutForm, sort_code: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        placeholder="12-34-56"
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.accountHolderName')}</label>
                      <input
                        type="text"
                        value={payoutForm.account_holder_name}
                        onChange={(e) => setPayoutForm({...payoutForm, account_holder_name: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{t('payout.notes')}</label>
                      <textarea
                        value={payoutForm.notes}
                        onChange={(e) => setPayoutForm({...payoutForm, notes: e.target.value})}
                        style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px'}}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginTop: '10px'
                      }}
                    >
                      {t('payout.submitRequest')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              <h3>{t('payout.payoutHistory')}</h3>
              
              {payoutRequests.length === 0 ? (
                <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>{t('payout.noPayoutRequests')}</p>
              ) : (
                <div style={{display: 'grid', gap: '15px'}}>
                  {payoutRequests.map(payout => (
                    <div key={payout.id} style={{
                      padding: '20px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                        <div>
                          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>£{payout.amount.toFixed(2)}</div>
                          <div style={{fontSize: '14px', color: '#666'}}>{payout.shop_name}</div>
                        </div>
                        <div style={{
                          padding: '5px 15px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            payout.status === 'paid' ? '#e8f5e9' :
                            payout.status === 'approved' ? '#fff3e0' :
                            payout.status === 'rejected' ? '#ffebee' : '#e3f2fd',
                          color: 
                            payout.status === 'paid' ? '#2e7d32' :
                            payout.status === 'approved' ? '#e65100' :
                            payout.status === 'rejected' ? '#c62828' : '#1565c0'
                        }}>
                          {payout.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div style={{borderTop: '1px solid #e0e0e0', paddingTop: '15px'}}>
                        <p style={{margin: '5px 0', fontSize: '14px'}}>
                          <strong>{t('payout.requestedAt')}:</strong> {new Date(payout.requested_at).toLocaleString()}
                        </p>
                        {payout.reviewed_at && (
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>{t('payout.reviewedAt')}:</strong> {new Date(payout.reviewed_at).toLocaleString()}
                          </p>
                        )}
                        {payout.paid_at && (
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>{t('payout.paidAt')}:</strong> {new Date(payout.paid_at).toLocaleString()}
                          </p>
                        )}
                        {payout.admin_notes && (
                          <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
                            <strong>{t('payout.adminNotes')}:</strong>
                            <p style={{margin: '5px 0'}}>{payout.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* QR Code Scanner */}
      {showQRScanner && (
        <QRScanner 
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}

// RECIPIENT DASHBOARD
function RecipientDashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('vouchers')
  const [vouchers, setVouchers] = useState([])
  const [voucherSummary, setVoucherSummary] = useState(null)
  const [shops, setShops] = useState([])
  const [toGoItems, setToGoItems] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [cart, setCart] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [recipientVoucherSearch, setRecipientVoucherSearch] = useState('')
  const [recipientVoucherStatus, setRecipientVoucherStatus] = useState('all')
  const [voucherHistorySearch, setVoucherHistorySearch] = useState('')
  const [voucherHistoryFilter, setVoucherHistoryFilter] = useState('all')
  const [townFilter, setTownFilter] = useState('all')
  const [showShopSelection, setShowShopSelection] = useState(false)
  const [shopSelectionVoucherCode, setShopSelectionVoucherCode] = useState(null)
  const [discountedItems, setDiscountedItems] = useState([])

  useEffect(() => {
    loadVouchers()
    // loadShops() removed - townFilter useEffect handles this
    loadToGoItems()
    loadCart()
    checkShopSelectionRequired()
  }, [])

  // Watch townFilter and reload shops when it changes
  useEffect(() => {
    console.log('[TOWN FILTER] useEffect triggered with townFilter:', townFilter);
    loadRecipientShops(townFilter);
  }, [townFilter])

  const loadVouchers = async () => {
    try {
      const data = await apiCall('/recipient/vouchers')
      setVouchers(data.vouchers || [])
      setVoucherSummary(data.summary || null)
    } catch (error) {
      console.error('Failed to load vouchers:', error)
    }
  }

  const checkShopSelectionRequired = async () => {
    try {
      const data = await apiCall('/recipient/vouchers')
      const activeVouchers = data.vouchers?.filter(v => v.status === 'active') || []
      
      // Check if any active voucher requires shop selection
      for (const voucher of activeVouchers) {
        const statusData = await apiCall(`/recipient/voucher-shop-status/${voucher.code}`)
        if (statusData.requires_selection) {
          setShopSelectionVoucherCode(voucher.code)
          setShowShopSelection(true)
          break
        }
      }
    } catch (error) {
      console.error('Failed to check shop selection requirement:', error)
    }
  }

  const loadDiscountedItems = async () => {
    try {
      const data = await apiCall('/recipient/discounted-items')
      setDiscountedItems(data.items || [])
    } catch (error) {
      console.error('Failed to load discounted items:', error)
    }
  }

  const handlePrintVoucher = (voucher) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>BAK UP Voucher - ${voucher.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .voucher { border: 3px solid #4CAF50; padding: 30px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; color: #4CAF50; margin-bottom: 20px; }
            .amount { font-size: 48px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; }
            .code { font-size: 24px; text-align: center; background: #f0f0f0; padding: 15px; margin: 20px 0; letter-spacing: 3px; }
            .details { margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <h1>BAK UP E-Voucher</h1>
            </div>
            <div class="amount">£${voucher.value}</div>
            <div class="code">${voucher.code}</div>
            <div class="details">
              <p><strong>Status:</strong> ${voucher.status}</p>
              <p><strong>Expires:</strong> ${new Date(voucher.expiry_date).toLocaleDateString()}</p>
              ${voucher.issued_by ? `<p><strong>Issued by:</strong> ${voucher.issued_by.name}</p>` : ''}
            </div>
            <div class="footer">
              <p>Present this voucher at any participating local shop</p>
              <p>For assistance, contact BAK UP support</p>
            </div>
          </div>
          <script>window.print(); window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const loadRecipientShops = async (town = 'all') => {
    console.log('[TOWN FILTER] loadRecipientShops called with town:', town);
    try {
      const url = town && town !== 'all' ? `/recipient/shops?town=${encodeURIComponent(town)}` : '/recipient/shops'
      const data = await apiCall(url)
      setShops(data.shops || [])
    } catch (error) {
      console.error('Failed to load shops:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/recipient/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load Food to Go Items:', error)
    }
  }

  const loadCart = async () => {
    try {
      const data = await apiCall('/cart')
      setCart(data.cart || [])
      setCartCount(data.cart ? data.cart.length : 0)
    } catch (error) {
      console.error('Failed to load cart:', error)
    }
  }

  const addToCart = async (itemId) => {
    try {
      await apiCall('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, quantity: 1 })
      })
      await loadCart()
      alert(t('alerts.itemAddedToCart'))
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert(t('alerts.failedToAddToCart') + ' ' + error.message)
    }
  }

  const removeFromCart = async (cartId) => {
    try {
      await apiCall(`/cart/remove/${cartId}`, { method: 'DELETE' })
      await loadCart()
      alert(t('alerts.itemRemoved'))
    } catch (error) {
      console.error('Failed to remove from cart:', error)
      alert(t('alerts.failedToRemove') + ' ' + error.message)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#9C27B0', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <NotificationBell apiCall={apiCall} userType="recipient" />
          <LanguageSelector />
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#1976d2'}}>🔒 {t('common.password')}</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.myVouchers')}</button>
          <button onClick={() => setActiveTab('shops')} style={activeTab === 'shops' ? styles.activeTab : styles.tab}>{t('dashboard.participatingShops')}</button>
          <button onClick={() => setActiveTab('discounted')} style={activeTab === 'discounted' ? styles.activeTab : styles.tab}>🎁 Discounted Items</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.browseToGo')}</button>
          <button onClick={() => setActiveTab('history')} style={activeTab === 'history' ? styles.activeTab : styles.tab}>📜 {t('dashboard.voucherHistory')}</button>
          <button onClick={() => setActiveTab('cart')} style={{...(activeTab === 'cart' ? styles.activeTab : styles.tab), position: 'relative'}}>
            🛒 {t('dashboard.shoppingCart')}
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>{cartCount}</span>
            )}
          </button>
        </div>
        
        {activeTab === 'vouchers' && (
          <div>
            <h2>💳 {t('dashboard.myVouchers')}</h2>
            
            {/* Search and Filter Bar */}
            <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>🔍 Search Vouchers</label>
                  <input
                    type="text"
                    placeholder="Search by code..."
                    value={recipientVoucherSearch || ''}
                    onChange={(e) => setRecipientVoucherSearch(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>📋 Status Filter</label>
                  <select
                    value={recipientVoucherStatus || 'all'}
                    onChange={(e) => setRecipientVoucherStatus(e.target.value)}
                    style={{...styles.input, width: '100%'}}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-end'}}>
                  <button
                    onClick={() => {
                      setRecipientVoucherSearch('')
                      setRecipientVoucherStatus('all')
                    }}
                    style={{...styles.secondaryButton, width: '100%'}}
                  >
                    ✖️ Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            {voucherSummary && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                <div style={{backgroundColor: '#4CAF50', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold'}}>£{voucherSummary.total_active_value.toFixed(2)}</div>
                  <div>{t('dashboard.activeBalance')}</div>
                </div>
                <div style={{backgroundColor: '#2196F3', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold'}}>{voucherSummary.active_count}</div>
                  <div>{t('dashboard.activeVouchers')}</div>
                </div>
                <div style={{backgroundColor: '#FF9800', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold'}}>{voucherSummary.redeemed_count}</div>
                  <div>{t('dashboard.redeemed')}</div>
                </div>
              </div>
            )}

            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {vouchers.length === 0 ? (
                <p>{t('recipient.noVouchersAvailable')}</p>
              ) : (
                <div style={{display: 'grid', gap: '20px'}}>
                  {vouchers
                    .filter(voucher => {
                      // Status filter
                      if (recipientVoucherStatus !== 'all' && voucher.status !== recipientVoucherStatus) return false
                      // Search filter
                      if (recipientVoucherSearch) {
                        return voucher.code.toLowerCase().includes(recipientVoucherSearch.toLowerCase())
                      }
                      return true
                    })
                    .map(voucher => (
                    <div key={voucher.id} style={{
                      padding: '25px',
                      border: `3px solid ${voucher.status === 'active' ? '#4CAF50' : '#ccc'}`,
                      borderRadius: '15px',
                      backgroundColor: voucher.status === 'active' ? '#f1f8f4' : '#f5f5f5'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px'}}>
                        <div style={{flex: 1, minWidth: '250px'}}>
                          <div style={{fontSize: '42px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '10px'}}>
                            £{voucher.value}
                          </div>
                          <div style={{fontSize: '18px', marginBottom: '5px'}}>
                            <strong>{t('recipient.code')}</strong> <span style={{backgroundColor: '#fff', padding: '5px 10px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '16px'}}>{voucher.code}</span>
                          </div>
                          <div style={{marginBottom: '5px'}}>
                            <strong>{t('recipient.status')}</strong> <span style={{
                              color: voucher.status === 'active' ? '#4CAF50' : voucher.status === 'redeemed' ? '#FF9800' : '#666',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>{voucher.status}</span>
                          </div>
                          <div style={{marginBottom: '5px'}}>
                            <strong>{t('recipient.expires')}</strong> {new Date(voucher.expiry_date).toLocaleDateString()}
                          </div>
                          {voucher.issued_by && (
                            <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                              <strong>{t('recipient.issuedBy')}</strong> {voucher.issued_by.name}
                            </div>
                          )}
                          {voucher.redeemed_at && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                              <strong>{t('recipient.redeemed')}</strong> {new Date(voucher.redeemed_at).toLocaleDateString()}
                              {voucher.redeemed_by && ` ${t('recipient.at')} ${voucher.redeemed_by.name}`}
                            </div>
                          )}
                        </div>
                        
                        {voucher.status === 'active' && (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <button 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setShowPrint(true)
                              }}
                              style={{
                                ...styles.primaryButton,
                                padding: '10px 20px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              🖨️ {t('recipient.printVoucher')}
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setShowQR(true)
                              }}
                              style={{
                                ...styles.primaryButton,
                                backgroundColor: '#2196F3',
                                padding: '10px 20px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              📱 {t('recipient.showQRCode')}
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/vcse/voucher-pdf/${voucher.id}`, {
                                    credentials: 'include'
                                  })
                                  if (!response.ok) throw new Error('Failed to download PDF')
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `voucher_${voucher.code}.pdf`
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  document.body.removeChild(a)
                                } catch (error) {
                                  alert('Failed to download PDF: ' + error.message)
                                }
                              }}
                              style={{
                                ...styles.primaryButton,
                                backgroundColor: '#FF5722',
                                padding: '10px 20px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              📄 Download PDF
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/recipient/vouchers/${voucher.id}/resend-sms`, {
                                    method: 'POST',
                                    credentials: 'include'
                                  })
                                  const data = await response.json()
                                  if (!response.ok) throw new Error(data.error || 'Failed to send SMS')
                                  alert('✅ SMS sent successfully!')
                                } catch (error) {
                                  alert('Failed to send SMS: ' + error.message)
                                }
                              }}
                              style={{
                                ...styles.primaryButton,
                                backgroundColor: '#9C27B0',
                                padding: '10px 20px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              💬 Resend SMS
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showQR && selectedVoucher && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '20px',
                  textAlign: 'center',
                  maxWidth: '500px'
                }}>
                  <h2 style={{marginBottom: '20px'}}>{t('recipient.scanToRedeem')}</h2>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '20px'}}>
                    £{selectedVoucher.value}
                  </div>
                  <div style={{marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px'}}>
                    <div style={{fontSize: '24px', fontFamily: 'monospace', letterSpacing: '3px'}}>
                      {selectedVoucher.code}
                    </div>
                  </div>
                  <div style={{marginBottom: '20px', fontSize: '14px', color: '#666'}}>
                    {t('recipient.presentCode')}
                  </div>
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                    <div style={{padding: '20px', backgroundColor: 'white', border: '2px solid #4CAF50', borderRadius: '10px'}}>
                      <QRCodeSVG 
                        value={selectedVoucher.code} 
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowQR(false)
                      setSelectedVoucher(null)
                    }}
                    style={{...styles.primaryButton, backgroundColor: '#666'}}
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Print Voucher Modal */}
            {showPrint && selectedVoucher && (
              <VoucherPrint 
                voucher={selectedVoucher}
                onClose={() => {
                  setShowPrint(false)
                  setSelectedVoucher(null)
                }}
              />
            )}
          </div>
        )}
        
        {activeTab === 'shops' && (
          <div>
            <h2>🏪 {t('dashboard.participatingShops')} ({shops.length})</h2>
            
            {/* Town Filter Dropdown */}
            <div style={{marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '10px'}}>
              <label style={{fontWeight: 'bold', marginRight: '10px', color: '#9C27B0'}}>📍 Filter by Town:</label>
              <select 
                value={townFilter} 
                onChange={(e) => {
                  console.log('[TOWN FILTER] Dropdown changed to:', e.target.value);
                  setTownFilter(e.target.value);
                  console.log('[TOWN FILTER] setTownFilter called with:', e.target.value);
                }}
                style={{
                  padding: '10px 15px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '2px solid #9C27B0',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer',
                  minWidth: '250px'
                }}
              >
                <option value="all">All Towns</option>
                <optgroup label="North Northamptonshire">
                  <option value="Wellingborough">Wellingborough</option>
                  <option value="Kettering">Kettering</option>
                  <option value="Corby">Corby</option>
                </optgroup>
                <optgroup label="East Northamptonshire">
                  <option value="Rushden">Rushden</option>
                  <option value="Higham Ferrers">Higham Ferrers</option>
                  <option value="Raunds">Raunds</option>
                  <option value="Irthlingborough">Irthlingborough</option>
                  <option value="Oundle">Oundle</option>
                  <option value="Thrapston">Thrapston</option>
                </optgroup>
                <optgroup label="West Northamptonshire">
                  <option value="Northampton">Northampton</option>
                  <option value="Daventry">Daventry</option>
                  <option value="Brackley">Brackley</option>
                  <option value="Towcester">Towcester</option>
                </optgroup>
              </select>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {shops.length === 0 ? (
                <p>{t('recipient.noShopsAvailable')}</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                  {shops.map(shop => (
                    <div key={shop.id} style={{padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      <h3 style={{margin: '0 0 10px 0', color: '#9C27B0'}}>{shop.shop_name}</h3>
                      {shop.town && (
                        <p style={{margin: '5px 0', fontSize: '13px', color: '#666', fontWeight: 'bold'}}>
                          📍 {shop.town}
                        </p>
                      )}
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>📍 {t('recipient.address')}</strong> {shop.address}, {shop.city} {shop.postcode}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>📞 {t('recipient.phone')}</strong> {shop.phone}
                      </p>
                      <p style={{margin: '10px 0 0 0', padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px', fontWeight: 'bold', color: '#9C27B0'}}>
                        🍎 {t('recipient.availableToGo')} {shop.to_go_items_count}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>🍎 {t('dashboard.browseToGo')} ({toGoItems.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <p>{t('dashboard.noToGoItems')}</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px'}}>
                  {toGoItems.map(item => (
                    <div key={item.id} style={{padding: '20px', border: '2px solid #9C27B0', borderRadius: '10px', backgroundColor: '#f3e5f5'}}>
                      <h3 style={{margin: '0 0 10px 0', color: '#9C27B0'}}>{item.item_name}</h3>
                      <p style={{margin: '8px 0', fontSize: '16px', fontWeight: 'bold', color: '#4CAF50'}}>
                        💰 £{item.price.toFixed(2)} per {item.unit}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>{t('recipient.available')}</strong> {item.quantity} {item.unit}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>{t('recipient.category')}</strong> {item.category}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>{t('recipient.description')}</strong> {item.description || t('recipient.freshReady')}
                      </p>
                      <div style={{marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0'}}>
                        <p style={{margin: '3px 0', fontSize: '14px', fontWeight: 'bold', color: '#1976d2'}}>
                          🏪 {item.shop_name}
                        </p>
                        <p style={{margin: '3px 0', fontSize: '13px'}}>
                          📍 {item.shop_address}
                        </p>
                        <p style={{margin: '3px 0', fontSize: '13px'}}>
                          📞 {item.shop_phone}
                        </p>
                      </div>
                      <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <button 
                          onClick={() => addToCart(item.id)}
                          style={{
                            ...styles.primaryButton,
                            backgroundColor: '#4CAF50',
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                         🛍️ {t('recipient.addToCart')}
                        </button>
                        <p style={{fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center', margin: 0}}>
                          💳 {t('recipient.useVoucher')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'cart' && (
          <div>
            <h2>🛒 {t('dashboard.shoppingCart')} ({cartCount})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {cart.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <p style={{fontSize: '18px', color: '#666'}}>{t('dashboard.emptyCart')}</p>
                  <button 
                    onClick={() => setActiveTab('togo')}
                    style={{...styles.primaryButton, marginTop: '20px'}}
                  >
                    {t('dashboard.browseToGo')}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{marginBottom: '20px'}}>
                    <h3 style={{marginBottom: '15px'}}>{t('cart.itemsInCart')}</h3>
                    <div style={{display: 'grid', gap: '15px'}}>
                      {cart.map(cartItem => (
                        <div key={cartItem.cart_id} style={{
                          padding: '20px',
                          border: '2px solid #4CAF50',
                          borderRadius: '10px',
                          backgroundColor: '#f1f8f4',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '15px'
                        }}>
                          <div style={{flex: 1, minWidth: '250px'}}>
                            <h3 style={{margin: '0 0 10px 0', color: '#2e7d32'}}>{cartItem.item.name}</h3>
                            <p style={{margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#4CAF50'}}>
                              💰 £{cartItem.item.price.toFixed(2)} per {cartItem.item.unit}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              <strong>{t('cart.quantityInCart')}</strong> {cartItem.quantity}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              <strong>{t('recipient.category')}</strong> {cartItem.item.category}
                            </p>
                            <div style={{marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '5px'}}>
                              <p style={{margin: '3px 0', fontSize: '14px', fontWeight: 'bold', color: '#1976d2'}}>
                                🏪 {cartItem.shop.name}
                              </p>
                              <p style={{margin: '3px 0', fontSize: '13px'}}>
                                📍 {cartItem.shop.address}
                              </p>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => removeFromCart(cartItem.cart_id)}
                              style={{
                                ...styles.primaryButton,
                                backgroundColor: '#f44336',
                                padding: '10px 20px'
                              }}
                            >
                              🗑️ {t('cart.remove')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '10px',
                    border: '2px solid #2196F3'
                  }}>
                    <h3 style={{margin: '0 0 15px 0', color: '#1565c0'}}>{t('cart.nextSteps')}</h3>
                    <ol style={{margin: 0, paddingLeft: '20px'}}>
                      <li style={{marginBottom: '10px'}}>{t('cart.step1')}</li>
                      <li style={{marginBottom: '10px'}}>{t('cart.step2')}</li>
                      <li style={{marginBottom: '10px'}}>{t('cart.step3')}</li>
                      <li>{t('cart.step4')}</li>
                    </ol>
                    <div style={{marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                      <button
                        onClick={() => setActiveTab('vouchers')}
                        style={{...styles.primaryButton, backgroundColor: '#2196F3'}}
                      >
                        {t('cart.viewVouchers')}
                      </button>
                      <button
                        onClick={() => setActiveTab('togo')}
                        style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}
                      >
                        {t('cart.continueShopping')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'discounted' && (
          <div>
            <h2>🎁 Food To Go at a Discount</h2>
            
            {discountedItems.length === 0 ? (
              <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center'}}>
                <p style={{color: '#666', marginBottom: '20px'}}>
                  {user.preferred_shop_id ? 
                    'No discounted items available at your selected shop right now. Check back later!' :
                    'Please select a shop first to view discounted items.'}
                </p>
                {!user.preferred_shop_id && (
                  <button
                    onClick={() => setActiveTab('shops')}
                    style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}
                  >
                    Browse Shops
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p style={{marginBottom: '20px', color: '#666'}}>
                  Browse discounted food items from your selected shop. These items are offered at reduced prices!
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                  {discountedItems.map(item => (
                    <div key={item.id} style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '2px solid #4CAF50',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                        <h3 style={{margin: 0, color: '#333', fontSize: '18px'}}>{item.item_name}</h3>
                        <span style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          SAVE £{item.savings.toFixed(2)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p style={{margin: '10px 0', color: '#666', fontSize: '14px'}}>{item.description}</p>
                      )}
                      
                      <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                          <div>
                            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>
                              £{item.price.toFixed(2)}
                            </div>
                            <div style={{fontSize: '14px', color: '#999', textDecoration: 'line-through'}}>
                              Was £{item.original_price.toFixed(2)}
                            </div>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <div style={{fontSize: '14px', color: '#666'}}>
                              Qty: {item.quantity} {item.unit}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                          🏪 {item.shop_name}<br/>
                          📍 {item.shop_town}
                        </div>
                        
                        {item.available_until && (
                          <div style={{marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '5px', fontSize: '12px', color: '#856404'}}>
                            ⏰ Available until {new Date(item.available_until).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div>
            <h2>📜 {t('dashboard.voucherHistory')}</h2>
            
            {/* Filter Bar */}
            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
              <input
                type="text"
                placeholder={t('dashboard.searchByCode')}
                value={voucherHistorySearch}
                onChange={(e) => setVoucherHistorySearch(e.target.value)}
                style={{flex: 1, minWidth: '200px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
              />
              <select
                value={voucherHistoryFilter}
                onChange={(e) => setVoucherHistoryFilter(e.target.value)}
                style={{padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
              >
                <option value="all">{t('dashboard.allVouchers')}</option>
                <option value="active">{t('dashboard.activeVouchers')}</option>
                <option value="redeemed">{t('dashboard.redeemedVouchers')}</option>
                <option value="expired">{t('dashboard.expiredVouchers')}</option>
              </select>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {(() => {
                const filteredHistory = vouchers
                  .filter(v => {
                    if (voucherHistoryFilter !== 'all' && v.status !== voucherHistoryFilter) return false
                    if (voucherHistorySearch && !v.code.toLowerCase().includes(voucherHistorySearch.toLowerCase())) return false
                    return true
                  })
                  .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                
                return filteredHistory.length === 0 ? (
                  <p>{t('dashboard.noVouchersFound')}</p>
                ) : (
                  <div style={{display: 'grid', gap: '15px'}}>
                    {filteredHistory.map(voucher => (
                      <div key={voucher.id} style={{
                        padding: '20px',
                        border: `2px solid ${voucher.status === 'active' ? '#4CAF50' : voucher.status === 'redeemed' ? '#2196F3' : '#757575'}`,
                        borderRadius: '10px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                          <div>
                            <h3 style={{margin: '0 0 10px 0', color: '#1976d2'}}>£{voucher.value.toFixed(2)}</h3>
                            <p style={{margin: '5px 0'}}><strong>{t('recipient.code')}:</strong> {voucher.code}</p>
                            <p style={{margin: '5px 0'}}>
                              <strong>{t('recipient.status')}:</strong>{' '}
                              <span style={{
                                color: voucher.status === 'active' ? '#2e7d32' : voucher.status === 'redeemed' ? '#1976d2' : '#757575',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                              }}>
                                {voucher.status}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px'}}>
                          <p style={{margin: '5px 0'}}><strong>{t('recipient.issuedBy')}:</strong> {voucher.issued_by?.organization || 'N/A'}</p>
                          <p style={{margin: '5px 0'}}><strong>{t('recipient.expiry')}:</strong> {new Date(voucher.expiry_date).toLocaleDateString()}</p>
                          {voucher.redeemed_at && (
                            <p style={{margin: '5px 0'}}><strong>{t('recipient.redeemedOn')}:</strong> {new Date(voucher.redeemed_at).toLocaleDateString()}</p>
                          )}
                          {voucher.redeemed_at && voucher.shop && (
                            <p style={{margin: '5px 0'}}><strong>{t('recipient.redeemedAt')}:</strong> {voucher.shop.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
      
      {/* Shop Selection Modal */}
      {showShopSelection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{marginBottom: '10px', color: '#4CAF50'}}>🏪 Select Your Preferred Shop</h2>
            <p style={{marginBottom: '30px', color: '#666'}}>
              Please select a shop where you'd like to use your voucher for discounted food items.
            </p>
            
            <div style={{display: 'grid', gap: '15px'}}>
              {shops.map(shop => (
                <div
                  key={shop.id}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/recipient/select-shop', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          voucher_code: shopSelectionVoucherCode,
                          shop_id: shop.id
                        })
                      })
                      const data = await response.json()
                      if (!response.ok) throw new Error(data.error || 'Failed to select shop')
                      
                      alert(`✅ Shop selected successfully! You can now browse discounted items from ${shop.shop_name}.`)
                      setShowShopSelection(false)
                      loadDiscountedItems()
                    } catch (error) {
                      alert('Failed to select shop: ' + error.message)
                    }
                  }}
                  style={{
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f5e9'
                    e.currentTarget.style.borderColor = '#4CAF50'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <h3 style={{margin: '0 0 10px 0', color: '#333'}}>{shop.shop_name}</h3>
                  <p style={{margin: '5px 0', color: '#666', fontSize: '14px'}}>
                    📍 {shop.address}, {shop.town} {shop.postcode}
                  </p>
                  {shop.phone && (
                    <p style={{margin: '5px 0', color: '#666', fontSize: '14px'}}>
                      📞 {shop.phone}
                    </p>
                  )}
                  {shop.category && (
                    <p style={{margin: '5px 0', color: '#4CAF50', fontSize: '14px', fontWeight: 'bold'}}>
                      🏷️ {shop.category}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// SCHOOL/CARE ORGANIZATION DASHBOARD
function SchoolDashboard({ user, onLogout }) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [balance, setBalance] = useState(0)
  const [vouchers, setVouchers] = useState([])
  const [organizationName, setOrganizationName] = useState('')
  const [toGoItems, setToGoItems] = useState([])
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [allocatedBalance, setAllocatedBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [walletStats, setWalletStats] = useState({
    total_credits: 0,
    total_debits: 0,
    voucher_stats: {
      total_issued: 0,
      total_value: 0,
      active_value: 0,
      redeemed_value: 0
    }
  })
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [fundsDescription, setFundsDescription] = useState('')
  
  // Issue voucher form state
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientFirstName, setRecipientFirstName] = useState('')
  const [recipientLastName, setRecipientLastName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [voucherAmount, setVoucherAmount] = useState('')
  const [message, setMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [assignShopMethod, setAssignShopMethod] = useState('none')
  const [specificShopId, setSpecificShopId] = useState('')
  
  // Voucher orders tab state
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadBalance()
    loadVouchers()
    loadToGoItems()
    loadWalletBalance()
    loadTransactions()
  }, [])

  const loadBalance = async () => {
    try {
      const data = await apiCall('/school/balance')
      setBalance(data.allocated_balance || 0)
      setOrganizationName(data.organization_name || '')
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  }

  const loadVouchers = async () => {
    try {
      const data = await apiCall('/school/vouchers')
      setVouchers(data.vouchers || [])
    } catch (error) {
      console.error('Failed to load vouchers:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/school/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load Food to Go Items:', error)
      // Fallback to admin endpoint if school endpoint doesn't exist
      try {
        const fallbackData = await apiCall('/admin/to-go-items')
        setToGoItems(fallbackData.items || [])
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    }
  }

  const loadWalletBalance = async () => {
    try {
      const data = await apiCall('/school/wallet/balance')
      setWalletBalance(data.current_balance || 0)
      setAllocatedBalance(data.allocated_balance || 0)
      setWalletStats(data)
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await apiCall('/school/wallet/transactions?limit=50')
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const data = await apiCall('/school/wallet/add-funds', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(addFundsAmount),
          payment_method: 'manual',
          payment_reference: paymentReference,
          description: fundsDescription || 'Funds added to wallet'
        })
      })
      
      setMessage(`✅ ${data.message}! New balance: £${data.new_balance.toFixed(2)}`)
      setAddFundsAmount('')
      setPaymentReference('')
      setFundsDescription('')
      
      // Reload wallet data
      loadWalletBalance()
      loadTransactions()
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    }
  }

  const handleIssueVoucher = async (e) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const data = await apiCall('/school/issue-voucher', {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: recipientEmail,
          recipient_first_name: recipientFirstName,
          recipient_last_name: recipientLastName,
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress,
          amount: parseFloat(voucherAmount),
          assign_shop_method: assignShopMethod || 'none',
          specific_shop_id: assignShopMethod === 'specific_shop' ? parseInt(specificShopId) : null
        })
      })
      
      // Handle both single and multiple voucher responses
      if (data.num_vouchers && data.num_vouchers > 1) {
        setMessage(`✅ ${data.num_vouchers} ${t('messages.vouchersIssuedSuccess')} ${t('messages.totalValue', 'Total')}: £${data.total_amount.toFixed(2)} (split into vouchers of £50 or less)`)
      } else if (data.voucher_codes && data.voucher_codes.length > 0) {
        setMessage(`✅ Voucher issued successfully! Code: ${data.voucher_codes[0]}`)
      } else if (data.voucher_code) {
        setMessage(`✅ Voucher issued successfully! Code: ${data.voucher_code}`)
      } else {
        setMessage(`✅ Voucher(s) issued successfully!`)
      }
      setRecipientEmail('')
      setRecipientFirstName('')
      setRecipientLastName('')
      setRecipientPhone('')
      setRecipientAddress('')
      setVoucherAmount('')
      loadBalance()
      loadVouchers()
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      {/* Header */}
      <div style={{backgroundColor: '#9C27B0', color: 'white', padding: '20px'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{margin: '0 0 5px 0'}}>School/Care Organization Portal</h1>
            <p style={{margin: 0, opacity: 0.9}}>Welcome, {organizationName || user.name}</p>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <NotificationBell apiCall={apiCall} userType="school" />
            <select 
              value={i18n.language} 
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: '2px solid white',
                backgroundColor: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="ar">🇸🇦 العربية</option>
              <option value="ro">🇷🇴 Română</option>
              <option value="pl">🇵🇱 Polski</option>
            </select>
            <button onClick={() => setShowPasswordModal(true)} style={{...styles.secondaryButton, borderColor: 'white'}}>🔒 Password</button>
            <button onClick={onLogout} style={{...styles.secondaryButton, borderColor: 'white'}}>Logout</button>
          </div>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}

      {/* Main Content */}
      <div style={{maxWidth: '1200px', margin: '30px auto', padding: '0 20px'}}>
        {/* Tabs */}
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button 
            onClick={() => setActiveTab('overview')} 
            style={activeTab === 'overview' ? styles.activeTab : styles.tab}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('issue')} 
            style={activeTab === 'issue' ? styles.activeTab : styles.tab}
          >
            Issue Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')} 
            style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}
          >
            {t('dashboard.voucherHistory')}
          </button>
          <button 
            onClick={() => setActiveTab('togo')} 
            style={activeTab === 'togo' ? styles.activeTab : styles.tab}
          >
            🛒️ {t('tabs.foodToGo')}
          </button>
          <button 
            onClick={() => setActiveTab('wallet')} 
            style={activeTab === 'wallet' ? styles.activeTab : styles.tab}
          >
            💰 Wallet Management
          </button>
          <button 
            onClick={() => setActiveTab('payment')} 
            style={activeTab === 'payment' ? styles.activeTab : styles.tab}
          >
            💳 {t('tabs.loadFunds')}
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            style={activeTab === 'orders' ? styles.activeTab : styles.tab}
          >
            📋 {t('tabs.voucherOrders')}
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            style={activeTab === 'reports' ? styles.activeTab : styles.tab}
          >
            📈 {t('tabs.reports')}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px'}}>
              <h2 style={{marginTop: 0, color: '#9C27B0'}}>Available Balance</h2>
              <div style={{fontSize: '48px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '10px'}}>
                £{balance.toFixed(2)}
              </div>
              <p style={{color: '#666', fontSize: '14px', marginBottom: 0}}>
                💡 This balance is allocated by BAK UP administrators to support families in your community
              </p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#9C27B0'}}>{vouchers.length}</div>
                <div style={{color: '#666', marginTop: '5px'}}>Total Vouchers Issued</div>
              </div>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50'}}>
                  {vouchers.filter(v => v.status === 'active').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Active Vouchers</div>
              </div>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#FF9800'}}>
                  {vouchers.filter(v => v.status === 'redeemed').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Redeemed Vouchers</div>
              </div>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#F44336'}}>
                  {vouchers.filter(v => v.status === 'expired').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Expired Vouchers</div>
              </div>
              <div 
                onClick={() => setActiveTab('vouchers')}
                style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}}
              >
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#2196F3'}}>
                  {vouchers.filter(v => v.status === 'reassigned').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Reissued Vouchers</div>
              </div>
            </div>

            <div style={{backgroundColor: '#E1BEE7', padding: '20px', borderRadius: '10px', marginTop: '20px'}}>
              <h3 style={{marginTop: 0, color: '#6A1B9A'}}>🎓 Supporting Families Through Education & Care</h3>
              <p style={{margin: '10px 0', lineHeight: '1.6'}}>
                Welcome to the <strong>Northamptonshire Community E-Voucher Scheme</strong>, led by BAK UP CIC. As a school or care organisation, you play a vital role in identifying and supporting families from underrepresented communities.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6'}}>
                Use your allocated balance to issue e-vouchers directly to families, giving them <strong>dignity and choice</strong> in accessing culturally appropriate food and essentials from local participating shops. Every voucher you issue supports both families in need and strengthens our local economy.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6', fontSize: '0.95em', opacity: 0.9}}>
                💡 Our scheme replaces traditional food parcels with flexible vouchers, respecting dietary preferences and ensuring families can choose what they truly need.
              </p>
            </div>
          </div>
        )}

        {/* Issue Vouchers Tab */}
        {activeTab === 'issue' && (
          <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px'}}>
            <h2 style={{marginTop: 0, color: '#9C27B0'}}>Issue E-Voucher to Family</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Available Balance: <strong>£{balance.toFixed(2)}</strong>
            </p>

            {message && (
              <div style={{
                backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                color: message.includes('✅') ? '#2e7d32' : '#c62828',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleIssueVoucher}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name</label>
                  <input
                    type="text"
                    value={recipientFirstName}
                    onChange={(e) => setRecipientFirstName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Last Name</label>
                  <input
                    type="text"
                    value={recipientLastName}
                    onChange={(e) => setRecipientLastName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email Address</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone Number</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  style={styles.input}
                  required
                  placeholder="Full address including postcode"
                />
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Voucher Amount (£)</label>
                <select
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  style={styles.input}
                  required
                >
                  <option value="">Select amount</option>
                  <option value="10">£10</option>
                  <option value="20">£20</option>
                  <option value="30">£30</option>
                  <option value="40">£40</option>
                  <option value="50">£50</option>
                  <option value="75">£75</option>
                  <option value="100">£100</option>
                  <option value="150">£150</option>
                  <option value="200">£200</option>
                  <option value="custom">Custom amount</option>
                </select>
                {voucherAmount === 'custom' && (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    placeholder="Enter custom amount"
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    style={{...styles.input, marginTop: '10px'}}
                    required
                  />
                )}
              </div>
              
              <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#1976d2'}}>
                  🎁 Food To Go at a Discount - Shop Assignment
                </label>
                <select
                  value={assignShopMethod}
                  onChange={(e) => setAssignShopMethod(e.target.value)}
                  style={styles.input}
                >
                  <option value="none">No shop assignment (regular voucher)</option>
                  <option value="recipient_choice">Recipient to choose shop</option>
                  <option value="specific_shop">Assign specific shop</option>
                </select>
                <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                  Choose how the shop will be assigned for discounted food items
                </small>
                
                {assignShopMethod === 'specific_shop' && (
                  <div style={{marginTop: '10px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Select Shop</label>
                    <select
                      value={specificShopId}
                      onChange={(e) => setSpecificShopId(e.target.value)}
                      style={styles.input}
                      required
                    >
                      <option value="">-- Select a shop --</option>
                      {toGoItems.length > 0 && [...new Set(toGoItems.map(item => JSON.stringify({id: item.shop_id, name: item.shop_name, town: item.shop_town})))].map(shopStr => {
                        const shop = JSON.parse(shopStr)
                        return (
                          <option key={shop.id} value={shop.id}>
                            {shop.name} - {shop.town}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" style={{...styles.primaryButton, backgroundColor: '#9C27B0', width: '100%'}}>
                Issue Voucher
              </button>
            </form>
          </div>
        )}

        {/* Voucher History Tab */}
        {activeTab === 'vouchers' && (
          <div>
            <h2 style={{marginBottom: '20px', color: '#9C27B0'}}>{t('dashboard.voucherHistory')}</h2>
            {vouchers.length === 0 ? (
              <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center'}}>
                <p style={{color: '#666'}}>No vouchers issued yet</p>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '15px'}}>
                {vouchers.map(voucher => (
                  <div key={voucher.id} style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                      <div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '5px'}}>
                          £{voucher.value.toFixed(2)}
                        </div>
                        <div style={{fontSize: '14px', color: '#666'}}>Code: {voucher.code}</div>
                      </div>
                      <div style={{
                        padding: '5px 15px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: voucher.status === 'active' ? '#e8f5e9' : voucher.status === 'redeemed' ? '#fff3e0' : '#ffebee',
                        color: voucher.status === 'active' ? '#2e7d32' : voucher.status === 'redeemed' ? '#e65100' : '#c62828'
                      }}>
                        {voucher.status.toUpperCase()}
                      </div>
                    </div>
                    <div style={{borderTop: '1px solid #e0e0e0', paddingTop: '15px'}}>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Recipient:</strong> {voucher.recipient_name}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Email:</strong> {voucher.recipient_email}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Phone:</strong> {voucher.recipient_phone}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Address:</strong> {voucher.recipient_address}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                        <strong>Issued:</strong> {new Date(voucher.created_at).toLocaleDateString()}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px', color: voucher.status === 'expired' ? '#F44336' : '#666'}}>
                        <strong>Expires:</strong> {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Food to Go Items Tab */}
        {activeTab === 'togo' && (
          <div>
            <h2 style={{marginBottom: '10px', color: '#9C27B0'}}>🛍️ Available Food to Go Items</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>Browse surplus Food to Go Items from local shops and order them for families in your community.</p>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No Food to Go Items available at the moment</p>
                  <p style={{fontSize: '14px'}}>Check back later for surplus Food to Go Items from local food shops</p>
                </div>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {toGoItems.map(item => (
                    <SchoolToGoOrderCard key={item.id} item={item} onOrderPlaced={loadToGoItems} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Management Tab */}
        {activeTab === 'wallet' && (
          <div>
            {/* Wallet Overview Cards */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>💰 Current Wallet Balance</div>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50'}}>
                  £{walletBalance.toFixed(2)}
                </div>
                <div style={{fontSize: '12px', color: '#999', marginTop: '5px'}}>
                  Available for voucher issuance
                </div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>📊 Total Credits</div>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#2196F3'}}>
                  £{walletStats.total_credits.toFixed(2)}
                </div>
                <div style={{fontSize: '12px', color: '#999', marginTop: '5px'}}>
                  Funds added to wallet
                </div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>💸 Total Debits</div>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#FF9800'}}>
                  £{walletStats.total_debits.toFixed(2)}
                </div>
                <div style={{fontSize: '12px', color: '#999', marginTop: '5px'}}>
                  Spent on vouchers
                </div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>🎫 Vouchers Issued</div>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#9C27B0'}}>
                  {walletStats.voucher_stats.total_issued}
                </div>
                <div style={{fontSize: '12px', color: '#999', marginTop: '5px'}}>
                  £{walletStats.voucher_stats.total_value.toFixed(2)} total value
                </div>
              </div>
            </div>

            {/* Add Funds Section - Payment Integration */}
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{marginTop: 0, color: '#9C27B0'}}>💰 Load Funds to Wallet</h3>
              <p style={{color: '#666', marginBottom: '20px'}}>
                Add funds to your wallet using a debit or credit card. Funds will be available immediately after payment.
              </p>
              
              <div style={{padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px'}}>
                  <div style={{fontSize: '48px'}}>💳</div>
                  <div>
                    <div style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '5px'}}>Secure Payment Required</div>
                    <div style={{fontSize: '14px', color: '#666'}}>All funds must be paid for via debit/credit card before being credited to your wallet</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveTab('payment')}
                  style={{
                    ...styles.primaryButton,
                    width: '100%',
                    backgroundColor: '#4CAF50',
                    fontSize: '16px',
                    padding: '15px'
                  }}
                >
                  💳 Go to Payment Page
                </button>
              </div>
              
              <div style={{padding: '15px', backgroundColor: '#E3F2FD', borderRadius: '5px', fontSize: '14px'}}>
                💡 <strong>How it works:</strong>
                <ul style={{marginTop: '10px', marginBottom: '0', paddingLeft: '20px'}}>
                  <li>Click "Go to Payment Page" above</li>
                  <li>Enter the amount you want to load (£1 - £10,000)</li>
                  <li>Complete payment with your debit or credit card</li>
                  <li>Funds will be credited to your wallet immediately</li>
                  <li>Use your wallet balance to issue vouchers to families</li>
                </ul>
              </div>
            </div>

            {/* Transaction History */}
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{marginTop: 0, color: '#9C27B0'}}>📜 Transaction History</h3>
              {transactions.length === 0 ? (
                <p style={{textAlign: 'center', color: '#999', padding: '40px 0'}}>
                  {t('messages.noTransactionsYet')}
                </p>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                        <th style={{padding: '12px', textAlign: 'left'}}>Date</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Type</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Description</th>
                        <th style={{padding: '12px', textAlign: 'right'}}>Amount</th>
                        <th style={{padding: '12px', textAlign: 'right'}}>Balance After</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '12px'}}>
                            {new Date(txn.created_at).toLocaleDateString('en-GB')}
                            <br />
                            <span style={{fontSize: '12px', color: '#999'}}>
                              {new Date(txn.created_at).toLocaleTimeString('en-GB')}
                            </span>
                          </td>
                          <td style={{padding: '12px'}}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: txn.transaction_type === 'credit' ? '#E8F5E9' : txn.transaction_type === 'debit' ? '#FFEBEE' : '#E3F2FD',
                              color: txn.transaction_type === 'credit' ? '#4CAF50' : txn.transaction_type === 'debit' ? '#F44336' : '#2196F3'
                            }}>
                              {txn.transaction_type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{padding: '12px'}}>
                            {txn.description}
                            {txn.reference && (
                              <div style={{fontSize: '12px', color: '#999'}}>
                                Ref: {txn.reference}
                              </div>
                            )}
                          </td>
                          <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', color: txn.transaction_type === 'credit' ? '#4CAF50' : '#F44336'}}>
                            {txn.transaction_type === 'credit' ? '+' : '-'}£{txn.amount.toFixed(2)}
                          </td>
                          <td style={{padding: '12px', textAlign: 'right'}}>
                            £{txn.balance_after.toFixed(2)}
                          </td>
                          <td style={{padding: '12px', textAlign: 'center'}}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: txn.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                              color: txn.status === 'completed' ? '#4CAF50' : '#FF9800'
                            }}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Payment/Load Funds Tab */}
        {activeTab === 'payment' && (
          <PaymentTab user={user} onBalanceUpdate={loadBalance} />
        )}
        
        {/* Voucher Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2>📋 {t('tabs.voucherOrders')}</h2>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <div style={{flex: '1', minWidth: '200px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Filter by Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    style={styles.input}
                  >
                    <option value="all">All Vouchers</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div style={{flex: '2', minWidth: '300px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code, recipient name, or email..."
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <strong>Total Vouchers: {vouchers.length}</strong>
                <a 
                  href="/api/school/export-vouchers" 
                  download
                  style={{...styles.primaryButton, textDecoration: 'none', display: 'inline-block', backgroundColor: '#2e7d32'}}
                >
                  📄 Export to Excel
                </a>
              </div>
              
              {vouchers.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No vouchers found matching your criteria</p>
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                        <th style={{padding: '12px', textAlign: 'left'}}>Code</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Recipient</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Email</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Phone</th>
                        <th style={{padding: '12px', textAlign: 'right'}}>Value</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Issued</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Expiry</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Redeemed</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map(voucher => (
                        <tr key={voucher.id} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '12px', fontFamily: 'monospace', fontWeight: 'bold'}}>{voucher.code}</td>
                          <td style={{padding: '12px'}}>{voucher.recipient_name}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{voucher.recipient_email}</td>
                          <td style={{padding: '12px'}}>{voucher.recipient_phone}</td>
                          <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#4CAF50'}}>£{voucher.value.toFixed(2)}</td>
                          <td style={{padding: '12px', textAlign: 'center'}}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: voucher.status === 'active' ? '#e8f5e9' : voucher.status === 'redeemed' ? '#e3f2fd' : '#ffebee',
                              color: voucher.status === 'active' ? '#2e7d32' : voucher.status === 'redeemed' ? '#1565c0' : '#c62828'
                            }}>
                              {voucher.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{new Date(voucher.created_at).toLocaleDateString()}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{new Date(voucher.expiry_date).toLocaleDateString()}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{voucher.redeemed_date ? new Date(voucher.redeemed_date).toLocaleDateString() : '-'}</td>
                          <td style={{padding: '12px', textAlign: 'center'}}>
                            <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                              <a 
                                href={`/api/school/voucher-pdf/${voucher.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{...styles.primaryButton, fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-block', backgroundColor: '#1976d2'}}
                              >
                                📝 PDF
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Reports & Analytics Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2>📈 {t('tabs.reports')} & {t('dashboard.tabs.analytics', 'Analytics')}</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>Visual insights into your voucher distribution and impact</p>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3 style={{marginTop: 0, fontSize: '16px', color: '#666'}}>Total Vouchers Issued</h3>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#4CAF50'}}>{vouchers.length}</div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3 style={{marginTop: 0, fontSize: '16px', color: '#666'}}>Total Value Distributed</h3>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#2196F3'}}>
                  £{vouchers.reduce((sum, v) => sum + v.value, 0).toFixed(2)}
                </div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3 style={{marginTop: 0, fontSize: '16px', color: '#666'}}>Active Vouchers</h3>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#FF9800'}}>
                  {vouchers.filter(v => v.status === 'active').length}
                </div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3 style={{marginTop: 0, fontSize: '16px', color: '#666'}}>Redeemed Vouchers</h3>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#9C27B0'}}>
                  {vouchers.filter(v => v.status === 'redeemed').length}
                </div>
              </div>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{marginTop: 0}}>Voucher Status Breakdown</h3>
              <div style={{marginTop: '20px'}}>
                <div style={{marginBottom: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                    <span>🟢 Active</span>
                    <strong>{vouchers.filter(v => v.status === 'active').length} ({vouchers.length > 0 ? ((vouchers.filter(v => v.status === 'active').length / vouchers.length) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                  <div style={{backgroundColor: '#f5f5f5', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{backgroundColor: '#4CAF50', height: '100%', width: `${vouchers.length > 0 ? (vouchers.filter(v => v.status === 'active').length / vouchers.length) * 100 : 0}%`}} />
                  </div>
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                    <span>🔵 Redeemed</span>
                    <strong>{vouchers.filter(v => v.status === 'redeemed').length} ({vouchers.length > 0 ? ((vouchers.filter(v => v.status === 'redeemed').length / vouchers.length) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                  <div style={{backgroundColor: '#f5f5f5', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{backgroundColor: '#2196F3', height: '100%', width: `${vouchers.length > 0 ? (vouchers.filter(v => v.status === 'redeemed').length / vouchers.length) * 100 : 0}%`}} />
                  </div>
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                    <span>🔴 Expired</span>
                    <strong>{vouchers.filter(v => v.status === 'expired').length} ({vouchers.length > 0 ? ((vouchers.filter(v => v.status === 'expired').length / vouchers.length) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                  <div style={{backgroundColor: '#f5f5f5', height: '20px', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{backgroundColor: '#F44336', height: '100%', width: `${vouchers.length > 0 ? (vouchers.filter(v => v.status === 'expired').length / vouchers.length) * 100 : 0}%`}} />
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{marginTop: 0}}>Value by Status</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px'}}>
                <div style={{padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px'}}>
                  <div style={{fontSize: '14px', color: '#2e7d32', marginBottom: '5px'}}>🟢 Active Value</div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>
                    £{vouchers.filter(v => v.status === 'active').reduce((sum, v) => sum + v.value, 0).toFixed(2)}
                  </div>
                </div>
                
                <div style={{padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
                  <div style={{fontSize: '14px', color: '#1565c0', marginBottom: '5px'}}>🔵 Redeemed Value</div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#2196F3'}}>
                    £{vouchers.filter(v => v.status === 'redeemed').reduce((sum, v) => sum + v.value, 0).toFixed(2)}
                  </div>
                </div>
                
                <div style={{padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px'}}>
                  <div style={{fontSize: '14px', color: '#c62828', marginBottom: '5px'}}>🔴 Expired Value</div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#F44336'}}>
                    £{vouchers.filter(v => v.status === 'expired').reduce((sum, v) => sum + v.value, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div>
            <h2>📜 {t('shop.redemptionHistory')}</h2>
            
            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
              <input
                type="text"
                placeholder={t('shop.searchByCodeOrRecipient')}
                value={redemptionHistorySearch}
                onChange={(e) => setRedemptionHistorySearch(e.target.value)}
                style={{flex: 1, minWidth: '200px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
              />
              <select
                value={redemptionHistoryFilter}
                onChange={(e) => setRedemptionHistoryFilter(e.target.value)}
                style={{padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
              >
                <option value="all">{t('shop.allRedemptions')}</option>
                <option value="today">{t('shop.today')}</option>
                <option value="week">{t('shop.thisWeek')}</option>
                <option value="month">{t('shop.thisMonth')}</option>
              </select>
            </div>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {(() => {
                // Note: This would need a backend API endpoint to fetch redeemed vouchers
                // For now, showing placeholder
                return (
                  <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                    <p style={{fontSize: '18px', marginBottom: '10px'}}>{t('shop.redemptionHistoryComingSoon')}</p>
                    <p>{t('shop.redemptionHistoryDescription')}</p>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// RECIPIENT DASHBOARDER CARD COMPONENT
function SchoolToGoOrderCard({ item, onOrderPlaced }) {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({
    client_name: '',
    client_mobile: '',
    client_email: '',
    quantity: 1
  })
  const [message, setMessage] = useState('')

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    try {
      await apiCall('/school/place-order', {
        method: 'POST',
        body: JSON.stringify({
          surplus_item_id: item.id,
          client_name: orderForm.client_name,
          client_mobile: orderForm.client_mobile,
          client_email: orderForm.client_email,
          quantity: orderForm.quantity
        })
      })
      setMessage('Order placed successfully!')
      setOrderForm({ client_name: '', client_mobile: '', client_email: '', quantity: 1 })
      setShowOrderForm(false)
      setTimeout(() => setMessage(''), 3000)
      if (onOrderPlaced) onOrderPlaced()
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '10px', padding: '15px', backgroundColor: '#fafafa'}}>
      {message && (
        <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '8px', borderRadius: '5px', marginBottom: '10px', fontSize: '14px'}}>
          {message}
        </div>
      )}
      
      <div style={{marginBottom: '10px'}}>
        <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>{item.item_name || item.title}</h3>
        <div style={{fontSize: '14px', color: '#666'}}>
          <div><strong>{t('product.shop')}</strong> {item.shop_name}</div>
          <div><strong>{t('product.category')}</strong> {item.category}</div>
          <div><strong>{t('product.available')}</strong> {item.quantity}</div>
          {item.expiry_date && <div><strong>{t('product.expiry')}</strong> {new Date(item.expiry_date).toLocaleDateString()}</div>}
          {item.description && <div style={{marginTop: '8px'}}>{item.description}</div>}
        </div>
      </div>
      
      {!showOrderForm ? (
        <button 
          onClick={() => setShowOrderForm(true)} 
          style={{...styles.primaryButton, width: '100%', backgroundColor: '#9C27B0'}}
        >
          📝 Order for Family
        </button>
      ) : (
        <form onSubmit={handlePlaceOrder} style={{marginTop: '15px'}}>
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Client Full Name *</label>
            <input
              type="text"
              value={orderForm.client_name}
              onChange={(e) => setOrderForm({...orderForm, client_name: e.target.value})}
              placeholder="e.g., John Smith"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Mobile Number *</label>
            <input
              type="tel"
              value={orderForm.client_mobile}
              onChange={(e) => setOrderForm({...orderForm, client_mobile: e.target.value})}
              placeholder="e.g., 07700900000"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '10px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Email Address *</label>
            <input
              type="email"
              value={orderForm.client_email}
              onChange={(e) => setOrderForm({...orderForm, client_email: e.target.value})}
              placeholder="e.g., client@example.com"
              style={{...styles.input, fontSize: '14px'}}
              required
            />
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>Quantity</label>
            <select
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value)})}
              style={{...styles.input, fontSize: '14px'}}
            >
              {[...Array(Math.min(10, item.quantity))].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>
          
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={{...styles.primaryButton, flex: 1, fontSize: '14px', backgroundColor: '#9C27B0'}}>
              ✅ Place Order
            </button>
            <button 
              type="button" 
              onClick={() => setShowOrderForm(false)} 
              style={{...styles.secondaryButton, flex: 1, fontSize: '14px'}}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// Styles
const styles = {
  primaryButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#4CAF50',
    border: '2px solid white',
    padding: '12px 24px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#1976d2',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  },
  tab: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: '1px solid #4CAF50',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
}

// Initialize Stripe with publishable key
// Note: Publishable keys (pk_test_...) are safe to expose in client-side code
const stripePromise = loadStripe('pk_test_51SVbPxPYZpaK67VwPalMz7tJDdpgmg0BtqU04wbBHBtvvjAP6TOv8XNq8wKfaWGNqHo45pozfP7m9JKh9TZVYuyd00IjE9gJDX')

// Wrap App with Stripe Elements and ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </ErrorBoundary>
)

export default AppWithErrorBoundary
