import { Search, Filter, Download, X } from 'lucide-react';
import { useState } from 'react';
import SystemAdminPagination from './SystemAdminPagination';

export default function SystemAdminAuditLogs({ 
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
  const [sortBy, setSortBy] = useState('date-desc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportPreset, setExportPreset] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredLogs = getFilteredLogs();

  // Sorting logic
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a?.timestamp || a?.time);
    const dateB = new Date(b?.timestamp || b?.time);
    return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    let start, end;

    if (exportPreset === 'custom') {
      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }
      start = new Date(startDate);
      end = new Date(endDate);

      if (start > end) {
        alert('Start date cannot be after end date');
        return;
      }
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);

      switch (exportPreset) {
        case 'today':
          start = new Date(today);
          break;
        case '7days':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          break;
        case '30days':
          start = new Date(today);
          start.setDate(today.getDate() - 30);
          break;
        case 'thisMonth':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          start = new Date(today);
      }
    }
    
    // Filter logs by date range
    const dateFilteredLogs = sortedLogs.filter(log => {
      const logDate = new Date(log?.timestamp || log?.time);
      return logDate >= start && logDate <= end;
    });

    if (dateFilteredLogs.length === 0) {
      alert('No logs to export for the selected date range');
      return;
    }

    // Define CSV headers
    const headers = ['User ID', 'User Name', 'Action', 'Resource', 'Timestamp', 'Status'];
    
    // Convert logs to CSV rows
    const csvRows = dateFilteredLogs.map(log => [
      log?.userId || 'N/A',
      log?.userName || 'Unknown User',
      log?.action || 'N/A',
      log?.resource || '-',
      log?.timestamp ? new Date(log.timestamp).toLocaleString() : log?.time || '-',
      log?.status || 'Unknown'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap cells with commas or quotes in quotes
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by User, Action, or Resource..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={logFilterAction}
            onChange={(e) => setLogFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Actions</option>
            {getActions().map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            value={logFilterStatus}
            onChange={(e) => setLogFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 whitespace-nowrap"
            title="Export logs to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Active Filters Chips */}
        {(logSearchQuery || logFilterAction !== 'All' || logFilterStatus !== 'All') && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {logSearchQuery && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>Search: <span className="font-semibold">{logSearchQuery}</span></span>
                <button
                  onClick={() => setLogSearchQuery('')}
                  className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                  title="Remove search filter"
                >
                  ×
                </button>
              </div>
            )}
            {logFilterAction !== 'All' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>Action: <span className="font-semibold">{logFilterAction}</span></span>
                <button
                  onClick={() => setLogFilterAction('All')}
                  className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                  title="Remove action filter"
                >
                  ×
                </button>
              </div>
            )}
            {logFilterStatus !== 'All' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>Status: <span className="font-semibold">{logFilterStatus}</span></span>
                <button
                  onClick={() => setLogFilterStatus('All')}
                  className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                  title="Remove status filter"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setLogSearchQuery('');
                setLogFilterAction('All');
                setLogFilterStatus('All');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Resource</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{log?.userName || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">{log?.userId || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log?.action || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log?.resource || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log?.timestamp ? new Date(log.timestamp).toLocaleString() : log?.time || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      log?.status === 'Success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log?.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredLogs.length > 0 && (
          <SystemAdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            rowsPerPage={rowsPerPage}
            totalRecords={sortedLogs.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onFirstPage={handleFirstPage}
            onLastPage={handleLastPage}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
        )}
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Export Audit Logs</h2>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">Select the date range for the logs you wish to export.</p>

            <div className="space-y-4">
              {/* Radio Button Presets */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="today"
                    checked={exportPreset === 'today'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Today</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="7days"
                    checked={exportPreset === '7days'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="30days"
                    checked={exportPreset === '30days'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="thisMonth"
                    checked={exportPreset === 'thisMonth'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">This Month</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="custom"
                    checked={exportPreset === 'custom'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Custom Range</span>
                </label>
              </div>

              {/* Conditional Date Inputs */}
              {exportPreset === 'custom' && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => exportToCSV()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
