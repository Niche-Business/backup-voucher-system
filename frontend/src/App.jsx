import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import LandingPage from './LandingPage'
import LanguageSelector from './components/LanguageSelector'
import PasswordChangeModal from './components/PasswordChangeModal'
import QRScanner from './components/QRScanner'
import VoucherPrint from './components/VoucherPrint'

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
      if (data.authenticated) {
        setUser(data.user)
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
      // Convert camelCase to snake_case for backend
      const backendData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        user_type: formData.userType,
        organization_name: formData.organizationName || '',
        shop_name: formData.shopName || '',
        shop_category: formData.shopCategory || '',
        address: formData.address || '',
        postcode: formData.postcode || '',
        city: formData.city || ''
      }
      
      const data = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(backendData)
      })
      
      if (data.message) {
        return { success: true, message: data.message }
      }
    } catch (error) {
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
        <FeatureCard icon="🏪" title="Local Shops" description="Partner shops accept vouchers and notify about to go available for collection" />
        <FeatureCard icon="🤝" title="VCSE Organizations" description="Charities issue vouchers and collect to go to support communities" />
        <FeatureCard icon="📊" title="Impact Tracking" description="Comprehensive reporting for admins and VCSE organizations to measure community impact" />
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>Sign In to BAK UP</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={styles.input}
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={styles.input}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', marginBottom: '15px'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{textAlign: 'center'}}>
          <p>Don't have an account? <button onClick={() => onNavigate('register')} style={styles.linkButton}>Register here</button></p>
          <p><button onClick={() => onNavigate('forgot-password')} style={styles.linkButton}>Forgot Password?</button></p>
          <button onClick={() => onNavigate('home')} style={styles.linkButton}>Back to Home</button>
        </div>
      </div>
    </div>
  )
}

// Admin Login Page Component
function AdminLoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Login failed. Please try again.')
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              style={styles.input}
            />
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={styles.input}
              required
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={styles.input}
              required
            />
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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'recipient',
    organizationName: '',
    shopName: '',
    shopCategory: '',
    address: '',
    postcode: '',
    city: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    const result = await onRegister(formData)
    
    if (result.success) {
      setSuccess(result.message || 'Registration successful! Please sign in.')
      setTimeout(() => onNavigate('login'), 2000)
    } else {
      setError(result.error || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#4CAF50', padding: '20px'}}>
      <div style={{backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '500px', maxWidth: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign: 'center', marginBottom: '30px'}}>Register for BAK UP</h2>
        
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{error}</div>}
        {success && <div style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>User Type</label>
            <select name="userType" value={formData.userType} onChange={handleChange} style={styles.input} required>
              <option value="recipient">Recipient</option>
                <option value="vendor">Local Food Shop</option>
              <option value="vcse">VCSE Organization</option>
              <option value="school">School/Care Organization</option>
            </select>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={styles.input} required />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={styles.input} required />
            </div>
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} required />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} required />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={styles.input} required />
            </div>
          </div>
          
          {(formData.userType === 'vcse' || formData.userType === 'vendor' || formData.userType === 'recipient' || formData.userType === 'school') && (
            <>
              {formData.userType === 'vcse' && (
                <>
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Organization Name</label>
                    <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} style={styles.input} required />
                  </div>
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Charity Commission Number</label>
                    <input 
                      type="text" 
                      name="charityCommissionNumber" 
                      value={formData.charityCommissionNumber || ''} 
                      onChange={handleChange} 
                      placeholder="e.g., 123456" 
                      style={styles.input} 
                      required 
                    />
                  </div>
                </>
              )}
              
              {formData.userType === 'school' && (
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>School/Organization Name</label>
                  <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} style={styles.input} required />
                </div>
              )}
              
              {formData.userType === 'vendor' && (
                <>
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Name</label>
                    <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} style={styles.input} required />
                  </div>
                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Category</label>
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
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} style={styles.input} required />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Postcode</label>
                  <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} style={styles.input} required />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} style={styles.input} required />
                </div>
              </div>
            </>
          )}
          
          <button type="submit" disabled={loading} style={{...styles.primaryButton, width: '100%', marginBottom: '15px'}}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div style={{textAlign: 'center'}}>
          <p>Already have an account? <button onClick={() => onNavigate('login')} style={styles.linkButton}>Sign in here</button></p>
          <button onClick={() => onNavigate('home')} style={styles.linkButton}>Back to Home</button>
        </div>
      </div>
    </div>
  )
}

