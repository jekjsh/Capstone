import { Search } from 'lucide-react';

export default function AdminLogAudits({
  auditLogs,
  logSearchQuery,
  setLogSearchQuery,
  logFilterAction,
  setLogFilterAction,
  logFilterStatus,
  setLogFilterStatus,
  getActions,
  getFilteredLogs
}) {
  const filteredLogs = getFilteredLogs();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Log Audits</h2>

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
          Showing <span className="font-semibold">{filteredLogs.length}</span> of <span className="font-semibold">{auditLogs.length}</span> logs
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {auditLogs.length === 0 
                      ? "No audit logs recorded yet. System activities will appear here."
                      : "No logs match your search criteria. Try adjusting your filters."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{log.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.resource}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}