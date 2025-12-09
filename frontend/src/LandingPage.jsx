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


        </div>
      </div>

      {/* About the Scheme Section */}
      <div style={{ backgroundColor: '#f0f7f0', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5em', marginBottom: '50px', color: '#2e7d32', fontWeight: 'bold' }}>
            {t('landing.about.sectionTitle')}
          </h2>
          
          {/* Mission Statement */}
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.6em', color: '#2e7d32', marginBottom: '20px', fontWeight: 'bold' }}>{t('landing.about.mission.title')}</h3>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              {t('landing.about.mission.text')}
            </p>
          </div>

          {/* Our Vision */}
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.6em', color: '#2e7d32', marginBottom: '20px', fontWeight: 'bold' }}>{t('landing.about.vision.title')}</h3>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              {t('landing.about.vision.text')}
            </p>
          </div>

          {/* Our Values */}
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.6em', color: '#2e7d32', marginBottom: '25px', fontWeight: 'bold' }}>{t('landing.about.values.title')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#555', lineHeight: '2' }}>
              <li style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#2e7d32' }}>{t('landing.about.values.compassion')}</strong> – {t('landing.about.values.compassionDesc')}
              </li>
              <li style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#2e7d32' }}>{t('landing.about.values.equity')}</strong> – {t('landing.about.values.equityDesc')}
              </li>
              <li style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#2e7d32' }}>{t('landing.about.values.empowerment')}</strong> – {t('landing.about.values.empowermentDesc')}
              </li>
              <li style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#2e7d32' }}>{t('landing.about.values.collaboration')}</strong> – {t('landing.about.values.collaborationDesc')}
              </li>
              <li style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#2e7d32' }}>{t('landing.about.values.integrity')}</strong> – {t('landing.about.values.integrityDesc')}
              </li>
            </ul>
          </div>

          {/* About BAK UP CIC */}
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            {t('landing.about.bakup.title')}
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
              {t('landing.about.bakup.paragraph1')}
            </p>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              {t('landing.about.bakup.paragraph2')}
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            {t('landing.about.keyAreas.title')}
            <div style={{ display: 'grid', gap: '20px' }}>
              <ul style={{ listStyle: 'none', padding: 0, color: '#555', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>{t('landing.about.keyAreas.foodSecurity')}</strong> – {t('landing.about.keyAreas.foodSecurityDesc')}
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>{t('landing.about.keyAreas.youthEmpowerment')}</strong> – {t('landing.about.keyAreas.youthEmpowermentDesc')}
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>{t('landing.about.keyAreas.healthWellbeing')}</strong> – {t('landing.about.keyAreas.healthWellbeingDesc')}
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>{t('landing.about.keyAreas.socialDeterminants')}</strong> – {t('landing.about.keyAreas.socialDeterminantsDesc')}
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>{t('landing.about.keyAreas.communityCohesion')}</strong> – {t('landing.about.keyAreas.communityCohesionDesc')}
                </li>
              </ul>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            {t('landing.about.circular.title')}
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '15px' }}>
              {t('landing.about.circular.paragraph1')}
            </p>
            <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
              {t('landing.about.circular.paragraph2')}
            </p>
          </div>

          <div style={{ backgroundColor: '#e8f5e9', padding: '40px', borderRadius: '15px', border: '2px solid #4CAF50' }}>
            {t('landing.about.funders.title')}
            <p style={{ fontSize: '1.2em', lineHeight: '1.8', color: '#333', textAlign: 'center', fontWeight: '500' }}>
              {t('landing.about.funders.text')}
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
              {t('landing.about.joinScheme')}
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
              {t('landing.about.footerAbout.title')}
              <p style={{ lineHeight: '1.6', color: '#e8f5e9', marginBottom: '15px' }}>
                {t('landing.about.footerAbout.description')}
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
                {t('landing.about.footerAbout.learnMore')}
              </button>
            </div>

            {/* For Funders Column */}
            <div>
              {t('landing.about.footerFunders.title')}
              <p style={{ lineHeight: '1.6', color: '#e8f5e9', marginBottom: '10px' }}>
                {t('landing.about.footerFunders.description')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, color: '#e8f5e9', lineHeight: '1.8' }}>
                <li>✓ {t('landing.about.footerFunders.item1')}</li>
                <li>✓ {t('landing.about.footerFunders.item2')}</li>
                <li>✓ {t('landing.about.footerFunders.item3')}</li>
                <li>✓ {t('landing.about.footerFunders.item4')}</li>
              </ul>
            </div>

            {/* Contact Us Column */}
            <div>
              {t('landing.about.footerContact.title')}
              <p style={{ lineHeight: '1.8', color: '#e8f5e9' }}>
                <strong>{t('landing.about.footerContact.company')}</strong><br />
                {t('landing.about.footerContact.location')}<br />
                <br />
                <strong>{t('landing.about.footerContact.email')}</strong> prince@bakupcic.co.uk<br />
                <strong>{t('landing.about.footerContact.phone')}</strong> 01933698347 / +447947002815<br />
                <br />
                <strong>{t('landing.about.footerContact.hours')}</strong><br />
                {t('landing.about.footerContact.hoursText')}
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
            <p>{t('landing.about.copyright')}<br />{t('landing.about.charityNumber')}</p>
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
