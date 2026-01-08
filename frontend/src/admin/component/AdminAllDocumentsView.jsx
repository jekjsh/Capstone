import { FileText, Search, Eye, Download, Trash2, User, Clock } from 'lucide-react';
import { useState } from 'react';

export default function AdminAllDocumentsView({ dataStore, userList, onViewDocument, onDownloadDocument }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('All');
  const [filterFormat, setFilterFormat] = useState('All');
  
  const allDocuments = dataStore.getAllDocuments();

  const filteredDocuments = allDocuments.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.createdBy?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUser = filterUser === 'All' || doc.createdBy === filterUser;
    const matchesFormat = filterFormat === 'All' || doc.format === filterFormat;
    
    return matchesSearch && matchesUser && matchesFormat;
  });

  const getUserName = (userId) => {
    const user = userList.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All User Documents</h2>
          <p className="text-sm text-gray-600 mt-1">View and monitor all documents created by users</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
          <span className="font-semibold">{allDocuments.length}</span> total documents
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or creator..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Users</option>
            {userList.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.id})</option>
            ))}
          </select>

          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="ocr">OCR</option>
            <option value="other">Other</option>
          </select>
        </div>

        {(searchQuery || filterUser !== 'All' || filterFormat !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterUser('All');
              setFilterFormat('All');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All Filters
          </button>
        )}

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredDocuments.length}</span> of <span className="font-semibold">{allDocuments.length}</span> documents
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {allDocuments.length === 0 
              ? 'No documents created yet' 
              : 'No documents match your filters'}
          </p>
          <p className="text-gray-400 text-sm">
            {allDocuments.length === 0
              ? 'When users create documents, they will appear here'
              : 'Try adjusting your search or filter criteria'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
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

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 mb-3">{doc.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Created by: <strong>{getUserName(doc.createdBy)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{doc.createdAt}</span>
                    </div>
                    {doc.folderId && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        In Folder
                      </span>
                    )}
                  </div>

                  {doc.personalInfo && Object.keys(doc.personalInfo).some(key => doc.personalInfo[key]) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 text-sm mb-2">Personal Information:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {doc.personalInfo.fullName && (
                          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{doc.personalInfo.fullName}</span></div>
                        )}
                        {doc.personalInfo.email && (
                          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{doc.personalInfo.email}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {doc.customFieldValues && Object.keys(doc.customFieldValues).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="font-semibold text-gray-700 text-sm mb-2">Custom Fields:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(doc.customFieldValues).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* âœ… Action Buttons */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={() => onViewDocument(doc)}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                </button>
                <button
                  onClick={() => onDownloadDocument(doc)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>ðŸ’¡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Admin View:</strong> This page shows all documents created by all users in the system. 
            You can view, download, search, and filter documents. Click "View Document" to open and inspect any document in detail.
          </p>
        </div>
      </div>
    </div>
  );
}