import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userAPI, idFormatAPI } from '../../services/api';
import { validateUserId, getFormatHint, generateSampleIds, buildIdFormatPattern } from '../../utils/idFormatValidator';
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
  const [step, setStep] = useState(1); // Single step form
  const [currentFormat, setCurrentFormat] = useState(null);
  const [userIdFormatValid, setUserIdFormatValid] = useState(null);
  const [userIdExists, setUserIdExists] = useState(false);
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
  const defaultSuffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Esq.', 'PhD'];
  const suffixOptions = defaultSuffixOptions.includes(formData.suffix)
    ? defaultSuffixOptions
    : [...defaultSuffixOptions, formData.suffix];

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

  // Get placeholder for user ID input
  const getPlaceholder = () => {
    if (!currentFormat) {
      return 'e.g., TUPM-01-0001';
    }
    const formatInfo = buildIdFormatPattern(currentFormat, formData.role);
    return formatInfo?.pattern || 'e.g., TUPM-01-0001';
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
    // Check if user ID already exists
    const exists = userList?.some(u => (u.userId || u.id) === value);
    setUserIdExists(exists);
  };

  // Generate password from last name
  const generatePassword = (lastName) => {
    return (lastName || 'USER').toUpperCase() + '123!';
  };

  // Normalize role type to lowercase format expected by backend
  const normalizeRole = (role) => {
    if (!role) return 'user';
    return role.toLowerCase().replace(/\s+/g, '_');
  };

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

  const handleNextStep = () => {
    if (validateStep1()) {
      if (isEditMode) {
        // For edit mode, submit directly after step 1 (no password required)
        handleSubmitEdit();
      } else {
        // For add mode, create user with auto-generated password
        handleCreate();
      }
    }
  };

  const handleCreate = async () => {
    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);
    try {
      // Generate password from last name
      const password = generatePassword(formData.lastName);

      const newUser = await userAPI.create({
        user_id: formData.userId,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        email_add: formData.email,
        password: password,
        role_type: normalizeRole(formData.role),
        org: formData.organizationUnitId || null,
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
      alert(`User created successfully!\\nDefault password: ${password}\\nRemind them to change password ASAP!`);
      onClose();
      // Refresh page to show new user in list
      window.location.reload();
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors({
        submit: error.message || 'Failed to create user. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    setIsLoading(true);
    try {
      await userAPI.update(formData.userId, {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        email_add: formData.email,
        role_type: normalizeRole(formData.role),
        org: formData.organizationUnitId || null,
        user_pos: formData.organizationPosition
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
        user_id: formData.userId,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        email_add: formData.email,
        password: passwordData.password,
        role_type: formData.role,
        org: formData.organizationUnitId || null,
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

  const renderOrgUnitOptions = (units, depth = 0, parentPath = '', index = 0) => {
    return units.flatMap((unit, idx) => {
      // Handle both org_id (backend field) and id (frontend field)
      const unitId = unit.org_id || unit.id || `fallback-${index}-${idx}`;
      const uniqueKey = `${parentPath}${unitId}`;
      const nextIndex = index + idx;
      
      return [
        <option key={uniqueKey} value={unitId}>
          {'—'.repeat(depth)} {unit.org_name || unit.name || 'Unknown'}
        </option>,
        ...(unit.sub_offices && unit.sub_offices.length > 0 
          ? renderOrgUnitOptions(unit.sub_offices, depth + 1, `${uniqueKey}-`, nextIndex + 1) 
          : [])
      ];
    });
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
          </div>
          <button 
            onClick={() => {
              onClose();
              setStep(1);
              setErrors({});
              setUserIdFormatValid(null);
              setUserIdExists(false);
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

        <div className="space-y-4">
          {/* User Information Form (for both Add and Edit) */}
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
                    userIdExists ? 'border-red-500 focus:ring-red-500' :
                    errors.userId ? 'border-red-500 focus:ring-red-500' : 
                    userIdFormatValid === true ? 'border-green-500 focus:ring-green-500' :
                    userIdFormatValid === false ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-blue-500'
                  }`} 
                  placeholder={getPlaceholder()}
                />

              </div>
              {!isEditMode && userIdExists && (
                <p className="mt-1 text-sm text-red-500">User ID already exists!</p>
              )}
              {!isEditMode && !userIdExists && errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
              {!isEditMode && !userIdExists && userIdFormatValid === false && !errors.userId && (
                <p className="mt-1 text-sm text-red-500">Invalid format! Expected: {getPlaceholder()}</p>
              )}
              {!isEditMode && !userIdExists && userIdFormatValid === true && (
                <p className="mt-1 text-sm text-green-600">Format is correct!</p>
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
                <select
                  value={formData.suffix}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suffixOptions.map((option) => (
                    <option key={option || 'none'} value={option}>
                      {option || 'None'}
                    </option>
                  ))}
                </select>
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
                    setUserIdExists(false);
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
                  setUserIdExists(false);
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
                disabled={isEditMode ? false : (userIdFormatValid !== true || userIdExists)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditMode ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}

