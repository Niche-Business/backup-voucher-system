import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import LandingPage from './LandingPage'
import LanguageSelector from './components/LanguageSelector'

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
              <option value="vendor">Local Shops</option>
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

  useEffect(() => {
    loadVcseOrgs()
    loadSchools()
    loadVouchers()
    loadVendorShops()
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
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>Overview</button>
          <button onClick={() => setActiveTab('vouchers')} style={activeTab === 'vouchers' ? styles.activeTab : styles.tab}>Voucher Management</button>
          <button onClick={() => setActiveTab('schools')} style={activeTab === 'schools' ? styles.activeTab : styles.tab}>Schools/Care Orgs</button>
          <button onClick={() => setActiveTab('shops')} style={activeTab === 'shops' ? styles.activeTab : styles.tab}>Local Shops</button>
          <button onClick={() => setActiveTab('togo')} style={activeTab === 'togo' ? styles.activeTab : styles.tab}>All To Go</button>
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
                        <strong>👤 Vendor:</strong> {shop.vendor_name}
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
            <h2>🍎 All To Go Items ({toGoItems.length})</h2>
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
                        <p style={{margin: '2px 0', fontSize: '13px'}}><strong>👤 Vendor:</strong> {item.vendor_name}</p>
                      </div>
                    </div>
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

  useEffect(() => {
    loadBalance()
    loadToGoItems()
  }, [])

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
      const data = await apiCall('/items/available')
      setToGoItems(data.items || [])
    } catch (error) {
      console.error('Failed to load to go items:', error)
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
          expiry_days: parseInt(voucherForm.expiryDays)
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
      loadBalance()
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
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      
      <div style={{padding: '20px'}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeTab : styles.tab}>{t('dashboard.overview')}</button>
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
            <h2>Available To Go</h2>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '10px'}}>
              {toGoItems.length === 0 ? (
                <p>No to go items available</p>
              ) : (
                toGoItems.map(item => (
                  <div key={item.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                    <strong>{item.title}</strong><br />
                    Category: {item.category}<br />
                    Quantity: {item.quantity}<br />
                    {item.description && <p>{item.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
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
  const [toGoForm, setToGoForm] = useState({
    shopName: '',
    shopAddress: '',
    itemName: '',
    quantity: '',
    category: 'Fresh Produce',
    description: ''
  })
  const [message, setMessage] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherValidation, setVoucherValidation] = useState(null)
  const [redemptionMessage, setRedemptionMessage] = useState('')

  useEffect(() => {
    loadShops()
    loadToGoItems()
  }, [])

  const loadShops = async () => {
    try {
      const data = await apiCall('/vendor/shops')
      setShops(data.shops || [])
      if (data.shops && data.shops.length > 0) {
        setToGoForm(prev => ({ ...prev, shopId: data.shops[0].id.toString() }))
      }
    } catch (error) {
      console.error('Failed to load shops:', error)
    }
  }

  const loadToGoItems = async () => {
    try {
      const data = await apiCall('/vendor/to-go-items')
      setToGoItems(data.to_go_items || [])
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
          description: toGoForm.description
        })
      })
      setMessage('To Go item posted successfully!')
      setToGoForm({ ...toGoForm, itemName: '', quantity: '', description: '' })
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

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
      <div style={{backgroundColor: '#FF9800', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <h1>{t('dashboard.welcome')}, {user.name}</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <LanguageSelector />
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      
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
                  <div key={shop.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                    <strong>{shop.shop_name}</strong><br />
                    {shop.address}, {shop.city} {shop.postcode}<br />
                    Phone: {shop.phone}
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
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Name</label>
                <input
                  type="text"
                  value={toGoForm.shopName}
                  onChange={(e) => setToGoForm({...toGoForm, shopName: e.target.value})}
                  placeholder="e.g., Corner Shop"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Shop Address</label>
                <input
                  type="text"
                  value={toGoForm.shopAddress}
                  onChange={(e) => setToGoForm({...toGoForm, shopAddress: e.target.value})}
                  placeholder="e.g., 123 Main Street, London"
                  style={styles.input}
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
                  <div key={item.id} style={{padding: '15px', borderBottom: '1px solid #eee'}}>
                    <strong>{item.item_name}</strong><br />
                    Quantity: {item.quantity}<br />
                    Category: {item.category}<br />
                    Shop: {item.shop_name}<br />
                    Status: {item.status}<br />
                    {item.description && <p>{item.description}</p>}
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
  const [cart, setCart] = useState([])
  const [cartCount, setCartCount] = useState(0)

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
          <button onClick={onLogout} style={{...styles.primaryButton, backgroundColor: '#d32f2f'}}>{t('common.signOut')}</button>
        </div>
      </div>
      
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
                              onClick={() => handlePrintVoucher(voucher)}
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
  
  // Issue voucher form state
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientFirstName, setRecipientFirstName] = useState('')
  const [recipientLastName, setRecipientLastName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [voucherAmount, setVoucherAmount] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadBalance()
    loadVouchers()
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
          <button onClick={onLogout} style={{...styles.secondaryButton, borderColor: 'white'}}>Logout</button>
        </div>
      </div>

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
                Use your allocated balance to issue e-vouchers directly to families, giving them dignity and choice in accessing food from local vendors.
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
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balance}
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  style={styles.input}
                  required
                />
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
      </div>
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
