import { X, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function UserChangePasswordModal({ 
  show, 
  onClose, 
  currentUser,
  onChangePassword 
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  if (!show) return null;

  const validatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    return requirements;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const requirements = validatePasswordStrength(newPassword);
      if (!requirements.length) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      } else if (!requirements.uppercase) {
        newErrors.newPassword = 'Password must contain at least 1 uppercase letter';
      } else if (!requirements.lowercase) {
        newErrors.newPassword = 'Password must contain at least 1 lowercase letter';
      } else if (!requirements.number) {
        newErrors.newPassword = 'Password must contain at least 1 number';
      } else if (!requirements.special) {
        newErrors.newPassword = 'Password must contain at least 1 special character';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onChangePassword(currentPassword, newPassword);
    }
  };

  const requirements = newPassword ? validatePasswordStrength(newPassword) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
              <p className="text-xs text-gray-500">Update your account password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                  errors.currentPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                  errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</p>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-4 h-4 ${requirements.length ? 'fill-green-600' : 'fill-gray-300'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-4 h-4 ${requirements.uppercase ? 'fill-green-600' : 'fill-gray-300'}`} />
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-4 h-4 ${requirements.lowercase ? 'fill-green-600' : 'fill-gray-300'}`} />
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-4 h-4 ${requirements.number ? 'fill-green-600' : 'fill-gray-300'}`} />
                  <span>One number (0-9)</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${requirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-4 h-4 ${requirements.special ? 'fill-green-600' : 'fill-gray-300'}`} />
                  <span>One special character (!@#$...)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}