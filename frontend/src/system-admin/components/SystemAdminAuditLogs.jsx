import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

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

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
        </div>

        {(logSearchQuery || logFilterAction !== 'All' || logFilterStatus !== 'All') && (
          <button
            onClick={() => {
              setLogSearchQuery('');
              setLogFilterAction('All');
              setLogFilterStatus('All');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        )}

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredLogs.length}</span> of <span className="font-semibold">{auditLogs.length}</span> logs
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
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
              {filteredLogs.map((log, idx) => (
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
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
