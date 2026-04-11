import { UserPlus, Users, ClipboardList } from 'lucide-react';

export default function SystemAdminDashboard({ 
  userList, 
  documentList,
  auditLogs = [],
  dataStore,
  pendingRequestsCount = 0
}) {
  const totalDocuments = documentList.length;
  const totalUsers = userList.length;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Requests</p>
              <p className="text-3xl font-bold text-gray-800">{pendingRequestsCount}</p>
            </div>
            <UserPlus className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Audit Logs</p>
              <p className="text-3xl font-bold text-gray-800">{auditLogs.length}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
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
