import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemAdminSidebar from './components/SystemAdminSidebar';
import SystemAdminHeader from './components/SystemAdminHeader';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import SystemAdminUserManagement from './components/SystemAdminUserManagement';
import SystemAdminDocuments from './components/SystemAdminDocuments';
import SystemAdminAuditLogs from './components/SystemAdminAuditLogs';
import OrganizationalStructure from './components/OrganizationalStructure';
import ErrorBoundary from '../admin/component/ErrorBoundary';
import SystemAdminAddUserModal from './components/SystemAdminAddUserModal';
import AdminCustomizationModal from '../admin/component/AdminCustomizationModal';
import UserIdFormatModal from '../admin/component/UserIdFormatModal';
import DocumentViewerModal from '../user/Components/modals/DocumentViewerModal';
import ChangePasswordModal from '../user/Components/modals/ChangePasswordModal';
import { UserActionMenu, AdminVerificationModal, EditPasswordModal } from '../admin/component/AdminModals';
import { userAPI, documentAPI, auditLogAPI, organizationAPI, sessionAPI, authAPI } from '../services/api';

export default function SystemAdminMainFrame({ 
  currentUser = { name: 'System Administrator', role: 'System Admin' }, 
  onLogout = () => {}, 
  dataStore  
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

  // Mapping between section IDs and URL paths
  const sectionToPath = {
    'dashboard': '/system-admin/dashboard',
    'user-management': '/system-admin/user-management',
    'all-documents': '/system-admin/all-documents',
    'audit-logs': '/system-admin/audit-logs',
    'organization': '/system-admin/organization'
  };

  const pathToSection = Object.fromEntries(
    Object.entries(sectionToPath).map(([section, path]) => [path, section])
  );

  const [activeSection, setActiveSectionState] = useState(() => {
    // Initialize based on current URL
    const path = location.pathname;
    return pathToSection[path] || 'dashboard';
  });

  // Wrapper function that updates state AND navigates to the URL
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    const path = sectionToPath[section] || '/system-admin/dashboard';
    navigate(path, { replace: false });
  };

  // Sync URL changes with activeSection
  useEffect(() => {
    const path = location.pathname;
    const newSection = pathToSection[path] || 'dashboard';
    if (newSection !== activeSection) {
      setActiveSectionState(newSection);
    }
  }, [location.pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [showUserIdFormatModal, setShowUserIdFormatModal] = useState(false);
  const [, forceUpdate] = useState(0);
  
  // User management states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  
  // Audit log filter states (system admin specific)
  const [sysAdminLogSearchQuery, setSysAdminLogSearchQuery] = useState('');
  const [sysAdminLogFilterAction, setSysAdminLogFilterAction] = useState('All');
  const [sysAdminLogFilterStatus, setSysAdminLogFilterStatus] = useState('All');
  
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false);
  const [adminVerificationPassword, setAdminVerificationPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Data states
  const [userList, setUserList] = useState([]);
  const [documentList, setDocumentList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [organizationTree, setOrganizationTree] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Subscribe to dataStore changes
  useEffect(() => {
    if (dataStore) {
      const unsubscribe = dataStore.subscribe(() => {
        forceUpdate(prev => prev + 1);
      });
      return unsubscribe;
    }
  }, [dataStore]);

  // Fetch current logged-in user's profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await authAPI.getCurrentProfile();
        setLoggedInUser({
          name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
          role: userData.role_type || 'System Admin',
          user_id: userData.user_id,
          full_data: userData
        });
      } catch (error) {
        console.error('Failed to fetch current user profile:', error);
        // Keep the default user if fetch fails
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const data = await userAPI.getAll();
        console.log('Users fetched from API:', data);
        const transformedUsers = transformUsers(data);
        setUserList(transformedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllUsers();
          console.log('Using fallback users from dataStore:', fallbackData);
          setUserList(fallbackData);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [dataStore]);

  // Fetch documents from backend
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        const data = await documentAPI.getAll();
        console.log('All documents fetched from API:', data);
        setDocumentList(data);
      } catch (error) {
        console.error('Failed to load documents:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllDocuments();
          console.log('Using fallback documents from dataStore:', fallbackData);
          setDocumentList(fallbackData);
        }
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [dataStore]);

  // Helper function to transform API user data from snake_case to camelCase
  const transformUsers = (apiData) => {
    const userArray = Array.isArray(apiData) ? apiData : (apiData.results || apiData.data || []);
    return userArray.map(user => ({
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email_add,
      role: user.role_type,
      isActive: user.is_active,
      joinedAt: user.joined_at,
      organizationUnitId: user.org || '',
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email_add: user.email_add,
      role_type: user.role_type,
      is_active: user.is_active,
      joined_at: user.joined_at,
      org: user.org
    }));
  };

  // Helper function to transform API audit log data
  const transformAuditLogs = (apiData) => {
    try {
      if (!apiData) {
        console.warn('No audit log data provided');
        return [];
      }
      
      const logsArray = Array.isArray(apiData) ? apiData : (apiData.results || apiData.data || []);
      
      if (!Array.isArray(logsArray)) {
        console.warn('Audit logs data is not an array:', logsArray);
        return [];
      }
      
      return logsArray.map((log, idx) => {
        try {
          const firstName = log?.first_name || '';
          const lastName = log?.last_name || '';
          const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : log?.user_name || 'Unknown';
          
          return {
            logId: log?.log_id || idx,
            timestamp: log?.audit_timestamp || null,
            userId: log?.user_id && log.user_id.trim() ? log.user_id : 'N/A',
            userName: displayName,
            action: log?.audit_action || 'N/A',
            resource: log?.audit_desc || 'N/A',
            status: log?.audit_status || 'Unknown'
          };
        } catch (e) {
          console.error('Error transforming audit log entry:', e, log);
          return {
            logId: idx,
            timestamp: null,
            userId: 'Error',
            userName: 'Error',
            action: 'Error',
            resource: 'Error processing log',
            status: 'Error'
          };
        }
      }).sort((a, b) => {
        // Sort by timestamp descending (most recent first)
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    } catch (error) {
      console.error('Error transforming audit logs:', error, apiData);
      return [];
    }
  };

  // Fetch audit logs from backend
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const data = await auditLogAPI.getAll();
        console.log('Raw audit logs from API:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('First log sample:', data[0] || 'No logs');
        
        const transformedLogs = transformAuditLogs(data);
        console.log('Transformed audit logs:', transformedLogs);
        setAuditLogs(transformedLogs);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllAuditLogs();
          console.log('Using fallback audit logs from dataStore:', fallbackData);
          setAuditLogs(fallbackData);
        } else {
          setAuditLogs([]);
        }
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAuditLogs();
  }, [dataStore]);

  // Fetch organization tree from backend
  useEffect(() => {
    const fetchOrganizationTree = async () => {
      try {
        const data = await organizationAPI.getAll();
        console.log('Organization structure fetched:', data);
        setOrganizationTree(data);
      } catch (error) {
        console.error('Failed to load organization structure:', error);
        if (dataStore) {
          const fallbackData = dataStore.getOrganizationTree();
          console.log('Using fallback organization structure from dataStore:', fallbackData);
          setOrganizationTree(fallbackData);
        }
      }
    };

    fetchOrganizationTree();
  }, [dataStore]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        setUserList(userList.filter(u => u.id !== userId));
        setOpenMenuUserId(null);
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleEditUser = (userId) => {
    setEditingUserId(userId);
    setShowAdminVerificationModal(true);
    setAdminVerificationPassword('');
    setOpenMenuUserId(null);
  };

  const handleEditPassword = (userId) => {
    setEditingUserId(userId);
    setShowEditPasswordModal(true);
    setShowAdminVerificationModal(true);
    setAdminVerificationPassword('');
    setOpenMenuUserId(null);
  };

  const handleVerifyAdmin = async () => {
    try {
      // Verify password with backend
      const result = await sessionAPI.verifyPassword(adminVerificationPassword);
      
      if (result.valid) {
        setShowAdminVerificationModal(false);
        if (showEditPasswordModal) {
          setPasswordData({ password: '', confirmPassword: '' });
        } else {
          // Open the Add User modal in edit mode
          const user = userList.find(u => u.id === editingUserId);
          if (user) {
            setEditingUser(user);
            setIsEditMode(true);
            setShowAddUserModal(true);
          }
        }
        setAdminVerificationPassword('');
        setErrors({});
      } else {
        setErrors({ adminPassword: 'Incorrect password' });
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      setErrors({ adminPassword: 'Failed to verify password. Please try again.' });
    }
  };

  const handleSavePassword = async () => {
    // Validate password
    const newErrors = {};

    if (!passwordData.password) {
      newErrors.password = 'Password is required';
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Update user password via update endpoint
      await userAPI.update(editingUserId, {
        password: passwordData.password
      });

      // Refresh user list
      const users = await userAPI.getAll();
      setUserList(users);

      setShowEditPasswordModal(false);
      setEditingUserId(null);
      setPasswordData({ password: '', confirmPassword: '' });
      setErrors({});
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Failed to update password:', error);
      setErrors({ submit: 'Failed to update password: ' + (error.message || 'Unknown error') });
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentAPI.delete(docId);
        setDocumentList(documentList.filter(d => d.id !== docId));
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document');
      }
    }
  };

  const handleMenuClick = (userId, event) => {
    event.stopPropagation();
    if (openMenuUserId === userId) {
      setOpenMenuUserId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 224;
      const menuHeight = 180;
      
      let top = Math.min(rect.bottom + 5, window.innerHeight - menuHeight - 10);
      let left = Math.max(10, Math.min(rect.left - menuWidth + 40, window.innerWidth - menuWidth - 10));
      
      if (rect.bottom + menuHeight > window.innerHeight - 50) {
        top = Math.max(10, rect.top - menuHeight - 5);
      }
      
      setMenuPosition({ top, left });
      setOpenMenuUserId(userId);
    }
  };

  const getFilteredUsers = () => {
    return userList.filter(user => {
      const matchesSearch = 
        user.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
        user.lastName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = userFilterRole === 'All' || user.role === userFilterRole;
      const matchesStatus = userFilterStatus === 'All' || (user.isActive ? 'Active' : 'Inactive') === userFilterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getSysAdminActions = () => {
    try {
      if (!Array.isArray(auditLogs)) {
        return [];
      }
      const actions = [...new Set(auditLogs.map(log => log?.action || ''))];
      return actions.filter(action => action && action.trim());
    } catch (error) {
      console.error('Error getting actions:', error);
      return [];
    }
  };

  const getSysAdminFilteredLogs = () => {
    try {
      if (!Array.isArray(auditLogs)) {
        return [];
      }
      
      return auditLogs.filter(log => {
        if (!log) return false;
        
        const matchesSearch = 
          (log?.userId || log?.userName || '').toString().toLowerCase().includes(sysAdminLogSearchQuery.toLowerCase()) ||
          (log?.action || '').toString().toLowerCase().includes(sysAdminLogSearchQuery.toLowerCase()) ||
          (log?.resource || '').toString().toLowerCase().includes(sysAdminLogSearchQuery.toLowerCase());
        
        const matchesAction = sysAdminLogFilterAction === 'All' || (log?.action || '') === sysAdminLogFilterAction;
        const matchesStatus = sysAdminLogFilterStatus === 'All' || (log?.status || '') === sysAdminLogFilterStatus;
        
        return matchesSearch && matchesAction && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering logs:', error);
      return [];
    }
  };

  const handleUserAdded = async () => {
    // Refresh user list
    try {
      const data = await userAPI.getAll();
      console.log('User list refreshed:', data);
      setUserList(data);
    } catch (error) {
      console.error('Failed to refresh user list:', error);
    }
  };

  const handleAddNewUser = () => {
    setIsEditMode(false);
    setEditingUser(null);
    setEditingUserId(null);
    setShowAddUserModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SystemAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={loggedInUser}
        onCustomize={() => setShowCustomizationModal(true)}
        onConfigureUserId={() => setShowUserIdFormatModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SystemAdminHeader
          currentUser={loggedInUser}
          onLogout={onLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <SystemAdminDashboard
              userList={userList}
              documentList={documentList}
              auditLogs={auditLogs}
              dataStore={dataStore}
            />
          )}

          {activeSection === 'user-management' && (
            <SystemAdminUserManagement
              userList={userList}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userFilterRole={userFilterRole}
              setUserFilterRole={setUserFilterRole}
              userFilterStatus={userFilterStatus}
              setUserFilterStatus={setUserFilterStatus}
              getFilteredUsers={getFilteredUsers}
              handleMenuClick={handleMenuClick}
              setShowAddUserModal={handleAddNewUser}
              openMenuUserId={openMenuUserId}
            />
          )}

          {activeSection === 'all-documents' && (
            <SystemAdminDocuments
              documentList={documentList}
              userList={userList}
              onViewDocument={console.log}
              onDeleteDocument={handleDeleteDocument}
              setShowDocumentViewer={setShowDocumentViewer}
              setViewingDocument={setViewingDocument}
            />
          )}

          {activeSection === 'audit-logs' && (
            <ErrorBoundary>
              <SystemAdminAuditLogs
                auditLogs={auditLogs}
                logSearchQuery={sysAdminLogSearchQuery}
                setLogSearchQuery={setSysAdminLogSearchQuery}
                logFilterAction={sysAdminLogFilterAction}
                setLogFilterAction={setSysAdminLogFilterAction}
                logFilterStatus={sysAdminLogFilterStatus}
                setLogFilterStatus={setSysAdminLogFilterStatus}
                getActions={getSysAdminActions}
                getFilteredLogs={getSysAdminFilteredLogs}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'organization' && (
            <OrganizationalStructure />
          )}
        </div>
      </div>

      {/* Modals */}
      <DocumentViewerModal
        show={showDocumentViewer}
        document={viewingDocument}
        onClose={() => {
          setShowDocumentViewer(false);
          setViewingDocument(null);
        }}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUsername={currentUser.username}
      />

      <SystemAdminAddUserModal
        isOpen={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setIsEditMode(false);
          setEditingUser(null);
          setEditingUserId(null);
        }}
        onUserAdded={handleUserAdded}
        userList={userList}
        organizationTree={organizationTree}
        dataStore={dataStore}
        editingUser={editingUser}
        isEditMode={isEditMode}
      />

      <UserActionMenu
        openMenuUserId={openMenuUserId}
        menuPosition={menuPosition}
        setOpenMenuUserId={setOpenMenuUserId}
        handleEditUser={handleEditUser}
        handleEditPassword={handleEditPassword}
        handleDeleteUser={handleDeleteUser}
      />

      <AdminVerificationModal
        showAdminVerificationModal={showAdminVerificationModal}
        setShowAdminVerificationModal={setShowAdminVerificationModal}
        setShowEditPasswordModal={setShowEditPasswordModal}
        adminVerificationPassword={adminVerificationPassword}
        setAdminVerificationPassword={setAdminVerificationPassword}
        setEditingUserId={setEditingUserId}
        errors={errors}
        setErrors={setErrors}
        handleVerifyAdmin={handleVerifyAdmin}
      />

      <EditPasswordModal
        showEditPasswordModal={showEditPasswordModal}
        showAdminVerificationModal={showAdminVerificationModal}
        setShowEditPasswordModal={setShowEditPasswordModal}
        setEditingUserId={setEditingUserId}
        editingUserId={editingUserId}
        userList={userList}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        errors={errors}
        setErrors={setErrors}
        handleSaveUser={handleSavePassword}
      />

      <AdminCustomizationModal
        show={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        dataStore={dataStore}
        onSave={() => setShowCustomizationModal(false)}
      />

      <UserIdFormatModal
        show={showUserIdFormatModal}
        onClose={() => setShowUserIdFormatModal(false)}
        dataStore={dataStore}
        onSave={() => setShowUserIdFormatModal(false)}
      />
    </div>
  );
}
