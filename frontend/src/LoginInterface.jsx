// frontend/src/pages/LoginInterface.jsx
import { useState } from 'react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import fallbackLogo from './assets/images/tup.png';
import fallbackBg from './assets/images/fallbackground.jpg';
import { useSystemTheme } from './contexts/SystemThemeContext';

const MEDIA_BASE_URL = 'http://localhost:8000';

const resolveMediaUrl = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }
  return `${MEDIA_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export default function LoginInterface() {
  const { theme } = useSystemTheme();
  const [showRegistration, setShowRegistration] = useState(false);

  const themeData = {
    sys_name: theme?.sys_name || 'Record Keeping Management System',
    sys_abbr: theme?.sys_abbr || 'RKMS',
    sys_logo: resolveMediaUrl(theme?.sys_logo) || fallbackLogo,
    sys_backg: resolveMediaUrl(theme?.sys_backg) || fallbackBg,
  };

  const backgroundImage = `url(${themeData.sys_backg}), url(${fallbackBg})`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-100">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage }}
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