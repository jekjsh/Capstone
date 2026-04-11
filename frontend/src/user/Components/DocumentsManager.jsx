import { Upload, ScanText, FileText, Folder, FolderPlus, ChevronRight, Plus, List, Grid3X3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import FolderCard from '@/components/FolderCard';
import ContextMenu from '@/components/ContextMenu';

export default function DocumentsManager({
  currentFolder,
  setCurrentFolder,
  folders,
  userDocuments,
  filteredDocuments,
  searchQuery,
  setSearchQuery,
  filterFormat,
  setFilterFormat,
  sortBy,
  setSortBy,
  customFields = [],
  filterByTag = {},
  setFilterByTag = () => {},
  setShowUploadDocumentModal,
  setShowCreateFolderModal,
  setShowOCRModal,
  onOpenDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPrintDocument,
  onMoveToFolder,
  onShareDocument,
  onRenameDocument,
  onDeleteFolder,
  onShareFolder,
  onRenameFolder,
  getFolderDocumentCount = () => 0
}) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Build breadcrumbs when folder changes
  useEffect(() => {
    if (!currentFolder) {
      setBreadcrumbs([]);
      return;
    }

    const crumbs = [{ id: null, name: 'Documents' }];
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

    setBreadcrumbs(crumbs);
  }, [currentFolder, folders]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const menu = document.querySelector('[data-new-menu]');
      if (menu && !menu.contains(e.target)) {
        setShowNewMenu(false);
      }
    };

    if (showNewMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNewMenu]);

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
  const documentsToShow = isInFolder
    ? userDocuments.filter(doc => doc.folder === currentFolder)
    : userDocuments;

  // Get subfolders for current view
  const subfolders = isInFolder
    ? folders.filter(f => f.parent_folder === currentFolder)
    : folders.filter(f => !f.parent_folder);

  const pageTitle = isInFolder ? currentFolderData?.folder_name : 'My Files';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{pageTitle}</h2>
        
        {/* Back Navigation */}
        {currentFolder && (
          <button
            onClick={() => {
              const parentFolder = currentFolderData?.parent_folder;
              setCurrentFolder(parentFolder || null);
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-1"
          >
            ← Back to parent folder
          </button>
        )}
        
        {/* New Menu Button - Below Title */}
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
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100 last:rounded-b-lg"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Upload Document</span>
              </button>
              <button
                onClick={() => {
                  setShowOCRModal(true);
                  setShowNewMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors last:rounded-b-lg"
              >
                <ScanText className="w-5 h-5 text-green-600" />
                <span>Scan with OCR</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentFolder(crumb.id)}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4" />}
            </div>
          ))}
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="ocr">OCR</option>
            </select>
          </div>

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

      {/* Folders Section */}
      {subfolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Folders</h3>
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-3'}>
            {subfolders.map((folder) => (
              <FolderCard
                key={folder.folder_id}
                folder={folder}
                viewMode={viewMode}
                docCount={getFolderDocumentCount(folder.folder_id)}
                onFolderClick={setCurrentFolder}
                onDeleteClick={onDeleteFolder}
                onShareClick={onShareFolder}
                onRenameClick={onRenameFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {documentsToShow.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-3'}>
            {documentsToShow.map((doc) => (
              <div key={doc.doc_id} className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group p-3 ${viewMode === 'list' ? 'flex items-center justify-between' : 'flex items-center gap-3'}`}>
                {viewMode === 'grid' ? (
                  // Grid View - Horizontal Card Layout
                  <>
                    <button 
                      onDoubleClick={() => onOpenDocument(doc)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <FileTypeIcon doc={doc} size="small" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{doc.doc_name}</h3>
                      {doc.doc_desc && <p className="text-xs text-gray-600 line-clamp-1">{doc.doc_desc}</p>}
                      <p className="text-xs text-gray-500">Created: {doc.doc_uploaded}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <ContextMenu
                        item={doc}
                        itemType="document"
                        onDownload={onDownloadDocument}
                        onShare={onShareDocument}
                        onRename={onRenameDocument}
                        onDelete={() => onDeleteDocument(doc.doc_id)}
                        onAddCategories={() => console.log('Add categories')}
                        onPermissions={() => console.log('Permissions')}
                      />
                    </div>
                  </>
                ) : (
                  // List View - Row Layout
                  <>
                    <div className="flex items-start gap-4 flex-1" onDoubleClick={() => onOpenDocument(doc)}>
                      <button 
                        className="flex-shrink-0 group/doc cursor-pointer"
                      >
                        <FileTypeIcon doc={doc} size="small" />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{doc.doc_name}</h3>
                        {doc.doc_desc && <p className="text-sm text-gray-600 mb-2">{doc.doc_desc}</p>}
                        <p className="text-xs text-gray-500">Created: {doc.doc_uploaded}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ContextMenu
                        item={doc}
                        itemType="document"
                        onDownload={onDownloadDocument}
                        onShare={onShareDocument}
                        onRename={onRenameDocument}
                        onDelete={() => onDeleteDocument(doc.doc_id)}
                        onAddCategories={() => console.log('Add categories')}
                        onPermissions={() => console.log('Permissions')}
                        onMoveToFolder={() => onMoveToFolder(doc.doc_id)}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
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
              <p className="text-gray-500 text-lg mb-2">No documents or folders yet</p>
              <p className="text-gray-400 text-sm">Create a folder or upload a document to get started</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
