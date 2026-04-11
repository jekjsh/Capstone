import { Users, Folder, Share2, ClipboardList } from 'lucide-react';

// Helper function to truncate text
const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export default function AdminDashboard({ 
  userList, 
  documentList,
  auditLogs = [],
  dataStore,     
  setActiveSection,
  currentUser,
  organizationTree = [],
  organizations = []
}) {
  // Find the organization the admin belongs to
  const getAdminOrganizationId = () => {
    if (!currentUser) return null;
    
    // First, check direct fields
    let orgId = currentUser.organizationUnitId || 
                currentUser.org || 
                currentUser.user_org_id ||
                currentUser.organization_unit_id ||
                currentUser.orgId;
    
    // If not found, check full_data object
    if (!orgId && currentUser.full_data) {
      orgId = currentUser.full_data.organizationUnitId || 
              currentUser.full_data.org || 
              currentUser.full_data.user_org_id ||
              currentUser.full_data.organization_unit_id ||
              currentUser.full_data.orgId;
    }
    
    console.log('Admin user:', currentUser);
    console.log('Detected admin org ID:', orgId);
    
    return orgId;
  };

  const adminOrgId = getAdminOrganizationId();

  // Find organization details from organizationTree or organizations list
  const findOrgDetails = (orgId) => {
    if (!orgId) return null;
    
    // Search in organizations list
    let org = organizations.find(o => o.id === orgId || String(o.id) === String(orgId));
    if (org) return org;
    
    // Search in organizationTree (recursive)
    const searchTree = (items) => {
      for (let item of items) {
        if (item.id === orgId || String(item.id) === String(orgId)) return item;
        if (item.children && item.children.length > 0) {
          const found = searchTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    org = searchTree(organizationTree);
    return org;
  };

  const adminOrg = findOrgDetails(adminOrgId);
  console.log('Admin organization:', adminOrg);

  // Filter users by admin's organization - match all possible org ID fields
  const orgUsers = adminOrgId 
    ? userList.filter(user => {
        const userOrgId = user.organizationUnitId || 
                         user.org || 
                         user.user_org_id ||
                         user.organization_unit_id ||
                         user.orgId;
        const matches = userOrgId === adminOrgId;
        if (!matches) {
          console.log('User mismatch:', user.id, 'userOrgId:', userOrgId, 'adminOrgId:', adminOrgId);
        }
        return matches;
      })
    : userList;

  console.log('Filtered users:', orgUsers.length, 'out of', userList.length);

  // Filter documents by admin's organization - match all possible org ID fields
  const orgDocuments = adminOrgId
    ? documentList.filter(doc => {
        const docOrgId = doc.organizationUnitId || 
                        doc.org || 
                        doc.user_org_id ||
                        doc.organization_unit_id ||
                        doc.orgId;
        return docOrgId === adminOrgId;
      })
    : documentList;

  const orgName = adminOrg?.name || 'Organization';
  const totalUsers = orgUsers.length;
  const totalDocuments = orgDocuments.length;
  const totalOrgShares = dataStore ? dataStore.getAllOrgShares().length : 0;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Users within {orgName}</p>
              <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Documents in {orgName}</p>
              <p className="text-3xl font-bold text-gray-800">{totalDocuments}</p>
            </div>
            <Folder className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Organization Shares</p>
              <p className="text-3xl font-bold text-gray-800">{totalOrgShares}</p>
            </div>
            <Share2 className="w-12 h-12 text-purple-500 opacity-50" />
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
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
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
              {(() => {
                // Filter for document, folder, and category-related activities only
                const relevantActions = ['Create', 'Update', 'Delete', 'Move', 'Copy', 'Share', 'Unshare'];
                const recentActivities = auditLogs
                  .filter(log => {
                    const resource = (log?.resource || '').toLowerCase();
                    const action = (log?.action || '').toLowerCase();
                    // Show only if resource contains document, folder, or category
                    // AND action is one of the relevant actions
                    return (
                      (resource.includes('document') || resource.includes('folder') || resource.includes('category')) &&
                      relevantActions.some(a => action.includes(a.toLowerCase()))
                    );
                  })
                  .slice(0, 5);

                if (recentActivities.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No document, folder, or category activities recorded yet.
                      </td>
                    </tr>
                  );
                }

                return recentActivities.map((log, idx) => {
                  let formattedDate = 'N/A';
                  try {
                    if (log?.timestamp) {
                      const date = new Date(log.timestamp);
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
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}