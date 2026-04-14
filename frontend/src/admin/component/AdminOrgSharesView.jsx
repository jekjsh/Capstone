import { Building2, Folder, FileText, List, Grid3X3, Eye, Download } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function AdminOrgSharesView({ dataStore, organizationTree = [], orgShares = [], userList = [], onViewDocument, onDownloadDocument, onOpenFolder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');

  const allOrgShares = orgShares || [];

  const getOrgUnitName = (unitId) => {
    if (!unitId) return '';
    const findUnit = (nodes) => {
      for (const node of nodes) {
        if (node.id === unitId || node.org_id === unitId) return node.name;
        if (node.children) {
          const found = findUnit(node.children);
          if (found) return found;
        }
      }
      return '';
    };
    return organizationTree.length > 0 ? findUnit(organizationTree) : '';
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const buildFullName = (user) => {
    if (!user) return '';
    const middleInitial = user.middleName ? `${String(user.middleName).trim().charAt(0)}.` : '';
    const full = [user.firstName, middleInitial, user.lastName, user.suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return full || user.name || user.user_id || user.id || '';
  };

  const resolveSharedBy = (share) => {
    const candidates = [
      share.shared_by_org_details,
      share.shared_by_org_name,
      share.shared_by_org,
      share.shared_by_user_details,
      share.shared_by_user,
      share.sentBy,
      share.sharedBy,
      share.shared_by,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (typeof candidate === 'object') {
        const directName = buildFullName({
          firstName: candidate.first_name || candidate.firstName,
          middleName: candidate.middle_name || candidate.middleName,
          lastName: candidate.last_name || candidate.lastName,
          suffix: candidate.suffix,
          name: candidate.name,
          user_id: candidate.user_id,
          id: candidate.id,
        });
        if (directName) return directName;
      }

      const candidateKey = String(candidate).trim();
      const matchedUser = userList.find((u) => {
        const idMatches = String(u.id || '').trim() === candidateKey;
        const userIdMatches = String(u.user_id || '').trim() === candidateKey;
        return idMatches || userIdMatches;
      });
      if (matchedUser) {
        const fullName = buildFullName(matchedUser);
        if (fullName) return fullName;
      }
    }

    return share.shared_by || share.sentBy || share.sharedBy || '-';
  };

  const normalizedItems = useMemo(() => {
    return allOrgShares.map((share, index) => {
      const isFolder = Boolean(share.folder || share.folder_name);
      const folderId = typeof share.folder === 'object' ? share.folder?.folder_id : share.folder;
      const documentRef = share.document || share.doc || null;
      const itemName =
        share.folder_name ||
        documentRef?.doc_name ||
        documentRef?.title ||
        share.doc_name ||
        share.document_name ||
        'Untitled';

      const shareDate = share.created_at || share.sentAt || share.share_timestamp || share.doc_uploaded || null;
      const sharedBy = resolveSharedBy(share);
      const fromUnit = getOrgUnitName(share.sentFrom) || '-';

      // Organization-shared if distribution metadata exists; otherwise user-shared.
      const sourceGroup = (share.sentFrom || share.distributionMode || Array.isArray(share.recipients))
        ? 'organization'
        : 'user';

      return {
        raw: share,
        key: share.share_id || share.id || `${isFolder ? 'folder' : 'doc'}-${index}`,
        type: isFolder ? 'folder' : 'document',
        name: itemName,
        sharedBy,
        fromUnit,
        recipientsCount: (share.recipients || []).length,
        dateValue: shareDate,
        dateLabel: formatDate(shareDate),
        sourceGroup,
        documentRef,
        folderId,
      };
    });
  }, [allOrgShares, organizationTree, userList]);

  const matchesSearch = (item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      String(item.sharedBy).toLowerCase().includes(q) ||
      String(item.fromUnit).toLowerCase().includes(q)
    );
  };

  const compareItems = (a, b) => {
    // Always keep folders first, like Google Drive.
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

  const visibleItems = normalizedItems.filter(matchesSearch);
  const organizationShared = visibleItems.filter((item) => item.sourceGroup === 'organization').sort(compareItems);
  const userShared = visibleItems.filter((item) => item.sourceGroup === 'user').sort(compareItems);

  const handleOpenItem = (item) => {
    if (item.type === 'folder' && onOpenFolder && item.folderId) {
      onOpenFolder(item.folderId);
      return;
    }
    if (item.documentRef && onViewDocument) {
      onViewDocument(item.documentRef);
    }
  };

  const renderListGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>

        <div className="hidden md:grid md:grid-cols-12 text-xs font-semibold text-gray-500 px-4 py-2 border-b border-gray-100">
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Shared by</div>
          <div className="col-span-2">Date shared</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.map((item) => (
          <div
            key={item.key}
            onDoubleClick={() => handleOpenItem(item)}
            className="grid grid-cols-1 md:grid-cols-12 px-4 py-3 border-b border-gray-100 last:border-b-0 items-center gap-2 md:gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="md:col-span-5 flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
                {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 md:hidden">{item.dateLabel}</p>
              </div>
            </div>

            <div className="md:col-span-3 text-sm text-gray-700 truncate">{item.sharedBy}</div>
            <div className="md:col-span-2 text-sm text-gray-600 hidden md:block">{item.dateLabel}</div>

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (item.type === 'folder' && onOpenFolder && item.folderId) {
                    onOpenFolder(item.folderId);
                    return;
                  }
                  if (onViewDocument && item.documentRef) {
                    onViewDocument(item.documentRef);
                  }
                }}
                disabled={item.type === 'folder' ? !item.folderId : !item.documentRef}
                  className="px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {item.type === 'folder' ? 'Open' : 'View'}
              </button>
              <button
                onClick={() => onDownloadDocument && item.documentRef && onDownloadDocument(item.documentRef)}
                disabled={!item.documentRef}
                  className="px-2 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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

  const renderGridGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {items.map((item) => (
              <div
                key={item.key}
                onDoubleClick={() => handleOpenItem(item)}
                className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-sm transition-shadow cursor-pointer"
              >
              <div className="flex items-center gap-2 min-w-0 mb-2">
                  <span className="w-7 h-7 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
                  {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </span>
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              </div>

              <p className="text-xs text-gray-600 truncate">Shared by: {item.sharedBy}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.dateLabel}</p>

                <div className="mt-2.5 flex gap-1.5">
                <button
                    onClick={() => {
                      if (item.type === 'folder' && onOpenFolder && item.folderId) {
                        onOpenFolder(item.folderId);
                        return;
                      }
                      if (onViewDocument && item.documentRef) {
                        onViewDocument(item.documentRef);
                      }
                    }}
                    disabled={item.type === 'folder' ? !item.folderId : !item.documentRef}
                  className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {item.type === 'folder' ? 'Open' : 'View'}
                </button>
                <button
                  onClick={() => onDownloadDocument && item.documentRef && onDownloadDocument(item.documentRef)}
                  disabled={!item.documentRef}
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
          <p className="text-sm text-gray-600 mt-1">Compact shared files view with folder-first ordering.</p>
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
          <p className="text-gray-600 font-medium mb-1">
            {allOrgShares.length === 0 ? 'No shared files yet' : 'No shared files match your search'}
          </p>
          <p className="text-gray-500 text-sm">
            {allOrgShares.length === 0 ? 'Shared items will appear here.' : 'Try another keyword or sort option.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {renderListGroup('Organization-shared', organizationShared)}
          {renderListGroup('User-shared', userShared)}
        </div>
      ) : (
        <div className="space-y-5">
          {renderGridGroup('Organization-shared', organizationShared)}
          {renderGridGroup('User-shared', userShared)}
        </div>
      )}
    </div>
  );
}