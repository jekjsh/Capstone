import { X, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

export default function SystemAdminVerificationModal({
  showAdminVerificationModal,
  setShowAdminVerificationModal,
  setShowEditPasswordModal,
  adminVerificationPassword,
  setAdminVerificationPassword,
  setEditingUserId,
  errors,
  setErrors,
  handleVerifyAdmin
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Get the currently logged-in user from JWT token
  useEffect(() => {
    const getLoggedInUser = async () => {
      try {
        const profile = await authAPI.getCurrentProfile();
        setLoggedInUser(profile);
      } catch (err) {
        console.error('Failed to get current profile:', err);
      }
    };
    
    if (showAdminVerificationModal) {
      getLoggedInUser();
    }
  }, [showAdminVerificationModal]);

  useEffect(() => {
    if (!showAdminVerificationModal) {
      setShowPassword(false);
    }
  }, [showAdminVerificationModal]);
  
  if (!showAdminVerificationModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Admin Verification Required</h2>
          <button 
            onClick={() => {
              setShowAdminVerificationModal(false);
              setShowEditPasswordModal(false);
              setAdminVerificationPassword('');
              setEditingUserId(null);
              setErrors({});
              setShowPassword(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <p className="text-sm text-yellow-800">
            Please enter your password to proceed with this action.
          </p>
        </div>


        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminVerificationPassword}
                onChange={(e) => setAdminVerificationPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyAdmin()}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.adminPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="Enter admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.adminPassword && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                <p className="text-red-700">{errors.adminPassword}</p>
                <p className="text-red-600 text-xs mt-1">
                  💡 Make sure you're entering the password for <strong>{loggedInUser?.user_id}</strong>, not the user being edited.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowAdminVerificationModal(false);
              setShowEditPasswordModal(false);
              setAdminVerificationPassword('');
              setEditingUserId(null);
              setErrors({});
              setShowPassword(false);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerifyAdmin}
            disabled={!adminVerificationPassword}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
