import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemAdminSidebar from './components/SystemAdminSidebar';
import SystemAdminHeader from './components/SystemAdminHeader';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import SystemAdminUserManagement from './components/SystemAdminUserManagement';
import SystemAdminAuditLogs from './components/SystemAdminAuditLogs';
import OrganizationalStructure from './components/OrganizationalStructure';
import OrgUnitUsersView from './components/OrgUnitUsersView';
import SystemAdminRequests from './components/SystemAdminRequests';
import ErrorBoundary from '../admin/component/ErrorBoundary';
import SystemAdminAddUserModal from './components/SystemAdminAddUserModal';
import AdminCustomizationModal from '../admin/component/AdminCustomizationModal';
import SystemAdminIDFormatter from './components/SystemAdminIDFormatter';
import DocumentViewerModal from '../components/modals/DocumentViewerModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import RequestApprovalModal from './components/RequestApprovalModal';
import { UserActionMenu, EditPasswordModal } from '../admin/component/AdminModals';
import SystemAdminVerificationModal from './components/SystemAdminVerificationModal';
import { userAPI, auditLogAPI, organizationAPI, sessionAPI, authAPI, idFormatAPI } from '../services/api';

export default function SystemAdminMainFrame({ 
  currentUser = { name: 'System Administrator', role: 'System Admin' }, 
  onLogout = () => {}, 
  dataStore  
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

  // Compute the correct user_id from whatever source is available
  const currentUserId = loggedInUser?.user_id || loggedInUser?.id || currentUser?.user_id || currentUser?.id || loggedInUser?.full_data?.user_id;

  // Mapping between section IDs and URL paths
  const sectionToPath = {
    'dashboard': '/system-admin/dashboard',
    'user-management': '/system-admin/user-management',
    'org-users': '/system-admin/users-by-organization',
    'audit-logs': '/system-admin/audit-logs',
    'organization': '/system-admin/organization',
    'requests': '/system-admin/requests'
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

  // Role-based access control - System Admin only
  useEffect(() => {
    const validateAccess = async () => {
      const userRole = currentUser?.role_type || currentUser?.role;
      
      if (userRole !== 'system_admin') {
        // Log unauthorized access attempt
        try {
          await auditLogAPI.create({
            audit_action: 'Unauthorized Access Attempt',
            audit_desc: `User ${currentUser?.user_id || 'Unknown'} (Role: ${userRole}) attempted to access System Admin panel`,
            audit_status: 'Failed'
          });
        } catch (error) {
          console.error('Failed to log unauthorized access:', error);
        }
        
        // Redirect to Unauthorized page
        navigate('/unauthorized', { replace: true });
      }
    };

    if (currentUser) {
      validateAccess();
    }
  }, [currentUser?.role_type]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [targetRequestId, setTargetRequestId] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [showUserIdFormatModal, setShowUserIdFormatModal] = useState(false);
  const [showRequestApprovalModal, setShowRequestApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestAction, setRequestAction] = useState(null); // 'claim', 'approve', 'reject'
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);
  const [, forceUpdate] = useState(0);
  
  // User management states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  const [userFilterOrganization, setUserFilterOrganization] = useState('All');
  
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
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requestStatusBreakdown, setRequestStatusBreakdown] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
  });
  const [hasActiveUserIdFormat, setHasActiveUserIdFormat] = useState(null);
  const [showIdFormatRequiredNotice, setShowIdFormatRequiredNotice] = useState(false);

  // Data states
  const [userList, setUserList] = useState([]);
  const [documentList, setDocumentList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [organizationTree, setOrganizationTree] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const refreshPendingRequestsCount = async () => {
    try {
      const { userCreationRequestAPI } = await import('../services/api');
      const requests = await userCreationRequestAPI.getAll();
      const pendingCount = requests.filter(req => req.status === 'pending').length;
      const approvedCount = requests.filter(req => req.status === 'approved').length;
      const deniedCount = requests.filter(req => req.status === 'denied' || req.status === 'rejected').length;
      setPendingRequestsCount(pendingCount);
      setRequestStatusBreakdown({
        pending: pendingCount,
        approved: approvedCount,
        denied: deniedCount,
      });
    } catch (error) {
      console.error('Failed to fetch requests count:', error);
    }
  };

  const refreshAuditLogList = async () => {
    try {
      setIsLoadingLogs(true);
      const data = await auditLogAPI.getAll();
      const transformedLogs = transformAuditLogs(data);
      setAuditLogs(transformedLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      if (dataStore) {
        const fallbackData = dataStore.getAllAuditLogs();
        setAuditLogs(fallbackData);
      } else {
        setAuditLogs([]);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const refreshOrganizationTree = async () => {
    try {
      const data = await organizationAPI.getAll();
      setOrganizationTree(data);
    } catch (error) {
      console.error('Failed to load organization structure:', error);
      if (dataStore) {
        const fallbackData = dataStore.getOrganizationTree();
        setOrganizationTree(fallbackData);
      }
    }
  };

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
          first_name: userData.first_name || '',
          middle_name: userData.middle_name || '',
          last_name: userData.last_name || '',
          suffix: userData.suffix || '',
          email_add: userData.email_add || '',
          full_data: userData
        });
      } catch (error) {
        console.error('Failed to fetch current user profile:', error);
        // Keep the default user if fetch fails
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch pending requests count
  useEffect(() => {
    // Fetch immediately
    refreshPendingRequestsCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshPendingRequestsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const data = await userAPI.getAll();
        const transformedUsers = transformUsers(data);
        setUserList(transformedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllUsers();
          setUserList(fallbackData);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [dataStore]);

  const checkActiveUserIdFormat = async () => {
    try {
      const formats = await idFormatAPI.getAll();
      const list = Array.isArray(formats) ? formats : (formats.results || []);
      const hasActive = list.some((fmt) => fmt?.is_active);
      setHasActiveUserIdFormat(hasActive);
      return hasActive;
    } catch (error) {
      console.error('Failed to check User ID format configuration:', error);
      setHasActiveUserIdFormat(false);
      return false;
    }
  };

  const handleUserIdFormatSaved = async () => {
    await checkActiveUserIdFormat();
  };

  useEffect(() => {
    checkActiveUserIdFormat();
  }, []);

  useEffect(() => {
    if (!showUserIdFormatModal) {
      checkActiveUserIdFormat();
    }
  }, [showUserIdFormatModal]);

  // Helper function to transform API user data from snake_case to camelCase
  const transformUsers = (apiData) => {
    const userArray = Array.isArray(apiData) ? apiData : (apiData.results || apiData.data || []);
    return userArray
      .filter(user => user && user.user_id) // Filter out users without user_id
      .map(user => ({
        id: user.user_id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        middleName: user.middle_name || '',
        userPos: user.user_pos || '',
        userContact: user.user_contact || '',
        userBirthdate: user.user_birthdate || '',
        email: user.email_add || '',
        role: user.role_type || 'User',
        isActive: user.is_active !== false,
        joinedAt: user.joined_at,
        organizationUnitId: user.org || '',
        user_id: user.user_id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        middle_name: user.middle_name || '',
        suffix: user.suffix || '',
        user_pos: user.user_pos || '',
        user_contact: user.user_contact || '',
        user_birthdate: user.user_birthdate || '',
        email_add: user.email_add || '',
        role_type: user.role_type || 'User',
        is_active: user.is_active !== false,
        joined_at: user.joined_at,
        org: user.org
      }));
  };

  // Helper function to transform API audit log data
  const transformAuditLogs = (apiData) => {
    try {
      if (!apiData) {
        return [];
      }
      
      const logsArray = Array.isArray(apiData) ? apiData : (apiData.results || apiData.data || []);
      
      if (!Array.isArray(logsArray)) {
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

  // Function to refresh user list
  const refreshUserList = async () => {
    try {
      const data = await userAPI.getAll();
      const transformedUsers = transformUsers(data);
      setUserList(transformedUsers);
    } catch (error) {
      console.error('Failed to refresh users:', error);
    }
  };

  // Fetch audit logs from backend
  useEffect(() => {
    refreshAuditLogList();
  }, [dataStore]);

  // Fetch organization tree from backend
  useEffect(() => {
    refreshOrganizationTree();
  }, [dataStore]);

  // Refresh the active tab data when switching sections, so no page reload is needed.
  useEffect(() => {
    if (activeSection === 'dashboard') {
      refreshUserList();
      refreshAuditLogList();
      refreshOrganizationTree();
      refreshPendingRequestsCount();
      return;
    }

    if (activeSection === 'user-management' || activeSection === 'org-users') {
      refreshUserList();
      refreshOrganizationTree();
      return;
    }

    if (activeSection === 'audit-logs') {
      refreshAuditLogList();
      return;
    }

    if (activeSection === 'requests') {
      setRequestsRefreshKey(prev => prev + 1);
      refreshPendingRequestsCount();
    }
  }, [activeSection]);

  const handleToggleUserStatus = async (userId) => {
    const user = userList.find(u => u.id === userId);
    const isCurrentlyActive = user?.isActive;
    const confirmMsg = isCurrentlyActive 
      ? 'Are you sure you want to deactivate this user? They will not be able to access the system.'
      : 'Are you sure you want to activate this user?';
    
    if (window.confirm(confirmMsg)) {
      try {
        await userAPI.update(userId, { is_active: !isCurrentlyActive });
        // Update the user in the list
        setUserList(userList.map(u => u.id === userId ? { ...u, isActive: !isCurrentlyActive } : u));
        setOpenMenuUserId(null);
        const statusMsg = isCurrentlyActive ? 'deactivated' : 'activated';
        alert(`User ${statusMsg} successfully!`);
      } catch (error) {
        console.error('Failed to toggle user status:', error);
        alert('Failed to toggle user status');
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
    setShowEditPasswordModal(true); // Mark this as a password reset action
    setShowAdminVerificationModal(true);
    setAdminVerificationPassword('');
    setErrors({});
    setOpenMenuUserId(null);
  };

  const handleVerifyAdmin = async () => {
    try {
      // Verify password with backend
      const result = await sessionAPI.verifyPassword(adminVerificationPassword);
      
      if (result.valid) {
        setShowAdminVerificationModal(false);
        
        // If this is for password reset, generate and set new password
        if (showEditPasswordModal === true) {
          const user = userList.find(u => u.id === editingUserId || u.user_index === editingUserId);
          if (user) {
            // Generate new password from uppercase last name without spaces (e.g., Dela Cruz -> DELACRUZ123!)
            const baseLastName = (user.last_name || user.lastName || '').replace(/\s+/g, '').toUpperCase();
            const newPassword = `${baseLastName || 'USER'}123!`;
            
            try {
              // Update user password
              await userAPI.update(user.user_id || user.id, {
                password: newPassword
              });
              
              // Refresh user list
              const users = await userAPI.getAll();
              setUserList(users);
              
              // Show success message in modal instead of alert
              setResetPasswordMessage(`Reset password success!\nPassword format is SURNAME123! (uppercase, spaces removed)\n\nRemind them to change password ASAP!`);
              setResetPasswordSuccess(true);
              setAdminVerificationPassword('');
              setPasswordData({ password: '', confirmPassword: '' });
              setErrors({});
            } catch (error) {
              console.error('Failed to reset password:', error);
              setErrors({ submit: 'Failed to reset password: ' + (error.message || 'Unknown error') });
            }
          }
        } else if (editingUserId) {
          // This is for editing user info - open the Add User modal in edit mode
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
      // Defensive checks for required fields
      if (!user || !user.id) return false;

      const normalizedRole = (user.role || '').toString().toLowerCase();
      const normalizedFilterRole = (userFilterRole || '').toString().toLowerCase();
      const userOrgId = typeof user.organizationUnitId === 'object'
        ? (user.organizationUnitId?.org_id || user.organizationUnitId?.id || '')
        : (user.organizationUnitId || '');
      const normalizedUserOrgId = userOrgId.toString();
      const normalizedFilterOrgId = (userFilterOrganization || '').toString();
      
      const matchesSearch = 
        (user.id || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.firstName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
        (user.lastName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
        (user.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = userFilterRole === 'All' || normalizedRole === normalizedFilterRole;
      const matchesStatus = userFilterStatus === 'All' || (user.isActive ? 'Active' : 'Inactive') === userFilterStatus;
      const matchesOrganization = userFilterOrganization === 'All' || normalizedUserOrgId === normalizedFilterOrgId;
      
      return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
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
    try {
      await refreshUserList();
    } catch (error) {
      console.error('Failed to refresh user list:', error);
    }
  };

  const handleAddNewUser = async () => {
    const hasFormat = await checkActiveUserIdFormat();
    if (!hasFormat) {
      setShowIdFormatRequiredNotice(true);
      return;
    }
    setIsEditMode(false);
    setEditingUser(null);
    setEditingUserId(null);
    setShowAddUserModal(true);
  };

  const handleOpenRequestModal = (request, action) => {
    // request is now the full request object from SystemAdminRequests
    setSelectedRequest(request);
    setRequestAction(action);
    setShowRequestApprovalModal(true);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      // Success - the API call is handled in RequestApprovalModal
      console.log('Request approved successfully:', requestId);
      setShowRequestApprovalModal(false);
      setRequestsRefreshKey(prev => prev + 1);
      await Promise.all([
        refreshPendingRequestsCount(),
        refreshUserList(),
        refreshAuditLogList(),
      ]);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      // Success - the API call is handled in RequestApprovalModal
      console.log('Request rejected successfully:', requestId, 'Reason:', reason);
      setShowRequestApprovalModal(false);
      setRequestsRefreshKey(prev => prev + 1);
      await Promise.all([
        refreshPendingRequestsCount(),
        refreshAuditLogList(),
      ]);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRequestClaimed = async () => {
    setRequestsRefreshKey(prev => prev + 1);
    await Promise.all([
      refreshPendingRequestsCount(),
      refreshAuditLogList(),
    ]);
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
        pendingRequestsCount={pendingRequestsCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SystemAdminHeader
          currentUser={loggedInUser}
          onLogout={onLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
          onEditProfile={() => setShowEditProfileModal(true)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onRequestsUpdate={(requestId = null) => {
            setActiveSection('requests');
            setTargetRequestId(requestId);
          }}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <SystemAdminDashboard
              userList={userList}
              documentList={documentList}
              auditLogs={auditLogs}
              dataStore={dataStore}
              pendingRequestsCount={pendingRequestsCount}
              requestStatusBreakdown={requestStatusBreakdown}
              setActiveSection={setActiveSection}
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
              userFilterOrganization={userFilterOrganization}
              setUserFilterOrganization={setUserFilterOrganization}
              organizationTree={organizationTree}
              getFilteredUsers={getFilteredUsers}
              handleMenuClick={handleMenuClick}
              setShowAddUserModal={handleAddNewUser}
              canAddUser={hasActiveUserIdFormat !== false}
              openMenuUserId={openMenuUserId}
            />
          )}

          {activeSection === 'org-users' && (
            <OrgUnitUsersView
              organizationTree={organizationTree}
              userList={userList}
              organizations={organizationTree}
              onRefreshUsers={refreshUserList}
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

          {activeSection === 'requests' && (
            <SystemAdminRequests
              onOpenRequestModal={handleOpenRequestModal}
              targetRequestId={targetRequestId}
              refreshKey={requestsRefreshKey}
              currentUser={loggedInUser}
            />
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
        currentUsername={currentUserId}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        currentUser={loggedInUser}
        onProfileUpdated={() => {
          // Refresh current user profile
          const fetchCurrentUser = async () => {
            try {
              const userData = await authAPI.getCurrentProfile();
              setLoggedInUser({
                name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
                role: userData.role_type || 'System Admin',
                user_id: userData.user_id,
                first_name: userData.first_name || '',
                middle_name: userData.middle_name || '',
                last_name: userData.last_name || '',
                suffix: userData.suffix || '',
                email_add: userData.email_add || '',
                full_data: userData
              });
            } catch (error) {
              console.error('Failed to refresh current user profile:', error);
            }
          };
          fetchCurrentUser();
        }}
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
        handleToggleUserStatus={handleToggleUserStatus}
        userList={userList}
      />

      <SystemAdminVerificationModal
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
        resetPasswordSuccess={resetPasswordSuccess}
        setResetPasswordSuccess={setResetPasswordSuccess}
        resetPasswordMessage={resetPasswordMessage}
      />

      <AdminCustomizationModal
        show={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        dataStore={dataStore}
        onSave={() => setShowCustomizationModal(false)}
      />

      <SystemAdminIDFormatter
        show={showUserIdFormatModal}
        onClose={() => setShowUserIdFormatModal(false)}
        dataStore={dataStore}
        onSave={handleUserIdFormatSaved}
        lockUntilConfigured={hasActiveUserIdFormat === false}
      />

      <RequestApprovalModal
        isOpen={showRequestApprovalModal}
        onClose={() => {
          setShowRequestApprovalModal(false);
          setSelectedRequest(null);
          setRequestAction(null);
        }}
        request={selectedRequest}
        action={requestAction}
        currentUser={loggedInUser}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onClaim={handleRequestClaimed}
      />

      {showIdFormatRequiredNotice && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">User ID Format Required</h3>
            <p className="mt-3 text-gray-700">
              Configure an active User ID format first before creating users.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowIdFormatRequiredNotice(false);
                  setShowUserIdFormatModal(true);
                }}
                className="w-full rounded-lg bg-slate-800 text-white py-2.5 font-medium hover:bg-slate-900"
              >
                Configure Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
