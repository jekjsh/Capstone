import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import api from './api';
import { ACCESS_TOKEN } from './constants';

const defaultCustomization = {
  systemName: 'Record Keeping Management System',
  systemLogo: null,
  loginBackground: null,
  primaryColor: '#4F46E5'
};

export default function LoginInterface({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [customization, setCustomization] = useState(defaultCustomization);

  useEffect(() => {
    const saved = localStorage.getItem('rkms_customization');
    if (saved) {
      try {
        setCustomization(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading customization:', e);
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/token/', {
          username: username,
          password: password,
        });

        if (response.status === 200) {
          const data = response.data;
          
          // Save tokens to localStorage FIRST
          localStorage.setItem(ACCESS_TOKEN, data.access);
          localStorage.setItem('refresh', data.refresh);
          
          console.log('[LoginInterface] Tokens saved to localStorage');
          console.log('[LoginInterface] Access token:', data.access.substring(0, 20) + '...');
          
          // Fetch user profile to check is_system_admin
          try {
            const profileResponse = await api.get('/auth/profile/');
            const userProfile = profileResponse.data;
            
            console.log('[LoginInterface] User Profile:', userProfile);
            console.log('[LoginInterface] is_system_admin:', userProfile.is_system_admin);
            
            // Record login event - NOW the token should be in localStorage
            try {
              console.log('[LoginInterface] Calling POST /auth/login-event/...');
              const loginEventResponse = await api.post('/auth/login-event/');
              console.log('[LoginInterface] Login event recorded successfully:', loginEventResponse.data);
            } catch (loginEventError) {
              console.error('[LoginInterface] Error recording login event:', {
                message: loginEventError.message,
                status: loginEventError.response?.status,
                statusText: loginEventError.response?.statusText,
                data: loginEventError.response?.data
              });
            }
            
            // Determine user type based on is_system_admin field
            const userType = userProfile.is_system_admin ? 'admin' : 'user';
            
            console.log('Determined userType:', userType);
            
            // Call success callback with full user profile and determined user type
            onLoginSuccess({
              id: userProfile.id,
              username: userProfile.username,
              email: userProfile.email,
              first_name: userProfile.first_name,
              last_name: userProfile.last_name,
              name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || userProfile.username,
              is_system_admin: userProfile.is_system_admin,
              access: data.access,
              refresh: data.refresh,
              userType: userType
            });
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // Fallback if profile fetch fails - default to user
            onLoginSuccess({
              username: username,
              access: data.access,
              refresh: data.refresh,
              userType: 'user'
            });
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.response?.status === 401) {
          setErrors({ password: 'Invalid username or password' });
        } else {
          setErrors({ password: 'Connection error. Please try again.' });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: customization.loginBackground ? 'transparent' : '#f3f4f6'
      }}
    >
      {customization.loginBackground && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${customization.loginBackground})`
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          {customization.systemLogo ? (
            <img 
              src={customization.systemLogo} 
              alt="System Logo" 
              className="h-16 mx-auto mb-4 object-contain"
            />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                background: `linear-gradient(to right, ${customization.primaryColor}, ${customization.primaryColor}dd)`
              }}
            >
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {customization.systemName}
          </h1>
          <p className="text-gray-600">Please sign in to your account</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.username
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                style={{
                  accentColor: customization.primaryColor
                }}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: customization.primaryColor
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}