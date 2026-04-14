import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { userAPI } from '../services/api';

export default function ChangePasswordModal({ isOpen, onClose, currentUsername }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

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
    currentUsername &&
    currentPassword &&
    newPassword &&
    confirmPassword &&
    isPasswordValid &&
    isConfirmMatch
  );

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setCapsLockOn(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleCapsLock = (e) => {
    setCapsLockOn(Boolean(e.getModifierState && e.getModifierState('CapsLock')));
  };

  // Validate that we have a username when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!currentUsername || currentUsername.trim() === '') {
        setError('Error: User ID is not available. Please refresh the page and try again.');
      } else {
        setError('');
      }
    }
  }, [isOpen, currentUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure we have username - it should be a string
    if (!currentUsername || typeof currentUsername !== 'string' || currentUsername.trim() === '') {
      setError('Error: User ID is missing. Please refresh the page.');
      toast.error('User ID is missing. Please refresh the page.');
      return;
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet all security requirements.');
      toast.error('New password does not meet all security requirements.');
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword(currentUsername, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      // Show success toast
      toast.success('Password changed successfully!');
      
      // Reset form
      resetForm();
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const errorMsg = err.message || 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          <button 
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyUp={handleCapsLock}
                onBlur={() => setCapsLockOn(false)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyUp={handleCapsLock}
                onBlur={() => setCapsLockOn(false)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
              <p className={passwordChecks.minLength ? 'text-green-600' : 'text-gray-500'}>
                {passwordChecks.minLength ? '✓' : '•'} At least 8 characters
              </p>
              <p className={passwordChecks.upper ? 'text-green-600' : 'text-gray-500'}>
                {passwordChecks.upper ? '✓' : '•'} One uppercase letter
              </p>
              <p className={passwordChecks.lower ? 'text-green-600' : 'text-gray-500'}>
                {passwordChecks.lower ? '✓' : '•'} One lowercase letter
              </p>
              <p className={passwordChecks.number ? 'text-green-600' : 'text-gray-500'}>
                {passwordChecks.number ? '✓' : '•'} One number
              </p>
              <p className={passwordChecks.special ? 'text-green-600' : 'text-gray-500'}>
                {passwordChecks.special ? '✓' : '•'} One special character
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyUp={handleCapsLock}
                onBlur={() => setCapsLockOn(false)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`mt-2 text-xs ${isConfirmMatch ? 'text-green-600' : 'text-red-600'}`}>
                {isConfirmMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {capsLockOn && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
              Caps Lock is on
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
