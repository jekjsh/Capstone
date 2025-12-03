// components/SharedDocuments.jsx
import { Share2, FileText, Eye, Edit, Users, Clock, User, X } from 'lucide-react';

export default function SharedDocuments({
  sharedDocuments,
  currentUser,
  onOpenDocument,
  onRemoveShare,
  allUsers
}) {
  // Separate shared documents into two categories
  const sharedWithMe = sharedDocuments.filter(share => 
    share.sharedWith.includes(currentUser.id)
  );

  const sharedByMe = sharedDocuments.filter(share => 
    share.sharedBy === currentUser.id
  );

  const getPermissionBadge = (permission) => {
    const configs = {
      view: { icon: Eye, color: 'blue', label: 'View Only' },
      edit: { icon: Edit, color: 'green', label: 'Can Edit' },
      full: { icon: Users, color: 'purple', label: 'Full Access' }
    };

    const config = configs[permission] || configs.view;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 bg-${config.color}-100 text-${config.color}-700 rounded-full text-xs font-medium`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>
    );
  };

  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const renderShareCard = (share, isSharedByMe = false) => {
    const sharedUsers = isSharedByMe 
      ? share.sharedWith.map(userId => getUserName(userId)).join(', ')
      : getUserName(share.sharedBy);

    return (
      <div key={share.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                {share.document?.title || 'Untitled Document'}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {share.document?.description || 'No description'}
              </p>
            </div>
          </div>
          {isSharedByMe && (
            <button
              onClick={() => onRemoveShare(share.id)}
              className="text-gray-400 hover:text-red-600 p-1 ml-2"
              title="Remove share"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {getPermissionBadge(share.permission)}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{share.sharedAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
          <User className="w-4 h-4 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">
              {isSharedByMe ? 'Shared with:' : 'Shared by:'}
            </p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {sharedUsers}
            </p>
          </div>
        </div>

        {share.message && (
          <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700 italic">"{share.message}"</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onOpenDocument(share.document)}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Document
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Share2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Shared Documents</h2>
          <p className="text-sm text-gray-500">Documents shared with you and by you</p>
        </div>
      </div>

      {/* Shared With Me Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Shared With Me</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {sharedWithMe.length}
          </span>
        </div>

        {sharedWithMe.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No documents shared with you yet</p>
            <p className="text-gray-400 text-sm">Documents that others share with you will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedWithMe.map(share => renderShareCard(share, false))}
          </div>
        )}
      </div>

      {/* Shared By Me Section */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Shared By Me</h3>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {sharedByMe.length}
          </span>
        </div>

        {sharedByMe.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">You haven't shared any documents yet</p>
            <p className="text-gray-400 text-sm">Share documents from your library to collaborate with others</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedByMe.map(share => renderShareCard(share, true))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can share documents with specific users and control their access level (View, Edit, or Full Access). Shared documents allow collaboration while maintaining security.
        </p>
      </div>
    </div>
  );
}