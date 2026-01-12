// NEW Multi-Step Register Page Component with Vuexy-inspired design
function RegisterPage({ onRegister, onNavigate }) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
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
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }

  const validateStep = (step) => {
    setError('')
    
    if (step === 1) {
      if (!formData.userType) {
        setError('Please select a user type')
        return false
      }
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email address')
        return false
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('register.passwordMismatch'))
        return false
      }
    }
    
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) {
        setError('Please enter your first and last name')
        return false
      }
      if (!formData.phone) {
        setError('Please enter your phone number')
        return false
      }
      
      // Conditional validation based on user type
      if (formData.userType === 'vcse') {
        if (!formData.organizationName) {
          setError('Please enter your organization name')
          return false
        }
        if (!formData.charityCommissionNumber) {
          setError('Please enter your charity commission number')
          return false
        }
      }
      if (formData.userType === 'school' && !formData.organizationName) {
        setError('Please enter your school/organization name')
        return false
      }
      if (formData.userType === 'vendor') {
        if (!formData.shopName) {
          setError('Please enter your shop name')
          return false
        }
        if (!formData.shopCategory) {
          setError('Please select a shop category')
          return false
        }
      }
    }
    
    if (step === 3) {
      if (!formData.address) {
        setError('Please enter your address')
        return false
      }
      if (!formData.postcode) {
        setError('Please enter your postcode')
        return false
      }
      if (formData.userType === 'vendor' && !formData.town) {
        setError('Please select your town')
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    setError('')
    setCurrentStep(currentStep - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!validateStep(3)) {
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

  // Step indicator component
  const StepIndicator = ({ stepNumber, title, subtitle, icon, isActive, isCompleted }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isCompleted ? '#4CAF50' : '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: 'white',
        fontWeight: 'bold',
        boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {isCompleted ? '✓' : icon}
      </div>
      <div style={{flex: 1, display: currentStep === stepNumber ? 'block' : 'none'}}>
        <div style={{fontSize: '14px', color: '#999', marginBottom: '2px'}}>{subtitle}</div>
        <div style={{fontSize: '18px', fontWeight: '600', color: '#333'}}>{title}</div>
      </div>
      {stepNumber < 3 && (
        <div style={{
          width: '40px',
          height: '2px',
          background: isCompleted ? '#4CAF50' : '#e0e0e0',
          marginLeft: 'auto',
          transition: 'all 0.3s ease'
        }} />
      )}
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Left side - Illustration/Branding */}
      <div style={{
        flex: '0 0 40%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: 'white',
        display: window.innerWidth < 768 ? 'none' : 'flex'
      }}>
        <div style={{fontSize: '80px', marginBottom: '30px'}}>🎫</div>
        <h1 style={{fontSize: '36px', marginBottom: '20px', textAlign: 'center'}}>BAK UP E-Voucher</h1>
        <p style={{fontSize: '20px', textAlign: 'center', opacity: 0.9, lineHeight: '1.6'}}>
          Join our community and start making a difference today
        </p>
        <div style={{marginTop: '40px', display: 'flex', gap: '20px'}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '32px', fontWeight: 'bold'}}>500+</div>
            <div style={{fontSize: '16px', opacity: 0.8}}>Active Users</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '32px', fontWeight: 'bold'}}>£50K+</div>
            <div style={{fontSize: '16px', opacity: 0.8}}>Distributed</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '32px', fontWeight: 'bold'}}>100+</div>
            <div style={{fontSize: '16px', opacity: 0.8}}>Partners</div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Step Indicators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            gap: '0'
          }}>
            <StepIndicator
              stepNumber={1}
              title="Account Type"
              subtitle="Step 1"
              icon="📝"
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
            />
            <StepIndicator
              stepNumber={2}
              title="Personal Info"
              subtitle="Step 2"
              icon="👤"
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
            />
            <StepIndicator
              stepNumber={3}
              title="Address Details"
              subtitle="Step 3"
              icon="📍"
              isActive={currentStep === 3}
              isCompleted={false}
            />
          </div>

          {/* Form Title */}
          <div style={{marginBottom: '30px'}}>
            <h2 style={{fontSize: '28px', fontWeight: '700', color: '#333', marginBottom: '8px'}}>
              {currentStep === 1 && 'Account Information'}
              {currentStep === 2 && 'Personal Information'}
              {currentStep === 3 && 'Address & Confirmation'}
            </h2>
            <p style={{fontSize: '16px', color: '#666', margin: 0}}>
              {currentStep === 1 && 'Select your account type and create credentials'}
              {currentStep === 2 && 'Tell us about yourself and your organization'}
              {currentStep === 3 && 'Complete your registration with address details'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid #ef5350',
              fontSize: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid #4CAF50',
              fontSize: '16px'
            }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: Account Type & Credentials */}
            {currentStep === 1 && (
              <div>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                    {t('register.userTypeLabel')}
                  </label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  >
                    <option value="recipient">{t('register.userTypes.recipient')}</option>
                    <option value="vendor">{t('register.userTypes.vendor')}</option>
                    <option value="vcse">{t('register.userTypes.vcse')}</option>
                    <option value="school">{t('register.userTypes.school')}</option>
                  </select>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                    {t('register.emailLabel')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@email.com"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.passwordLabel')}
                    </label>
                    <div style={{position: 'relative'}}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '14px',
                          paddingRight: '45px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          color: '#666'
                        }}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.confirmPasswordLabel')}
                    </label>
                    <div style={{position: 'relative'}}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '14px',
                          paddingRight: '45px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          color: '#666'
                        }}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Personal Information */}
            {currentStep === 2 && (
              <div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.firstNameLabel')}
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.lastNameLabel')}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                    {t('register.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900000"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                {/* VCSE Fields */}
                {formData.userType === 'vcse' && (
                  <>
                    <div style={{marginBottom: '20px'}}>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                        {t('register.organizationNameLabel')} <span style={{color: '#f44336'}}>*</span>
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleChange}
                        placeholder="Enter EXACT registered charity name"
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      />
                      <small style={{color: '#666', fontSize: '14px', display: 'block', marginTop: '5px'}}>
                        💡 Use the exact name as registered with the Charity Commission
                      </small>
                    </div>
                    <div style={{marginBottom: '20px'}}>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                        {t('register.charityNumberLabel')} <span style={{color: '#f44336'}}>*</span>
                      </label>
                      <input
                        type="text"
                        name="charityCommissionNumber"
                        value={formData.charityCommissionNumber || ''}
                        onChange={handleChange}
                        placeholder="e.g., 1234567"
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      />
                      <div style={{backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: '8px', padding: '12px', marginTop: '8px'}}>
                        <small style={{color: '#e65100', fontSize: '14px', display: 'block', lineHeight: '1.5'}}>
                          <strong>🔒 Verification Required:</strong><br/>
                          Your charity number will be verified with the UK Charity Commission
                        </small>
                      </div>
                    </div>
                  </>
                )}

                {/* School Fields */}
                {formData.userType === 'school' && (
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.schoolNameLabel')}
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder="Enter school or organization name"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                )}

                {/* Vendor Fields */}
                {formData.userType === 'vendor' && (
                  <>
                    <div style={{marginBottom: '20px'}}>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                        {t('register.shopNameLabel')}
                      </label>
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="Enter your shop name"
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      />
                    </div>
                    <div style={{marginBottom: '20px'}}>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                        {t('register.shopCategoryLabel')}
                      </label>
                      <select
                        name="shopCategory"
                        value={formData.shopCategory}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          outline: 'none',
                          transition: 'border-color 0.3s',
                          backgroundColor: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        required
                      >
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
              </div>
            )}

            {/* STEP 3: Address Details */}
            {currentStep === 3 && (
              <div>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                    {t('register.addressLabel')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.postcodeLabel')}
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="NN8 1AA"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.cityLabel')} <span style={{fontSize: '14px', color: '#666'}}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder={t('register.townPlaceholder')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                </div>

                {/* Vendor Town Dropdown */}
                {formData.userType === 'vendor' && (
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: '#333'}}>
                      {t('register.townLabel')}
                    </label>
                    <select
                      name="town"
                      value={formData.town || ''}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'border-color 0.3s',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    >
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
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.color = '#667eea'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e0e0e0'
                    e.target.style.color = '#666'
                  }}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '10px',
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }
                  }}
                >
                  {loading ? '⏳ Registering...' : '✓ Complete Registration'}
                </button>
              )}
            </div>
          </form>

          {/* Sign In Link */}
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <p style={{color: '#666', fontSize: '16px'}}>
              {t('register.haveAccount')}{' '}
              <button
                onClick={() => onNavigate('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {t('register.signInLink')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
