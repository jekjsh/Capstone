import { Share2, FileText, Eye, Edit, Users, Clock, User, X, Building2, Download } from 'lucide-react';

export default function SharedDocuments({
  sharedDocuments,
  organizationShares,
  currentUser,
  onOpenDocument,
  onRemoveShare,
  allUsers,
  organizationTree,
  onSaveToMyDocuments
}) {
  const sharedWithMe = sharedDocuments.filter(share => 
    share.sharedWith.includes(currentUser.id)
  );

  const sharedByMe = sharedDocuments.filter(share => 
    share.sharedBy === currentUser.id
  );

  const orgDistributedToMe = organizationShares ? organizationShares.filter(share =>
    share.recipients.includes(currentUser.id)
  ) : [];

  const orgDistributedByMe = organizationShares ? organizationShares.filter(share =>
    share.sentBy === currentUser.id
  ) : [];

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
    return user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username) : 'Unknown User';
  };

  const getOrgUnitName = (unitId) => {
    const findUnit = (nodes) => {
      for (const node of nodes) {
        if (node.id === unitId) return node.name;
        if (node.children) {
          const found = findUnit(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return organizationTree ? findUnit(organizationTree) : 'Unknown Unit';
  };

  const getDistributionModeLabel = (mode) => {
    const modes = {
      'all-sub-units': 'All Sub-Units',
      'direct-children': 'Direct Children Only',
      'specific-units': 'Specific Units'
    };
    return modes[mode] || mode;
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
          {!isSharedByMe && onSaveToMyDocuments && (
            <button
              onClick={() => onSaveToMyDocuments(share.document, 'direct-share')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              title="Save to My Documents"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderOrgShareCard = (share, isSentByMe = false) => {
    return (
      <div key={share.id} className="bg-white border-2 border-blue-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {share.document?.title || 'Untitled Document'}
                </h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                  Organization
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {share.document?.description || 'No description'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-blue-600">
                {isSentByMe ? 'Sent from:' : 'Sent to you from:'}
              </p>
              <p className="text-sm font-medium text-gray-800">
                {getOrgUnitName(isSentByMe ? share.sentFrom : share.sentFrom)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Users className="w-4 h-4 text-gray-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Distribution Mode:</p>
              <p className="text-sm font-medium text-gray-800">
                {getDistributionModeLabel(share.distributionMode)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Recipients</p>
              <p className="text-lg font-bold text-gray-800">{share.recipients.length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{share.sentAt}</span>
          </div>
          {!isSentByMe && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>From: {getUserName(share.sentBy)}</span>
            </div>
          )}
        </div>

        {share.message && (
          <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700 italic">"{share.message}"</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onOpenDocument(share.document)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Document
          </button>

          {!isSentByMe && onSaveToMyDocuments && (
            <button
              onClick={() => onSaveToMyDocuments(share.document, 'org-share')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              title="Save to My Documents"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          )}
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

      {organizationShares && (
        <>
          <div className="border-t pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Organization Distributed</h3>
              <div className="flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-full text-sm font-bold">
                {orgDistributedToMe.length + orgDistributedByMe.length}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-md font-semibold text-gray-700">Received from Organization</h4>
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
                  {orgDistributedToMe.length}
                </div>
              </div>

              {orgDistributedToMe.length === 0 ? (
                <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center border border-gray-200">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No organization documents received yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orgDistributedToMe.map(share => renderOrgShareCard(share, false))}
                </div>
              )}
            </div>

            {orgDistributedByMe.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-md font-semibold text-gray-700">Sent to Organization</h4>
                  <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold">
                    {orgDistributedByMe.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orgDistributedByMe.map(share => renderOrgShareCard(share, true))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="border-t pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Directly Shared With Me</h3>
          <div className="flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-full text-sm font-bold">
            {sharedWithMe.length}
          </div>
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

      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Directly Shared By Me</h3>
          <div className="flex items-center justify-center w-7 h-7 bg-green-500 text-white rounded-full text-sm font-bold">
            {sharedByMe.length}
          </div>
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

      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Tip:</strong> Click the <strong>Save</strong> button on received documents to add them to your "My Documents" section for easy access. 
            Organization-distributed documents will reach all users in the selected units automatically.
          </p>
        </div>
      </div>
    </div>
  );
}