// Dashboard Router Component
function Dashboard({ user, onLogout }) {
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
  const [editingSchool, setEditingSchool] = useState(null)
  const [editingVcse, setEditingVcse] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [loginStats, setLoginStats] = useState(null)

  const loadLoginStats = async () => {
    try {
      const data = await apiCall('/admin/login-stats')
      setLoginStats(data)
    } catch (error) {
      console.error('Error loading login stats:', error)
    }
  }

  useEffect(() => {
    loadVcseOrgs()
    loadSchools()
    loadVouchers()
    loadVendorShops()
    if (activeTab === 'settings') {
      loadLoginStats()
    }
    loadToGoItems()
  }, [])

  const loadVcseOrgs = async () => {
    try {
      const data = await apiCall('/admin/vcse-organizations')
      setVcseOrgs(data)
    } catch (error) {
      console.error('Failed to load VCSE organizations:', error)
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
      console.error('Failed to load to go items:', error)
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
      alert('VCSE organization updated successfully')
      setEditingVcse(null)
      setEditFormData({})
      loadVcseOrgs()
    } catch (error) {
      alert('Error updating VCSE organization: ' + error.message)
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
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.overview')}</button>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.voucherManagement')}</button>
          <button onClick={() => setActiveTab('schools')} style={activeTab === 'schools' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.schoolsOrgs')}</button>
          <button onClick={() => setActiveTab('shops')} style={activeTab === 'shops' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.localShops')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.tabs.allToGo')}</button>
          <button onClick={() => setActiveTab('settings')} style={activeTab === 'settings' ? styles.activeTab : styles.tab}>⚙️ {t('dashboard.tabs.settings')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <h2>Fund Allocation</h2>
            {message && <div style={{backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', color: message.includes('Error') ? '#c62828' : '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>{message}</div>}
            
            <form onSubmit={handleAllocateFunds} style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Organization Type</label>
                <select value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} style={styles.input}>
                  <option value="vcse">VCSE Organization</option>
                  <option value="school">School/Care Organization</option>
                </select>
              </div>
              
              {organizationType === 'vcse' ? (
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Select VCSE Organization</label>
                  <select value={selectedVcse} onChange={(e) => setSelectedVcse(e.target.value)} style={styles.input} required>
                    <option value="">Choose a VCSE organization...</option>
                    {vcseOrgs.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} - Allocated: £{org.allocated_balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Select School/Care Organization</label>
                  <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} style={styles.input} required>
                    <option value="">Choose a school/care organization...</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.organization_name} - Allocated: £{(school.allocated_balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Amount (£)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 1000.00" style={styles.input} required />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{...styles.input, minHeight: '80px'}} />
              </div>
              
              <button type="submit" style={styles.primaryButton}>💸 Allocate Funds</button>
            </form>
            
            <h3>VCSE Organizations</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {vcseOrgs.map(org => (
                <div key={org.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                  {editingVcse === org.id ? (
                    <div>
                      <div style={{marginBottom: '10px'}}>
                        <label>Organization Name:</label><br />
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
                        <label>Charity Commission Number:</label><br />
                        <input 
                          type="text" 
                          value={editFormData.charity_commission_number || ''} 
                          onChange={(e) => setEditFormData({...editFormData, charity_commission_number: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <label>Allocated Balance (£):</label><br />
                        <input 
                          type="number" 
                          step="0.01"
                          value={editFormData.allocated_balance || ''} 
                          onChange={(e) => setEditFormData({...editFormData, allocated_balance: e.target.value})}
                          style={{width: '100%', padding: '8px', marginTop: '5px'}}
                        />
                      </div>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={handleSaveVcse} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>Save</button>
                        <button onClick={() => { setEditingVcse(null); setEditFormData({}) }} style={{...styles.primaryButton, backgroundColor: '#757575'}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div style={{flex: 1}}>
                        <strong>{org.name}</strong> ({org.email})<br />
                        {org.charity_commission_number && (
                          <span style={{color: '#666', fontSize: '14px'}}>
                            Charity Commission #: <strong>{org.charity_commission_number}</strong><br />
                          </span>
                        )}
                        Allocated Balance: £{org.allocated_balance.toFixed(2)}
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
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
                            try {
                              await apiCall(`/admin/vcse/${org.id}`, { method: 'DELETE' })
                              alert('VCSE organization deleted successfully')
                              loadVcseOrgs()
                            } catch (error) {
                              alert('Error deleting VCSE organization: ' + error.message)
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
                        🗑️ Delete
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'vouchers' && (
          <div>
            <h2>All Vouchers ({vouchers.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {vouchers.length === 0 ? (
                <p>No vouchers found</p>
              ) : (
                vouchers.map(voucher => (
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
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'shops' && (
          <div>
            <h2>🏪 Local Shops with To Gos ({vendorShops.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {vendorShops.length === 0 ? (
                <p>No local shops found</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                  {vendorShops.map(shop => (
                    <div key={shop.id} style={{padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
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
                        🍎 To Go: {shop.to_go_items_count}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'schools' && (
          <div>
            <h2>🎓 Schools & Care Organizations ({schools.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {schools.length === 0 ? (
                <p>No schools/care organizations registered yet</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {schools.map(school => (
                    <div key={school.id} style={{padding: '20px', border: '2px solid #9C27B0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      {editingSchool === school.id ? (
                        <div>
                          <h3 style={{margin: '0 0 15px 0', color: '#9C27B0'}}>Edit School</h3>
                          <div style={{marginBottom: '10px'}}>
                            <label>Organization Name:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.organization_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, organization_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>First Name:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.first_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{marginBottom: '10px'}}>
                            <label>Last Name:</label><br />
                            <input 
                              type="text" 
                              value={editFormData.last_name || ''} 
                              onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
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
                          <div style={{marginBottom: '10px'}}>
                            <label>Allocated Balance (£):</label><br />
                            <input 
                              type="number" 
                              step="0.01"
                              value={editFormData.allocated_balance || ''} 
                              onChange={(e) => setEditFormData({...editFormData, allocated_balance: e.target.value})}
                              style={{width: '100%', padding: '8px', marginTop: '5px'}}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                            <button onClick={handleSaveSchool} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>Save</button>
                            <button onClick={() => { setEditingSchool(null); setEditFormData({}) }} style={{...styles.primaryButton, backgroundColor: '#757575'}}>Cancel</button>
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
                              💰 Allocated Balance: £{(school.allocated_balance || 0).toFixed(2)}
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
                              🗑️ Delete
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
                <p>No to go items found</p>
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
          <h3>Change Your Password</h3>
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
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Current Password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>New Password</label>
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
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <button type="submit" style={styles.button}>Change Password</button>
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
              {showCreateAdmin ? '✕ Cancel' : '+ Create New Admin'}
            </button>
          </div>

          {showCreateAdmin && (
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px', maxWidth: '600px'}}>
              <h3>Create New Admin Account</h3>
              <form onSubmit={handleCreateAdmin}>
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>First Name</label>
                  <input
                    type="text"
                    value={newAdminForm.first_name}
                    onChange={(e) => setNewAdminForm({...newAdminForm, first_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Last Name</label>
                  <input
                    type="text"
                    value={newAdminForm.last_name}
                    onChange={(e) => setNewAdminForm({...newAdminForm, last_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email</label>
                  <input
                    type="email"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Password</label>
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
                
                <button type="submit" style={styles.button}>Create Admin</button>
              </form>
            </div>
          )}

          <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
            <h3>Admin Accounts ({admins.length})</h3>
            {admins.length === 0 ? (
              <p>No admin accounts found</p>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f5f5f5'}}>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Name</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Email</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Created</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Last Login</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd'}}>Logins</th>
                      <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd'}}>Actions</th>
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
                              Delete
                            </button>
                          ) : (
                            <span style={{color: '#999', fontSize: '14px'}}>Current User</span>
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
          <h3>📊 User Login Statistics</h3>
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

// TO GO ORDER CARD COMPONENT FOR VCSE
function ToGoOrderCard({ item, onOrderPlaced }) {
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
          <div><strong>Shop:</strong> {item.shop_name}</div>
          <div><strong>Category:</strong> {item.category}</div>
          <div><strong>Available:</strong> {item.quantity}</div>
          {item.expiry_date && <div><strong>Expiry:</strong> {new Date(item.expiry_date).toLocaleDateString()}</div>}
          {item.description && <div style={{marginTop: '8px'}}>{item.description}</div>}
        </div>
      </div>
      
      {!showOrderForm ? (
        <button 
          onClick={() => setShowOrderForm(true)} 
          style={{...styles.primaryButton, width: '100%', backgroundColor: '#4CAF50'}}
        >
          📝 Order for Client
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
      const data = await apiCall('/admin/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load to go items:', error)
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
          selected_shops: selectedShops === 'all' ? 'all' : selectedShops
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
          <LanguageSelector />
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#FF9800'}}>🔒 Password</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.overview')}</button>
          <button onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeTab : styles.tab}>📋 Voucher Orders</button>
          <button onClick={() => setActiveTab('reports')} style={activeTab === 'reports' ? styles.activeTab : styles.tab}>📈 Reports</button>
          <button onClick={() => setActiveTab('issue')} style={activeTab === 'issue' ? styles.activeTab : styles.tab}>{t('dashboard.issueVouchers')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.toGo')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <div style={{backgroundColor: '#e3f2fd', padding: '30px', borderRadius: '15px', marginBottom: '30px'}}>
              <h3 style={{marginTop: 0, color: '#1565c0'}}>💰 Funds Allocated by Administrator</h3>
              <p>The System Administrator allocates funds to your organization. Use these funds to issue vouchers to recipients.</p>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#1976d2'}}>£{allocatedBalance.toFixed(2)}</div>
                <div style={{fontSize: '18px', color: '#666'}}>Available Balance for Voucher Issuance</div>
              </div>
              <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px'}}>
                <p style={{margin: 0, color: '#856404'}}>⚠️ <strong>Note:</strong> You cannot load money directly. Only the System Administrator can allocate funds to your organization.</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h2>📋 Voucher Orders</h2>
            
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
                          <td style={{padding: '12px'}}>{voucher.recipient.name}</td>
                          <td style={{padding: '12px', fontSize: '14px'}}>{voucher.recipient.email}</td>
                          <td style={{padding: '12px'}}>{voucher.recipient.phone}</td>
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
            <h2>📈 Reports & Analytics</h2>
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
              
              <button type="submit" style={styles.primaryButton}>Issue Voucher</button>
            </form>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>🛍️ Available To Go - Order for Clients</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>Browse available To Go items from local shops and order them on behalf of your clients by providing their contact details.</p>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No To Go items available at the moment</p>
                  <p style={{fontSize: '14px'}}>Check back later for surplus food items from local shops</p>
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
function VendorDashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [shops, setShops] = useState([])
  const [toGoItems, setToGoItems] = useState([])
  const [toGoCount, setToGoCount] = useState(0)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [toGoForm, setToGoForm] = useState({
    shopName: '',
    shopAddress: '',
    itemName: '',
    quantity: '',
    category: 'Fresh Produce',
    description: '',
    expiry_date: ''
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

  useEffect(() => {
    loadShops()
    loadToGoItems()
  }, [])

  const loadShops = async () => {
    try {
      const data = await apiCall('/vendor/shops')
      setShops(data.shops || [])
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
      console.error('Failed to load to go items:', error)
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
          expiry_date: toGoForm.expiry_date
        })
      })
      setMessage('To Go item posted successfully!')
      setToGoForm({ ...toGoForm, itemName: '', quantity: '', description: '', expiry_date: '' })
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
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#1976d2'}}>🔒 Password</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.overview')}</button>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.redeemVouchers')}</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.toGo')}</button>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#FF9800'}}>{toGoCount}</div>
                <div>To Go Posted</div>
              </div>
              <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#4CAF50'}}>{shops.length}</div>
                <div>Shops Registered</div>
              </div>
            </div>
            
            <h3>Your Shops</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {shops.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <p style={{marginBottom: '20px', color: '#666'}}>You haven't registered a shop yet. Create your shop profile to start posting To Go items.</p>
                  <button 
                    onClick={() => setActiveTab('create-shop')} 
                    style={{...styles.primaryButton, backgroundColor: '#FF9800'}}
                  >
                    ➕ Create Shop Profile
                  </button>
                </div>
              ) : (
                shops.map(shop => (
                  <div key={shop.id} style={{padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    {editingShop === shop.id ? (
                      <div style={{flex: 1}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Name</label>
                            <input
                              type="text"
                              value={shopEditForm.shop_name}
                              onChange={(e) => setShopEditForm({...shopEditForm, shop_name: e.target.value})}
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone</label>
                            <input
                              type="text"
                              value={shopEditForm.phone}
                              onChange={(e) => setShopEditForm({...shopEditForm, phone: e.target.value})}
                              style={styles.input}
                            />
                          </div>
                        </div>
                        <div style={{marginBottom: '15px'}}>
                          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Address</label>
                          <input
                            type="text"
                            value={shopEditForm.address}
                            onChange={(e) => setShopEditForm({...shopEditForm, address: e.target.value})}
                            style={styles.input}
                          />
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>City/County</label>
                            <input
                              type="text"
                              value={shopEditForm.city}
                              onChange={(e) => setShopEditForm({...shopEditForm, city: e.target.value})}
                              style={styles.input}
                              placeholder="e.g., London, Essex"
                            />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Postcode</label>
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
                          <button onClick={handleSaveShop} style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}>💾 Save</button>
                          <button onClick={() => setEditingShop(null)} style={{...styles.primaryButton, backgroundColor: '#757575'}}>Cancel</button>
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
                          <button onClick={() => handleEditShop(shop)} style={{...styles.primaryButton, backgroundColor: '#2196F3', padding: '8px 16px'}}>✏️ Edit</button>
                          <button onClick={() => handleDeleteShop(shop.id)} style={{...styles.primaryButton, backgroundColor: '#f44336', padding: '8px 16px'}}>🗑️ Delete</button>
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
            <h2>🎫 Redeem Vouchers</h2>
            
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto'}}>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px'}}>Enter Voucher Code</label>
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
                  📷 Scan QR Code
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
                  🔍 Validate
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
                  ✅ Redeem
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
                  <h3 style={{margin: '0 0 15px 0', color: '#4CAF50'}}>✅ Valid Voucher</h3>
                  <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '15px'}}>
                    £{voucherValidation.value}
                  </div>
                  <div style={{marginBottom: '10px'}}>
                    <strong>Code:</strong> <span style={{fontFamily: 'monospace'}}>{voucherValidation.code}</span>
                  </div>
                  {voucherValidation.recipient && (
                    <div>
                      <div style={{marginBottom: '5px'}}>
                        <strong>Recipient:</strong> {voucherValidation.recipient.name}
                      </div>
                      <div style={{marginBottom: '5px'}}>
                        <strong>Phone:</strong> {voucherValidation.recipient.phone}
                      </div>
                    </div>
                  )}
                  {voucherValidation.expiry_date && (
                    <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                      <strong>Expires:</strong> {new Date(voucherValidation.expiry_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px'}}>
                <h4 style={{margin: '0 0 10px 0'}}>📊 How to Redeem:</h4>
                <ol style={{margin: 0, paddingLeft: '20px'}}>
                  <li>Ask customer for their voucher code</li>
                  <li>Enter the code above</li>
                  <li>Click "Validate" to check the voucher</li>
                  <li>Click "Redeem" to complete the transaction</li>
                  <li>The voucher amount will be added to your balance</li>
                </ol>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'togo' && (
          <div>
            <h2>Post To Go</h2>
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
              
              <button type="submit" style={styles.primaryButton}>Post To Go Item</button>
            </form>
            
            <h3>Your To Go ({toGoCount})</h3>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <p>No to go items posted yet</p>
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

  useEffect(() => {
    loadVouchers()
    loadShops()
    loadToGoItems()
    loadCart()
  }, [])

  const loadVouchers = async () => {
    try {
      const data = await apiCall('/recipient/vouchers')
      setVouchers(data.vouchers || [])
      setVoucherSummary(data.summary || null)
    } catch (error) {
      console.error('Failed to load vouchers:', error)
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

  const loadShops = async () => {
    try {
      const data = await apiCall('/recipient/shops')
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
      console.error('Failed to load to go items:', error)
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
      alert('Item added to cart successfully!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add item to cart: ' + error.message)
    }
  }

  const removeFromCart = async (cartId) => {
    try {
      await apiCall(`/cart/remove/${cartId}`, { method: 'DELETE' })
      await loadCart()
      alert('Item removed from cart')
    } catch (error) {
      console.error('Failed to remove from cart:', error)
      alert('Failed to remove item: ' + error.message)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#9C27B0', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <LanguageSelector />
          <button onClick={() => setShowPasswordModal(true)} style={{...styles.primaryButton, backgroundColor: '#1976d2'}}>🔒 Password</button>
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>{t('dashboard.myVouchers')}</button>
          <button onClick={() => setActiveTab('shops')} style={activeTab === 'shops' ? styles.activeTab : styles.tab}>Participating Shops</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>{t('dashboard.browseToGo')}</button>
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
                <p>No vouchers available</p>
              ) : (
                <div style={{display: 'grid', gap: '20px'}}>
                  {vouchers.map(voucher => (
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
                            <strong>Code:</strong> <span style={{backgroundColor: '#fff', padding: '5px 10px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '16px'}}>{voucher.code}</span>
                          </div>
                          <div style={{marginBottom: '5px'}}>
                            <strong>Status:</strong> <span style={{
                              color: voucher.status === 'active' ? '#4CAF50' : voucher.status === 'redeemed' ? '#FF9800' : '#666',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>{voucher.status}</span>
                          </div>
                          <div style={{marginBottom: '5px'}}>
                            <strong>Expires:</strong> {new Date(voucher.expiry_date).toLocaleDateString()}
                          </div>
                          {voucher.issued_by && (
                            <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                              <strong>Issued by:</strong> {voucher.issued_by.name}
                            </div>
                          )}
                          {voucher.redeemed_at && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                              <strong>Redeemed:</strong> {new Date(voucher.redeemed_at).toLocaleDateString()}
                              {voucher.redeemed_by && ` at ${voucher.redeemed_by.name}`}
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
                              🖨️ Print Voucher
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
                              📱 Show QR Code
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
                  <h2 style={{marginBottom: '20px'}}>Scan to Redeem</h2>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '20px'}}>
                    £{selectedVoucher.value}
                  </div>
                  <div style={{marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px'}}>
                    <div style={{fontSize: '24px', fontFamily: 'monospace', letterSpacing: '3px'}}>
                      {selectedVoucher.code}
                    </div>
                  </div>
                  <div style={{marginBottom: '20px', fontSize: '14px', color: '#666'}}>
                    Present this code at the shop or scan the QR code below
                  </div>
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                    <div style={{padding: '20px', backgroundColor: 'white', border: '2px solid #4CAF50', borderRadius: '10px'}}>
                      {/* QR Code placeholder - would need QRCode library */}
                      <div style={{width: '200px', height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        QR Code: {selectedVoucher.code}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowQR(false)
                      setSelectedVoucher(null)
                    }}
                    style={{...styles.primaryButton, backgroundColor: '#666'}}
                  >
                    Close
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
            <h2>🏪 Participating Shops ({shops.length})</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {shops.length === 0 ? (
                <p>No shops available</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                  {shops.map(shop => (
                    <div key={shop.id} style={{padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa'}}>
                      <h3 style={{margin: '0 0 10px 0', color: '#9C27B0'}}>{shop.shop_name}</h3>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>📍 Address:</strong> {shop.address}, {shop.city} {shop.postcode}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>📞 Phone:</strong> {shop.phone}
                      </p>
                      <p style={{margin: '10px 0 0 0', padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px', fontWeight: 'bold', color: '#9C27B0'}}>
                        🍎 Available To Go: {shop.to_go_items_count}
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
                        <strong>Available:</strong> {item.quantity} {item.unit}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Category:</strong> {item.category}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px'}}>
                        <strong>Description:</strong> {item.description || 'Fresh and ready for collection'}
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
                          🛒 Add to Cart
                        </button>
                        <p style={{fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center', margin: 0}}>
                          💳 Use your voucher to purchase this item at the shop
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
                    <h3 style={{marginBottom: '15px'}}>Items in your cart:</h3>
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
                              <strong>Quantity in cart:</strong> {cartItem.quantity}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              <strong>Category:</strong> {cartItem.item.category}
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
                              🗑️ Remove
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
                    <h3 style={{margin: '0 0 15px 0', color: '#1565c0'}}>Next Steps:</h3>
                    <ol style={{margin: 0, paddingLeft: '20px'}}>
                      <li style={{marginBottom: '10px'}}>Review your cart items above</li>
                      <li style={{marginBottom: '10px'}}>Visit the shop locations to collect your items</li>
                      <li style={{marginBottom: '10px'}}>Show your voucher QR code at the shop to complete purchase</li>
                      <li>Your voucher balance will be deducted at the shop</li>
                    </ol>
                    <div style={{marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                      <button
                        onClick={() => setActiveTab('vouchers')}
                        style={{...styles.primaryButton, backgroundColor: '#2196F3'}}
                      >
                        View My Vouchers
                      </button>
                      <button
                        onClick={() => setActiveTab('togo')}
                        style={{...styles.primaryButton, backgroundColor: '#4CAF50'}}
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// SCHOOL/CARE ORGANIZATION DASHBOARD
function SchoolDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [balance, setBalance] = useState(0)
  const [vouchers, setVouchers] = useState([])
  const [organizationName, setOrganizationName] = useState('')
  const [toGoItems, setToGoItems] = useState([])
  
  // Issue voucher form state
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientFirstName, setRecipientFirstName] = useState('')
  const [recipientLastName, setRecipientLastName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [voucherAmount, setVoucherAmount] = useState('')
  const [message, setMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    loadBalance()
    loadVouchers()
    loadToGoItems()
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
      const data = await apiCall('/admin/to-go-items')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load to go items:', error)
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
          amount: parseFloat(voucherAmount)
        })
      })
      
      setMessage(`✅ Voucher issued successfully! Code: ${data.voucher_code}`)
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
          <div style={{display: 'flex', gap: '10px'}}>
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
            Voucher History
          </button>
          <button 
            onClick={() => setActiveTab('togo')} 
            style={activeTab === 'togo' ? styles.activeTab : styles.tab}
          >
            🛍️ To Go Items
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

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
              <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#9C27B0'}}>{vouchers.length}</div>
                <div style={{color: '#666', marginTop: '5px'}}>Total Vouchers Issued</div>
              </div>
              <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#4CAF50'}}>
                  {vouchers.filter(v => v.status === 'active').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Active Vouchers</div>
              </div>
              <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '36px', fontWeight: 'bold', color: '#FF9800'}}>
                  {vouchers.filter(v => v.status === 'redeemed').length}
                </div>
                <div style={{color: '#666', marginTop: '5px'}}>Redeemed Vouchers</div>
              </div>
            </div>

            <div style={{backgroundColor: '#E1BEE7', padding: '20px', borderRadius: '10px', marginTop: '20px'}}>
              <h3 style={{marginTop: 0, color: '#6A1B9A'}}>🎓 Supporting Families Through Education & Care</h3>
              <p style={{margin: '10px 0', lineHeight: '1.6'}}>
                As a school or care organization, you play a vital role in identifying and supporting families from underrepresented communities who need assistance.
              </p>
              <p style={{margin: '10px 0', lineHeight: '1.6'}}>
                Use your allocated balance to issue e-vouchers directly to families, giving them dignity and choice in accessing food from local food shops.
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

              <button type="submit" style={{...styles.primaryButton, backgroundColor: '#9C27B0', width: '100%'}}>
                Issue Voucher
              </button>
            </form>
          </div>
        )}

        {/* Voucher History Tab */}
        {activeTab === 'vouchers' && (
          <div>
            <h2 style={{marginBottom: '20px', color: '#9C27B0'}}>Voucher History</h2>
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
                      {voucher.expiry_date && (
                        <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                          <strong>Expires:</strong> {new Date(voucher.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* To Go Items Tab */}
        {activeTab === 'togo' && (
          <div>
            <h2 style={{marginBottom: '10px', color: '#9C27B0'}}>🛍️ Available To Go Items</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>Browse surplus food items from local shops and order them for families in your community.</p>
            
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <p>No To Go items available at the moment</p>
                  <p style={{fontSize: '14px'}}>Check back later for surplus food items from local food shops</p>
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
      </div>
    </div>
  )
}

// SCHOOL TO GO ORDER CARD COMPONENT
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
          <div><strong>Shop:</strong> {item.shop_name}</div>
          <div><strong>Category:</strong> {item.category}</div>
          <div><strong>Available:</strong> {item.quantity}</div>
          {item.expiry_date && <div><strong>Expiry:</strong> {new Date(item.expiry_date).toLocaleDateString()}</div>}
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

export default App
