import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) {
  const firstNameInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email_add: ''
  });
  const [initialFormData, setInitialFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email_add: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const profile = currentUser?.full_data || currentUser || {};
  const defaultSuffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Esq.', 'PhD'];
  const suffixOptions = defaultSuffixOptions.includes(formData.suffix)
    ? defaultSuffixOptions
    : [...defaultSuffixOptions, formData.suffix];
  const isEmailValid = !formData.email_add || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_add);
  const hasRequiredFields = Boolean(formData.first_name.trim() && formData.last_name.trim() && isEmailValid);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
  const canSave = !isLoading && hasRequiredFields && hasChanges;

  const normalizeName = (value) => {
    const trimmed = (value || '').trim().replace(/\s+/g, ' ');
    return trimmed
      .split(' ')
      .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
      .join(' ');
  };

  const closeIfAllowed = () => {
    if (hasChanges && !isLoading) {
      const shouldDiscard = window.confirm('You have unsaved changes. Discard them?');
      if (!shouldDiscard) {
        return;
      }
    }
    onClose();
  };

  useEffect(() => {
    if (currentUser && isOpen) {
      const preparedData = {
        first_name: profile.first_name || currentUser.firstName || '',
        middle_name: profile.middle_name || currentUser.middleName || '',
        last_name: profile.last_name || currentUser.lastName || '',
        suffix: profile.suffix || '',
        email_add: profile.email_add || currentUser.email || ''
      };
      setFormData(preparedData);
      setInitialFormData(preparedData);
      setErrors({});

      requestAnimationFrame(() => {
        if (firstNameInputRef.current) {
          firstNameInputRef.current.focus();
        }
      });
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeIfAllowed();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, formData, initialFormData, isLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;

    if (name === 'first_name' || name === 'middle_name' || name === 'last_name') {
      setFormData((prev) => ({
        ...prev,
        [name]: normalizeName(value)
      }));
      return;
    }

    if (name === 'suffix' || name === 'email_add') {
      setFormData((prev) => ({
        ...prev,
        [name]: (value || '').trim()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.middle_name.trim() && formData.middle_name.trim().length === 1) {
      newErrors.middle_name = 'Middle name must be at least 2 characters if provided';
    }

    if (formData.email_add && !formData.email_add.includes('@')) {
      newErrors.email_add = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        email_add: formData.email_add
      });

      toast.success('Profile updated successfully.');

      if (onProfileUpdated) {
        onProfileUpdated();
      }
      
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        email_add: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', error.message, error.response);
      setErrors({ submit: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={closeIfAllowed}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button 
            onClick={closeIfAllowed}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-medium text-gray-800">{profile.user_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="font-medium text-gray-800">{profile.role_type || currentUser?.role || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Organization</p>
              <p className="font-medium text-gray-800">{profile.org_name || profile.org_code || 'N/A'}</p>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            {/* Name Fields - 4 Column Grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  ref={firstNameInputRef}
                  type="text"
                  name="first_name"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.first_name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isLoading}
                  placeholder="First Name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  autoComplete="additional-name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.middle_name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isLoading}
                  placeholder="Middle Name"
                />
                {errors.middle_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.middle_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.last_name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isLoading}
                  placeholder="Last Name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suffix
                </label>
                <select
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  {suffixOptions.map((suffixValue) => (
                    <option key={suffixValue || 'none'} value={suffixValue}>
                      {suffixValue || 'None'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Optional: select a common suffix</p>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email_add"
                autoComplete="email"
                value={formData.email_add}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.email_add || !isEmailValid
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
                placeholder="your@email.com"
              />
              {errors.email_add ? (
                <p className="mt-1 text-xs text-red-600">{errors.email_add}</p>
              ) : !isEmailValid ? (
                <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
              ) : null}

              {!hasChanges && (
                <p className="mt-2 text-xs text-gray-500">No changes made yet</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={closeIfAllowed}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
