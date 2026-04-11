import { Search, MoreVertical } from 'lucide-react';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function SystemAdminUserManagement({ 
  userList, 
  userSearchQuery, 
  setUserSearchQuery,
  userFilterRole,
  setUserFilterRole,
  userFilterStatus,
  setUserFilterStatus,
  userFilterOrganization,
  setUserFilterOrganization,
  organizationTree,
  getFilteredUsers,
  handleMenuClick,
  setShowAddUserModal,
  openMenuUserId
}) {
  const filteredUsers = getFilteredUsers();
  
  // Helper function to flatten organization tree
  const getAllOrganizationUnits = () => {
    const units = [];
    
    // If organizationTree is empty or null
    if (!organizationTree || organizationTree.length === 0) {
      return units;
    }
    
    // Process each organization
    organizationTree.forEach(org => {
      // Handle different backend response formats
      // Backend returns: org_id, org_name, org_code, org_type, parent_org
      const orgId = org.org_id || org.id;
      const orgName = org.org_name || org.name || org.org_code;
      
      if (orgId && orgName) {
        units.push({ 
          id: orgId, 
          name: orgName
        });
      }
      
      // Handle nested children if they exist
      if (org.sub_offices && Array.isArray(org.sub_offices)) {
        const processChildren = (children, parentName = '') => {
          children.forEach(child => {
            const childId = child.org_id || child.id;
            const childName = child.org_name || child.name || child.org_code;
            if (childId && childName) {
              units.push({
                id: childId,
                name: parentName ? `${parentName} > ${childName}` : childName
              });
            }
            if (child.sub_offices && Array.isArray(child.sub_offices)) {
              processChildren(child.sub_offices, childName);
            }
          });
        };
        processChildren(org.sub_offices, orgName);
      }
    });
    
    return units;
  };
  
  const organizationUnits = getAllOrganizationUnits();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          + Add New User
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search by User ID, Name, or Email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={userFilterRole}
              onChange={(e) => setUserFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={userFilterStatus}
              onChange={(e) => setUserFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Organization</label>
            <select
              value={userFilterOrganization}
              onChange={(e) => setUserFilterOrganization(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Organizations</option>
              {organizationUnits.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(userSearchQuery || userFilterRole !== 'All' || userFilterStatus !== 'All' || userFilterOrganization !== 'All') && (
          <button
            onClick={() => {
              setUserSearchQuery('');
              setUserFilterRole('All');
              setUserFilterStatus('All');
              setUserFilterOrganization('All');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All Filters
          </button>
        )}

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{userList.length}</span> users
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {userList.length === 0 
                      ? "No users found. Click 'Add New User' to create one."
                      : "No users match your search criteria. Try adjusting your filters."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  // Find organization name
                  const orgUnit = organizationUnits.find(org => org.id === user.organizationUnitId);
                  const orgName = orgUnit ? orgUnit.name : 'Unassigned';
                  
                  // Format full name with middle initial and suffix
                  const formatFullName = () => {
                    let fullName = user.firstName;
                    
                    if (user.middleName) {
                      const middleInitial = user.middleName.charAt(0).toUpperCase();
                      fullName += ` ${middleInitial}.`;
                    }
                    
                    fullName += ` ${user.lastName}`;
                    
                    if (user.suffix) {
                      fullName += ` ${user.suffix}`;
                    }
                    
                    return fullName;
                  };
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatFullName()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.userPos || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getRoleDisplayName(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{orgName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex justify-center">
                          <button 
                            onClick={(e) => handleMenuClick(user.id, e)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
