import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userAPI, idFormatAPI } from '../../services/api';
import { validateUserId, getFormatHint, generateSampleIds } from '../../utils/idFormatValidator';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function SystemAdminAddUserModal({
  isOpen,
  onClose,
  onUserAdded,
  userList,
  organizationTree,
  dataStore,
  editingUser = null,
  isEditMode = false
}) {
  const [step, setStep] = useState(1); // Step 1: User Info, Step 2: Password
  const [currentFormat, setCurrentFormat] = useState(null);
  const [userIdFormatValid, setUserIdFormatValid] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    role: 'User',
    organizationUnitId: '',
    organizationPosition: ''
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load user ID format from backend API
  useEffect(() => {
    const loadFormat = async () => {
      try {
        // Fetch all ID formats and use the first active one
        // In a real scenario, you'd filter by organization
        const formats = await idFormatAPI.getAll();
        const data = Array.isArray(formats) ? formats : (formats.results || []);
        const activeFormat = data.find(f => f.is_active) || data[0];
        
        if (activeFormat) {
          setCurrentFormat(activeFormat);
        }
      } catch (error) {
        console.error('Failed to load ID format:', error);
        // Fallback to dataStore if API fails
        if (dataStore) {
          const format = dataStore.getUserIdFormat ? dataStore.getUserIdFormat() : null;
          setCurrentFormat(format);
        }
      }
    };

    if (isOpen) {
      loadFormat();
    }
  }, [isOpen, dataStore, formData.role]);

  // Pre-fill form data when editing
  useEffect(() => {
    if (isOpen && isEditMode && editingUser) {
      setFormData({
        userId: editingUser.id || editingUser.userId || '',
        firstName: editingUser.firstName || '',
        middleName: editingUser.middleName || '',
        lastName: editingUser.lastName || '',
        suffix: editingUser.suffix || '',
        email: editingUser.email || '',
        role: editingUser.role || 'User',
        organizationUnitId: editingUser.organizationUnitId || '',
        organizationPosition: editingUser.userPos || editingUser.organizationPosition || ''
      });
      setUserIdFormatValid(true);
      setStep(1); // Start at step 1 for editing
    } else if (isOpen && !isEditMode) {
      // Reset form for adding new user
      setFormData({
        userId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        email: '',
        role: 'User',
        organizationUnitId: '',
        organizationPosition: ''
      });
      setUserIdFormatValid(null);
      setStep(1);
    }
  }, [isOpen, isEditMode, editingUser]);

  // Get format info for current role
  const getFormatByRole = () => {
    if (!currentFormat) {
      return {
        separator: '-',
        pattern: 'No format configured',
        hint: 'Please configure ID format'
      };
    }
    return {
      separator: formData.role === 'Admin' ? currentFormat.admin_separator : currentFormat.user_separator,
      pattern: generateSampleIds(currentFormat, formData.role)?.admin || 'N/A',
      hint: getFormatHint(currentFormat, formData.role)
    };
  };

  const validateUserIdFormat = (userId) => {
    if (!userId) {
      setUserIdFormatValid(null);
      return false;
    }

    if (!currentFormat) {
      setUserIdFormatValid(false);
      return false;
    }

    // Use the utility function to validate
    const result = validateUserId(userId, currentFormat, formData.role);
    setUserIdFormatValid(result.isValid);
    return result.isValid;
  };

  const handleUserIdChange = (value) => {
    setFormData({ ...formData, userId: value });
    validateUserIdFormat(value);
  };

  // Auto-fill password with last name in uppercase
  useEffect(() => {
    if (step === 2 && formData.lastName && !passwordData.password) {
      const defaultPassword = formData.lastName.toUpperCase();
      setPasswordData({
        password: defaultPassword,
        confirmPassword: defaultPassword
      });
    }
  }, [step, formData.lastName, passwordData.password]);

  const validateStep1 = () => {
    const newErrors = {};

    // Skip User ID validation in edit mode since it's disabled
    if (!isEditMode) {
      if (!formData.userId.trim()) {
        newErrors.userId = 'User ID is required';
      } else if (userIdFormatValid !== true) {
        newErrors.userId = 'User ID format is invalid';
      } else if (userList?.some(u => (u.userId || u.id) === formData.userId)) {
        newErrors.userId = 'User ID already exists';
      }
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!passwordData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      if (isEditMode) {
        // For edit mode, submit directly after step 1 (no password required)
        handleSubmitEdit();
      } else {
        // For add mode, go to step 2 for password
        setStep(2);
        setErrors({});
      }
    }
  };

  const handleSubmitEdit = async () => {
    setIsLoading(true);
    try {
      await userAPI.update(formData.userId, {
        first_name: formData.firstName,
        firstName: formData.firstName,
        middle_name: formData.middleName,
        middleName: formData.middleName,
        last_name: formData.lastName,
        lastName: formData.lastName,
        suffix: formData.suffix,
        email: formData.email,
        role: formData.role,
        organizationUnitId: formData.organizationUnitId || null,
        user_pos: formData.organizationPosition,
        organizationPosition: formData.organizationPosition || null
      });

      console.log('User updated successfully');
      
      // Reset form
      setFormData({
        userId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        email: '',
        role: 'User',
        organizationUnitId: '',
        organizationPosition: ''
      });
      setPasswordData({ password: '', confirmPassword: '' });
      setStep(1);
      setErrors({});
      setUserIdFormatValid(null);
      
      // Call the callback to refresh user list
      if (onUserAdded) {
        await onUserAdded();
      }
      
      onClose();
      alert('User information updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      setErrors({ submit: error.message || 'Failed to update user. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await userAPI.create({
        username: formData.userId,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        email: formData.email,
        password: passwordData.password,
        role: formData.role,
        organizationUnitId: formData.organizationUnitId || null,
        user_pos: formData.organizationPosition
      });

      console.log('User created successfully:', newUser);
      
      // Reset form
      setFormData({
        userId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        email: '',
        role: 'User',
        organizationUnitId: '',
        organizationPosition: ''
      });
      setPasswordData({
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setStep(1);
      setUserIdFormatValid(null);
      
      // Notify parent
      onUserAdded();
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors({
        submit: error.message || 'Failed to create user. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrgUnitOptions = (units, depth = 0) => {
    return units.flatMap(unit => [
      <option key={unit.id} value={unit.id}>
        {'—'.repeat(depth)} {unit.name}
      </option>,
      ...(unit.children && unit.children.length > 0 
        ? renderOrgUnitOptions(unit.children, depth + 1) 
        : [])
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit User Information' : 'Add New User'}
            </h2>
            {!isEditMode && <p className="text-sm text-gray-500">Step {step} of 2</p>}
          </div>
          <button 
            onClick={() => {
              onClose();
              setStep(1);
              setErrors({});
              setUserIdFormatValid(null);
              setFormData({
                userId: '',
                firstName: '',
                middleName: '',
                lastName: '',
                suffix: '',
                email: '',
                role: 'User',
                organizationUnitId: '',
                organizationPosition: ''
              });
              setPasswordData({ password: '', confirmPassword: '' });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 1 ? (
          // Step 1: User Information
          <div className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {errors.submit}
              </div>
            )}

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID * {isEditMode && <span className="text-gray-500 text-xs">(cannot be changed)</span>}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.userId} 
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  disabled={isEditMode}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    isEditMode ? 'bg-gray-100 cursor-not-allowed' :
                    errors.userId ? 'border-red-500 focus:ring-red-500' : 
                    userIdFormatValid === true ? 'border-green-500 focus:ring-green-500' :
                    userIdFormatValid === false ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-blue-500'
                  }`} 
                  placeholder={getPlaceholder()}
                />
                {!isEditMode && userIdFormatValid === true && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">✓</span>
                )}
                {!isEditMode && userIdFormatValid === false && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 font-bold">✗</span>
                )}
              </div>
              {!isEditMode && errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
              {!isEditMode && userIdFormatValid === false && !errors.userId && (
                <p className="mt-1 text-sm text-red-500">⚠️ Invalid format! Expected: {getPlaceholder()}</p>
              )}
              {!isEditMode && userIdFormatValid === true && (
                <p className="mt-1 text-sm text-green-600">✓ Format is correct!</p>
              )}
              {!isEditMode && <p className="mt-1 text-xs text-gray-500">{getFormatHint()}</p>}
            </div>

            {/* First Name & Middle Name & Last Name & Suffix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Michael"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jr., Sr., III"
                />
              </div>
            </div>

            {/* Email & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value, userId: '' });
                    setUserIdFormatValid(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="System Admin">System Admin</option>
                </select>
              </div>
            </div>

            {/* Organization Fields */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Organization Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Unit</label>
                  <select
                    value={formData.organizationUnitId || ''}
                    onChange={(e) => setFormData({ ...formData, organizationUnitId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Organization Unit (Optional)</option>
                    {organizationTree && organizationTree.length > 0 && renderOrgUnitOptions(organizationTree)}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">The organizational unit where this user belongs</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                  <input
                    type="text"
                    value={formData.organizationPosition || ''}
                    onChange={(e) => setFormData({ ...formData, organizationPosition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Director, Manager, Officer"
                  />
                  <p className="mt-1 text-xs text-gray-500">User's position/title within their organization</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
              <button
                onClick={() => {
                  onClose();
                  setStep(1);
                  setErrors({});
                  setUserIdFormatValid(null);
                  setFormData({
                    userId: '',
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    suffix: '',
                    email: '',
                    role: 'User',
                    organizationUnitId: '',
                    organizationPosition: ''
                  });
                  setPasswordData({ password: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                disabled={isEditMode ? false : userIdFormatValid !== true}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditMode ? 'Save Changes' : 'Next: Set Password'}
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Password
          <div className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {errors.submit}
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Creating account for:</p>
              <p className="text-sm text-blue-800">{formData.firstName} {formData.lastName}</p>
              <p className="text-xs text-blue-700 mt-1">{formData.userId}</p>
              <p className="text-xs text-blue-700">{formData.email}</p>
              <p className="text-xs text-blue-700 mt-2">Role: {getRoleDisplayName(formData.role)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              <p className="mt-2 text-xs text-gray-600 font-semibold">Password requirements:</p>
              <ul className="mt-1 list-disc list-inside text-xs text-gray-600">
                <li className={passwordData.password.length >= 6 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 6 characters
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Default: User's last name in CAPITALS</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
              <button
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

