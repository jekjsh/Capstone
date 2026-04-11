import { FileText, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { documentAPI, authAPI } from '../../services/api';
import AdminPagination from './AdminPagination';

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
  const [adminOrg, setAdminOrg] = useState(null);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await documentAPI.getAll();
      console.log('Fetched documents:', data);
      setAllDocuments(Array.isArray(data) ? data : []);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All User Documents</h2>
          <p className="text-sm text-gray-600 mt-1">View and monitor all documents created by users in your organization</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
          <span className="font-semibold">{allDocuments.length}</span> total documents
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((doc) => (
                    <tr key={doc.doc_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {getUserFullName(doc.user_index)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.doc_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {doc.doc_desc || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {doc.folder ? doc.folder.folder_name : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.doc_uploaded).toLocaleDateString()}
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
        <AdminPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredDocuments.length / rowsPerPage)}
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
          onLastPage={() => setCurrentPage(Math.ceil(filteredDocuments.length / rowsPerPage))}
          onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => Math.min(Math.ceil(filteredDocuments.length / rowsPerPage), prev + 1))}
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