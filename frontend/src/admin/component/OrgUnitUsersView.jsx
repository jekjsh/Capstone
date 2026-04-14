import { Users, Search, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import Pagination from '../../components/Pagination';

export default function OrgUnitUsersView({ 
  organizationTree, 
  userList,
  organizations = [],
  onRefreshUsers,
  loggedInUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Determine role type
  const userRole = loggedInUser?.role_type || loggedInUser?.role || 'user';
  const userOrgId = loggedInUser?.org || loggedInUser?.full_data?.org;

  // Get the organization to display
  const viewingOrganization = useMemo(() => {
    if (userRole === 'system_admin') {
      return null;
    } else if (userRole === 'admin') {
      if (!userOrgId) return null;
      return organizations.find(org => org.org_id === userOrgId);
    }
    return null;
  }, [userRole, userOrgId, organizations]);

  // Get organization name
  const getOrgName = () => {
    if (viewingOrganization) {
      return viewingOrganization.org_name;
    }
    return 'Organization';
  };

  // Get users in the organization being viewed
  const organizationUsers = useMemo(() => {
    if (userRole === 'admin') {
      if (!userOrgId) return [];
      return userList.filter(user => user.org === userOrgId);
    } else if (userRole === 'system_admin') {
      return userList;
    }
    return [];
  }, [userRole, userOrgId, userList]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    let users = organizationUsers;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(user =>
        user.id?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.middle_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    return users;
  }, [organizationUsers, searchQuery]);

  // Get unassigned users for the Add Member modal
  const unassignedUsers = useMemo(() => {
    let users = userList.filter(u => !u.org && u.role_type !== 'system_admin');
    
    if (memberSearchQuery) {
      const query = memberSearchQuery.toLowerCase();
      users = users.filter(user =>
        user.id?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    return users;
  }, [userList, memberSearchQuery]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const assignUserToOrg = async (userId) => {
    setIsAddingUser(true);
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ org: userOrgId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign user to organization');
      }

      const updatedUser = await response.json();
      
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
      
      setNotification({
        show: true,
        message: `${updatedUser.first_name || updatedUser.firstName} ${updatedUser.last_name || updatedUser.lastName} has been added successfully!`,
        type: 'success'
      });
      
      setMemberSearchQuery('');
      setShowAddMemberModal(false);
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error assigning user:', error);
      setNotification({
        show: true,
        message: 'Failed to add user to organization',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'error' });
      }, 3000);
    } finally {
      setIsAddingUser(false);
    }
  };

  const unassignUserFromOrg = async (userId) => {
    setIsRemovingUser(true);
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ org: null })
      });

      if (!response.ok) {
        throw new Error('Failed to unassign user from organization');
      }

      const updatedUser = await response.json();
      
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
      
      setNotification({
        show: true,
        message: `${updatedUser.first_name || updatedUser.firstName} ${updatedUser.last_name || updatedUser.lastName} has been removed successfully!`,
        type: 'success'
      });
      
      setShowRemoveConfirm(false);
      setUserToRemove(null);
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error unassigning user:', error);
      setNotification({
        show: true,
        message: 'Failed to remove user from organization',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'error' });
      }, 3000);
    } finally {
      setIsRemovingUser(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const getInitials = (user) => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 z-40 animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        }`}>
          {notification.type === 'success' ? (
            <span className="text-lg">✓</span>
          ) : (
            <span className="text-lg">✕</span>
          )}
          <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {userRole === 'admin' ? `Users within ${getOrgName()}` : 'Users by Organization'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {userRole === 'admin' 
            ? `View and manage users in your organization`
            : 'View and manage users within organizations'}
        </p>
      </div>

      {/* Organization Card */}
      {userRole === 'admin' && viewingOrganization && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{viewingOrganization.org_name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {viewingOrganization.org_type ? `Type: ${viewingOrganization.org_type}` : 'Organization details'}
              </p>
              {viewingOrganization.org_desc && (
                <p className="text-sm text-gray-500 mt-2">{viewingOrganization.org_desc}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-600">{organizationUsers.length}</p>
              <p className="text-xs text-gray-500 mt-1">member{organizationUsers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users List Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Members</h3>
              <p className="text-sm text-gray-500 mt-1">Total: {filteredUsers.length} member{filteredUsers.length !== 1 ? 's' : ''}</p>
            </div>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No members found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'No users assigned to this organization'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(user)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.firstName} {user.middle_name && `${user.middle_name} `}{user.lastName}{user.suffix && ` ${user.suffix}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {user.id}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' || user.role_type === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'user' || user.role_type === 'user'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {user.role || user.role_type || 'User'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.joinedAt || user.joined_at)}
                    </td>

                    <td className="px-6 py-4 text-sm text-right">
                      {userRole === 'admin' && (user.role_type === 'user' || user.role === 'user') && (
                        <button
                          onClick={() => {
                            setUserToRemove(user);
                            setShowRemoveConfirm(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Unassign from organization"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-medium">Unassign</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Outside the box */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsers.length / rowsPerPage)}
          startIndex={(currentPage - 1) * rowsPerPage}
          endIndex={Math.min(currentPage * rowsPerPage, filteredUsers.length)}
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

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMemberModal(false);
              setMemberSearchQuery('');
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Add Member</h3>
                <p className="text-sm text-gray-500 mt-1">Add to {getOrgName()}</p>
              </div>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setMemberSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search users by name, ID, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                {unassignedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-1">No unassigned users found</p>
                    <p className="text-gray-400 text-xs">
                      {memberSearchQuery ? 'Try a different search term' : 'All users are already assigned to organizations'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {unassignedUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">
                              {[user.firstName, user.middleName, user.lastName, user.suffix]
                                .filter(Boolean)
                                .join(' ') || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">ID: {user.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => assignUserToOrg(user.id)}
                          disabled={isAddingUser}
                          className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingUser ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setMemberSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveConfirm && userToRemove && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRemoveConfirm(false);
              setUserToRemove(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">Unassign Member?</h3>
              <p className="text-sm text-gray-500 mt-2">
                You are about to unassign <span className="font-semibold">{userToRemove.firstName} {userToRemove.lastName}</span> from <span className="font-semibold">{getOrgName()}</span>.
              </p>
            </div>

            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ This action will unassign the user from the organization. They will become unassigned and can be reassigned elsewhere.
              </p>
            </div>

            <div className="p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setUserToRemove(null);
                }}
                disabled={isRemovingUser}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => unassignUserFromOrg(userToRemove.id)}
                disabled={isRemovingUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemovingUser ? 'Unassigning...' : 'Unassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}