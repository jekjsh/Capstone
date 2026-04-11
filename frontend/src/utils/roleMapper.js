/**
 * Role Display Mapper
 * Maps backend role values to human-readable display names
 */

/**
 * Get display name for a role
 * @param {string} role - The role value (system_admin, admin, user)
 * @returns {string} - Human-readable role name
 */
export const getRoleDisplayName = (role) => {
  if (!role) return 'Unknown';
  
  const roleMap = {
    'system_admin': 'IS Manager',
    'admin': 'Organization Head',
    'user': 'Employee',
    'System Admin': 'IS Manager',
    'Admin': 'Organization Head',
    'User': 'Employee'
  };

  return roleMap[role] || role;
};

/**
 * Get role color/style for badges
 * @param {string} role - The role value
 * @returns {string} - Tailwind CSS classes for styling
 */
export const getRoleColor = (role) => {
  if (!role) return 'bg-gray-100 text-gray-800';

  const roleColorMap = {
    'system_admin': 'bg-purple-100 text-purple-800',
    'admin': 'bg-blue-100 text-blue-800',
    'user': 'bg-green-100 text-green-800',
    'System Admin': 'bg-purple-100 text-purple-800',
    'Admin': 'bg-blue-100 text-blue-800',
    'User': 'bg-green-100 text-green-800'
  };

  return roleColorMap[role] || 'bg-gray-100 text-gray-800';
};
