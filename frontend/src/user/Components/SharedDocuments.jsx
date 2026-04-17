import { Building2, Folder, FileText, List, Grid3X3, Eye, Download, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function SharedDocuments({
  sharedDocuments = [],
  sharedFolders = [],
  organizationShares = [],
  allFolders = [],
  currentUser,
  onOpenDocument,
  onOpenFolder,
  onRemoveShare,
  allUsers = [],
  organizationTree = [],
  onSaveToMyDocuments,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');

  const userId = currentUser?.id;
  const userIndex = currentUser?.user_index;
  const roleValue = String(currentUser?.role_type || currentUser?.role || '').toLowerCase();
  const isAdminViewer = roleValue === 'admin';

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const buildFullName = (user) => {
    if (!user) return '';
    const firstName = user.firstName || user.first_name || '';
    const middleName = user.middleName || user.middle_name || '';
    const lastName = user.lastName || user.last_name || '';
    const suffix = user.suffix || '';
    const middleInitial = middleName ? `${String(middleName).trim().charAt(0)}.` : '';
    const full = [firstName, middleInitial, lastName, suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return full || user.name || user.user_id || user.id || '';
  };

  const getOrgUnitName = (unitId) => {
    if (!unitId) return '';
    const findUnit = (nodes) => {
      for (const node of nodes || []) {
        if (String(node.id) === String(unitId) || String(node.org_id) === String(unitId)) {
          return {
            name: node.name || node.org_name || '',
            code: node.org_code || '',
          };
        }
        const children = node.children || node.sub_offices;
        if (children) {
          const found = findUnit(children);
          if (found) return found;
        }
      }
      return null;
    };
    const unit = findUnit(organizationTree);
    if (!unit) return '';
    return unit.code || unit.name || '';
  };

  const resolveFolderColor = (folderColor) => {
    if (!folderColor) return '#6B7280';

    const normalized = String(folderColor).trim().toLowerCase();
    const namedColors = {
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#F59E0B',
      orange: '#F97316',
      red: '#EF4444',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      teal: '#14B8A6',
      gray: '#6B7280',
      grey: '#6B7280',
    };

    if (namedColors[normalized]) return namedColors[normalized];
    if (normalized.startsWith('#')) return normalized;
    return '#6B7280';
  };

  const resolveSharedTo = (item) => {
    const orgId = item.shared_with_org || item.sharedWithOrg || item.shared_with_org_id;
    if (orgId) {
      return getOrgUnitName(orgId) || `Org ${orgId}`;
    }

    const userKey = item.shared_to_user || item.shared_to || item.sharedToUser;
    if (userKey) {
      const matchedUser = allUsers.find((u) => String(u.user_index) === String(userKey) || String(u.user_id) === String(userKey));
      if (matchedUser) return matchedUser.user_id || buildFullName(matchedUser) || String(userKey);
      return String(userKey);
    }

    if (Array.isArray(item.sharedWith) && item.sharedWith.length > 0) {
      const orgLabel = getOrgUnitName(item.sharedWith[0]);
      if (orgLabel) return orgLabel;
    }

    return '-';
  };

  const resolveSharedBy = (item) => {
    const orgCandidates = [
      item.shared_by_org_details?.org_code,
      item.shared_by_org_name,
      item.sharedByOrgName,
      item.shared_by_org_details?.org_name,
    ].filter(Boolean);
    if (orgCandidates.length > 0) {
      return orgCandidates[0];
    }

    const candidates = [
      item.shared_by_user_details,
      item.sharedBy,
      item.shared_by_user,
      item.shared_by,
      item.shared_to,
      item.sentBy,
      item.sharedByUser,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (typeof candidate === 'object') {
        const directName = buildFullName(candidate);
        if (directName) return directName;
      }

      const candidateKey = String(candidate).trim();
      const matchedUser = allUsers.find((u) => {
        const idMatches = String(u.id || '').trim() === candidateKey;
        const userIdMatches = String(u.user_id || u.user_index || '').trim() === candidateKey;
        return idMatches || userIdMatches;
      });

      if (matchedUser) {
        const fullName = buildFullName(matchedUser);
        if (fullName) return fullName;
      }
    }

    return item.shared_by || '-';
  };

  const normalizedItems = useMemo(() => {
    const directDocGrouped = new Map();
    (sharedDocuments || []).forEach((share, index) => {
      const documentRef = share.document || share.doc || share;
      const owner = share.sharedBy;
      const isSharedByMe = String(owner) === String(userId) || String(owner) === String(userIndex);
      const docId = String(documentRef?.doc_id || documentRef?.id || share.doc || `idx-${index}`);
      const groupKey = `${docId}|${resolveSharedBy(share)}`;

      if (!directDocGrouped.has(groupKey)) {
        directDocGrouped.set(groupKey, {
          key: `direct-doc-${groupKey}`,
          sourceGroup: 'user',
          sourceType: 'direct-doc',
          type: 'document',
          name: documentRef?.doc_name || documentRef?.title || share.doc_name || share.document_name || 'Untitled',
          dateValue: share.sharedAt || share.created_at || share.share_timestamp || documentRef?.doc_uploaded || null,
          dateLabel: formatDate(share.sharedAt || share.created_at || share.share_timestamp || documentRef?.doc_uploaded),
          sharedBy: resolveSharedBy(share),
          sharedTo: resolveSharedTo(share),
          recipientCount: 1,
          fromUnit: '-',
          documentRef,
          folderId: null,
          raw: share,
          isSharedByMe,
        });
        return;
      }

      const existing = directDocGrouped.get(groupKey);
      const existingTime = existing.dateValue ? new Date(existing.dateValue).getTime() : 0;
      const candidateTime = share.sharedAt || share.created_at || share.share_timestamp || documentRef?.doc_uploaded || null;
      const candidateMs = candidateTime ? new Date(candidateTime).getTime() : 0;

      existing.recipientCount += 1;
      existing.sharedTo = String(existing.recipientCount);

      if (candidateMs > existingTime) {
        existing.dateValue = candidateTime;
        existing.dateLabel = formatDate(candidateTime);
      }
    });

    const directDocItems = Array.from(directDocGrouped.values());

    const directFolderItems = (sharedFolders || []).map((share, index) => {
      const folderObj = share.folder || share.folder_data || null;
      const owner = share.sharedBy || share.shared_by_user;
      const isSharedByMe = String(owner) === String(userId) || String(owner) === String(userIndex);

      return {
        key: `direct-folder-${share.id || share.shareId || share.share_id || index}`,
        sourceGroup: 'user',
        sourceType: 'direct-folder',
        type: 'folder',
        name: folderObj?.folder_name || share.folder_name || 'Untitled Folder',
        dateValue: share.sharedAt || share.created_at || null,
        dateLabel: formatDate(share.sharedAt || share.created_at),
        sharedBy: resolveSharedBy(share),
        sharedTo: resolveSharedTo({
          ...share,
          shared_with_org: Array.isArray(share.sharedWith) ? share.sharedWith[0] : null,
        }),
        fromUnit: '-',
        documentRef: null,
        folderId: share.folderId || share.folder || folderObj?.folder_id || null,
        folderColor: folderObj?.folder_color || share.folder_color || 'gray',
        raw: share,
        isSharedByMe,
      };
    });

    const organizationItems = (organizationShares || []).map((share, index) => {
      const isFolder = Boolean(share.folder || share.folder_name);
      const folderObj = share.folder_data || (typeof share.folder === 'object' ? share.folder : null);
      const folderId = share.folderId || (typeof share.folder === 'object' ? share.folder?.folder_id : share.folder) || folderObj?.folder_id;
      const documentRef = share.document || share.doc || null;
      const sender = share.sentBy || share.shared_by_user;
      const isSharedByMe = String(sender) === String(userId) || String(sender) === String(userIndex);

      return {
        key: `org-${share.id || share.share_id || index}`,
        sourceGroup: 'organization',
        sourceType: 'organization',
        type: isFolder ? 'folder' : 'document',
        name:
          share.folder_name ||
          folderObj?.folder_name ||
          documentRef?.doc_name ||
          documentRef?.title ||
          share.doc_name ||
          'Untitled',
        dateValue: share.created_at || share.sentAt || share.share_timestamp || documentRef?.doc_uploaded || null,
        dateLabel: formatDate(share.created_at || share.sentAt || share.share_timestamp || documentRef?.doc_uploaded),
        sharedBy: resolveSharedBy(share),
        sharedTo: resolveSharedTo(share),
        fromUnit: getOrgUnitName(share.sentFrom) || '-',
        documentRef,
        folderId,
        folderColor: folderObj?.folder_color || share.folder_color || 'gray',
        raw: share,
        isSharedByMe,
      };
    });

    const baseItems = [...organizationItems, ...directFolderItems, ...directDocItems];

    const dedup = new Map();
    baseItems.forEach((item) => {
      const docId = item.documentRef?.doc_id || item.documentRef?.id || '';
      const key = `${item.type}|${item.folderId || docId || item.name}|${item.sharedBy}|${item.sharedTo}`;
      if (!dedup.has(key)) dedup.set(key, item);
    });

    return Array.from(dedup.values());
  }, [sharedDocuments, sharedFolders, organizationShares, allFolders, userId, userIndex, allUsers, organizationTree]);

  const matchesSearch = (item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      String(item.sharedBy).toLowerCase().includes(q) ||
      String(item.sharedTo).toLowerCase().includes(q) ||
      String(item.fromUnit).toLowerCase().includes(q)
    );
  };

  const compareItems = (a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);

    const timeA = a.dateValue ? new Date(a.dateValue).getTime() : 0;
    const timeB = b.dateValue ? new Date(b.dateValue).getTime() : 0;

    if (sortBy === 'oldest') return timeA - timeB;
    return timeB - timeA;
  };

  const visibleItems = normalizedItems
    .filter((item) => (isAdminViewer ? true : !item.isSharedByMe))
    .filter(matchesSearch)
    .sort(compareItems);

  const handleOpenItem = (item) => {
    if (item.type === 'folder' && onOpenFolder && item.folderId) {
      onOpenFolder(item.folderId, false);
      return;
    }
    if (item.documentRef && onOpenDocument) {
      onOpenDocument(item.documentRef);
    }
  };

  const maybeDownloadDocument = (item) => {
    if (!onSaveToMyDocuments || !item.documentRef) return;
    const source = item.sourceGroup === 'organization' ? 'org-share' : 'direct-share';
    onSaveToMyDocuments(item.documentRef, source);
  };

  const openFolderInMyFiles = (item) => {
    if (item.type !== 'folder' || !onOpenFolder || !item.folderId) return;
    onOpenFolder(item.folderId, true);
  };

  const renderListGroup = (items) => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="hidden md:grid md:grid-cols-12 text-xs font-semibold text-gray-500 px-4 py-2 border-b border-gray-100">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Shared by</div>
          <div className="col-span-2">Shared to</div>
          <div className="col-span-1">Date shared</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => handleOpenItem(item)}
            className="grid grid-cols-1 md:grid-cols-12 px-4 py-3 border-b border-gray-100 last:border-b-0 items-center gap-2 md:gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="md:col-span-4 flex items-center gap-2 min-w-0">
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={
                  item.type === 'folder'
                    ? { backgroundColor: `${resolveFolderColor(item.folderColor)}1A`, color: resolveFolderColor(item.folderColor) }
                    : undefined
                }
              >
                {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 md:hidden">{item.dateLabel}</p>
              </div>
            </div>

            <div className="md:col-span-3 text-sm text-gray-700 truncate">{item.sharedBy}</div>
            <div className="md:col-span-2 text-sm text-gray-700 truncate">{item.sharedTo}</div>
            <div className="md:col-span-1 text-sm text-gray-600 hidden md:block">{item.dateLabel}</div>

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  item.type === 'folder' ? openFolderInMyFiles(item) : handleOpenItem(item);
                }}
                disabled={item.type === 'folder' ? !item.folderId : !item.documentRef}
                className="px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {item.type === 'folder' ? 'Open in My Files' : 'View'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  maybeDownloadDocument(item);
                }}
                disabled={!item.documentRef || !onSaveToMyDocuments}
                className="px-2 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGridGroup = (items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => handleOpenItem(item)}
              className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 mb-2">
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={
                    item.type === 'folder'
                      ? { backgroundColor: `${resolveFolderColor(item.folderColor)}1A`, color: resolveFolderColor(item.folderColor) }
                      : undefined
                  }
                >
                  {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </span>
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              </div>

              <p className="text-xs text-gray-600 truncate">Shared by: {item.sharedBy}</p>
              <p className="text-xs text-gray-600 truncate">Shared to: {item.sharedTo}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.dateLabel}</p>
              {item.sourceGroup === 'organization' && item.fromUnit !== '-' && (
                <p className="text-xs text-gray-500 truncate">From: {item.fromUnit}</p>
              )}

              <div className="mt-2.5 flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.type === 'folder' ? openFolderInMyFiles(item) : handleOpenItem(item);
                  }}
                  disabled={item.type === 'folder' ? !item.folderId : !item.documentRef}
                  className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.type === 'folder' ? 'Open in My Files' : 'View'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    maybeDownloadDocument(item);
                  }}
                  disabled={!item.documentRef || !onSaveToMyDocuments}
                  className="flex-1 px-2 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">File Sharing</h2>
          <p className="text-sm text-gray-600 mt-1">Unified shared items view with folder-first ordering.</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
          <span className="font-semibold">{visibleItems.length}</span> item{visibleItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, sender, or org unit..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>

          <div className="justify-self-start lg:justify-self-end inline-flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </button>
          </div>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No shared files yet</p>
          <p className="text-gray-500 text-sm">Shared items will appear here.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {renderListGroup(visibleItems)}
        </div>
      ) : (
        <div className="space-y-5">
          {renderGridGroup(visibleItems)}
        </div>
      )}
    </div>
  );
}