import { X, Share2, Users, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { documentShareAPI } from '../../services/api';

export default function ShareDocumentModal({ 
  show, 
  onClose, 
  document, 
  allUsers, 
  organizationTree = [],
  currentUser,
  onShareDocument,
  onSharesUpdated,
  allowOrgSharing = true,
  onRequestApproval
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlySharedWith, setCurrentlySharedWith] = useState([]);
  const [shareMap, setShareMap] = useState({}); // Map of userId -> share_id for easy deletion
  const [shareScope, setShareScope] = useState('users');
  const [selectedOrgIds, setSelectedOrgIds] = useState([]);

  const getUserIndexValue = (user) => String(user?.user_index ?? user?.userIndex ?? user?.id ?? '');
  const getUserOrgValue = (user) => String(user?.org ?? user?.organizationUnitId ?? user?.org_id ?? user?.organization?.org_id ?? '');
  const getUserDisplayValue = (user) => {
    const first = user?.first_name || user?.firstName || '';
    const last = user?.last_name || user?.lastName || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || user?.name || user?.user_id || user?.id || '';
  };
  const getUserEmailValue = (user) => user?.email_add || user?.email || '';

  const findUserById = (value) => {
    const normalized = String(value);
    return allUsers.find(
      (u) =>
        getUserIndexValue(u) === normalized ||
        String(u.user_id ?? '') === normalized ||
        String(u.id ?? '') === normalized
    );
  };

  const getUserDisplayName = (value) => {
    const user = findUserById(value);
    if (!user) return `User ${value}`;
    const fullName = getUserDisplayValue(user);
    return fullName || user.name || user.user_id || `User ${value}`;
  };

  // Fetch existing shares for this document
  useEffect(() => {
    const fetchExistingShares = async () => {
      if (!show || !document) return;
      
      try {
        const shares = await documentShareAPI.getAll();
        const currentDocId = document.doc_id || document.id;
        // Filter shares for this specific document
        const docShares = shares.filter(share => String(share.doc) === String(currentDocId));
        // Extract the user_index of users this document is shared with
        const sharedUserIds = docShares.map(share => String(share.shared_to_user));
        const map = {};
        docShares.forEach(share => {
          map[String(share.shared_to_user)] = share.share_id;
        });

        const sharedOrgIds = Array.from(
          new Set(
            sharedUserIds
              .map((sharedId) => {
                const matched = findUserById(sharedId);
                return matched ? getUserOrgValue(matched) : '';
              })
              .filter(Boolean)
          )
        );

        setCurrentlySharedWith(sharedUserIds);
        setSelectedUsers(sharedUserIds);
        setSelectedOrgIds(sharedOrgIds);
        setShareMap(map);
      } catch (error) {
        console.error('Failed to fetch existing shares:', error);
      }
    };

    fetchExistingShares();
  }, [show, document, allUsers]);

  // Allow sharing across all organization units; exclude current user.
  const availableUsers = allUsers.filter(user => 
    getUserIndexValue(user) !== String(currentUser?.user_index ?? currentUser?.id ?? '') &&
    String(user?.role_type || '').toLowerCase() !== 'system_admin'
  );
  
  // Filter based on search
  const filteredUsers = availableUsers.filter(user => {
    const displayName = getUserDisplayValue(user).toLowerCase().trim();
    const username = String(user.user_id || user.id || '').toLowerCase();
    const email = String(getUserEmailValue(user)).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return displayName.includes(searchLower) || 
           username.includes(searchLower) || 
           email.includes(searchLower);
  });

  const flattenedOrgUnits = (() => {
    const units = [];
    const walk = (nodes = []) => {
      nodes.forEach((node) => {
        const id = node.org_id || node.id;
        if (id) {
          units.push({
            id,
            name: node.org_name || node.name || `Org ${id}`,
            code: node.org_code || '',
          });
        }
        const children = node.sub_offices || node.children || [];
        if (children.length) walk(children);
      });
    };
    walk(organizationTree || []);
    return units;
  })();

  const effectiveSelectedUsers = shareScope === 'users'
    ? selectedUsers
    : Array.from(
        new Set(
          availableUsers
            .filter((user) => selectedOrgIds.includes(getUserOrgValue(user)))
            .map((user) => getUserIndexValue(user))
        )
      );

  const handleToggleOrg = (orgId) => {
    const normalized = String(orgId);
    setSelectedOrgIds((prev) =>
      prev.includes(normalized) ? prev.filter((id) => id !== normalized) : [...prev, normalized]
    );
  };

  const handleToggleUser = (userId) => {
    const normalizedUserId = String(userId);
    setSelectedUsers(prev => 
      prev.includes(normalizedUserId) 
        ? prev.filter(id => id !== normalizedUserId)
        : [...prev, normalizedUserId]
    );
  };

  if (!show || !document) return null;

  const handleShare = async () => {
    setIsLoading(true);
    try {
      // Determine who to unshare with (were shared before, not selected now)
      const usersToUnshare = currentlySharedWith.filter(userId => !effectiveSelectedUsers.includes(String(userId)));
      
      // Determine who to share with (not shared before, selected now)
      const usersToShare = effectiveSelectedUsers.filter(userId => !currentlySharedWith.includes(String(userId)));

      // Handle unsharing (delete operations)
      for (const userId of usersToUnshare) {
        const shareId = shareMap[String(userId)];
        if (shareId) {
          await documentShareAPI.delete(shareId);
        }
      }

      // Handle new shares
      if (usersToShare.length > 0) {
        const normalizedRecipients = usersToShare
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));

        await onShareDocument({
          documentId: document.doc_id || document.id,
          sharedWith: normalizedRecipients,
          shareScope,
          selectedUnits: selectedOrgIds,
          shareAllUnits: false,
          message: shareMessage,
          sharedBy: currentUser.user_index,
          sharedAt: new Date().toISOString()
        });
      } else if (usersToUnshare.length > 0) {
        // Only unsharing, no new shares
        const recipientNames = usersToUnshare
          .map(userId => getUserDisplayName(userId))
          .join(', ');
        
        alert(`Document "${document.doc_name || document.title}" unshared from ${recipientNames}`);
      }

      if (usersToShare.length > 0 || usersToUnshare.length > 0) {
        await onSharesUpdated?.();
      }

      // Reset form
      setSelectedUsers([]);
      setShareMessage('');
      setSearchQuery('');
      setSelectedOrgIds([]);
      setCurrentlySharedWith([]);
      setShareMap({});
      onClose();
    } catch (error) {
      alert('Failed to update document shares: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Share To</h2>
              <p className="text-sm text-gray-500">{document.doc_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a message for the recipient..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Target
            </label>
            <div className={`grid gap-2 mb-3 ${allowOrgSharing ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                onClick={() => setShareScope('users')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${shareScope === 'users' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                Users
              </button>
              {allowOrgSharing && (
                <button
                  onClick={() => setShareScope('organization')}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium ${shareScope === 'organization' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                  Organization Units
                </button>
              )}
            </div>

            {shareScope === 'organization' && allowOrgSharing && (
              <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">
                  Select organization units that should receive this file.
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                  {flattenedOrgUnits.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No organization units found.</p>
                  ) : (
                    flattenedOrgUnits.map((org) => (
                      <label key={org.id} className="flex items-center gap-2 p-2 text-sm hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOrgIds.includes(String(org.id))}
                          onChange={() => handleToggleOrg(org.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                        <span className="text-gray-800">{org.name}</span>
                        {org.code && <span className="text-xs text-gray-500">({org.code})</span>}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">Recipients: {effectiveSelectedUsers.length}</p>
              </div>
            )}

            {shareScope === 'users' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Users to Share With ({selectedUsers.length} selected)
                </label>
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* User List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No users in your organization to share with</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No users found matching your search</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <label
                        key={getUserIndexValue(user)}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                          checked={selectedUsers.includes(getUserIndexValue(user))}
                          onChange={() => handleToggleUser(getUserIndexValue(user))}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {(getUserDisplayValue(user) || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{getUserDisplayValue(user) || '-'}</p>
                          <p className="text-sm text-gray-500">{getUserEmailValue(user) || '-'}</p>
                        </div>
                      </div>
                      {selectedUsers.includes(getUserIndexValue(user)) && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Selected
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
              </>
            )}
          </div>

          {/* Selected Users Summary */}
          {effectiveSelectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Sharing with {effectiveSelectedUsers.length} user{effectiveSelectedUsers.length > 1 ? 's' : ''}:
              </p>
              {shareScope === 'users' ? <div className="flex flex-wrap gap-2">
                {effectiveSelectedUsers.map(userId => {
                  const displayName = getUserDisplayName(userId);
                  return (
                    <div key={userId} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-blue-300">
                      <span className="text-sm text-gray-700">{displayName}</span>
                      <button
                        onClick={() => handleToggleUser(userId)}
                        className="text-gray-400 hover:text-red-600"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div> : <p className="text-xs text-blue-700">Recipients are automatically determined from organization memberships.</p>}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          {!allowOrgSharing && onRequestApproval && (
            <button
              onClick={() => {
                onRequestApproval(document);
                onClose();
              }}
              className="flex-1 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4" />
              Request Approval
            </button>
          )}
          <button
            onClick={handleShare}
            disabled={isLoading || (effectiveSelectedUsers.length === 0 && currentlySharedWith.length === 0)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {isLoading ? 'Updating...' : 'Update Sharing'}
          </button>
        </div>
      </div>
    </div>
  );
}

