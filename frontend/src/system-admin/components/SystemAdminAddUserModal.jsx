import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userAPI, idFormatAPI } from '../../services/api';
import { validateUserId, getFormatHint, buildIdFormatPattern } from '../../utils/idFormatValidator';

const initialUserForm = {
  userId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  email: '',
  contactNumber: '',
  birthdate: '',
  role: 'User',
  organizationUnitId: '',
  organizationPosition: ''
};

const initialUserIdParts = {
  prefix: '',
  segment1: '',
  segment2: '',
  segment3: ''
};

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
  const [formData, setFormData] = useState(initialUserForm);
  const [userIdParts, setUserIdParts] = useState(initialUserIdParts);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState({
    isOpen: false,
    title: '',
    lines: []
  });
  const defaultSuffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Esq.', 'PhD'];
  const suffixOptions = defaultSuffixOptions.includes(formData.suffix)
    ? defaultSuffixOptions
    : [...defaultSuffixOptions, formData.suffix];

  const getValidationRole = (role = formData.role) => {
    return normalizeRole(role) === 'user' ? 'User' : 'Admin';
  };

  const getRoleSeparator = (role = formData.role) => {
    if (!currentFormat) {
      return '-';
    }
    return normalizeRole(role) === 'user' ? currentFormat.user_separator : currentFormat.admin_separator;
  };

  const getSegmentLengths = () => {
    if (!currentFormat) {
      return [];
    }

    return [currentFormat.segment1_len, currentFormat.segment2_len, currentFormat.segment3_len]
      .map((len) => Number(len) || 0)
      .filter((len) => len > 0)
      .slice(0, 3);
  };

  const buildUserIdFromParts = (parts) => {
    if (!currentFormat) {
      return '';
    }

    const separator = getRoleSeparator();
    const segmentLengths = getSegmentLengths();
    const typedSegments = segmentLengths
      .map((_, idx) => (parts[`segment${idx + 1}`] || '').trim())
      .filter(Boolean);

    if (!typedSegments.length) {
      return currentFormat.prefix || '';
    }

    return [currentFormat.prefix, ...typedSegments].join(separator);
  };

  const isUserIdComplete = (parts) => {
    const segmentLengths = getSegmentLengths();
    if (!segmentLengths.length) {
      return false;
    }

    return segmentLengths.every((len, idx) => {
      const value = parts[`segment${idx + 1}`] || '';
      return value.length === len;
    });
  };

  const splitUserIdIntoParts = (userId, role = formData.role) => {
    const parsed = {
      ...initialUserIdParts,
      prefix: currentFormat?.prefix || ''
    };

    if (!userId || !currentFormat) {
      return parsed;
    }

    const separator = getRoleSeparator(role);
    const parts = userId.split(separator);
    parsed.prefix = parts[0] || currentFormat.prefix || '';

    getSegmentLengths().forEach((_, idx) => {
      parsed[`segment${idx + 1}`] = (parts[idx + 1] || '').replace(/\D/g, '');
    });

    return parsed;
  };

  const resetUserIdParts = (prefix = currentFormat?.prefix || '') => {
    setUserIdParts({
      ...initialUserIdParts,
      prefix
    });
  };

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
  }, [isOpen, dataStore]);

  // Pre-fill form data when editing
  useEffect(() => {
    if (isOpen && isEditMode && editingUser) {
      const sourceRole = editingUser.role_type || editingUser.role || 'user';
      const normalizedRole = normalizeRole(sourceRole);
      const displayRole = normalizedRole === 'admin'
        ? 'Admin'
        : normalizedRole === 'system_admin'
          ? 'System Admin'
          : 'User';

      setFormData({
        userId: editingUser.id || editingUser.userId || '',
        firstName: editingUser.firstName || '',
        middleName: editingUser.middleName || '',
        lastName: editingUser.lastName || '',
        suffix: editingUser.suffix || '',
        email: editingUser.email || '',
        contactNumber: editingUser.userContact || editingUser.user_contact || '',
        birthdate: editingUser.userBirthdate || editingUser.user_birthdate || '',
        role: displayRole,
        organizationUnitId: editingUser.organizationUnitId || '',
        organizationPosition: editingUser.userPos || editingUser.organizationPosition || ''
      });
      setUserIdFormatValid(true);
      setStep(1); // Start at step 1 for editing
      setUserIdExists(false);
    } else if (isOpen && !isEditMode) {
      // Reset form for adding new user
      setFormData(initialUserForm);
      resetUserIdParts();
      setUserIdFormatValid(null);
      setUserIdExists(false);
      setStep(1);
    }
  }, [isOpen, isEditMode, editingUser]);

  useEffect(() => {
    if (!isOpen || !currentFormat) {
      return;
    }

    if (isEditMode && formData.userId) {
      setUserIdParts(splitUserIdIntoParts(formData.userId, formData.role));
      return;
    }

    resetUserIdParts(currentFormat.prefix || '');
  }, [isOpen, currentFormat, isEditMode]);

  // Get placeholder for user ID input
  const getPlaceholder = () => {
    if (!currentFormat) {
      return 'e.g., TUPM-01-0001';
    }
    const formatInfo = buildIdFormatPattern(currentFormat, getValidationRole());
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
    const result = validateUserId(userId, currentFormat, getValidationRole());
    setUserIdFormatValid(result.isValid);
    return result.isValid;
  };

  const handleUserIdSegmentChange = (segmentIndex, value) => {
    const segmentLengths = getSegmentLengths();
    const maxLength = segmentLengths[segmentIndex - 1] || 0;
    const normalizedValue = value.replace(/\D/g, '').slice(0, maxLength);

    const updatedParts = {
      ...userIdParts,
      [`segment${segmentIndex}`]: normalizedValue
    };

    setUserIdParts(updatedParts);

    const composedUserId = buildUserIdFromParts(updatedParts);
    setFormData((prev) => ({ ...prev, userId: composedUserId }));

    if (!isUserIdComplete(updatedParts)) {
      setUserIdFormatValid(null);
      setUserIdExists(false);
      return;
    }

    validateUserIdFormat(composedUserId);
    const exists = userList?.some((u) => (u.userId || u.id) === composedUserId);
    setUserIdExists(Boolean(exists));
  };

  // Generate password from last name
  const generatePassword = (lastName) => {
    const normalizedSurname = (lastName || 'USER').replace(/\s+/g, '').toUpperCase();
    return normalizedSurname + '123!';
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
      if (!isUserIdComplete(userIdParts)) {
        newErrors.userId = 'Please complete all User ID number segments';
      } else if (!formData.userId.trim()) {
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

    if (formData.middleName.trim() && formData.middleName.trim().length === 1) {
      newErrors.middleName = 'Middle name must be at least 2 characters if provided';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.organizationUnitId) {
      newErrors.organizationUnitId = 'Organization Unit is required';
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
        user_contact: formData.contactNumber || '',
        user_birthdate: formData.birthdate || null,
        password: password,
        role_type: normalizeRole(formData.role),
        org: formData.organizationUnitId || null,
        user_pos: formData.organizationPosition
      });

      console.log('User created successfully:', newUser);
      
      // Reset form
      setFormData(initialUserForm);
      resetUserIdParts();
      setPasswordData({
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setStep(1);
      setUserIdFormatValid(null);
      
      // Notify parent
      onUserAdded();
      setSuccessNotice({
        isOpen: true,
        title: 'User Created',
        lines: [
          'User created successfully.',
          `Default password: ${password}`,
          'Remind them to change password ASAP.'
        ]
      });
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
        user_contact: formData.contactNumber || '',
        user_birthdate: formData.birthdate || null,
        role_type: normalizeRole(formData.role),
        org: formData.organizationUnitId || null,
        user_pos: formData.organizationPosition
      });

      // Reset form
      setFormData(initialUserForm);
      resetUserIdParts();
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
      setFormData(initialUserForm);
      resetUserIdParts();
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
    <>
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
              setFormData(initialUserForm);
              resetUserIdParts();
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={userIdParts.prefix || currentFormat?.prefix || ''}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Prefix"
                />
                {getSegmentLengths().map((segmentLen, idx) => (
                  <input
                    key={`segment-${idx + 1}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={userIdParts[`segment${idx + 1}`]}
                    onChange={(e) => handleUserIdSegmentChange(idx + 1, e.target.value)}
                    disabled={isEditMode}
                    maxLength={segmentLen}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      isEditMode ? 'bg-gray-100 cursor-not-allowed' :
                      userIdExists ? 'border-red-500 focus:ring-red-500' :
                      errors.userId ? 'border-red-500 focus:ring-red-500' :
                      userIdFormatValid === true ? 'border-green-500 focus:ring-green-500' :
                      userIdFormatValid === false ? 'border-red-500 focus:ring-red-500' :
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={'#'.repeat(segmentLen)}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Separator for {formData.role}: <span className="font-medium">{getRoleSeparator()}</span>
              </p>
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
              {!isEditMode && <p className="mt-1 text-xs text-gray-500">{getFormatHint(currentFormat, getValidationRole())}</p>}
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
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.middleName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Michael"
                />
                {errors.middleName && <p className="mt-1 text-sm text-red-500">{errors.middleName}</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">System Privilege *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value, userId: '' });
                    resetUserIdParts(currentFormat?.prefix || '');
                    setUserIdFormatValid(null);
                    setUserIdExists(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="User">Standard Access</option>
                  <option value="Admin">Management Access</option>
                  <option value="System Admin">System Privilege</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={formData.contactNumber || ''}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 09171234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                <input
                  type="date"
                  value={formData.birthdate || ''}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Organization Fields */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Organization Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Unit *</label>
                  <select
                    value={formData.organizationUnitId || ''}
                    onChange={(e) => setFormData({ ...formData, organizationUnitId: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.organizationUnitId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Organization Unit</option>
                    {organizationTree && organizationTree.length > 0 && renderOrgUnitOptions(organizationTree)}
                  </select>
                  {errors.organizationUnitId && <p className="mt-1 text-sm text-red-500">{errors.organizationUnitId}</p>}
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
                  setFormData(initialUserForm);
                  resetUserIdParts();
                  setPasswordData({ password: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                disabled={isEditMode ? false : (userIdFormatValid !== true || userIdExists || !isUserIdComplete(userIdParts))}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditMode ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
      </div>
    </div>
    {successNotice.isOpen && (
      <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[60] p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-900">{successNotice.title}</h3>
            <button
              type="button"
              onClick={() => {
                setSuccessNotice({ isOpen: false, title: '', lines: [] });
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 space-y-2 text-gray-700">
            {successNotice.lines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setSuccessNotice({ isOpen: false, title: '', lines: [] });
                onClose();
              }}
              className="w-full rounded-lg bg-slate-800 text-white font-medium py-2.5 hover:bg-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

