import { UserPlus, Users, ClipboardList } from 'lucide-react';

export default function SystemAdminDashboard({ 
  userList, 
  documentList,
  auditLogs = [],
  dataStore,
  pendingRequestsCount = 0,
  requestStatusBreakdown = { pending: 0, approved: 0, denied: 0 },
  setActiveSection = () => {}
}) {
  const totalDocuments = documentList.length;
  const totalUsers = userList.length;
  const pendingCount = requestStatusBreakdown.pending || 0;
  const approvedCount = requestStatusBreakdown.approved || 0;
  const deniedCount = requestStatusBreakdown.denied || 0;
  const totalRequestStatus = pendingCount + approvedCount + deniedCount;

  const pendingPercent = totalRequestStatus > 0 ? (pendingCount / totalRequestStatus) * 100 : 0;
  const approvedPercent = totalRequestStatus > 0 ? (approvedCount / totalRequestStatus) * 100 : 0;
  const deniedPercent = totalRequestStatus > 0 ? (deniedCount / totalRequestStatus) * 100 : 0;

  const auditSuccessCount = auditLogs.filter((log) => (log.status || '').toLowerCase() === 'success').length;
  const auditFailedCount = auditLogs.filter((log) => (log.status || '').toLowerCase() !== 'success').length;
  const totalAuditStatus = auditSuccessCount + auditFailedCount;
  const auditSuccessPercent = totalAuditStatus > 0 ? (auditSuccessCount / totalAuditStatus) * 100 : 0;
  const auditFailedPercent = totalAuditStatus > 0 ? (auditFailedCount / totalAuditStatus) * 100 : 0;

  const pieBackground = `conic-gradient(
    #f59e0b 0% ${pendingPercent}%,
    #10b981 ${pendingPercent}% ${pendingPercent + approvedPercent}%,
    #ef4444 ${pendingPercent + approvedPercent}% 100%
  )`;

  const auditPieBackground = `conic-gradient(
    #10b981 0% ${auditSuccessPercent}%,
    #ef4444 ${auditSuccessPercent}% 100%
  )`;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveSection('user-management')}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </button>
        <button 
          onClick={() => setActiveSection('requests')}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Requests</p>
              <p className="text-3xl font-bold text-gray-800">{pendingRequestsCount}</p>
            </div>
            <UserPlus className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </button>
        <button 
          onClick={() => setActiveSection('audit-logs')}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Audit Logs</p>
              <p className="text-3xl font-bold text-gray-800">{auditLogs.length}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Request Status Distribution</h3>
            <button
              onClick={() => setActiveSection('requests')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Open Requests
            </button>
          </div>

          {totalRequestStatus === 0 ? (
            <p className="text-gray-500 text-center py-6">No request data available yet</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <div
                  className="w-44 h-44 rounded-full"
                  style={{ background: pieBackground }}
                />
                <div className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <span className="text-sm font-semibold text-gray-700">{totalRequestStatus}</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <span className="font-semibold text-gray-800">{pendingCount} ({pendingPercent.toFixed(1)}%)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-700">Approved</span>
                  </div>
                  <span className="font-semibold text-gray-800">{approvedCount} ({approvedPercent.toFixed(1)}%)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-700">Denied</span>
                  </div>
                  <span className="font-semibold text-gray-800">{deniedCount} ({deniedPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Audit Status Distribution</h3>
            <button
              onClick={() => setActiveSection('audit-logs')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Open Audit Logs
            </button>
          </div>

          {totalAuditStatus === 0 ? (
            <p className="text-gray-500 text-center py-6">No audit data available yet</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <div
                  className="w-44 h-44 rounded-full"
                  style={{ background: auditPieBackground }}
                />
                <div className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <span className="text-sm font-semibold text-gray-700">{totalAuditStatus}</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-700">Success</span>
                  </div>
                  <span className="font-semibold text-gray-800">{auditSuccessCount} ({auditSuccessPercent.toFixed(1)}%)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-700">Failed</span>
                  </div>
                  <span className="font-semibold text-gray-800">{auditFailedCount} ({auditFailedPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {auditLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity to display</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.userName || activity.userId}</p>
                  {activity.resource && (
                    <p className="text-xs text-gray-400 mt-1">{activity.resource}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : activity.time}</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                    activity.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
