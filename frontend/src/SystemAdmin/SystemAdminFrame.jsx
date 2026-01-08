import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, ClipboardList, Shield, Settings, LogOut, Menu, X, Bell, Palette, Hash, Search, MoreVertical, Plus, FileText } from 'lucide-react';
import AdminUserManagement from '../admin/component/AdminUserManagement';
import { AddUserModal } from "../admin/component/AdminModals";
import AdminAllDocumentsView from '../admin/component/AdminAllDocumentsView';
import DocumentViewerModal from '../user/components/modals/DocumentViewerModal';

export default function SystemAdminFrame({ 
  currentUser = { name: 'System Administrator', role: 'System Admin' }, 
  onLogout = () => {}, 
  dataStore 
}) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [customization, setCustomization] = useState({
    sidebarGradientStart: '#DC2626',
    sidebarGradientEnd: '#991B1B'
  });

  // User Management States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    jobTitle: '',
    department: '',
    organizationUnitId: '',
    organizationPosition: ''
  });
  const [userIdFormatValid, setUserIdFormatValid] = useState(null);
  const [errors, setErrors] = useState({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  
  // Activity Logs States
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('All');
  const [logFilterStatus, setLogFilterStatus] = useState('All');

  // Document Viewer States
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  useEffect(() => {
    if (dataStore) {
      const custom = dataStore.getCustomization();
      if (custom) {
        setCustomization({
          sidebarGradientStart: custom.sidebarGradientStart || '#DC2626',
          sidebarGradientEnd: custom.sidebarGradientEnd || '#991B1B'
        });
      }
      
      const unsubscribe = dataStore.subscribe(() => {
        const updated = dataStore.getCustomization();
        if (updated) {
          setCustomization({
            sidebarGradientStart: updated.sidebarGradientStart || '#DC2626',
            sidebarGradientEnd: updated.sidebarGradientEnd || '#991B1B'
          });
        }
      });
      
      return unsubscribe;
    }
  }, [dataStore]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'all-documents', label: 'All User Documents', icon: FileText },
    { id: 'activity-logs', label: 'Log Audits', icon: ClipboardList }
  ];

  const allUsers = dataStore ? dataStore.getAllUsers() : [];
  const auditLogs = dataStore ? dataStore.getAllAuditLogs() : [];
  const organizationTree = dataStore ? dataStore.getOrganizationTree() : [];
  const allDocuments = dataStore ? dataStore.getAllDocuments() : [];

  // User Management Functions
  const handleUserIdChange = (value) => {
    const upperValue = value.toUpperCase();
    setNewUser({ ...newUser, userId: upperValue });
    
    if (upperValue) {
      const isValid = dataStore.validateUserId(upperValue, 'user');
      setUserIdFormatValid(isValid);
    } else {
      setUserIdFormatValid(null);
    }
  };

  const handleAddUser = () => {
    const newErrors = {};
    
    if (!newUser.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }
    if (!newUser.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!newUser.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!newUser.organizationUnitId) {
      newErrors.organizationUnitId = 'Organization unit is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (userIdFormatValid !== true) {
      alert('Please enter a valid User ID format');
      return;
    }
    
    const defaultPassword = newUser.lastName.toUpperCase();
    
    const userToAdd = {
      id: newUser.userId,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email || '',
      role: newUser.role,
      jobTitle: newUser.jobTitle || '',
      department: newUser.department || '',
      organizationUnitId: newUser.organizationUnitId,
      organizationPosition: newUser.organizationPosition || '',
      password: defaultPassword,
      status: 'Active',
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleString()
    };
    
    dataStore.addUser(userToAdd);
    
    const auditLog = {
      time: new Date().toLocaleString(),
      user: `${currentUser.name} (System Admin)`,
      action: 'User Created',
      resource: `${newUser.userId} - ${newUser.firstName} ${newUser.lastName}`,
      status: 'Success'
    };
    dataStore.addAuditLog(auditLog);
    
    alert(`User created successfully!\nUser ID: ${newUser.userId}\nDefault Password: ${defaultPassword}\n\nPlease inform the user to change their password after first login.`);
    
    setNewUser({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      role: 'User',
      jobTitle: '',
      department: '',
      organizationUnitId: '',
      organizationPosition: ''
    });
    setUserIdFormatValid(null);
    setErrors({});
    setShowAddUserModal(false);
  };

  const getFilteredUsers = () => {
    return allUsers.filter(user => {
      const matchesSearch = userSearchQuery === '' || 
        user.id?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = userFilterRole === 'All' || user.role === userFilterRole;
      const matchesStatus = userFilterStatus === 'All' || user.status === userFilterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getFilteredLogs = () => {
    return auditLogs.filter(log => {
      const matchesSearch = logSearchQuery === '' ||
        log.user?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.resource?.toLowerCase().includes(logSearchQuery.toLowerCase());
      
      const matchesAction = logFilterAction === 'All' || log.action === logFilterAction;
      const matchesStatus = logFilterStatus === 'All' || log.status === logFilterStatus;
      
      return matchesSearch && matchesAction && matchesStatus;
    });
  };

  const getActions = () => {
    const actions = new Set();
    auditLogs.forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions).sort();
  };

  const handleMenuClick = (userId, event) => {
    event.stopPropagation();
    setOpenMenuUserId(openMenuUserId === userId ? null : userId);
  };

  const renderOrgUnitOptions = (units, level = 0) => {
    return units.flatMap(unit => [
      <option key={unit.id} value={unit.id}>
        {'  '.repeat(level) + unit.name} ({unit.type})
      </option>,
      ...(unit.children ? renderOrgUnitOptions(unit.children, level + 1) : [])
    ]);
  };

  // Document Handler Functions
  const handleViewDocument = (doc) => {
    setViewingDocument(doc);
    setShowDocumentViewer(true);
    
    addAuditLog(
      'Document Viewed',
      `System Admin viewed: ${doc.title} (ID: ${doc.id})`,
      'Success'
    );
  };

  const handleDownloadDocument = (doc) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = `${doc.title}.${doc.format || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    addAuditLog(
      'Document Downloaded',
      `System Admin downloaded: ${doc.title} (ID: ${doc.id})`,
      'Success'
    );
  };

  const handlePrintDocument = (doc) => {
    if (doc.fileData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Document</title></head>
            <body>
              <embed src="${doc.fileData}" type="application/pdf" width="100%" height="100%" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else if (doc.content || doc.ocrContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print: ${doc.title}</title>
              <style>
                body { font-family: serif; padding: 2in; }
                h1 { text-align: center; margin-bottom: 1em; }
                pre { white-space: pre-wrap; font-family: serif; }
              </style>
            </head>
            <body>
              <h1>${doc.title}</h1>
              <pre>${doc.content || doc.ocrContent}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    addAuditLog(
      'Document Printed',
      `System Admin printed: ${doc.title} (ID: ${doc.id})`,
      'Success'
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Document Viewer Modal */}
      <DocumentViewerModal
        show={showDocumentViewer}
        document={viewingDocument}
        onClose={() => {
          setShowDocumentViewer(false);
          setViewingDocument(null);
        }}
        onPrint={handlePrintDocument}
        onDownload={handleDownloadDocument}
      />

      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 flex flex-col`}
        style={{
          background: `linear-gradient(to bottom, ${customization.sidebarGradientStart}, ${customization.sidebarGradientEnd})`
        }}
      >
        <div className="p-4 flex items-center justify-between border-b border-white border-opacity-20">
          {sidebarOpen && <span className="font-bold text-lg">RKMS System</span>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                  activeSection === item.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : ''
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white border-opacity-20">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div 
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-red-600"
            >
              {currentUser.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-sm">{currentUser.name}</p>
                <p className="text-xs opacity-75">System Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              {showSettingsMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSettingsMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

              {/* Stats Cards - Matching Admin Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-4xl font-bold text-gray-800 mt-2">{allUsers.length}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Documents</p>
                      <p className="text-4xl font-bold text-gray-800 mt-2">{allDocuments.length}</p>
                    </div>
                    <ClipboardList className="w-12 h-12 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Sessions</p>
                      <p className="text-4xl font-bold text-gray-800 mt-2">{allUsers.filter(u => u.status === 'Active').length}</p>
                    </div>
                    <LayoutDashboard className="w-12 h-12 text-purple-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Audit Logs</p>
                      <p className="text-4xl font-bold text-gray-800 mt-2">{auditLogs.length}</p>
                    </div>
                    <Shield className="w-12 h-12 text-orange-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Recent Activity - Matching Admin Style */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activity recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.slice(0, 10).map((log, idx) => (
                      <div key={idx} className="flex items-start justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                          <p className="text-xs text-gray-600 mt-1">{log.user}</p>
                          {log.resource && (
                            <p className="text-xs text-gray-400 mt-1">{log.resource}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-400">{log.time}</p>
                          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                            log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'user-management' && (
            <AdminUserManagement
              userList={allUsers}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userFilterRole={userFilterRole}
              setUserFilterRole={setUserFilterRole}
              userFilterStatus={userFilterStatus}
              setUserFilterStatus={setUserFilterStatus}
              getFilteredUsers={getFilteredUsers}
              handleMenuClick={handleMenuClick}
              setShowAddUserModal={setShowAddUserModal}
              openMenuUserId={openMenuUserId}
            />
          )}

          {activeSection === 'all-documents' && (
            <AdminAllDocumentsView 
              dataStore={dataStore}
              userList={allUsers}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
            />
          )}

          {activeSection === 'activity-logs' && (
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
                  Showing <span className="font-semibold">{getFilteredLogs().length}</span> of <span className="font-semibold">{auditLogs.length}</span> logs
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
                      {getFilteredLogs().length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            {auditLogs.length === 0 
                              ? "No audit logs recorded yet. System activities will appear here."
                              : "No logs match your search criteria. Try adjusting your filters."}
                          </td>
                        </tr>
                      ) : (
                        getFilteredLogs().map((log, idx) => (
                          <tr key={`${log.time}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{log.time}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{log.user}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{log.resource || 'N/A'}</td>
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
          )}

        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          showAddUserModal={showAddUserModal}
          setShowAddUserModal={setShowAddUserModal}
          editingUserId={null}
          setEditingUserId={() => {}}
          newUser={newUser}
          setNewUser={setNewUser}
          handleUserIdChange={handleUserIdChange}
          userIdFormatValid={userIdFormatValid}
          errors={errors}
          setErrors={setErrors}
          setUserIdFormatValid={setUserIdFormatValid}
          handleAddUser={handleAddUser}
          userList={allUsers}
          organizationTree={organizationTree}
          renderOrgUnitOptions={renderOrgUnitOptions}
          dataStore={dataStore}
          isSystemAdmin={true}
        />
      )}
    </div>
  );
}