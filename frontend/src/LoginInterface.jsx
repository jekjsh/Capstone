// frontend/src/pages/LoginInterface.jsx
import { useState } from 'react';
import LoginForm from './LoginForm';
import fallbackLogo from './assets/images/sra.svg';
import fallbackBg from './assets/images/fallback.avif';

export default function LoginInterface() {
  // Simulating the data you will eventually fetch from the system_themes table
  const [themeData] = useState({
    sys_name: 'Record Keeping Management System',
    sys_logo: fallbackLogo,
    sys_backg: fallbackBg
  });

  /* // FUTURE: Replace with API call to fetch active theme
  useEffect(() => {
    fetch('http://localhost:8000/api/system/theme/active/')
      .then(res => res.json())
      .then(data => setThemeData(data));
  }, []);
  */

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-100">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${themeData.sys_backg})` }}
      />
      
      {/* Dark Overlay (Ensures the white box is always readable) */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* The Actual Login Box Component */}
      <LoginForm themeData={themeData} />
      
    </div>
  );
}