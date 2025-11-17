import React from 'react';

const LandingPage = ({ onNavigate }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px', fontWeight: 'bold' }}>
          BAK UP E-Voucher System
        </h1>
        <p style={{ fontSize: '1.3em', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px' }}>
          Connecting food vendors, VCSE organizations, and vulnerable families through a unified digital solution
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('register')}
            style={{
              padding: '15px 40px',
              fontSize: '1.1em',
              backgroundColor: '#fff',
              color: '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            Get Started
          </button>
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '15px 40px',
              fontSize: '1.1em',
              backgroundColor: 'transparent',
              color: '#fff',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          {/* Feature 1 */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🎫</div>
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>Supporting Communities</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Digital food vouchers promoting dignity and choice for vulnerable families
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🤝</div>
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>VCSE Partnership</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Charitable organizations can fund and manage voucher distributions efficiently
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🏪</div>
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>Vendor Network</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Local shops join the network to accept vouchers and support their community
            </p>
          </div>

          {/* Feature 4 - UPDATED */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🍎</div>
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>Surplus Food Sharing</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Vendors can post surplus food items for families as discount and free food surplus to VCSE partners to support the families they serve, reducing food waste
            </p>
          </div>
        </div>
      </div>

      {/* Who We Serve Section - UPDATED */}
      <div style={{ backgroundColor: '#fff', padding: '60px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5em', marginBottom: '50px', color: '#333' }}>
          Who We Serve
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* For Recipients - UPDATED */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #9C27B0'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#9C27B0' }}>
              👤 For Recipients
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• Receive digital food vouchers with dignity</li>
              <li>• Choose what you need from local vendors</li>
              <li>• <strong>Food to Go at a discount</strong> - Buy discounted food from participating vendors</li>
              <li>• Track your voucher balance easily</li>
            </ul>
          </div>

          {/* For Vendors */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #FF9800'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#FF9800' }}>
              🏪 For Vendors
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• Accept digital vouchers seamlessly</li>
              <li>• Post discounted food items for recipients</li>
              <li>• Post free surplus food for VCSE collection</li>
              <li>• Support your local community</li>
              <li>• Manage multiple shop locations</li>
            </ul>
          </div>

          {/* For VCSE Organizations - UPDATED */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #4CAF50'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#4CAF50' }}>
              🤝 For VCSE Organizations
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• Issue and manage vouchers efficiently</li>
              <li>• Fund families digitally</li>
              <li>• <strong>Collect free surplus food</strong> to distribute to families you serve</li>
              <li>• Track usage and impact</li>
              <li>• Generate detailed reports</li>
            </ul>
          </div>

          {/* For Schools/Care Organizations - NEW */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #2196F3'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#2196F3' }}>
              🎓 For Schools & Care Organizations
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• <strong>Receive e-vouchers from BAK UP</strong> to support families</li>
              <li>• Distribute vouchers to families from underrepresented communities</li>
              <li>• Track voucher distribution and impact</li>
              <li>• Support students and families through trusted institutions</li>
              <li>• Generate reports for accountability</li>
            </ul>
          </div>

          {/* For Administrators */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #1976d2'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#1976d2' }}>
              👨‍💼 For Administrators
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• Oversee the entire platform</li>
              <li>• Manage users and roles</li>
              <li>• Monitor discount and surplus food programs</li>
              <li>• Generate comprehensive reports</li>
              <li>• Ensure system integrity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>
          Ready to Make a Difference?
        </h2>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
          Join our community-driven platform today
        </p>
        <button
          onClick={() => onNavigate('register')}
          style={{
            padding: '15px 40px',
            fontSize: '1.1em',
            backgroundColor: '#fff',
            color: '#4CAF50',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}
        >
          Create Account
        </button>
      </div>
      
      {/* Admin Access Link - Subtle footer link */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #ddd'
      }}>
        <button
          onClick={() => onNavigate('admin-login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '0.85em',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '5px 10px'
          }}
        >
          Administrator Access
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
