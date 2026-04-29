// frontend/src/components/LoginForm.jsx
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { setAuthTokens, authAPI } from "./services/api";
import './LoginForm.css';

const REMEMBER_ME_STORAGE_KEY = 'rkms.rememberedLogin';

export default function LoginForm({ themeData, onShowRegistration }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (saved?.rememberMe) {
        setUserId(saved.userId || '');
        setPassword(saved.password || '');
        setRememberMe(true);
      }
    } catch (error) {
      console.warn('Failed to read remembered login:', error);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Step 1: Send credentials to login endpoint
      const response = await fetch('http://localhost:8000/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password }) 
      });

      const data = await response.json();
      console.log('Login Response:', { status: response.status, ok: response.ok, data });

      if (response.ok) {
        // Credentials valid, OTP sent - show 2FA screen
        console.log('Setting requires2FA to true, tempUserId:', data.user_id);
        setTempUserId(data.user_id);
        setRequires2FA(true);
        setErrorMessage('');
        setShowError(false);
      } else {
        // Login failed
        setPassword('');
        setErrorMessage(data.detail || 'Invalid credentials. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setPassword('');
      setErrorMessage('An error occurred. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit code.');
      setShowError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Step 2: Verify OTP and get tokens
      const response = await fetch('http://localhost:8000/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: tempUserId, otp_code: otpCode }) 
      });

      const data = await response.json();

      if (response.ok) {
        // OTP verified, tokens received
        setAuthTokens(data.access, data.refresh);

        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify({
            rememberMe: true,
            userId,
            password
          }));
        } else {
          localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
        }
        
        // Check if user must change password on first login
        if (data.must_change_password) {
          // Store the flag and redirect to password change page
          localStorage.setItem('mustChangePassword', 'true');
          window.location.href = '/change-password-required';
          return;
        }
        
        // Fetch user profile to determine which dashboard to redirect to
        try {
          const userData = await authAPI.getCurrentProfile();
          const roleType = userData.role_type;
          
          // Redirect based on role
          if (roleType === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (roleType === 'system_admin') {
            window.location.href = '/system-admin/dashboard';
          } else {
            // Default to user dashboard
            window.location.href = '/user/documents';
          }
        } catch (error) {
          console.error('Failed to fetch user profile, redirecting to documents:', error);
          // Fallback to user documents if profile fetch fails
          window.location.href = '/user/documents';
        }
      } else {
        // OTP verification failed
        setOtpCode('');
        setErrorMessage(data.detail || 'Invalid OTP code. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setOtpCode('');
      setErrorMessage('An error occurred. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setOtpCode('');
    setErrorMessage('');
    setShowError(false);
  };

  // 2FA OTP Verification Screen
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Background Image/Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Error Alert */}
        {showError && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black bg-opacity-50"></div>
            <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-red-600 font-semibold mb-2">Error</h3>
              <p className="text-gray-700 mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowError(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 2FA Form Container */}
        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleVerifyOTP} className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-center mb-2">Verify Your Identity</h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              We've sent a 6-digit code to your email. Please enter it below.
            </p>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Authentication Code</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-3xl letter-spacing-wide border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-bold"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-gray-500 text-xs mt-2 text-center">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={isLoading}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Standard Login Screen
  return (
    <>
      {/* Error Alert Popup */}
      {showError && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowError(false)}
          />
          
          {/* Alert Box */}
          <div className="bg-red-500 rounded-lg shadow-2xl w-full max-w-md p-6 relative z-10 alert-popup-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Alert!</h3>
              <button
                onClick={() => setShowError(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-white mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowError(false)}
              className="w-full bg-white text-red-500 py-2 rounded font-medium hover:bg-gray-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Login Form Box */}
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-12 relative z-10 login-glass-effect">
      
      {/* --- HEADER (Logo & System Name) --- */}
      <div className="text-center mb-10">
        {themeData.sys_logo && (
          <img 
            src={themeData.sys_logo} 
            alt="System Logo" 
            className="h-16 mx-auto mb-4 object-contain"
          />
        )}
        
        {/* Dynamic System Name from your database */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
          {themeData.sys_name || 'Record Keeping Management System'}
        </h1>
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Record Keeping Management System
        </p>
        <p className="text-sm text-gray-500">Please sign in to your account</p>
      </div>

      {/* --- FORM --- */}
      <form onSubmit={handleLogin} className="space-y-6">
        
        {/* User ID Field */}
        <div>
          <label htmlFor="userId" className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
            User ID
          </label>
          <div className="relative rounded-md input-focus-ring transition-all border border-gray-300">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 bg-transparent rounded-md focus:outline-none text-sm text-gray-800"
              placeholder="Enter your user ID"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
            Password
          </label>
          <div className="relative rounded-md input-focus-ring transition-all border border-gray-300">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-3 bg-transparent rounded-md focus:outline-none text-sm text-gray-800"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Remember Me + Request Link */}
          <div className="flex items-center justify-between mt-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Remember Me
            </label>

            <button
              type="button"
              onClick={() => onShowRegistration && onShowRegistration()}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              No Account? Request Here
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-white py-3 mt-6 rounded-md font-medium hover:opacity-90 transition-all disabled:opacity-70 bg-indigo-600"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
    </>
  );
}