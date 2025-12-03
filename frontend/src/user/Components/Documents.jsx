// components/Documents.jsx
import { Plus, Upload, ScanText, FileText, Trash2, Folder, Share2 } from 'lucide-react';

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
  onShareDocument
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'My Documents'}
          </h2>
          {currentFolder && (
            <button
              onClick={() => setCurrentFolder(null)}
              className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1"
            >
              ← Back to all documents
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowUploadDocumentModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button onClick={() => setShowOCRModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
            <ScanText className="w-4 h-4" />
            Use OCR
          </button>
          <button onClick={() => setShowAddDocumentModal(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Document
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Documents</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Format</label>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF Only</option>
              <option value="docx">DOCX Only</option>
              <option value="ocr">OCR Only</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
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

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredDocuments.length} of {userDocuments.length} document{userDocuments.length !== 1 ? 's' : ''}
          </span>
          {(searchQuery || filterFormat !== 'all' || sortBy !== 'date-desc') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterFormat('all');
                setSortBy('date-desc');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {userDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents created yet</p>
          <p className="text-gray-400 text-sm mb-4">Click "Create Document" to add your first document</p>
          <button onClick={() => setShowAddDocumentModal(true)} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Document
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents match your filters</p>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterFormat('all');
              setSortBy('date-desc');
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0 group">
                    {doc.format === 'pdf' ? (
                      <div className="w-16 h-20 bg-red-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-red-200 transition-colors cursor-pointer border-2 border-red-300">
                        <FileText className="w-8 h-8 text-red-600 mb-1" />
                        <span className="text-xs font-bold text-red-600">PDF</span>
                      </div>
                    ) : doc.format === 'ocr' ? (
                      <div className="w-16 h-20 bg-green-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300">
                        <ScanText className="w-8 h-8 text-green-600 mb-1" />
                        <span className="text-xs font-bold text-green-600">OCR</span>
                      </div>
                    ) : (
                      <div className="w-16 h-20 bg-blue-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-blue-200 transition-colors cursor-pointer border-2 border-blue-300">
                        <FileText className="w-8 h-8 text-blue-600 mb-1" />
                        <span className="text-xs font-bold text-blue-600">DOCX</span>
                      </div>
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{doc.title}</h3>
                    {doc.description && <p className="text-gray-600 mb-3">{doc.description}</p>}
                    <p className="text-sm text-gray-500">Created: {doc.createdAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onShareDocument(doc)} 
                    className="text-purple-600 hover:text-purple-900 p-2"
                    title="Share document"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onMoveToFolder(doc.id)} 
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Move to folder"
                  >
                    <Folder className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDownloadDocument(doc)} 
                    className="text-green-600 hover:text-green-900 p-2"
                    title="Download document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button onClick={() => onDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900 p-2" title="Delete document">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {Object.keys(doc.customFieldValues || {}).length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Custom Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(doc.customFieldValues).map(([fieldName, value]) => (
                      <div key={fieldName} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 font-medium">{fieldName}</p>
                        <p className="text-gray-800">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <button 
                  onClick={() => onOpenDocument(doc)}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button 
                  onClick={() => onDownloadDocument(doc)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button 
                  onClick={() => onPrintDocument(doc)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}