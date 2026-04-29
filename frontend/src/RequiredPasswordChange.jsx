import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI, getAccessToken } from './services/api';
import './LoginForm.css';

export default function RequiredPasswordChange() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redirect if user doesn't have a token or didn't need password change
  useEffect(() => {
    const checkToken = async () => {
      const token = getAccessToken();
      if (!token) {
        navigate('/');
        return;
      }

      // Check if user actually needs password change
      try {
        const profile = await authAPI.getCurrentProfile();
        setUserInfo(profile);
        if (!profile.must_change_password) {
          // User doesn't need to change password, redirect to dashboard
          const roleType = profile.role_type;
          if (roleType === 'admin') {
            navigate('/admin/dashboard');
          } else if (roleType === 'system_admin') {
            navigate('/system-admin/dashboard');
          } else {
            navigate('/user/documents');
          }
        }
      } catch (err) {
        console.error('Error checking password change status:', err);
        navigate('/');
      }
    };

    checkToken();
  }, [navigate]);

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const isConfirmMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = Boolean(
    !loading &&
    currentPassword &&
    newPassword &&
    confirmPassword &&
    isPasswordValid &&
    isConfirmMatch
  );

  const handleCapsLock = (e) => {
    setCapsLockOn(Boolean(e.getModifierState && e.getModifierState('CapsLock')));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet all security requirements.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      // Call the change password endpoint
      await userAPI.changePassword(userInfo.user_id, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear the flag and redirect after 2 seconds
      localStorage.removeItem('mustChangePassword');
      setTimeout(() => {
        const roleType = userInfo.role_type;
        if (roleType === 'admin') {
          navigate('/admin/dashboard');
        } else if (roleType === 'system_admin') {
          navigate('/system-admin/dashboard');
        } else {
          navigate('/user/documents');
        }
      }, 2000);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Password Reset Required</h1>
          <p className="text-indigo-100 mt-2 text-sm">
            You must change your password before accessing the system
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Changed Successfully!</h2>
              <p className="text-gray-600 mb-4">Redirecting you to the dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">User:</span> {userInfo.name}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    onKeyUp={handleCapsLock}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ Caps Lock is on</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    onKeyUp={handleCapsLock}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Password must contain:</p>
                  <div className="space-y-1">
                    <p className={`text-xs flex items-center gap-2 ${passwordChecks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${passwordChecks.minLength ? 'bg-green-100 border-green-300' : 'border-gray-300'}`}>
                        {passwordChecks.minLength ? '✓' : ''}
                      </span>
                      At least 8 characters
                    </p>
                    <p className={`text-xs flex items-center gap-2 ${passwordChecks.upper ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${passwordChecks.upper ? 'bg-green-100 border-green-300' : 'border-gray-300'}`}>
                        {passwordChecks.upper ? '✓' : ''}
                      </span>
                      Uppercase letter (A-Z)
                    </p>
                    <p className={`text-xs flex items-center gap-2 ${passwordChecks.lower ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${passwordChecks.lower ? 'bg-green-100 border-green-300' : 'border-gray-300'}`}>
                        {passwordChecks.lower ? '✓' : ''}
                      </span>
                      Lowercase letter (a-z)
                    </p>
                    <p className={`text-xs flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${passwordChecks.number ? 'bg-green-100 border-green-300' : 'border-gray-300'}`}>
                        {passwordChecks.number ? '✓' : ''}
                      </span>
                      Number (0-9)
                    </p>
                    <p className={`text-xs flex items-center gap-2 ${passwordChecks.special ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${passwordChecks.special ? 'bg-green-100 border-green-300' : 'border-gray-300'}`}>
                        {passwordChecks.special ? '✓' : ''}
                      </span>
                      Special character (!@#$%^&*)
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && !isConfirmMatch && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
                {isConfirmMatch && (
                  <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-2 rounded-lg font-semibold text-white transition-all duration-200 ${
                  canSubmit
                    ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Changing Password...' : 'Change Password & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
