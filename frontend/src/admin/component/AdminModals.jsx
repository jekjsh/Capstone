
import { X, Edit, Trash2, Key } from 'lucide-react';
import { useState, useEffect } from 'react';

export function UserActionMenu({ 
  openMenuUserId, 
  menuPosition, 
  setOpenMenuUserId, 
  handleEditUser, 
  handleEditPassword, 
  handleDeleteUser 
}) {
  if (!openMenuUserId) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      <div 
        className="absolute inset-0" 
        onClick={() => setOpenMenuUserId(null)}
        style={{ pointerEvents: 'auto' }}
      />
      <div 
        className="absolute w-56 bg-white rounded-lg shadow-2xl border border-gray-200 py-2"
        style={{ 
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => handleEditUser(openMenuUserId)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <Edit className="w-4 h-4 text-blue-600" />
          <span>Edit Personal Info</span>
        </button>
        <button
          onClick={() => handleEditPassword(openMenuUserId)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <Key className="w-4 h-4 text-green-600" />
          <span>Edit Password</span>
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button
          onClick={() => handleDeleteUser(openMenuUserId)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete User</span>
        </button>
      </div>
    </div>
  );
}


export function AdminVerificationModal({
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
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Security Check:</strong> Please enter your admin password to proceed with this action.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
            <input
              type="password"
              value={adminVerificationPassword}
              onChange={(e) => setAdminVerificationPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyAdmin()}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.adminPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Enter admin password"
              autoFocus
            />
            {errors.adminPassword && <p className="mt-1 text-sm text-red-500">{errors.adminPassword}</p>}
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

export function AddUserModal({
  showAddUserModal,
  setShowAddUserModal,
  editingUserId,
  setEditingUserId,
  newUser,
  setNewUser,
  handleUserIdChange,
  userIdFormatValid,
  errors,
  setErrors,
  setUserIdFormatValid,
  handleAddUser,
  userList,
  organizationTree,
  renderOrgUnitOptions,
   dataStore
}) {
 
   const [currentFormat, setCurrentFormat] = useState(null);
    useEffect(() => {
    if (showAddUserModal && dataStore) {
      const format = dataStore.getUserIdFormat ? dataStore.getUserIdFormat() : null;
      setCurrentFormat(format);
    }
  }, [showAddUserModal, dataStore, newUser.role]);
   if (!showAddUserModal) return null;
 const getPlaceholder = () => {
    if (currentFormat) {
      if (currentFormat.format.customFormat) {
        return newUser.role === 'Admin' ? currentFormat.customPattern.admin : currentFormat.customPattern.user;
      } else {
        const separator = newUser.role === 'Admin' ? currentFormat.format.adminSeparator : currentFormat.format.userSeparator;
        let id = currentFormat.format.prefix;
        for (let i = 0; i < currentFormat.format.segmentCount; i++) {
          id += separator + 'X'.repeat(currentFormat.format.segmentLength[i] || 2);
        }
        return `e.g., ${id}`;
      }
    }
    return newUser.role === 'Admin' ? 'e.g., TUPM_01_0001' : 'e.g., TUPM-01-0001';
  };

  const getFormatHint = () => {
    if (currentFormat) {
      if (currentFormat.format.customFormat) {
        return `🔹 Pattern: ${newUser.role === 'Admin' ? currentFormat.customPattern.admin : currentFormat.customPattern.user}`;
      } else {
        const separator = newUser.role === 'Admin' ? currentFormat.format.adminSeparator : currentFormat.format.userSeparator;
        const sepName = separator === '_' ? 'underscores' : separator === '-' ? 'hyphens' : separator === '.' ? 'dots' : 'no separator';
        return `🔹 ${currentFormat.format.prefix} with ${sepName}, ${currentFormat.format.segmentCount} segment(s)`;
      }
    }
    return newUser.role === 'Admin' 
      ? '🔹 Admin format: TUPM_XX_XXXX (with underscores, XX must be numbers)' 
      : '🔹 User format: TUPM-XX-XXXX (with hyphens, XX must be numbers)';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingUserId ? 'Edit User Information' : 'Add New User'}
          </h2>
          <button 
            onClick={() => {
              setShowAddUserModal(false);
              setErrors({});
              setUserIdFormatValid(null);
              setEditingUserId(null);
              setNewUser({ 
                userId: '', 
                firstName: '', 
                lastName: '', 
                email: '', 
                role: 'User', 
                organizationUnitId: '', 
                organizationPosition: '' 
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {editingUserId ? (
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Editing user:</strong> {editingUserId}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID *</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={newUser.userId} 
                  onChange={(e) => handleUserIdChange(e.target.value)} 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.userId ? 'border-red-500 focus:ring-red-500' : 
                    userIdFormatValid === true ? 'border-green-500 focus:ring-green-500' :
                    userIdFormatValid === false ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-indigo-500'
                  }`} 
                placeholder={getPlaceholder()}
                />
                {userIdFormatValid === true && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">✓</span>
                )}
                {userIdFormatValid === false && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 font-bold">✗</span>
                )}
              </div>
              {errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
              {userIdFormatValid === false && !errors.userId && (
                 <p className="mt-1 text-sm text-red-500">
                  ⚠️ Invalid format! Expected: {getPlaceholder()}
                </p>
              )}
              {userIdFormatValid === true && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Format is correct!
                </p>
              )}
               <p className="mt-1 text-xs text-gray-500">
                {getFormatHint()}  {/* DYNAMIC HINT */}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g., John"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g., Doe"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g., john.doe@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Role */}
            {!editingUserId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => { 
                    setNewUser({ ...newUser, role: e.target.value, userId: '' }); 
                    setUserIdFormatValid(null); 
                  }} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Changing role will clear the User ID field
                </p>
              </div>
            )}
          </div>

          {/* ORGANIZATION FIELDS */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Organization Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Unit *</label>
                <select
                  value={newUser.organizationUnitId || ''}
                  onChange={(e) => setNewUser({ ...newUser, organizationUnitId: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.organizationUnitId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">Select Organization Unit</option>
                  {organizationTree && organizationTree.length > 0 && renderOrgUnitOptions(organizationTree)}
                </select>
                {errors.organizationUnitId && <p className="mt-1 text-sm text-red-500">{errors.organizationUnitId}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  The organizational unit where this user belongs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position/Title in Organization</label>
                <input
                  type="text"
                  value={newUser.organizationPosition || ''}
                  onChange={(e) => setNewUser({ ...newUser, organizationPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., President, Dean, Faculty Member"
                />
                <p className="mt-1 text-xs text-gray-500">
                  User's position/title within their organizational unit
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowAddUserModal(false);
              setErrors({});
              setUserIdFormatValid(null);
              setEditingUserId(null);
              setNewUser({ 
                userId: '', 
                firstName: '', 
                lastName: '', 
                email: '', 
                role: 'User', 
                organizationUnitId: '', 
                organizationPosition: '' 
              });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUser}
            disabled={!editingUserId && userIdFormatValid !== true}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingUserId ? 'Update User' : 'Next: Set Password'}
          </button>
        </div>
        {!editingUserId && userIdFormatValid !== true && newUser.userId && (
          <p className="mt-2 text-xs text-center text-red-600 font-medium">
            ⚠️ Please correct the User ID format to proceed
          </p>
        )}
      </div>
    </div>
  );
}


export function PasswordModal({
  showPasswordModal,
  showEditPasswordModal,
  setShowPasswordModal,
  setShowAddUserModal,
  tempUserData,
  passwordData,
  setPasswordData,
  errors,
  setErrors,
  handleSaveUser
}) {
  if (!showPasswordModal || showEditPasswordModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Set Password</h2>
          <button 
            onClick={() => {
              setShowPasswordModal(false);
              setShowAddUserModal(true);
              setErrors({});
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Creating account for:</span>
          </p>
          {/* Display First + Last Name */}
          <p className="text-sm text-gray-900 font-medium">
            {tempUserData?.firstName} {tempUserData?.lastName}
          </p>
          <p className="text-xs text-gray-600">{tempUserData?.userId}</p>
          <p className="text-xs text-gray-600 mt-1">{tempUserData?.email}</p>
          <p className="text-xs text-gray-600 mt-2">Role: {tempUserData?.role}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Enter password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            <div className="mt-2 text-xs text-gray-600">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={passwordData.password.length >= 8 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 8 characters
                </li>
                <li className={/[A-Z]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 uppercase letter (A-Z)
                </li>
                <li className={/[a-z]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 lowercase letter (a-z)
                </li>
                <li className={/[0-9]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 digit (0-9)
                </li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 symbol (!@#$%^&*...)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setShowAddUserModal(true);
              setErrors({});
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSaveUser}
            disabled={!passwordData.password || !passwordData.confirmPassword || 
              passwordData.password.length < 8 || 
              !/[A-Z]/.test(passwordData.password) || 
              !/[a-z]/.test(passwordData.password) || 
              !/[0-9]/.test(passwordData.password) || 
              !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.password) ||
              passwordData.password !== passwordData.confirmPassword
            }
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditPasswordModal({
  showEditPasswordModal,
  showAdminVerificationModal,
  setShowEditPasswordModal,
  setEditingUserId,
  editingUserId,
  userList,
  passwordData,
  setPasswordData,
  errors,
  setErrors,
  handleSaveUser
}) {
  if (!showEditPasswordModal || showAdminVerificationModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
          <button 
            onClick={() => {
              setShowEditPasswordModal(false);
              setEditingUserId(null);
              setPasswordData({ password: '', confirmPassword: '' });
              setErrors({});
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Changing password for:</span>
          </p>
          <p className="text-sm text-gray-900 font-medium">
            {userList.find(u => u.id === editingUserId)?.name}
          </p>
          <p className="text-xs text-gray-600">{editingUserId}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Enter new password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            <div className="mt-2 text-xs text-gray-600">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={passwordData.password.length >= 8 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 8 characters
                </li>
                <li className={/[A-Z]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 uppercase letter (A-Z)
                </li>
                <li className={/[a-z]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 lowercase letter (a-z)
                </li>
                <li className={/[0-9]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 digit (0-9)
                </li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.password) ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  ✓ At least 1 symbol (!@#$%^&*...)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Re-enter new password"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowEditPasswordModal(false);
              setEditingUserId(null);
              setPasswordData({ password: '', confirmPassword: '' });
              setErrors({});
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveUser}
            disabled={!passwordData.password || !passwordData.confirmPassword || 
              passwordData.password.length < 8 || 
              !/[A-Z]/.test(passwordData.password) || 
              !/[a-z]/.test(passwordData.password) || 
              !/[0-9]/.test(passwordData.password) || 
              !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.password) ||
              passwordData.password !== passwordData.confirmPassword
            }
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}