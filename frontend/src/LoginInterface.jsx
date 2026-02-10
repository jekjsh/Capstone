import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { setAuthTokens } from './services/api';

export default function LoginInterface({ onLoginSuccess, dataStore }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [customization, setCustomization] = useState({
    systemName: 'Record Keeping Management System',
    systemLogo: null,
    loginBackground: null,
    primaryColor: '#4F46E5'
  });

  useEffect(() => {
    if (dataStore) {
      const custom = dataStore.getCustomization();
      if (custom) {
        setCustomization(custom);
        
        document.documentElement.style.setProperty('--primary-color', custom.primaryColor);
      }
    }
  }, [dataStore]);

  const validateForm = () => {
    const newErrors = {};

    if (!userId) {
      newErrors.userId = 'User ID is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const determineUserType = (id, isSuperUser, isStaff) => {
    // System admin has superuser status
    if (isSuperUser) {
      return 'system-admin';
    }
    // Organization admin has is_staff status
    if (isStaff) {
      return 'admin';
    }
    // Regular users
    if (id.includes('_')) {
      return 'admin';
    } else if (id.includes('-')) {
      return 'user';
    }
    return 'user';
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Call the backend API to authenticate
        const response = await fetch('http://localhost:8000/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: userId,
            password: password
          })
        });

        if (!response.ok) {
          setErrors({ password: 'Invalid User ID or Password' });
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        console.log('Login Response Data:', data);
        console.log('data.user:', data.user);
        console.log('organizationUnitId:', data.user.organizationUnitId);
        
        // Store tokens using the API service
        setAuthTokens(data.access, data.refresh);

        // Determine user type based on backend flags and username format
        const userType = determineUserType(userId, data.user.is_superuser, data.user.is_staff);

        // Call onLoginSuccess with user data including profile
        onLoginSuccess({
          id: userId,
          username: userId,
          name: `${data.user.first_name} ${data.user.last_name}` || userId,
          role: data.user.is_superuser ? 'System Admin' : (data.user.is_staff ? 'Admin' : 'User'),
          userType: userType,
          email: data.user.email,
          organizationUnitId: data.user.organizationUnitId,
          jobTitle: data.user.jobTitle,
          department: data.user.department,
          organizationPosition: data.user.organizationPosition,
          status: data.user.status
        });
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ password: 'Unable to connect to server' });
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
      {/*Background Image Overlay */}
      {customization.loginBackground && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${customization.loginBackground})`,
              filter: 'blur(0px)'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Custom Logo or Default Icon */}
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
          
          {/*Custom System Name */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {customization.systemName}
          </h1>
          <p className="text-gray-600">Please sign in to your account</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* User ID Field */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.userId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                style={{
                  focusRingColor: customization.primaryColor
                }}
                placeholder="Enter your user ID"
              />
            </div>
            {errors.userId && (
              <p className="mt-1 text-sm text-red-500">{errors.userId}</p>
            )}
          </div>

          {/* Password Field */}
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

          {/* Remember Me */}
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: customization.primaryColor,
              focusRingColor: customization.primaryColor
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