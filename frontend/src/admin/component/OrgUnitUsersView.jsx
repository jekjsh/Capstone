import { Users, Search, Briefcase, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function OrgUnitUsersView({ 
  organizationTree, 
  userList,
  organizations = []
}) {
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Build organization tree from flat list
  const orgTree = useMemo(() => {
    if (!organizations || organizations.length === 0) {
      return [];
    }
    
    const orgsMap = new Map();
    organizations.forEach(org => {
      orgsMap.set(org.org_id, {
        ...org,
        children: []
      });
    });
    
    const roots = [];
    organizations.forEach(org => {
      const orgNode = orgsMap.get(org.org_id);
      if (!org.parent_org) {
        roots.push(orgNode);
      } else {
        const parent = orgsMap.get(org.parent_org);
        if (parent) {
          parent.children.push(orgNode);
        }
      }
    });
    
    // Sort children for consistency
    const sortOrgs = (orgs) => {
      orgs.forEach(org => {
        org.children.sort((a, b) => a.org_name.localeCompare(b.org_name));
        if (org.children.length > 0) {
          sortOrgs(org.children);
        }
      });
    };
    
    sortOrgs(roots);
    roots.sort((a, b) => a.org_name.localeCompare(b.org_name));
    
    return roots;
  }, [organizations]);

  const getOrgMemberCount = (orgId) => {
    return userList.filter(u => u.org === orgId).length;
  };

  // Get users without organization
  const unassignedUsers = useMemo(() => {
    let users = userList.filter(u => !u.org);
    
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

  const assignUserToOrg = async (userId) => {
    try {
      // Call API to assign user to organization
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ org: selectedOrgId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign user to organization');
      }

      // Update local state
      const updatedUser = await response.json();
      console.log('User assigned successfully:', updatedUser);
      setMemberSearchQuery('');
      // Refresh user list or update locally
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user to organization');
    }
  };

  const renderOrgTree = (orgs, level = 0) => {
    return orgs.map(org => {
      const hasChildren = org.children && org.children.length > 0;
      const memberCount = getOrgMemberCount(org.org_id);
      const isSelected = selectedOrgId === org.org_id;
      const paddingLeft = level * 20;
      
      return (
        <div key={org.org_id} className="w-full">
          <button
            onClick={() => setSelectedOrgId(org.org_id)}
            className={`w-full px-3 py-2 rounded-lg transition-all text-left ${
              isSelected
                ? 'bg-indigo-100 border-2 border-indigo-500'
                : 'hover:bg-gray-100 border border-transparent'
            }`}
            title={org.org_name}
            style={{ paddingLeft: `calc(0.75rem + ${paddingLeft}px)` }}
          >
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{org.org_name}</p>
                <p className="text-xs text-gray-500">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </button>
          
          {hasChildren && (
            <div className="space-y-1 mt-1">
              {renderOrgTree(org.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Get users for selected organization
  const selectedOrgUsers = useMemo(() => {
    if (!selectedOrgId) return [];
    
    let users = userList.filter(user => user.org === selectedOrgId);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(user =>
        user.id.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.middle_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    return users;
  }, [selectedOrgId, userList, searchQuery]);

  const getSelectedOrgName = () => {
    if (!selectedOrgId) return '';
    
    const findOrgName = (orgs) => {
      for (const org of orgs) {
        if (org.org_id === selectedOrgId) {
          return org.org_name;
        }
        if (org.children && org.children.length > 0) {
          const found = findOrgName(org.children);
          if (found) return found;
        }
      }
      return '';
    };
    
    return findOrgName(orgTree) || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Users by Organization</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage users within organizations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Organizations</h3>
            {orgTree.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No organizations found</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {renderOrgTree(orgTree)}
              </div>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="lg:col-span-3">
          {!selectedOrgId ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Select an Organization</p>
              <p className="text-gray-400 text-sm">
                Choose an organization from the left to view its members
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      Members of {getSelectedOrgName()}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: {selectedOrgUsers.length} member{selectedOrgUsers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Members Grid */}
              <div className="p-6">
                {selectedOrgUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No members found</p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery 
                        ? 'Try adjusting your search criteria'
                        : 'No users assigned to this organization'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedOrgUsers.map(user => (
                      <div 
                        key={user.id}
                        className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {getInitials(user)}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1 mb-1">
                              <p className="text-xs font-medium text-gray-600">({user.id})</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm leading-tight">
                              {user.firstName} {user.middle_name && `${user.middle_name} `}{user.lastName}{user.suffix && ` ${user.suffix}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {user.email}
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600 font-medium">
                                Member since {formatDate(user.joinedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Add Member</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add to {getSelectedOrgName()}
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search Field */}
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

              {/* Users List */}
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
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => assignUserToOrg(user.id)}
                          className="ml-4 px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
                        >
                          Add
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
    </div>
  );
}