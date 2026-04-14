import { useState } from 'react';
import { Trash2, RotateCcw, XCircle, FileText, Clock, User, AlertTriangle } from 'lucide-react';
export default function RecycleBin({ 
  deletedDocuments, 
  deletedFolders = [],
  currentUser,
  onRestore, 
  onRestoreAll,
  onRestoreFolder,
  onPermanentDeleteFolder,
  onPermanentDelete, 
  onEmptyBin,
  showAll = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState('All');
  const normalizedDeletedDocs = (deletedDocuments || []).map((doc) => {
    const name = doc.title || doc.doc_name || 'Untitled';
    const description = doc.description || doc.doc_desc || '';
    const createdBy = doc.createdBy || doc.user_index?.user_id || doc.uploaded_by_user?.user_id || '';
    const deletedAt = doc.deletedAt || doc.deleted_at || doc.updated_at || doc.doc_uploaded;
    const format = (() => {
      const lower = String(name).toLowerCase();
      if (lower.endsWith('.pdf')) return 'pdf';
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
      if (lower.includes('ocr')) return 'ocr';
      return doc.format || 'other';
    })();

    return {
      ...doc,
      id: doc.id || doc.doc_id,
      title: name,
      description,
      createdBy,
      deletedAt,
      format,
      createdAt: doc.createdAt || doc.doc_uploaded || doc.updated_at,
    };
  });

  const userDeletedDocs = showAll
    ? normalizedDeletedDocs
    : normalizedDeletedDocs.filter((doc) => String(doc.createdBy) === String(currentUser.id));

  const normalizedDeletedFolders = (deletedFolders || []).map((folder) => ({
    ...folder,
    id: folder.id || folder.folder_id,
    name: folder.name || folder.folder_name || 'Untitled Folder',
    deletedAt: folder.deletedAt || folder.deleted_at || folder.updated_at || folder.created_at,
    createdAt: folder.createdAt || folder.created_at || folder.updated_at,
  }));

  const userDeletedFolders = normalizedDeletedFolders;
  const filteredDocs = userDeletedDocs.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFormat = filterFormat === 'All' || doc.format === filterFormat;
    
    return matchesSearch && matchesFormat;
  });

  const filteredFolders = userDeletedFolders.filter((folder) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return String(folder.name || '').toLowerCase().includes(q);
  });

  const totalDeletedItems = userDeletedDocs.length + userDeletedFolders.length;
  const getDaysRemaining = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now - deleted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recycle Bin</h2>
          <p className="text-sm text-gray-600 mt-1">
            Deleted documents are kept for 30 days before permanent deletion
          </p>
        </div>
        {totalDeletedItems > 0 && (
          <div className="flex items-center gap-2">
            {onRestoreAll && (
              <button
                onClick={() => {
                  if (window.confirm(`Restore all ${userDeletedDocs.length} deleted documents?`)) {
                    onRestoreAll();
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restore All
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete ALL ${userDeletedDocs.length} deleted documents? This cannot be undone!`)) {
                  onEmptyBin();
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Empty Recycle Bin
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {totalDeletedItems > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deleted documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Formats</option>
              <option value="pdf">PDF Only</option>
              <option value="docx">DOCX Only</option>
              <option value="ocr">OCR Only</option>
              <option value="other">Other</option>
            </select>
          </div>

          {(searchQuery || filterFormat !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterFormat('All');
              }}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear Filters
            </button>
          )}

          <div className="mt-3 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredDocs.length + filteredFolders.length}</span> of <span className="font-semibold">{totalDeletedItems}</span> deleted items
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {totalDeletedItems > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Documents in the recycle bin will be automatically and permanently deleted after 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalDeletedItems === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Recycle Bin is Empty</p>
          <p className="text-gray-400 text-sm">
            Deleted files and folders will appear here and can be restored within 30 days
          </p>
        </div>
      ) : filteredDocs.length === 0 && filteredFolders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No deleted items match your filters</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFolders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-700">Deleted Folders</div>
              <div className="divide-y divide-gray-100">
                {filteredFolders.map((folder) => (
                  <div key={folder.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-800">{folder.name}</p>
                      <p className="text-xs text-gray-500">Deleted: {folder.deletedAt || '-'}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 ml-auto">
                      <button
                        onClick={() => onRestoreFolder && onRestoreFolder(folder.id)}
                        disabled={!onRestoreFolder}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (onPermanentDeleteFolder && window.confirm(`Permanently delete folder \"${folder.name}\"? This cannot be undone.`)) {
                            onPermanentDeleteFolder(folder.id);
                          }
                        }}
                        disabled={!onPermanentDeleteFolder}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocs.map((doc) => {
            const daysRemaining = getDaysRemaining(doc.deletedAt);
            const isExpiringSoon = daysRemaining <= 7;

            return (
                <div
                  key={doc.id}
                  className="bg-white p-6 rounded-lg shadow-md border-2 border-red-200 hover:shadow-lg transition-shadow"
                >
                <div className="flex items-start gap-4">
                  {/* Document Icon */}
                  <div className={`w-16 h-20 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                    doc.format === 'pdf' ? 'bg-red-100' :
                    doc.format === 'ocr' ? 'bg-green-100' :
                    doc.format === 'docx' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <FileText className={`w-8 h-8 mb-1 ${
                      doc.format === 'pdf' ? 'text-red-600' :
                      doc.format === 'ocr' ? 'text-green-600' :
                      doc.format === 'docx' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                    <span className={`text-xs font-bold ${
                      doc.format === 'pdf' ? 'text-red-600' :
                      doc.format === 'ocr' ? 'text-green-600' :
                      doc.format === 'docx' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {doc.format?.toUpperCase() || 'DOC'}
                    </span>
                  </div>

                  {/* Document Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-gray-600 mb-3">{doc.description}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Deleted: {doc.deletedAt}</span>
                      </div>
                      <div className={`flex items-center gap-2 font-semibold ${
                        isExpiringSoon ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                        </span>
                      </div>
                    </div>

                    {/* Original Creation Info */}
                    <div className="text-xs text-gray-500 mb-3">
                      Originally created: {doc.createdAt}
                    </div>

                    {/* Custom Fields Preview */}
                    {doc.customFieldValues && Object.keys(doc.customFieldValues).length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Custom Fields:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(doc.customFieldValues).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              <strong>{key}:</strong> {value}
                            </span>
                          ))}
                          {Object.keys(doc.customFieldValues).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{Object.keys(doc.customFieldValues).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => onRestore(doc.id)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete "${doc.title}"? This cannot be undone!`)) {
                        onPermanentDelete(doc.id);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Delete Forever
                  </button>
                </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
