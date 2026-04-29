import { Upload, ScanText, FileText, Folder, FolderPlus, ChevronRight, Plus, List, Grid3X3, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import FolderCard from '@/components/FolderCard';
import ContextMenu from '@/components/ContextMenu';

export default function FileManagement({
  currentFolder,
  setCurrentFolder,
  folders,
  userDocuments,
  sharedDocumentIds = [],
  sharedDocumentLabels = {},
  sharedFolderIds = [],
  sharedFolderLabels = {},
  ownerDisplayMode = 'full',
  filteredDocuments,
  searchQuery,
  setSearchQuery,
  organizationFilters = [],
  setOrganizationFilters = () => {},
  organizationFilterOptions = [],
  ownerFilter = 'all',
  setOwnerFilter = () => {},
  ownerFilterOptions = [],
  sortBy,
  setSortBy,
  customFields = [],
  filterByTag = {},
  setFilterByTag = () => {},
  setShowUploadDocumentModal,
  setShowCreateFolderModal,
  setShowOCRModal = null,
  onOpenDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPrintDocument,
  onMoveToFolder,
  onMoveDocumentByDrop = null,
  enableDocumentDragDrop = false,
  canDragDocument = () => true,
  canDropToFolder = () => true,
  canDropToRoot = () => true,
  onMoveFolderByDrop = null,
  enableFolderDragDrop = false,
  canDragFolder = () => true,
  canDropFolderToFolder = () => true,
  canDropFolderToRoot = () => true,
  onShareDocument,
  onRenameDocument,
  onAddCategories,
  onAddFolderCategory,
  onDeleteFolder,
  onDownloadFolder,
  onShareFolder,
  onRenameFolder,
  getFolderDocumentCount = () => 0,
  rootLabel = 'My Files'
}) {
  const folderIconColorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    pink: 'text-pink-600 bg-pink-100',
  };

  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [draggedDocumentId, setDraggedDocumentId] = useState(null);
  const [draggedDocument, setDraggedDocument] = useState(null);
  const [draggedFolderId, setDraggedFolderId] = useState(null);
  const [draggedFolder, setDraggedFolder] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false);

  const canUseDocumentDragDrop = enableDocumentDragDrop && typeof onMoveDocumentByDrop === 'function';
  const canUseFolderDragDrop = enableFolderDragDrop && typeof onMoveFolderByDrop === 'function';
  const ROOT_DROP_TARGET = '__ROOT__';

  // Build breadcrumbs when folder changes
  useEffect(() => {
    const crumbs = [{ id: null, name: rootLabel }];
    
    if (currentFolder) {
      let folderId = currentFolder;
      const visited = new Set();

      while (folderId && !visited.has(folderId)) {
        visited.add(folderId);
        const folder = folders.find(f => f.folder_id === folderId);
        if (folder) {
          crumbs.splice(1, 0, { id: folder.folder_id, name: folder.folder_name });
          folderId = folder.parent_folder;
        } else {
          break;
        }
      }
    }

    setBreadcrumbs(crumbs);
  }, [currentFolder, folders, rootLabel]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const menu = document.querySelector('[data-new-menu]');
      if (menu && !menu.contains(e.target)) {
        setShowNewMenu(false);
      }

      const orgMenu = document.querySelector('[data-org-filter-menu]');
      if (orgMenu && !orgMenu.contains(e.target)) {
        setShowOrganizationDropdown(false);
      }
    };

    if (showNewMenu || showOrganizationDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNewMenu, showOrganizationDropdown]);

  const currentFolderData = folders.find(f => f.folder_id === currentFolder);
  const isInFolder = !!currentFolder;

  const getFileType = (doc) => {
    const fileName = (doc.doc_name || doc.doc_path || '').toLowerCase();
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'docx';
    if (fileName.includes('ocr')) return 'ocr';
    return 'other';
  };

  const FileTypeIcon = ({ doc, size = 'large' }) => {
    const fileType = getFileType(doc);
    const sizeClasses = size === 'large' 
      ? { container: 'w-full h-40', icon: 'w-8 h-8', text: 'text-xs' }
      : { container: 'w-12 h-16', icon: 'w-5 h-5', text: 'text-xs' };

    if (fileType === 'pdf') {
      return (
        <div className={`${sizeClasses.container} bg-red-100 rounded-lg flex flex-col items-center justify-center hover:bg-red-200 transition-colors cursor-pointer border-2 border-red-300`}>
          <FileText className={`${sizeClasses.icon} text-red-600 mb-2`} />
          <span className={`font-bold text-red-600 ${sizeClasses.text}`}>PDF</span>
        </div>
      );
    } else if (fileType === 'docx') {
      return (
        <div className={`${sizeClasses.container} bg-blue-100 rounded-lg flex flex-col items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer border-2 border-blue-300`}>
          <FileText className={`${sizeClasses.icon} text-blue-600 mb-2`} />
          <span className={`font-bold text-blue-600 ${sizeClasses.text}`}>DOCX</span>
        </div>
      );
    } else if (fileType === 'ocr') {
      return (
        <div className={`${sizeClasses.container} bg-green-100 rounded-lg flex flex-col items-center justify-center hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300`}>
          <ScanText className={`${sizeClasses.icon} text-green-600 mb-2`} />
          <span className={`font-bold text-green-600 ${sizeClasses.text}`}>OCR</span>
        </div>
      );
    } else {
      return (
        <div className={`${sizeClasses.container} bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer border-2 border-gray-300`}>
          <FileText className={`${sizeClasses.icon} text-gray-600 mb-2`} />
          <span className={`font-bold text-gray-600 ${sizeClasses.text}`}>FILE</span>
        </div>
      );
    }
  };

  // Get documents for current view (all or in folder)
  const documentSource = Array.isArray(filteredDocuments) ? filteredDocuments : userDocuments;
  const searchLower = String(searchQuery || '').toLowerCase().trim();

  const documentsToShow = isInFolder
    ? documentSource.filter((doc) => String(doc.folder) === String(currentFolder))
    : documentSource.filter((doc) => !doc.folder || String(doc.folder) === '');

  // Get subfolders for current view
  const rawSubfolders = isInFolder
    ? folders.filter(f => f.parent_folder === currentFolder)
    : folders.filter(f => !f.parent_folder);

  const subfolders = searchLower
    ? rawSubfolders.filter((folder) => String(folder.folder_name || '').toLowerCase().includes(searchLower))
    : rawSubfolders;

  const sharedDocumentIdSet = new Set((sharedDocumentIds || []).map((id) => String(id)));
  const sharedFolderIdSet = new Set((sharedFolderIds || []).map((id) => String(id)));

  const getDocumentSharedLabel = (docId) => {
    const explicitLabel = sharedDocumentLabels?.[String(docId)] ?? sharedDocumentLabels?.[docId];
    if (explicitLabel) return explicitLabel;
    return sharedDocumentIdSet.has(String(docId)) ? 'Shared' : '';
  };

  const getFolderSharedLabel = (folderId) => {
    const explicitLabel = sharedFolderLabels?.[String(folderId)] ?? sharedFolderLabels?.[folderId];
    if (explicitLabel) return explicitLabel;
    return sharedFolderIdSet.has(String(folderId)) ? 'Shared' : '';
  };

  const getDocumentCategoryBadge = (doc) => {
    const categories = Array.isArray(doc?.categories) ? doc.categories : [];
    if (categories.length === 0) return '';

    const firstCategoryName = categories[0]?.category_name || '';
    if (!firstCategoryName) return '';

    if (categories.length === 1) return firstCategoryName;
    return `${firstCategoryName} +${categories.length - 1}`;
  };

  const pageTitle = isInFolder ? currentFolderData?.folder_name : 'My Files';

  const getOwnerLabel = (item) => {
    if (ownerDisplayMode === 'self') return 'Me';
    const owner = item?.user_index;
    if (!owner || typeof owner !== 'object') return 'Unknown';
    const middleInitial = owner.middle_name ? `${String(owner.middle_name).trim().charAt(0)}.` : '';
    const fullName = [owner.first_name, middleInitial, owner.last_name, owner.suffix]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return fullName || owner.user_id || 'Unknown';
  };

  const combinedListItems = [
    ...subfolders.map((folder) => ({
      type: 'folder',
      id: folder.folder_id,
      name: folder.folder_name,
      createdAt: folder.created_at || folder.updated_at || '-',
      owner: getOwnerLabel(folder),
      data: folder,
      isShared: sharedFolderIdSet.has(String(folder.folder_id)),
      sharedLabel: getFolderSharedLabel(folder.folder_id),
    })),
    ...documentsToShow.map((doc) => ({
      type: 'document',
      id: doc.doc_id || doc.id,
      name: doc.doc_name,
      createdAt: doc.doc_uploaded || '-',
      owner: getOwnerLabel(doc),
      data: doc,
      isShared: sharedDocumentIdSet.has(String(doc.doc_id || doc.id)),
      sharedLabel: getDocumentSharedLabel(doc.doc_id || doc.id),
    })),
  ].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

    if (sortBy === 'title-desc' || sortBy === 'name-desc') {
      return String(b.name || '').localeCompare(String(a.name || ''));
    }
    if (sortBy === 'title-asc' || sortBy === 'name-asc') {
      return String(a.name || '').localeCompare(String(b.name || ''));
    }

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === 'date-asc') return timeA - timeB;
    return timeB - timeA;
  });

  const handleDocumentDragStart = (event, docId) => {
    if (!canUseDocumentDragDrop) return;

    const sourceDoc = (documentSource || []).find(
      (doc) => String(doc.doc_id || doc.id) === String(docId)
    );

    if (!sourceDoc || !canDragDocument(sourceDoc)) {
      event.preventDefault();
      return;
    }

    const normalizedDocId = String(docId);
    setDraggedDocumentId(normalizedDocId);
    setDraggedDocument(sourceDoc);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', normalizedDocId);
  };

  const handleDragEnd = () => {
    setDraggedDocumentId(null);
    setDraggedDocument(null);
    setDraggedFolderId(null);
    setDraggedFolder(null);
    setDragOverTarget(null);
  };

  const isDescendantFolder = (sourceFolderId, candidateTargetFolderId) => {
    if (!sourceFolderId || !candidateTargetFolderId) return false;

    let current = folders.find((folder) => String(folder.folder_id) === String(candidateTargetFolderId));

    while (current) {
      if (String(current.folder_id) === String(sourceFolderId)) {
        return true;
      }

      if (!current.parent_folder) {
        return false;
      }

      current = folders.find((folder) => String(folder.folder_id) === String(current.parent_folder));
    }

    return false;
  };

  const handleFolderDragStart = (event, folderId) => {
    if (!canUseFolderDragDrop) return;

    const sourceFolder = folders.find((folder) => String(folder.folder_id) === String(folderId));

    if (!sourceFolder || !canDragFolder(sourceFolder)) {
      event.preventDefault();
      return;
    }

    const normalizedFolderId = String(folderId);
    setDraggedFolderId(normalizedFolderId);
    setDraggedFolder(sourceFolder);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', normalizedFolderId);
  };

  const handleDragOverTarget = (event, targetId) => {
    const draggingDocument = canUseDocumentDragDrop && !!draggedDocumentId;
    const draggingFolder = canUseFolderDragDrop && !!draggedFolderId;

    if (!draggingDocument && !draggingFolder) return;

    if (draggingDocument) {
      if (targetId === ROOT_DROP_TARGET) {
        if (!canDropToRoot(draggedDocument)) return;
      } else {
        const targetFolder = folders.find((folder) => String(folder.folder_id) === String(targetId));
        if (!targetFolder || !canDropToFolder(targetFolder, draggedDocument)) return;
      }
    }

    if (draggingFolder) {
      if (targetId === ROOT_DROP_TARGET) {
        if (!canDropFolderToRoot(draggedFolder)) return;
      } else {
        const targetFolder = folders.find((folder) => String(folder.folder_id) === String(targetId));
        if (!targetFolder) return;
        if (String(targetFolder.folder_id) === String(draggedFolderId)) return;
        if (isDescendantFolder(draggedFolderId, targetFolder.folder_id)) return;
        if (!canDropFolderToFolder(targetFolder, draggedFolder)) return;
      }
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverTarget(String(targetId));
  };

  const handleDragLeaveTarget = (targetId) => {
    if (dragOverTarget === String(targetId)) {
      setDragOverTarget(null);
    }
  };

  const handleDropOnTarget = async (event, targetId) => {
    const draggingDocument = canUseDocumentDragDrop && !!draggedDocumentId;
    const draggingFolder = canUseFolderDragDrop && !!draggedFolderId;

    if (!draggingDocument && !draggingFolder) return;
    event.preventDefault();

    if (draggingDocument) {
      if (targetId === ROOT_DROP_TARGET) {
        if (!canDropToRoot(draggedDocument)) {
          handleDragEnd();
          return;
        }
      } else {
        const targetFolder = folders.find((folder) => String(folder.folder_id) === String(targetId));
        if (!targetFolder || !canDropToFolder(targetFolder, draggedDocument)) {
          handleDragEnd();
          return;
        }
      }

      const destinationFolderId = targetId === ROOT_DROP_TARGET ? null : targetId;
      await onMoveDocumentByDrop(draggedDocumentId, destinationFolderId);
      handleDragEnd();
      return;
    }

    if (draggingFolder) {
      if (targetId === ROOT_DROP_TARGET) {
        if (!canDropFolderToRoot(draggedFolder)) {
          handleDragEnd();
          return;
        }
      } else {
        const targetFolder = folders.find((folder) => String(folder.folder_id) === String(targetId));
        if (!targetFolder) {
          handleDragEnd();
          return;
        }

        if (String(targetFolder.folder_id) === String(draggedFolderId)) {
          handleDragEnd();
          return;
        }

        if (isDescendantFolder(draggedFolderId, targetFolder.folder_id)) {
          handleDragEnd();
          return;
        }

        if (!canDropFolderToFolder(targetFolder, draggedFolder)) {
          handleDragEnd();
          return;
        }
      }

      const destinationParentFolderId = targetId === ROOT_DROP_TARGET ? null : targetId;
      await onMoveFolderByDrop(draggedFolderId, destinationParentFolderId);
      handleDragEnd();
      return;
    }

    handleDragEnd();
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb as Main Navigation */}
      <div>
        {/* Breadcrumb Navigation - Always visible as title */}
        <div className="flex items-center gap-2 text-2xl font-bold text-black mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentFolder(crumb.id)}
                onDragOver={(event) => {
                  if (index === 0) {
                    handleDragOverTarget(event, ROOT_DROP_TARGET);
                  }
                }}
                onDragLeave={() => {
                  if (index === 0) {
                    handleDragLeaveTarget(ROOT_DROP_TARGET);
                  }
                }}
                onDrop={(event) => {
                  if (index === 0) {
                    handleDropOnTarget(event, ROOT_DROP_TARGET);
                  }
                }}
                className={`text-black hover:bg-gray-200 rounded px-2 py-1 transition-colors ${
                  index === 0 && dragOverTarget === ROOT_DROP_TARGET
                    ? 'ring-2 ring-indigo-300 bg-indigo-50'
                    : ''
                }`}
                title={
                  index === 0 && (canUseDocumentDragDrop || canUseFolderDragDrop)
                    ? 'Drop here to move to root'
                    : undefined
                }
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-6 h-6 text-gray-400" />}
            </div>
          ))}
        </div>

        {isInFolder && currentFolderData?.folder_category_name && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Category: {currentFolderData.folder_category_name}
            </span>
          </div>
        )}
        
        {/* Primary actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-fit" data-new-menu>
            <button 
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              New
            </button>
            
            {showNewMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                <button
                  onClick={() => {
                    setShowCreateFolderModal(true);
                    setShowNewMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100 first:rounded-t-lg"
                >
                  <FolderPlus className="w-5 h-5 text-indigo-600" />
                  <span>Create Folder</span>
                </button>
                <button
                  onClick={() => {
                    setShowUploadDocumentModal(true);
                    setShowNewMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors last:rounded-b-lg"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Upload Document</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (setShowOCRModal) {
                setShowOCRModal(true);
              }
            }}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-semibold transition-colors ${
              setShowOCRModal
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed opacity-70'
            }`}
            title={setShowOCRModal ? 'Open OCR scan modal' : 'OCR modal is not available in this view yet'}
            disabled={!setShowOCRModal}
          >
            <ScanText className="w-5 h-5" />
            <span>Scan with OCR</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="inline-flex bg-gray-200 rounded-full p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 font-medium ${
              viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 font-medium ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className={`grid grid-cols-1 ${ownerFilterOptions.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
            <div className="relative" data-org-filter-menu>
              <button
                type="button"
                onClick={() => setShowOrganizationDropdown((prev) => !prev)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {organizationFilters.length === 0
                  ? 'All organizations'
                  : `${organizationFilters.length} selected`}
              </button>

              {showOrganizationDropdown && (
                <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100">
                    <input
                      type="checkbox"
                      checked={organizationFilters.length === 0}
                      onChange={() => setOrganizationFilters([])}
                    />
                    <span>All organizations</span>
                  </label>

                  {organizationFilterOptions.map((option) => {
                    const isChecked = organizationFilters.includes(String(option.value));
                    return (
                      <label key={option.value} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const value = String(option.value);
                            if (e.target.checked) {
                              setOrganizationFilters((prev) => Array.from(new Set([...(prev || []), value])));
                            } else {
                              setOrganizationFilters((prev) => (prev || []).filter((id) => String(id) !== value));
                            }
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {ownerFilterOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ownerFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        combinedListItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-visible">
            <div className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {combinedListItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                draggable={
                  (item.type === 'document' && canUseDocumentDragDrop && canDragDocument(item.data)) ||
                  (item.type === 'folder' && canUseFolderDragDrop && canDragFolder(item.data))
                }
                onDragStart={(event) => {
                  if (item.type === 'document') {
                    handleDocumentDragStart(event, item.id);
                  } else if (item.type === 'folder') {
                    handleFolderDragStart(event, item.id);
                  }
                }}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => {
                  if (item.type === 'folder') {
                    handleDragOverTarget(event, item.id);
                  }
                }}
                onDragLeave={() => {
                  if (item.type === 'folder') {
                    handleDragLeaveTarget(item.id);
                  }
                }}
                onDrop={(event) => {
                  if (item.type === 'folder') {
                    handleDropOnTarget(event, item.id);
                  }
                }}
                className={`grid grid-cols-12 px-4 py-4 border-b border-gray-100 last:border-b-0 items-center gap-2 hover:bg-gray-50 group ${
                  item.type === 'folder' && dragOverTarget === String(item.id)
                    ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300'
                    : ''
                }`}
                title={
                  item.type === 'document' && canUseDocumentDragDrop && canDragDocument(item.data)
                    ? 'Drag onto a folder to move'
                    : item.type === 'folder' && canUseFolderDragDrop && canDragFolder(item.data)
                      ? 'Drag onto another folder to move'
                      : undefined
                }
              >
                <div
                  className="col-span-6 flex items-center gap-3 min-w-0 cursor-pointer select-none"
                  onDoubleClick={() => {
                    if (item.type === 'folder') {
                      setCurrentFolder(item.id);
                    } else {
                      onOpenDocument(item.data);
                    }
                  }}
                >
                  <span
                    className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      item.type === 'folder'
                        ? (folderIconColorClasses[item.data.folder_color] || folderIconColorClasses.blue)
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex items-center gap-2 select-none">
                      <p className="text-base font-semibold text-gray-800 truncate select-none">
                        {item.name}
                      </p>
                    {item.type === 'folder' && item.data?.folder_category_name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {item.data.folder_category_name}
                      </span>
                    )}
                    {item.type === 'document' && getDocumentCategoryBadge(item.data) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {getDocumentCategoryBadge(item.data)}
                      </span>
                    )}
                    {item.isShared && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {item.sharedLabel || 'Shared'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-span-2 text-sm text-gray-600 capitalize">{item.type}</div>
                <div className="col-span-2 text-sm text-gray-700 truncate">{item.owner}</div>

                <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => (item.type === 'folder' ? onShareFolder(item.data) : onShareDocument(item.data))}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>

                  {item.type === 'folder' ? (
                    <ContextMenu
                      item={item.data}
                      itemType="folder"
                      onDownload={onDownloadFolder}
                      hideShareOption={true}
                      onShare={() => onShareFolder(item.data)}
                      onRename={() => onRenameFolder(item.data.folder_id)}
                      onAddCategories={() => onAddFolderCategory?.(item.data)}
                      onDelete={() => onDeleteFolder(item.data.folder_id)}
                    />
                  ) : (
                    <ContextMenu
                      item={item.data}
                      itemType="document"
                      hideShareOption={true}
                      onDownload={onDownloadDocument}
                      onShare={onShareDocument}
                      onRename={onRenameDocument}
                      onDelete={() => onDeleteDocument(item.data.doc_id)}
                      onAddCategories={() => onAddCategories(item.data)}
                      onMoveToFolder={() => onMoveToFolder(item.data.doc_id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {/* Folders Section */}
          {subfolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Folders</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {subfolders.map((folder) => (
                  <div
                    key={folder.folder_id}
                    draggable={canUseFolderDragDrop && canDragFolder(folder)}
                    onDragStart={(event) => handleFolderDragStart(event, folder.folder_id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(event) => handleDragOverTarget(event, folder.folder_id)}
                    onDragLeave={() => handleDragLeaveTarget(folder.folder_id)}
                    onDrop={(event) => handleDropOnTarget(event, folder.folder_id)}
                    className={dragOverTarget === String(folder.folder_id) ? 'rounded-lg ring-2 ring-indigo-300 bg-indigo-50/40' : ''}
                    title={
                      (canUseDocumentDragDrop && canDropToFolder(folder, draggedDocument)) ||
                      (canUseFolderDragDrop && canDropFolderToFolder(folder, draggedFolder))
                        ? 'Drop to move into this folder'
                        : undefined
                    }
                  >
                    <FolderCard
                      folder={folder}
                      viewMode={viewMode}
                      docCount={getFolderDocumentCount(folder.folder_id)}
                      isShared={sharedFolderIdSet.has(String(folder.folder_id))}
                      sharedLabel={getFolderSharedLabel(folder.folder_id)}
                      onFolderClick={setCurrentFolder}
                      onDeleteClick={onDeleteFolder}
                      onShareClick={onShareFolder}
                      onRenameClick={onRenameFolder}
                      onAddCategories={onAddFolderCategory}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {documentsToShow.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Files</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {documentsToShow.map((doc) => (
                  <div
                    key={doc.doc_id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group p-3 flex items-center gap-3"
                    draggable={canUseDocumentDragDrop && canDragDocument(doc)}
                    onDragStart={(event) => handleDocumentDragStart(event, doc.doc_id || doc.id)}
                    onDragEnd={handleDragEnd}
                    title={canUseDocumentDragDrop && canDragDocument(doc) ? 'Drag onto a folder to move' : undefined}
                  >
                    <button
                      onDoubleClick={() => onOpenDocument(doc)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <FileTypeIcon doc={doc} size="small" />
                    </button>
                    <div className="flex-1 min-w-0 select-none">
                      <div className="flex items-center gap-2 min-w-0 select-none">
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-1 select-none">{doc.doc_name}</h3>
                        {getDocumentCategoryBadge(doc) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            {getDocumentCategoryBadge(doc)}
                          </span>
                        )}
                        {doc.approval_status === 'approved' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                            Approved
                          </span>
                        )}
                        {doc.approval_status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Pending
                          </span>
                        )}
                        {sharedDocumentIdSet.has(String(doc.doc_id || doc.id)) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {getDocumentSharedLabel(doc.doc_id || doc.id) || 'Shared'}
                          </span>
                        )}
                      </div>
                      {doc.doc_desc && <p className="text-xs text-gray-600 line-clamp-1">{doc.doc_desc}</p>}
                      <p className="text-xs text-gray-500">Created: {doc.doc_uploaded}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => onShareDocument(doc)}
                        className="px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      <ContextMenu
                        item={doc}
                        itemType="document"
                        onDownload={onDownloadDocument}
                        onShare={onShareDocument}
                        onRename={onRenameDocument}
                        onDelete={() => onDeleteDocument(doc.doc_id)}
                        onAddCategories={() => onAddCategories(doc)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {subfolders.length === 0 && documentsToShow.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          {isInFolder ? (
            <>
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">This folder is empty</p>
              <p className="text-gray-400 text-sm">Upload documents to get started</p>
            </>
          ) : (
            <>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No files or folders yet</p>
              <p className="text-gray-400 text-sm">Create a folder or upload a file to get started</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
