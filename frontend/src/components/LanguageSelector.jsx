import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('language.en'), flag: '🇬🇧' },
    { code: 'ar', name: t('language.ar'), flag: '🇸🇦' },
    { code: 'fr', name: t('language.fr'), flag: '🇫🇷' },
    { code: 'es', name: t('language.es'), flag: '🇪🇸' },
    { code: 'pl', name: t('language.pl'), flag: '🇵🇱' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Set document direction for RTL languages
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          outline: 'none',
          transition: 'all 0.2s',
          minWidth: '150px'
        }}
        onMouseOver={(e) => {
          e.target.style.borderColor = '#4CAF50';
          e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.borderColor = '#ddd';
          e.target.style.boxShadow = 'none';
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
