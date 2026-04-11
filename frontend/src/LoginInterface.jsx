// frontend/src/pages/LoginInterface.jsx
import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import fallbackLogo from './assets/images/sra.svg';
import fallbackBg from './assets/images/fallback.avif';
import { systemThemeAPI } from './services/api';

export default function LoginInterface() {
  const [themeData, setThemeData] = useState({
    sys_name: 'Record Keeping Management System',
    sys_abbr: 'RKMS',
    sys_logo: fallbackLogo,
    sys_backg: fallbackBg
  });
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const activeTheme = await systemThemeAPI.getActive();
        setThemeData(prev => ({
          ...prev,
          sys_name: activeTheme.sys_name || prev.sys_name,
          sys_abbr: activeTheme.sys_abbr || prev.sys_abbr,
          sys_logo: activeTheme.sys_logo || prev.sys_logo,
          sys_backg: activeTheme.sys_backg || prev.sys_backg
        }));
        
        // Update document title with the system abbreviation
        if (activeTheme.sys_abbr) {
          document.title = `${activeTheme.sys_abbr} RKMS`;
        }
      } catch (error) {
        console.error('Failed to fetch system theme:', error);
        // Use defaults if fetch fails
      }
    };

    fetchTheme();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-100">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${themeData.sys_backg})` }}
      />
      
      {/* Dark Overlay (Ensures the white box is always readable) */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Conditional Rendering: Login or Registration Form */}
      {!showRegistration ? (
        <LoginForm 
          themeData={themeData}
          onShowRegistration={() => setShowRegistration(true)}
        />
      ) : (
        <RegistrationForm 
          themeData={themeData}
          onBackToLogin={() => setShowRegistration(false)}
          onRegistrationSuccess={() => setShowRegistration(false)}
        />
      )}
      
    </div>
  );
}