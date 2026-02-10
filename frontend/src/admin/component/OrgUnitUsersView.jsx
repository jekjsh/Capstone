import { Users, Search, Mail, Phone, Briefcase, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function OrgUnitUsersView({ 
  organizationTree, 
  userList,
  onUserClick 
}) {
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeSubUnits, setIncludeSubUnits] = useState(false); // ✅ NEW: Toggle for sub-units
  const [detailsUser, setDetailsUser] = useState(null);

  const getUsersInUnit = (unitId, includeChildren = false) => {
    const users = userList.filter(user => user.organizationUnitId === unitId);
    
    if (includeChildren) {
      const getChildUsers = (nodes) => {
        let childUsers = [];
        for (const node of nodes) {
          childUsers = [...childUsers, ...userList.filter(user => user.organizationUnitId === node.id)];
          if (node.children && node.children.length > 0) {
            childUsers = [...childUsers, ...getChildUsers(node.children)];
          }
        }
        return childUsers;
      };

      const findNode = (nodes, id) => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const unit = findNode(organizationTree, unitId);
      if (unit && unit.children) {
        const childUsers = getChildUsers(unit.children);
        return [...users, ...childUsers];
      }
    }
    
    return users;
  };

  const getOrgUnitPath = (unitId) => {
    const findPath = (nodes, id, path = []) => {
      for (const node of nodes) {
        if (node.id === id) {
          return [...path, node.name];
        }
        if (node.children) {
          const found = findPath(node.children, id, [...path, node.name]);
          if (found) return found;
        }
      }
      return null;
    };
    return findPath(organizationTree, unitId);
  };

  const renderOrgUnitSelector = (nodes, level = 0) => {
    return nodes.map(node => {
      const directUsersCount = getUsersInUnit(node.id, false).length;
      const totalUsersCount = getUsersInUnit(node.id, true).length;
      
      return (
        <div key={node.id}>
          <button
            onClick={() => setSelectedUnitId(node.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              selectedUnitId === node.id 
                ? 'bg-indigo-100 border-2 border-indigo-500' 
                : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
            }`}
            style={{ marginLeft: `${level * 20}px`, width: `calc(100% - ${level * 20}px)` }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                level === 0 ? 'bg-blue-100' :
                level === 1 ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                <Briefcase className={`w-4 h-4 ${
                  level === 0 ? 'text-blue-600' :
                  level === 1 ? 'text-green-600' :
                  'text-purple-600'
                }`} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-800 text-sm">{node.name}</p>
                <p className="text-xs text-gray-500">{node.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                {directUsersCount} direct
              </span>
              {totalUsersCount > directUsersCount && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {totalUsersCount} total
                </span>
              )}
            </div>
          </button>
          {node.children && node.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {renderOrgUnitSelector(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const selectedUnit = selectedUnitId 
    ? organizationTree.find(function findNode(node) {
        if (node.id === selectedUnitId) return true;
        if (node.children) {
          return node.children.some(findNode);
        }
        return false;
      })
    : null;

 
 const displayedUsers = selectedUnitId 
  ? getUsersInUnit(selectedUnitId, includeSubUnits).filter(user => 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.organizationPosition && user.organizationPosition.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  : [];

const directUsers = selectedUnitId 
  ? getUsersInUnit(selectedUnitId, false).filter(user => 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.organizationPosition && user.organizationPosition.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Users by Organization</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage users within organizational units</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Tree Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Select Organization Unit</h3>
            {organizationTree.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No organization structure defined</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {renderOrgUnitSelector(organizationTree)}
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          {!selectedUnitId ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Select an Organization Unit</p>
              <p className="text-gray-400 text-sm">
                Choose a unit from the left to view its users
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Users in {getOrgUnitPath(selectedUnitId)?.join(' → ')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {directUsers.length} direct user(s)
                      {includeSubUnits && displayedUsers.length > directUsers.length && (
                        <>, {displayedUsers.length} total (including sub-units)</>
                      )}
                    </p>
                  </div>
                </div>

                {/*  Toggle for including sub-units */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSubUnits}
                      onChange={(e) => setIncludeSubUnits(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">
                        Include users from sub-units
                      </p>
                      <p className="text-xs text-blue-600">
                        {includeSubUnits 
                          ? 'Showing users from this unit AND all sub-units' 
                          : 'Showing ONLY direct users in this unit'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, ID, or position..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Users Grid */}
              <div className="p-6">
                {displayedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No users found</p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery 
                        ? 'Try adjusting your search criteria'
                        : includeSubUnits
                          ? 'No users assigned to this organizational unit or its sub-units'
                          : 'No users directly assigned to this organizational unit'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedUsers.map(user => {
                      const isDirect = user.organizationUnitId === selectedUnitId;
                      const userOrgPath = user.organizationUnitId ? getOrgUnitPath(user.organizationUnitId) : null;
                      
                      return (
                        <div 
                          key={user.id}
                          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            isDirect 
                              ? 'bg-indigo-50 border-indigo-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                             <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                             {user.firstName?.charAt(0) || 'U'}
                            </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-800 text-lg">
                                    {user.firstName} {user.lastName}
                                  </h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    user.role === 'Admin' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role}
                                  </span>
                                  {!isDirect && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                                      Sub-unit
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">ID: {user.id}</p>
                                
                                {user.organizationPosition && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-700">
                                      {user.organizationPosition}
                                    </span>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{user.jobTitle} - {user.department}</span>
                                  </div>
                                  {!isDirect && userOrgPath && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <ChevronRight className="w-3 h-3" />
                                      <span>From: {userOrgPath.join(' → ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setDetailsUser(user);
                                if (onUserClick) onUserClick(user);
                              }}
                              className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {detailsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">User Details</h3>
                <p className="text-sm text-gray-500">Complete profile information</p>
              </div>
              <button
                onClick={() => setDetailsUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {detailsUser.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {detailsUser.firstName} {detailsUser.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">User ID: {detailsUser.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.email || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.role || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Status</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.status || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Position</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.organizationPosition || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Job Title</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.jobTitle || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-gray-500 mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-800">{detailsUser.department || '—'}</p>
                </div>
              </div>

              {detailsUser.organizationUnitId && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs uppercase text-indigo-500 mb-1">Organization Path</p>
                  <p className="text-sm font-medium text-indigo-800">
                    {getOrgUnitPath(detailsUser.organizationUnitId)?.join(' → ') || '—'}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setDetailsUser(null)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
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