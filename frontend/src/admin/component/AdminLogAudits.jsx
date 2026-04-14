import { Search, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import Pagination from '../../components/Pagination';

// Helper function to truncate text
const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export default function AdminLogAudits({
  auditLogs = [],
  logSearchQuery = '',
  setLogSearchQuery = () => {},
  logFilterAction = 'All',
  setLogFilterAction = () => {},
  logFilterStatus = 'All',
  setLogFilterStatus = () => {},
  getActions = () => [],
  getFilteredLogs = () => []
}) {
  
  const [, setRenderKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    setRenderKey(prev => prev + 1);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [auditLogs, auditLogs.length, logSearchQuery, logFilterAction, logFilterStatus]);
  
  const filteredLogs = getFilteredLogs();
  
  // Pagination calculations
  const totalRecords = filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  
  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to page 1
  };
  
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePreviousPage = () => handlePageChange(currentPage - 1);
  const handleNextPage = () => handlePageChange(currentPage + 1);
  
  // CSV Export function
  const exportToCSV = () => {
    const headers = ['Timestamp', 'User ID', 'User Name', 'Action', 'Resource', 'Status'];
    const rows = filteredLogs.map(log => [
      log?.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      log?.userId || 'N/A',
      log?.userName || 'N/A',
      log?.action || 'N/A',
      log?.resource || 'N/A',
      log?.status || 'N/A'
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
        <button
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export filtered logs to CSV"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={logSearchQuery}
            onChange={(e) => setLogSearchQuery(e.target.value)}
            placeholder="Search by User, Action, or Resource..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Action</label>
            <select
              value={logFilterAction}
              onChange={(e) => setLogFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Actions</option>
              {getActions().map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={logFilterStatus}
              onChange={(e) => setLogFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {(logSearchQuery || logFilterAction !== 'All' || logFilterStatus !== 'All') && (
          <button
            onClick={() => {
              setLogSearchQuery('');
              setLogFilterAction('All');
              setLogFilterStatus('All');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All Filters
          </button>
        )}

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold">{totalRecords}</span> logs
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {auditLogs.length === 0 
                      ? "No audit logs recorded yet. System activities will appear here."
                      : "No logs match your search criteria. Try adjusting your filters."}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => {
                  // Safe date formatting
                  let formattedDate = 'N/A';
                  try {
                    if (log?.timestamp) {
                      const date = new Date(log.timestamp);
                      // Check if date is valid
                      if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleString();
                      }
                    }
                  } catch (e) {
                    console.warn('Error formatting date:', e, log?.timestamp);
                  }

                  return (
                    <tr key={`${log?.logId || idx}-${idx}`} className="hover:bg-gray-50 h-20">
                      <td className="px-6 py-4 text-sm text-gray-900 align-middle truncate">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-middle">
                        <div>
                          <p className="font-medium truncate">{log?.userName || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500 truncate">{log?.userId || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-middle truncate">{log?.action || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 align-middle" title={log?.resource || ''}>
                        <div className="line-clamp-2">{truncateText(log?.resource, 50)}</div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                          log?.status === 'Success' || log?.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log?.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        rowsPerPage={rowsPerPage}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onFirstPage={handleFirstPage}
        onLastPage={handleLastPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
}