import { FileText, Folder, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../api';
import RecentActivity from './RecentActivity';

export default function AdminDashboard({ 
  userList, 
  documentList,  
  dataStore,     
  setActiveSection,
  currentUser
}) {
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch total users and active sessions from backend
    const fetchCounts = async () => {
      console.log('[AdminDashboard] Starting fetch counts...');
      try {
        // Fetch total users
        const usersResponse = await api.get('/auth/users/');
        console.log('[AdminDashboard] Users response:', usersResponse.data);
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          setTotalUsersCount(usersResponse.data.length);
        } else if (usersResponse.data && usersResponse.data.count) {
          setTotalUsersCount(usersResponse.data.count);
        }
        
        // Fetch active sessions (valid access tokens)
        try {
          const sessionsResponse = await api.get('/auth/active-sessions/');
          console.log('[AdminDashboard] Active sessions response:', sessionsResponse.data);
          if (sessionsResponse.data && sessionsResponse.data.active_sessions !== undefined) {
            setActiveSessions(sessionsResponse.data.active_sessions);
            console.log('[AdminDashboard] Set active sessions to:', sessionsResponse.data.active_sessions);
          }
        } catch (sessionError) {
          console.error('[AdminDashboard] Error fetching active sessions:', {
            message: sessionError.message,
            response: sessionError.response?.data,
            status: sessionError.response?.status
          });
          setActiveSessions(0);
        }
      } catch (error) {
        console.error('[AdminDashboard] Error fetching counts:', error);
        // Fallback to dataStore if API fails
        setTotalUsersCount(userList ? userList.length : 0);
        setActiveSessions(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [userList]);

  const auditLogs = dataStore ? dataStore.getAllAuditLogs() : [];
  
  const totalDocuments = dataStore ? dataStore.getAllDocuments().length : documentList.length;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : totalUsersCount}</p>
            </div>
            <svg className="w-12 h-12 text-blue-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Documents</p>
              <p className="text-3xl font-bold text-gray-800">{totalDocuments}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : activeSessions}</p>
            </div>
            <LayoutDashboard className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <RecentActivity />
    </div>
  );
}