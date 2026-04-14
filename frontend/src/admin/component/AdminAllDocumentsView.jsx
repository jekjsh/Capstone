import { FileText, Search, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { documentAPI } from '../../services/api';
import Pagination from '../../components/Pagination';

export default function AdminAllDocumentsView({ 
  documents = [], 
  dataStore, 
  userList = [], 
  loggedInUser = null,
  onViewDocument, 
  onDownloadDocument 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allDocuments, setAllDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await documentAPI.getAll();
      const normalized = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      setAllDocuments(normalized);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = allDocuments.filter(doc => {
    const matchesSearch = 
      (doc.doc_name && doc.doc_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.doc_desc && doc.doc_desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.user_index && doc.user_index.first_name && doc.user_index.first_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / rowsPerPage));

  useEffect(() => {
    if (Array.isArray(documents) && documents.length > 0 && allDocuments.length === 0) {
      setAllDocuments(documents);
    }
  }, [documents, allDocuments.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getUserFullName = (userIndex) => {
    if (!userIndex) return 'Unknown';
    // Handle both object and string user_index
    if (typeof userIndex === 'string') return userIndex;
    const firstName = userIndex.first_name || '';
    const middleName = userIndex.middle_name ? userIndex.middle_name.charAt(0) + '.' : '';
    const lastName = userIndex.last_name || '';
    const suffix = userIndex.suffix ? ', ' + userIndex.suffix : '';
    const fullName = `${firstName} ${middleName} ${lastName}${suffix}`.trim();
    return fullName || 'Unknown';
  };

  const exportToCSV = () => {
    if (filteredDocuments.length === 0) {
      alert('No documents to export');
      return;
    }

    // Prepare CSV headers
    const headers = ['Owner', 'User ID', 'Document Name', 'Description', 'Categories', 'Folder', 'Uploaded', 'Updated'];

    // Prepare CSV rows
    const rows = filteredDocuments.map(doc => [
      getUserFullName(doc.user_index),
      doc.user_index?.user_id || '-',
      doc.doc_name,
      doc.doc_desc || '-',
      doc.categories ? doc.categories.map(cat => cat.category_name).join('; ') : '-',
      doc.folder_name || '-',
      new Date(doc.doc_uploaded).toLocaleDateString(),
      new Date(doc.updated_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `documents-export-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All User Documents</h2>
          <p className="text-sm text-gray-600 mt-1">View and monitor all documents created by users in your organization</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToCSV}
            disabled={allDocuments.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export visible documents to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by document name, description, or owner..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear Search
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            {allDocuments.length === 0 ? (
              <>
                <p className="text-lg font-medium">No documents yet</p>
                <p className="text-sm">Documents will appear here when users upload files</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No documents match your search</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Document Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Categories</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Folder</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((doc) => (
                    <tr key={doc.doc_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">
                        {getUserFullName(doc.user_index)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">
                        {doc.user_index?.user_id || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium text-center">
                        {doc.doc_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate text-center">
                        {doc.doc_desc || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {doc.categories && doc.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {doc.categories.map((cat, idx) => (
                              <span key={idx}>
                                {cat.category_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">
                        {doc.folder_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">
                        {new Date(doc.doc_uploaded).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredDocuments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={(currentPage - 1) * rowsPerPage}
          endIndex={currentPage * rowsPerPage}
          rowsPerPage={rowsPerPage}
          totalRecords={filteredDocuments.length}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          onFirstPage={() => setCurrentPage(1)}
          onLastPage={() => setCurrentPage(totalPages)}
          onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        />
      )}

      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Admin View:</strong> Monitor all documents uploaded by users in your organization.
            Use the search bar to filter by document name, description, or owner.
          </p>
        </div>
      </div>
    </div>
  );
}