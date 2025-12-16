import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api';

const ACTION_COLORS = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-red-100 text-red-800',
  create: 'bg-blue-100 text-blue-800',
  view: 'bg-gray-100 text-gray-800',
  edit: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-200 text-red-900',
  download: 'bg-purple-100 text-purple-800',
  share: 'bg-indigo-100 text-indigo-800',
  upload: 'bg-cyan-100 text-cyan-800',
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/recent-activity/');
      console.log('[RecentActivity] Fetched activities:', response.data);
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data.activities)) {
        setActivities(response.data.activities);
      } else if (response.data && Array.isArray(response.data)) {
        setActivities(response.data);
      } else {
        console.warn('[RecentActivity] Unexpected response format:', response.data);
        setActivities([]);
      }
    } catch (err) {
      console.error('[RecentActivity] Error fetching activities:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError('Failed to load recent activity');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading recent activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchActivities}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="p-2 hover:bg-gray-200 rounded transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchActivities}
            className="text-sm px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent activity yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Target/Document</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">IP Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {activity.username}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ACTION_COLORS[activity.action] || 'bg-gray-100 text-gray-800'}`}>
                      {activity.action_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {activity.target_doc || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                    {activity.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatTime(activity.log_timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-600">
        Showing latest {activities.length} activities • Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
