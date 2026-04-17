import { Search, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRoleDisplayName } from '../../utils/roleMapper';
import Pagination from '../../components/Pagination';

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
  canAddUser = true,
  openMenuUserId
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const filteredUsers = getFilteredUsers();
  
  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchQuery, userFilterRole, userFilterStatus, userFilterOrganization]);
  
  // Sorting function
  const sortedAndPaginatedUsers = (() => {
    let sorted = [...filteredUsers];
    
    // Sort based on field
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortField) {
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.isActive ? 'active' : 'inactive';
          bValue = b.isActive ? 'active' : 'inactive';
          break;
        default:
          aValue = '';
          bValue = '';
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply pagination
    return sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  })();
  
  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting
    setCurrentPage(1);
  };
  
  // Render sort indicator
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />;
  };
  
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
      const orgCode = org.org_code || org.code || '';
      
      if (orgId && orgCode) {
        units.push({ 
          id: orgId, 
          code: orgCode
        });
      }
      
      // Handle nested children if they exist
      if (org.sub_offices && Array.isArray(org.sub_offices)) {
        const processChildren = (children) => {
          children.forEach(child => {
            const childId = child.org_id || child.id;
            const childCode = child.org_code || child.code || '';
            if (childId && childCode) {
              units.push({
                id: childId,
                code: childCode
              });
            }
            if (child.sub_offices && Array.isArray(child.sub_offices)) {
              processChildren(child.sub_offices);
            }
          });
        };
        processChildren(org.sub_offices);
      }
    });
    
    return units;
  };
  
  const organizationUnits = getAllOrganizationUnits();

  const getRoleLevelDisplayName = (role) => {
    const normalizedRole = (role || '').toString().toLowerCase();
    if (normalizedRole === 'system_admin') return 'System Admin';
    if (normalizedRole === 'admin') return 'OU Admin';
    if (normalizedRole === 'user') return 'Regular User';
    return getRoleDisplayName(role);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          disabled={!canAddUser}
          className={`px-4 py-2 rounded-lg transition-colors ${
            canAddUser
              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          + Add New User
        </button>
      </div>

      {!canAddUser && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          User creation is locked. Configure an active User ID format first.
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Policy: Setting a user to Inactive disables login access while organization-owned records remain recoverable by authorized admins.
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role Level</label>
            <select
              value={userFilterRole}
              onChange={(e) => setUserFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Role Levels</option>
              <option value="system_admin">System Admin</option>
              <option value="admin">OU Admin</option>
              <option value="user">Regular User</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Organization Unit</label>
            <select
              value={userFilterOrganization}
              onChange={(e) => setUserFilterOrganization(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Organization Units</option>
              {organizationUnits.map(org => (
                <option key={org.id} value={org.id}>{org.code}</option>
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
                <th 
                  onClick={() => handleSort('id')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  User ID <SortIndicator field="id" />
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Full Name <SortIndicator field="name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th 
                  onClick={() => handleSort('email')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Email <SortIndicator field="email" />
                </th>
                <th 
                  onClick={() => handleSort('role')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Role Level <SortIndicator field="role" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization Unit</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Status <SortIndicator field="status" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedAndPaginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {userList.length === 0 
                      ? "No users found. Click 'Add New User' to create one."
                      : "No users match your search criteria. Try adjusting your filters."}
                  </td>
                </tr>
              ) : (
                sortedAndPaginatedUsers.map((user) => {
                  const userOrgId = typeof user.organizationUnitId === 'object'
                    ? (user.organizationUnitId?.org_id || user.organizationUnitId?.id || '')
                    : (user.organizationUnitId || '');

                  // Find organization code
                  const orgUnit = organizationUnits.find(org => String(org.id) === String(userOrgId));
                  const orgCode = orgUnit ? orgUnit.code : '';
                  
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
                      <td className="px-6 py-4 text-sm text-gray-900">{getRoleLevelDisplayName(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{orgCode || 'Unassigned'}</td>
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

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsers.length / rowsPerPage)}
          startIndex={(currentPage - 1) * rowsPerPage}
          endIndex={currentPage * rowsPerPage}
          rowsPerPage={rowsPerPage}
          totalRecords={filteredUsers.length}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          onFirstPage={() => setCurrentPage(1)}
          onLastPage={() => setCurrentPage(Math.ceil(filteredUsers.length / rowsPerPage))}
          onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => Math.min(Math.ceil(filteredUsers.length / rowsPerPage), prev + 1))}
        />
      )}
    </div>
  );
}
