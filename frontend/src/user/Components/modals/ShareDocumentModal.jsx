import { X, Share2, Users, Eye } from 'lucide-react';
import { useState } from 'react';

export default function ShareDocumentModal({ 
  show, 
  onClose, 
  document, 
  allUsers, 
  currentUser,
  onShareDocument 
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!show || !document) return null;


  const availableUsers = allUsers.filter(user => user.id !== currentUser.id);

  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to share with');
      return;
    }

    onShareDocument({
      documentId: document.id,
      sharedWith: selectedUsers,
      permission: 'view', 
      message: shareMessage,
      sharedBy: currentUser.id,
      sharedAt: new Date().toLocaleString()
    });


    setSelectedUsers([]);
    setShareMessage('');
    setSearchQuery('');
    onClose();
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
              <h2 className="text-xl font-bold text-gray-800">Share Document</h2>
              <p className="text-sm text-gray-500">{document.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Permission Info - View Only */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800">View Only Access</p>
                <p className="text-sm text-blue-600 mt-1">
                  Recipients will be able to view this document.
                </p>
              </div>
            </div>
          </div>

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
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email || user.role}</p>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Eye className="w-3 h-3" />
                          <span>View Only</span>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Sharing with {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} (View Only):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = availableUsers.find(u => u.id === userId);
                  return (
                    <div key={userId} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-blue-300">
                      <span className="text-sm text-gray-700">{user?.name}</span>
                      <button
                        onClick={() => handleToggleUser(userId)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Document
          </button>
        </div>
      </div>
    </div>
  );
}