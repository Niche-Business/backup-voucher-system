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
          Connecting local food shops, VCSE organizations, and vulnerable families through a unified digital solution
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
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>Local Food Shop Network</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Local food shops join the network to accept vouchers and support their community
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
              Local shops can post surplus items as discounted offers for individuals and free surplus for VCSE partners to support the families they serve, reducing food waste and strengthening the community
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5em', marginBottom: '40px', color: '#333' }}>
            About BAK UP
          </h2>
          
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              BAK UP CIC is proud to lead the Northamptonshire Community E-Voucher Scheme an innovative, 
              community-led solution that ensures families and individuals facing hardship can access 
              culturally appropriate essential goods and services with dignity, flexibility, and fairness.
            </p>
            
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              Our E-Voucher model replaces traditional food parcels with a digital, text and paper-based 
              voucher that can be redeemed at local participating shops, markets, and community suppliers. 
              This approach not only supports households in crisis but also reinvests spending back into 
              the local economy, strengthening small businesses and community networks.
            </p>
            
            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: '#4CAF50', fontSize: '1.8em' }}>Our Mission</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              BAK UP CIC exists to reduce inequalities and improve life chances by tackling the social, 
              economic, and structural barriers that prevent people from thriving. We work collaboratively 
              across Northamptonshire to create inclusive, equitable systems that empower residents to 
              lead healthier, more resilient, and self-determined lives.
            </p>
            
            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: '#4CAF50', fontSize: '1.8em' }}>Objectives of the E-Voucher Scheme</h3>
            <ul style={{ fontSize: '18px', lineHeight: '2', marginLeft: '20px', color: '#555' }}>
              <li><strong>Promote Dignity and Choice:</strong> Allow families to select the food they truly need, respecting cultural and dietary preferences.</li>
              <li><strong>Support Local Economies:</strong> Partner with local shops, independent retailers, and social enterprises to circulate funding within communities.</li>
              <li><strong>Enhance Accessibility:</strong> Ensure those with No Recourse to Public Funds (NRPF), digital exclusion, or mobility challenges are not left behind.</li>
              <li><strong>Improve Data and Impact Measurement:</strong> Use anonymised data to map needs, target support, and influence local policy on food and financial insecurity.</li>
              <li><strong>Foster Collaboration:</strong> Work with councils, health partners, and VCSE organisations to deliver integrated, wrap-around support.</li>
            </ul>
            
            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: '#4CAF50', fontSize: '1.8em' }}>Creating a Circular and Sustainable Community Economy</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              The E-Voucher Scheme also creates a unique opportunity for local shops and retailers to play 
              a proactive role in reducing waste and promoting sustainability. Participating outlets will be 
              able to notify BAK UP CIC and partner charities about surplus food and essential goods, enabling 
              these items to be collected and redistributed to families in need rather than going to waste.
            </p>
            
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              This simple yet powerful system strengthens the local circular economy ensuring that valuable 
              resources are used efficiently, environmental impact is reduced, and communities become more 
              resilient, sustainable, and self-supporting.
            </p>
            
            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: '#4CAF50', fontSize: '1.8em' }}>Why Funders Should Invest</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px', color: '#555' }}>
              Funding the E-Voucher Scheme means investing in a smarter, fairer, and greener approach to 
              tackling poverty and inequality. Every pound directly benefits both households in need and 
              local small businesses, creating a cycle of community wealth.
            </p>
            
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#555' }}>
              Your support will help BAK UP CIC expand coverage across Northamptonshire, increase the number 
              of participating retailers, and strengthen our digital systems for monitoring impact and reducing 
              administrative costs. Together, we can ensure that no household is left without access to 
              essentials and that dignity, equity, and opportunity are at the heart of community support.
            </p>
          </div>
        </div>
      </div>

      {/* Who We Serve Section - UPDATED */
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
              <li>• Choose what you need from local food shops</li>
              <li>• <strong>Food to Go at a discount</strong> - Buy discounted food from participating shops</li>
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
              🏪 For Local Food Shops
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
