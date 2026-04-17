import { Users, Search, Briefcase, Plus, Trash2, MoreVertical, Eye, Edit } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Pagination from '../../components/Pagination';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function OrgUnitUsersView({
  userList,
  organizations = [],
  onRefreshUsers,
  loggedInUser,
  onViewUser = () => {},
  onEditUser = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionUserId, setOpenActionUserId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });

  const userRole = loggedInUser?.role_type || loggedInUser?.role || 'user';
  const userOrgId = loggedInUser?.org || loggedInUser?.full_data?.org;

  const viewingOrganization = useMemo(() => {
    if (userRole === 'admin') {
      if (!userOrgId) return null;
      return organizations.find((org) => String(org.org_id) === String(userOrgId));
    }
    return null;
  }, [userRole, userOrgId, organizations]);

  const getOrgName = () => {
    if (viewingOrganization) return viewingOrganization.org_name;
    return 'Organization';
  };

  const organizationUsers = useMemo(() => {
    if (userRole === 'admin') {
      if (!userOrgId) return [];
      return userList.filter((user) => {
        if (user.role_type === 'system_admin' || user.role === 'system_admin') return false;
        const orgId = user.organizationUnitId ?? user.org;
        return String(orgId || '') === String(userOrgId);
      });
    }

    if (userRole === 'system_admin') {
      return userList.filter((user) => user.role_type !== 'system_admin' && user.role !== 'system_admin');
    }

    return [];
  }, [userRole, userOrgId, userList]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return organizationUsers.filter((user) => {
      const userStatus = user.isActive ? 'ACTIVE' : 'INACTIVE';
      const userRoleValue = (user.role || user.role_type || '').toLowerCase();
      const fullName = [user.firstName, user.middleName, user.middle_name, user.lastName, user.suffix]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        user.id?.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        user.email?.toLowerCase().includes(query);

      const matchesRole = filterRole === 'All' || userRoleValue === filterRole.toLowerCase();
      const matchesStatus = filterStatus === 'All' || userStatus === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [organizationUsers, searchQuery, filterRole, filterStatus]);

  const unassignedUsers = useMemo(() => {
    let users = userList.filter((u) => {
      const orgId = u.organizationUnitId ?? u.org;
      return !orgId && u.role_type !== 'system_admin' && u.role !== 'system_admin';
    });

    if (memberSearchQuery) {
      const query = memberSearchQuery.toLowerCase();
      users = users.filter(
        (user) =>
          user.id?.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

    return users;
  }, [userList, memberSearchQuery]);

  const totalRecords = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterStatus, rowsPerPage]);

  useEffect(() => {
    const closeMenu = () => setOpenActionUserId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const assignUserToOrg = async (userId) => {
    setIsAddingUser(true);
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ org: userOrgId }),
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
        type: 'success',
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
        type: 'error',
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
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ org: null }),
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
        type: 'success',
      });

      setShowRemoveConfirm(false);
      setUserToRemove(null);
      setOpenActionUserId(null);

      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error unassigning user:', error);
      setNotification({
        show: true,
        message: 'Failed to remove user from organization',
        type: 'error',
      });

      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'error' });
      }, 3000);
    } finally {
      setIsRemovingUser(false);
    }
  };

  const formatFullName = (user) => {
    const middleRaw = user.middleName || user.middle_name || '';
    const middleInitial = middleRaw ? `${String(middleRaw).trim().charAt(0).toUpperCase()}.` : '';
    return [user.firstName, middleInitial, user.lastName, user.suffix].filter(Boolean).join(' ') || 'N/A';
  };

  const handleActionMenuClick = (userId, event) => {
    event.stopPropagation();

    if (openActionUserId === userId) {
      setOpenActionUserId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 150;

    let top = Math.min(rect.bottom + 6, window.innerHeight - menuHeight - 10);
    let left = Math.min(rect.left, window.innerWidth - menuWidth - 10);

    if (rect.bottom + menuHeight > window.innerHeight - 10) {
      top = Math.max(10, rect.top - menuHeight - 6);
    }

    if (rect.left + menuWidth > window.innerWidth - 10) {
      left = Math.max(10, rect.right - menuWidth);
    }

    setActionMenuPosition({ top, left });
    setOpenActionUserId(userId);
  };

  const canUnassign = (user) => {
    return userRole === 'admin' && (user.role_type === 'user' || user.role === 'user');
  };

  return (
    <div className="space-y-6">
      {notification.show && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 z-40 animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.type === 'success' ? <span className="text-lg">✓</span> : <span className="text-lg">✕</span>}
          <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-800">Users within {getOrgName()}</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage users in your organization</p>
      </div>

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
              {viewingOrganization.org_desc && <p className="text-sm text-gray-500 mt-2">{viewingOrganization.org_desc}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-600">{organizationUsers.length}</p>
              <p className="text-xs text-gray-500 mt-1">member{organizationUsers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Members</h3>
            <p className="text-sm text-gray-500 mt-1">Total: {totalRecords} member{totalRecords !== 1 ? 's' : ''}</p>
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

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Policy: Setting a user to INACTIVE disables login access while organization-owned records remain recoverable by authorized admins.
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID, Name, or Email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {(searchQuery || filterRole !== 'All' || filterStatus !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterRole('All');
              setFilterStatus('All');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All Filters
          </button>
        )}

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{totalRecords === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold">{totalRecords}</span> users
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {totalRecords === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No members found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatFullName(user)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.userPos || user.organizationPosition || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getRoleDisplayName(user.role || user.role_type)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <button
                        onClick={(event) => handleActionMenuClick(user.id, event)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openActionUserId === user.id && (
                        <div
                          className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                          style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onViewUser(user.id);
                              setOpenActionUserId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View profile
                          </button>

                          <button
                            onClick={() => {
                              onEditUser(user.id);
                              setOpenActionUserId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit user
                          </button>

                          {canUnassign(user) && (
                            <button
                              onClick={() => {
                                setUserToRemove(user);
                                setShowRemoveConfirm(true);
                                setOpenActionUserId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Unassign
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        rowsPerPage={rowsPerPage}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setCurrentPage(1);
        }}
        onFirstPage={() => setCurrentPage(1)}
        onLastPage={() => setCurrentPage(totalPages)}
        onPreviousPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
      />

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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                x
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
                    {unassignedUsers.map((user) => (
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
                              {[user.firstName, user.middleName, user.lastName, user.suffix].filter(Boolean).join(' ') || 'N/A'}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">Unassign Member?</h3>
              <p className="text-sm text-gray-500 mt-2">
                You are about to unassign <span className="font-semibold">{userToRemove.firstName} {userToRemove.lastName}</span> from{' '}
                <span className="font-semibold">{getOrgName()}</span>.
              </p>
            </div>

            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <p className="text-sm text-yellow-800">
                This action will unassign the user from the organization. They will become unassigned and can be reassigned elsewhere.
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
