import { Plus, Upload, ScanText, FileText, Trash2, Folder, Share2, Building2, Tag, FileSpreadsheet, LayoutGrid, List, Grid, Eye, Download, Calendar } from 'lucide-react';
import { useState } from 'react';
import { TagFilter, TagDisplay, getAllTagsFromDocuments } from './TagComponents';

export default function Documents({
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
  setShowUploadDocumentModal,
  setShowOCRModal,
  setShowAddDocumentModal,
  onOpenDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPrintDocument,
  onMoveToFolder,
  onShareDocument,
  onSendToOrganization,
  dataStore
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card', 'list', 'details'

  // Get all unique tags from user documents
  const allTags = getAllTagsFromDocuments(userDocuments);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Filter documents by selected tags
  const documentsFilteredByTags = selectedTags.length > 0
    ? filteredDocuments.filter(doc => 
        doc.tags && selectedTags.every(tag => doc.tags.includes(tag))
      )
    : filteredDocuments;

  const finalFilteredDocuments = documentsFilteredByTags;

  const getDocumentIcon = (doc) => {
    if (doc.format === 'excel') {
      return (
        <div className="w-16 h-20 bg-green-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300">
          <FileSpreadsheet className="w-8 h-8 text-green-600 mb-1" />
          <span className="text-xs font-bold text-green-600">EXCEL</span>
        </div>
      );
    }
    
    if (doc.format === 'pdf') {
      return (
        <div className="w-16 h-20 bg-red-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-red-200 transition-colors cursor-pointer border-2 border-red-300">
          <FileText className="w-8 h-8 text-red-600 mb-1" />
          <span className="text-xs font-bold text-red-600">PDF</span>
        </div>
      );
    }
    
    if (doc.format === 'ocr') {
      return (
        <div className="w-16 h-20 bg-green-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300">
          <ScanText className="w-8 h-8 text-green-600 mb-1" />
          <span className="text-xs font-bold text-green-600">OCR</span>
        </div>
      );
    }
    
    if (doc.format === 'docx') {
      return (
        <div className="w-16 h-20 bg-blue-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-blue-200 transition-colors cursor-pointer border-2 border-blue-300">
          <FileText className="w-8 h-8 text-blue-600 mb-1" />
          <span className="text-xs font-bold text-blue-600">DOCX</span>
        </div>
      );
    }
    
    return (
      <div className="w-16 h-20 bg-gray-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors cursor-pointer border-2 border-gray-300">
        <FileText className="w-8 h-8 text-gray-600 mb-1" />
        <span className="text-xs font-bold text-gray-600">DOC</span>
      </div>
    );
  };

  const getFormatBadge = (format) => {
    const colors = {
      pdf: 'bg-red-100 text-red-700',
      excel: 'bg-green-100 text-green-700',
      ocr: 'bg-green-100 text-green-700',
      docx: 'bg-blue-100 text-blue-700'
    };
    return colors[format] || 'bg-gray-100 text-gray-700';
  };

  // CARD VIEW (Current/Default View)
  const CardView = () => (
    <div className="grid grid-cols-1 gap-4">
      {finalFilteredDocuments.map((doc) => (
        <div key={doc.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4 flex-1">
              <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0 group">
                {getDocumentIcon(doc)}
              </button>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{doc.title}</h3>
                {doc.description && <p className="text-gray-600 mb-3">{doc.description}</p>}
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mb-3">
                    <TagDisplay tags={doc.tags} maxDisplay={5} />
                  </div>
                )}
                
                <p className="text-sm text-gray-500">Created: {doc.createdAt}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onSendToOrganization(doc)} className="text-blue-600 hover:text-blue-900 p-2" title="Send to organization">
                <Building2 className="w-5 h-5" />
              </button>
              <button onClick={() => onShareDocument(doc)} className="text-purple-600 hover:text-purple-900 p-2" title="Share document">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => onMoveToFolder(doc.id)} className="text-blue-600 hover:text-blue-900 p-2" title="Move to folder">
                <Folder className="w-5 h-5" />
              </button>
              <button onClick={() => onDownloadDocument(doc)} className="text-green-600 hover:text-green-900 p-2" title="Download document">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => onDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900 p-2" title="Delete document">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {doc.personalInfo && Object.keys(doc.personalInfo).some(key => doc.personalInfo[key]) && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-700 mb-3">Personal Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doc.personalInfo.fullName && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Full Name</p>
                    <p className="text-gray-800">{doc.personalInfo.fullName}</p>
                  </div>
                )}
                {doc.personalInfo.email && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Email</p>
                    <p className="text-gray-800">{doc.personalInfo.email}</p>
                  </div>
                )}
                {doc.personalInfo.dateOfBirth && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Date of Birth</p>
                    <p className="text-gray-800">{doc.personalInfo.dateOfBirth}</p>
                  </div>
                )}
                {doc.personalInfo.phoneNumber && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Phone Number</p>
                    <p className="text-gray-800">{doc.personalInfo.phoneNumber}</p>
                  </div>
                )}
                {doc.personalInfo.address && (
                  <div className="bg-blue-50 p-3 rounded col-span-2">
                    <p className="text-sm text-blue-600 font-medium">Address</p>
                    <p className="text-gray-800">{doc.personalInfo.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t pt-4 mt-4 flex gap-2">
            <button onClick={() => onOpenDocument(doc)} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              View
            </button>
            <button onClick={() => onDownloadDocument(doc)} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button onClick={() => onPrintDocument(doc)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // LIST VIEW
  const ListView = () => (
    <div className="space-y-2">
      {finalFilteredDocuments.map((doc) => (
        <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all group">
          <div className="flex items-center gap-4">
            <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0">
              {getDocumentIcon(doc)}
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{doc.title}</h3>
              <p className="text-sm text-gray-500 truncate">{doc.description}</p>
              
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && <span className="text-xs text-gray-500">+{doc.tags.length - 3}</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getFormatBadge(doc.format)}`}>
                {doc.format?.toUpperCase() || 'DOC'}
              </span>
              <div className="text-right min-w-[120px]">
                <p className="text-xs">{doc.createdAt}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onSendToOrganization(doc)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" title="Send to Organization">
                <Building2 className="w-4 h-4" />
              </button>
              <button onClick={() => onShareDocument(doc)} className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors" title="Share">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => onMoveToFolder(doc.id)} className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors" title="Move to Folder">
                <Folder className="w-4 h-4" />
              </button>
              <button onClick={() => onOpenDocument(doc)} className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => onDownloadDocument(doc)} className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => onDeleteDocument(doc.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // DETAILS VIEW (Table)
  const DetailsView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finalFilteredDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0">
                      {getDocumentIcon(doc)}
                    </button>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-sm text-gray-500 truncate">{doc.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getFormatBadge(doc.format)}`}>
                    {doc.format?.toUpperCase() || 'DOC'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">{doc.fileSize || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags && doc.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {doc.tags && doc.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{doc.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => onSendToOrganization(doc)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" title="Send to Organization">
                      <Building2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onShareDocument(doc)} className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onMoveToFolder(doc.id)} className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors" title="Move to Folder">
                      <Folder className="w-4 h-4" />
                    </button>
                    <button onClick={() => onOpenDocument(doc)} className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDownloadDocument(doc)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'My Documents'}
          </h2>
          {currentFolder && (
            <button onClick={() => setCurrentFolder(null)} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1">
              â† Back to all documents
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowUploadDocumentModal(true)} className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
          <button onClick={() => setShowOCRModal(true)} className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md">
            <ScanText className="w-5 h-5" />
            Use OCR
          </button>
        </div>
      </div>

      {/* Filters and View Mode Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Documents</label>
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title, description, name..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Format</label>
            <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Formats</option>
              <option value="pdf">PDF Only</option>
              <option value="docx">DOCX Only</option>
              <option value="excel">Excel Only</option>
              <option value="ocr">OCR Only</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>

          {/* View Mode Selector - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="card">Card View</option>
              <option value="list">List View</option>
              <option value="details">Details View</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {finalFilteredDocuments.length} of {userDocuments.length} document{userDocuments.length !== 1 ? 's' : ''}
            {selectedTags.length > 0 && ` (filtered by ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''})`}
          </span>
          {(searchQuery || filterFormat !== 'all' || sortBy !== 'date-desc' || selectedTags.length > 0) && (
            <button onClick={() => { setSearchQuery(''); setFilterFormat('all'); setSortBy('date-desc'); setSelectedTags([]); }} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <TagFilter allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearTags={handleClearTags} />
      )}

      {/* Document Views */}
      {userDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents created yet</p>
          <p className="text-gray-400 text-sm mb-4">Upload a document or use OCR to get started</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowUploadDocumentModal(true)} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
            <button onClick={() => setShowOCRModal(true)} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2">
              <ScanText className="w-4 h-4" />
              Use OCR
            </button>
          </div>
        </div>
      ) : finalFilteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents match your filters</p>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filter criteria</p>
          <button onClick={() => { setSearchQuery(''); setFilterFormat('all'); setSortBy('date-desc'); setSelectedTags([]); }} className="text-indigo-600 hover:text-indigo-800 font-medium">
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'card' && <CardView />}
          {viewMode === 'list' && <ListView />}
          {viewMode === 'details' && <DetailsView />}
        </>
      )}
    </div>
  );
}