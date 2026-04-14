import { X, Share2, Building2, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { folderShareAPI } from '../../services/api';

function flattenOrgTree(nodes = []) {
  const result = [];

  const walk = (items) => {
    items.forEach((node) => {
      const orgId = node.org_id ?? node.id;
      const orgName = node.org_name ?? node.name ?? `Org ${orgId}`;
      if (orgId) {
        result.push({ org_id: orgId, org_name: orgName });
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children);
      }
    });
  };

  walk(nodes);

  // De-duplicate by org_id while keeping first label seen.
  const seen = new Set();
  return result.filter((item) => {
    const key = String(item.org_id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ShareFolderModal({
  show,
  onClose,
  folder,
  organizationTree = [],
  currentUser,
  onShareFolder,
  onSharesUpdated,
}) {
  const [selectedOrgIds, setSelectedOrgIds] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlySharedWith, setCurrentlySharedWith] = useState([]);
  const [shareMap, setShareMap] = useState({});

  const currentOrgId = currentUser?.org || currentUser?.full_data?.org || null;

  const orgUnits = useMemo(() => {
    const units = flattenOrgTree(organizationTree);
    return units.filter((org) => String(org.org_id) !== String(currentOrgId));
  }, [organizationTree, currentOrgId]);

  const filteredOrgUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orgUnits;
    return orgUnits.filter((org) => String(org.org_name).toLowerCase().includes(q));
  }, [orgUnits, searchQuery]);

  useEffect(() => {
    const fetchExistingShares = async () => {
      if (!show || !folder) return;

      try {
        const shares = await folderShareAPI.getAll();
        const folderShares = shares.filter((share) => String(share.folder) === String(folder.folder_id));
        const sharedOrgIds = Array.from(new Set(folderShares.map((share) => String(share.shared_with_org)).filter(Boolean)));

        const map = {};
        folderShares.forEach((share) => {
          if (share.shared_with_org) {
            map[String(share.shared_with_org)] = share.share_id;
          }
        });

        setCurrentlySharedWith(sharedOrgIds);
        setSelectedOrgIds(sharedOrgIds);
        setShareMap(map);
      } catch (error) {
        console.error('Failed to fetch existing shares:', error);
      }
    };

    fetchExistingShares();
  }, [show, folder]);

  if (!show || !folder) return null;

  const toggleOrg = (orgId) => {
    const normalized = String(orgId);
    setSelectedOrgIds((prev) =>
      prev.includes(normalized) ? prev.filter((id) => id !== normalized) : [...prev, normalized]
    );
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const orgsToUnshare = currentlySharedWith.filter((orgId) => !selectedOrgIds.includes(String(orgId)));
      const orgsToShare = selectedOrgIds.filter((orgId) => !currentlySharedWith.includes(String(orgId)));

      if (orgsToShare.length > 0 || orgsToUnshare.length > 0) {
        await onShareFolder?.({
          folderId: folder.folder_id,
          sharedWith: orgsToShare,
          unsharedWith: orgsToUnshare,
          message: shareMessage,
          sharedBy: currentUser?.user_index,
          sharedAt: new Date().toISOString(),
        });
        await onSharesUpdated?.();
      }

      setSearchQuery('');
      setShareMessage('');
      setCurrentlySharedWith([]);
      setShareMap({});
      onClose();
    } catch (error) {
      alert(`Failed to update folder shares: ${error.message}`);
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
              <h2 className="text-xl font-bold text-gray-800">Share Folder To Organization Units</h2>
              <p className="text-sm text-gray-500">{folder.folder_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a message for recipient organizations..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Organization Units ({selectedOrgIds.length} selected)
            </label>
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organization unit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
              {filteredOrgUnits.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No organization units found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOrgUnits.map((org) => {
                    const isSelected = selectedOrgIds.includes(String(org.org_id));
                    return (
                      <label
                        key={org.org_id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrg(org.org_id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{org.org_name}</p>
                            <p className="text-xs text-gray-500">Org ID: {org.org_id}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Eye className="w-3.5 h-3.5" />
                            Can view folder
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            disabled={isLoading || (selectedOrgIds.length === 0 && currentlySharedWith.length === 0)}
          >
            {isLoading ? 'Updating...' : 'Update Sharing'}
          </button>
        </div>
      </div>
    </div>
  );
}
