import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

const LandingPage = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Language Switcher - Top Right */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px', fontWeight: 'bold' }}>
          {t('landing.hero.title')}
        </h1>
        <p style={{ fontSize: '1.3em', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px' }}>
          {t('landing.hero.subtitle')}
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
            {t('landing.hero.getStarted')}
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
            {t('landing.hero.signIn')}
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
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>
              {t('landing.features.communities.title')}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {t('landing.features.communities.description')}
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
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>
              {t('landing.features.vcse.title')}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {t('landing.features.vcse.description')}
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
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>
              {t('landing.features.vendors.title')}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {t('landing.features.vendors.description')}
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🍎</div>
            <h3 style={{ fontSize: '1.4em', marginBottom: '15px', color: '#333' }}>
              {t('landing.features.surplus.title')}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {t('landing.features.surplus.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Who We Serve Section */}
      <div style={{ backgroundColor: '#fff', padding: '60px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5em', marginBottom: '50px', color: '#333' }}>
          {t('landing.whoWeServe.title')}
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* For Recipients */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #9C27B0'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#9C27B0' }}>
              👤 {t('landing.whoWeServe.recipients.title')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• {t('landing.whoWeServe.recipients.item1')}</li>
              <li>• {t('landing.whoWeServe.recipients.item2')}</li>
              <li>• <strong>{t('landing.whoWeServe.recipients.item3')}</strong></li>
              <li>• {t('landing.whoWeServe.recipients.item4')}</li>
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
              🏪 {t('landing.whoWeServe.vendors.title')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• {t('landing.whoWeServe.vendors.item1')}</li>
              <li>• {t('landing.whoWeServe.vendors.item2')}</li>
              <li>• {t('landing.whoWeServe.vendors.item3')}</li>
              <li>• {t('landing.whoWeServe.vendors.item4')}</li>
              <li>• {t('landing.whoWeServe.vendors.item5')}</li>
            </ul>
          </div>

          {/* For VCSE Organizations */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #4CAF50'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#4CAF50' }}>
              🤝 {t('landing.whoWeServe.vcse.title')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• {t('landing.whoWeServe.vcse.item1')}</li>
              <li>• {t('landing.whoWeServe.vcse.item2')}</li>
              <li>• <strong>{t('landing.whoWeServe.vcse.item3')}</strong></li>
              <li>• {t('landing.whoWeServe.vcse.item4')}</li>
              <li>• {t('landing.whoWeServe.vcse.item5')}</li>
            </ul>
          </div>

          {/* For Schools/Care Organizations */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #2196F3'
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#2196F3' }}>
              🎓 {t('landing.whoWeServe.schools.title')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• <strong>{t('landing.whoWeServe.schools.item1')}</strong></li>
              <li>• {t('landing.whoWeServe.schools.item2')}</li>
              <li>• {t('landing.whoWeServe.schools.item3')}</li>
              <li>• {t('landing.whoWeServe.schools.item4')}</li>
              <li>• {t('landing.whoWeServe.schools.item5')}</li>
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
              👨‍💼 {t('landing.whoWeServe.admins.title')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#666', lineHeight: '2' }}>
              <li>• {t('landing.whoWeServe.admins.item1')}</li>
              <li>• {t('landing.whoWeServe.admins.item2')}</li>
              <li>• {t('landing.whoWeServe.admins.item3')}</li>
              <li>• {t('landing.whoWeServe.admins.item4')}</li>
              <li>• {t('landing.whoWeServe.admins.item5')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About the Scheme Section */}
      <div style={{ backgroundColor: '#f0f7f0', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5em', marginBottom: '30px', color: '#2e7d32' }}>
            🌿 About the Northamptonshire Community E-Voucher Scheme
          </h2>
          
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.8em', color: '#4CAF50', marginBottom: '20px' }}>🏯 About BAK UP CIC</h3>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
              BAK UP CIC is proud to lead the <strong>Northamptonshire Community E-Voucher Scheme</strong>, an innovative, community-led solution that ensures families and individuals facing hardship can access culturally appropriate essential goods and services with dignity, flexibility, and fairness.
            </p>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              Our E-Voucher model replaces traditional food parcels with digital, text-based, and paper-based vouchers that can be redeemed at local participating shops, markets, and community suppliers. This approach not only supports households in crisis but also reinvests spending back into the local economy, strengthening small businesses and community networks.
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.8em', color: '#4CAF50', marginBottom: '20px' }}>🎯 Our Mission</h3>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              BAK UP CIC exists to reduce inequalities and improve life chances by tackling the social, economic, and structural barriers that prevent people from thriving. We work collaboratively across Northamptonshire to create inclusive, equitable systems that empower residents to lead healthier, more resilient, and self-determined lives.
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.8em', color: '#4CAF50', marginBottom: '25px' }}>🌟 Objectives of the E-Voucher Scheme</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '1.3em', color: '#2e7d32', marginBottom: '10px' }}>1. Promote Dignity and Choice</h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Enable families to select the food and essentials they truly need, respecting cultural and dietary preferences.</p>
              </div>
              <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '1.3em', color: '#2e7d32', marginBottom: '10px' }}>2. Support Local Economies</h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Partner with local shops, independent retailers, and social enterprises to keep funding circulating within communities.</p>
              </div>
              <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '1.3em', color: '#2e7d32', marginBottom: '10px' }}>3. Enhance Accessibility</h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Ensure that individuals with No Recourse to Public Funds (NRPF), those facing digital exclusion, or people with mobility challenges are not left behind.</p>
              </div>
              <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '1.3em', color: '#2e7d32', marginBottom: '10px' }}>4. Improve Data and Impact Measurement</h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Use anonymised data to map needs, target support, and influence local policy on food and financial insecurity.</p>
              </div>
              <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '20px' }}>
                <h4 style={{ fontSize: '1.3em', color: '#2e7d32', marginBottom: '10px' }}>5. Foster Collaboration</h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Work with councils, health partners, and VCSE organisations to deliver integrated, wrap-around support.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.8em', color: '#4CAF50', marginBottom: '20px' }}>♻️ Creating a Circular and Sustainable Community Economy</h3>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '15px' }}>
              The E-Voucher Scheme also creates a unique opportunity for local shops and retailers to play an active role in reducing waste and promoting sustainability.
            </p>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              Participating outlets will be able to notify BAK UP CIC and partner charities about surplus food and essential goods, enabling these items to be collected and redistributed to families in need rather than going to waste. This simple yet powerful system strengthens the local circular economy – ensuring that valuable resources are used efficiently, environmental impact is reduced, and communities become more resilient, sustainable, and self-supporting.
            </p>
          </div>

          <div style={{ backgroundColor: '#e8f5e9', padding: '40px', borderRadius: '15px', border: '2px solid #4CAF50' }}>
            <h3 style={{ fontSize: '1.8em', color: '#2e7d32', marginBottom: '20px', textAlign: 'center' }}>💰 Why Funders Should Invest</h3>
            <p style={{ fontSize: '1.2em', lineHeight: '1.8', color: '#333', textAlign: 'center', fontWeight: '500' }}>
              Funding the E-Voucher Scheme means investing in a smarter, fairer, and greener approach to tackling poverty and inequality. Every pound directly benefits both households facing hardship and local small businesses, creating a positive cycle of community wealth and wellbeing.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              onClick={() => onNavigate('register')}
              style={{
                padding: '15px 40px',
                fontSize: '1.2em',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              Join the Scheme Today
            </button>
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
          {t('landing.cta.title')}
        </h2>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
          {t('landing.cta.subtitle')}
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
          {t('landing.cta.button')}
        </button>
      </div>
      
      {/* Footer Links Section */}
      <div style={{
        backgroundColor: '#2e7d32',
        color: 'white',
        padding: '50px 20px 30px',
        borderTop: '4px solid #4CAF50'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '30px' }}>
            {/* About Us Column */}
            <div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: 'bold' }}>About Us</h3>
              <p style={{ lineHeight: '1.6', color: '#e8f5e9', marginBottom: '15px' }}>
                BAK UP CIC leads the Northamptonshire Community E-Voucher Scheme, providing dignified support to families and strengthening local economies.
              </p>
              <button
                onClick={() => onNavigate('register')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95em'
                }}
              >
                Learn More
              </button>
            </div>

            {/* For Funders Column */}
            <div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: 'bold' }}>For Funders</h3>
              <p style={{ lineHeight: '1.6', color: '#e8f5e9', marginBottom: '10px' }}>
                Invest in a smarter, fairer approach to tackling poverty and inequality.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, color: '#e8f5e9', lineHeight: '1.8' }}>
                <li>✓ Direct community impact</li>
                <li>✓ Support local businesses</li>
                <li>✓ Measurable outcomes</li>
                <li>✓ Sustainable circular economy</li>
              </ul>
            </div>

            {/* Contact Us Column */}
            <div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: 'bold' }}>Contact Us</h3>
              <p style={{ lineHeight: '1.8', color: '#e8f5e9' }}>
                <strong>BAK UP CIC</strong><br />
                Northamptonshire, UK<br />
                <br />
                <strong>Email:</strong> info@bakup.org.uk<br />
                <strong>Phone:</strong> Coming soon<br />
                <br />
                <strong>Hours:</strong><br />
                Monday - Friday: 9am - 5pm
              </p>
            </div>
          </div>

          {/* Bottom Footer Bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '20px',
            textAlign: 'center',
            color: '#c8e6c9',
            fontSize: '0.9em'
          }}>
            <p>&copy; 2024 BAK UP CIC. All rights reserved. | Northamptonshire Community E-Voucher Scheme</p>
          </div>
        </div>
      </div>

      {/* Admin Access Link */}
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
          {t('landing.footer.adminAccess')}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
