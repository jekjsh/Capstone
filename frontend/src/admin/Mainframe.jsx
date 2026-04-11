import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList } from 'lucide-react';

import AdminSidebar from './component/AdminSidebar';
import AdminHeader from './component/AdminHeader';
import AdminDashboard from './component/AdminDashboard';
import AdminUserManagement from './component/AdminUserManagement';
import AdminDocuments from './component/AdminDocuments';
import AdminLogAudits from './component/AdminLogAudits';
import ErrorBoundary from './component/ErrorBoundary';
import OrgUnitModal from './component/OrgUnitModal';
import OrgUnitUsersView from './component/OrgUnitUsersView';
import AdminCustomizationModal from './component/AdminCustomizationModal';
import  UserIdFormatModal from './component/UserIdFormatModal';
import DocumentViewerModal from '../user/Components/modals/DocumentViewerModal';
import { 
  UserActionMenu, 
  AdminVerificationModal, 
  AddUserModal, 
  PasswordModal, 
  EditPasswordModal 
} from './component/AdminModals';
import AdminAllDocumentsView from './component/AdminAllDocumentsView';
import AdminOrgSharesView from './component/AdminOrgSharesView';
import Category from './component/Category';
import { organizationAPI, userAPI, auditLogAPI, documentAPI, systemSettingsAPI, organizationShareAPI, sessionAPI, authAPI } from '../services/api';

export default function Mainframe({ 
  currentUser = { name: 'Administrator', role: 'Admin' }, 
  onLogout = () => {}, 
  dataStore  
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

  // Mapping between section IDs and URL paths
  const sectionToPath = {
    'dashboard': '/admin/dashboard',
    'org-users': '/admin/users-by-organization',
    'users': '/admin/user-management',
    'all-documents': '/admin/all-user-documents',
    'org-shares': '/admin/organization-shares',
    'categories': '/admin/categories',
    'logs': '/admin/audit-logs'
  };

  const pathToSection = Object.fromEntries(
    Object.entries(sectionToPath).map(([section, path]) => [path, section])
  );

  const [activeSection, setActiveSectionState] = useState(() => {
    // Initialize based on current URL
    const path = location.pathname;
    return pathToSection[path] || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
   const [showUserIdFormatModal, setShowUserIdFormatModal] = useState(false);  // ✅ ADD THIS
  const [userIdFormat, setUserIdFormat] = useState(null);  // ✅ ADD THIS
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
const [viewingDocument, setViewingDocument] = useState(null);
  const [customization, setCustomization] = useState({
    systemName: 'Record Keeping Management System',
    primaryColor: '#4F46E5',
    sidebarGradientStart: '#4F46E5',
    sidebarGradientEnd: '#7C3AED'
  });
   const [, forceUpdate] = useState(0);
  const [documentList, setDocumentList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [organizationTree, setOrganizationTree] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [orgShares, setOrgShares] = useState([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false);
  const [adminVerificationPassword, setAdminVerificationPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [tempUserData, setTempUserData] = useState(null);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [newUser, setNewUser] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    jobTitle: '',
    organizationUnitId: '',
    organizationPosition: ''
  });
  const [userIdFormatValid, setUserIdFormatValid] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('All');
  const [logFilterStatus, setLogFilterStatus] = useState('All');
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [documentFilterType, setDocumentFilterType] = useState('All');
  const [showOrgUnitModal, setShowOrgUnitModal] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
  const [parentOrgUnit, setParentOrgUnit] = useState(null);
  const [orgUnitData, setOrgUnitData] = useState({
    name: '',
    type: '',
    headPosition: '',
    code: '',
    description: ''
  });
  
  // OLD: Customization is now handled by SystemThemeContext
  // const applyCustomization = (custom) => {
  //   document.documentElement.style.setProperty('--primary-color', custom.primaryColor);
  //   document.documentElement.style.setProperty('--sidebar-gradient-start', custom.sidebarGradientStart);
  //   document.documentElement.style.setProperty('--sidebar-gradient-end', custom.sidebarGradientEnd);
  // };

  // Helper function to transform API user data from snake_case to camelCase
  const transformUsers = (apiData) => {
    const userArray = Array.isArray(apiData) ? apiData : (apiData.results || apiData.data || []);
    return userArray.map(user => ({
      id: user.user_id,
      firstName: user.first_name,
      middleName: user.middle_name || '',
      lastName: user.last_name,
      suffix: user.suffix || '',
      userPos: user.user_pos || '',
      email: user.email_add,
      role: user.role_type,
      isActive: user.is_active,
      joinedAt: user.joined_at,
      organizationUnitId: user.org || '',
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name || '',
      last_name: user.last_name,
      suffix: user.suffix || '',
      user_pos: user.user_pos || '',
      email_add: user.email_add,
      role_type: user.role_type,
      is_active: user.is_active,
      joined_at: user.joined_at,
      org: user.org
    }));
  };

  // Wrapper function that updates state AND navigates to the URL
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    const path = sectionToPath[section] || '/admin/dashboard';
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

  // Fetch current logged-in user's profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await authAPI.getCurrentProfile();
        setLoggedInUser({
          name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
          role: userData.role_type || 'Admin',
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

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
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

  // Fetch organization structure from API
  useEffect(() => {
    const fetchOrganizationTree = async () => {
      setIsLoadingOrg(true);
      try {
        const data = await organizationAPI.getAll();
        console.log('Organization structure fetched from API:', data);
        setOrganizationTree(data);
      } catch (error) {
        console.error('Failed to load organization structure:', error);
        if (dataStore) {
          const fallbackData = dataStore.getOrganizationTree();
          console.log('Using fallback organization structure from dataStore:', fallbackData);
          setOrganizationTree(fallbackData);
        }
      } finally {
        setIsLoadingOrg(false);
      }
    };
    fetchOrganizationTree();
  }, [dataStore]);

  // Fetch all organizations for the org users view
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await organizationAPI.getAllOrganizations();
        console.log('Organizations fetched from API:', data);
        setOrganizations(data);
      } catch (error) {
        console.error('Failed to load organizations:', error);
      }
    };
    fetchOrganizations();
  }, []);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const data = await documentAPI.getAll();
        console.log('Documents fetched from API:', data);
        setDocuments(data);
        setDocumentList(data);
      } catch (error) {
        console.error('Failed to load documents:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllDocuments();
          console.log('Using fallback documents from dataStore:', fallbackData);
          setDocuments(fallbackData);
          setDocumentList(fallbackData);
        }
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    fetchDocuments();
  }, [dataStore]);

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

  // Fetch audit logs from API
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoadingLogs(true);
      try {
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
    fetchAuditLogs();
  }, [dataStore]);

  // Fetch organization shares from API
  useEffect(() => {
    const fetchOrgShares = async () => {
      try {
        const data = await organizationShareAPI.getAll();
        console.log('Organization shares fetched from API:', data);
        setOrgShares(data);
      } catch (error) {
        console.error('Failed to load organization shares:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllOrgShares();
          console.log('Using fallback org shares from dataStore:', fallbackData);
          setOrgShares(fallbackData);
        }
      }
    };
    fetchOrgShares();
  }, [dataStore]);


  // OLD: Customization is now handled by SystemThemeContext
  // useEffect(() => {
  //   if (dataStore) {
  //     const custom = dataStore.getCustomization();
  //     if (custom) {
  //       setCustomization(custom);
  //       applyCustomization(custom);
  //     }
  //   }
  // }, [dataStore]);

  // useEffect(() => {
  //   if (dataStore) {
  //     const unsubscribe = dataStore.subscribe(() => {
  //       forceUpdate(prev => prev + 1);
  //       const custom = dataStore.getCustomization();
  //       if (custom) {
  //         setCustomization(custom);
  //         applyCustomization(custom);
  //       }
  //     });
  //     return unsubscribe;
  //   }
  // }, [dataStore]);

  useEffect(() => {
    if (dataStore) {
      const format = dataStore.getUserIdFormat();
      if (format) {
        setUserIdFormat(format);
      }
    }
    
    // Load user ID format from API
    const loadUserIdFormat = async () => {
      try {
        const data = await systemSettingsAPI.getUserIdFormat();
        if (data && data.setting_value) {
          setUserIdFormat(data.setting_value);
          // Also update dataStore
          if (dataStore) {
            dataStore.setUserIdFormat(data.setting_value);
          }
        }
      } catch (error) {
        // User ID format is optional - not finding it is not an error
        console.debug('User ID format configuration not available in backend');
      }
    };
    
    loadUserIdFormat();
  }, [dataStore]);
 const handleCustomizationSave = (newSettings) => {
   
    if (dataStore) {
      dataStore.setCustomization(newSettings);
    }
    
   
    setCustomization(newSettings);
    // OLD: Customization is now applied by SystemThemeContext
    // applyCustomization(newSettings);
    
   
    addAuditLog(
      'System Customization Updated',
      `System Name: ${newSettings.systemName}, Colors updated`,
      'Success'
    );
    
    alert('Customization saved successfully!');
  };

  const handleCustomize = () => {
    setShowCustomizationModal(true);
  };


   const handleConfigureUserId = () => {
    setShowUserIdFormatModal(true);
  };
  const handleUserIdFormatSave = (newFormat) => {
    setUserIdFormat(newFormat);
    forceUpdate(prev => prev + 1);
    
    // Save to API
    const saveFormat = async () => {
      try {
        await systemSettingsAPI.saveUserIdFormat(newFormat);
        console.log('User ID format saved to backend');
      } catch (error) {
        console.error('Failed to save user ID format to backend:', error);
      }
    };
    
    saveFormat();
    
    // Save to dataStore
    if (dataStore) {
      dataStore.setUserIdFormat(newFormat);
    }
    
    addAuditLog(
      'User ID Format Updated',
      `Admin: ${newFormat.previewIds.admin}, User: ${newFormat.previewIds.user}`,
      'Success'
    );
    
    alert('User ID format updated successfully! New users will use this format.');
  };
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'user-mgmt', 
      label: 'Users', 
      icon: Users,
      children: [
        { id: 'users', label: 'User Management', icon: null },
        { id: 'org-users', label: 'Users by Organization', icon: null }
      ]
    },
    { 
      id: 'documents-mgmt', 
      label: 'Documents', 
      icon: FileText,
      children: [
        { id: 'all-documents', label: 'All User Documents', icon: null },
        { id: 'org-shares', label: 'Organization Shares', icon: null },
        { id: 'categories', label: 'Categories', icon: null }
      ]
    },
    { id: 'logs', label: 'Audit Logs', icon: ClipboardList }
  ];

  const renderOrgUnitOptions = (nodes, level = 0) => {
    const options = [];
    for (const node of nodes) {
      options.push(
        <option key={node.id} value={node.id}>
          {'  '.repeat(level) + '└ ' + node.name + ' (' + node.type + ')'}
        </option>
      );
      if (node.children && node.children.length > 0) {
        options.push(...renderOrgUnitOptions(node.children, level + 1));
      }
    }
    return options;
  };

  const validateUserIdFormat = (userId, role) => {
    if (!userId) return null;
    
    if (dataStore) {
      return dataStore.validateUserId(userId, role.toLowerCase());
    }
    

    const userIdPattern = /^TUPM-\d{2}-\d{4}$/;
    const adminIdPattern = /^TUPM_\d{2}_\d{4}$/;
    
    if (role === 'User') {
      return userIdPattern.test(userId);
    } else if (role === 'Admin') {
      return adminIdPattern.test(userId);
    }
    return null;
  };

  const handleUserIdChange = (value) => {
    setNewUser({ ...newUser, userId: value });
    const isValid = validateUserIdFormat(value, newUser.role);
    setUserIdFormatValid(isValid);
  };

 const validateUserForm = () => {
  const newErrors = {};

  if (!editingUserId) {
    if (!newUser.userId.trim()) {
      newErrors.userId = 'User ID is required';
    } else {
      const userIdPattern = /^TUPM-\d{2}-\d{4}$/;
      const adminIdPattern = /^TUPM_\d{2}_\d{4}$/;
      
      if (newUser.role === 'User') {
        if (!userIdPattern.test(newUser.userId)) {
          newErrors.userId = 'User ID must be in format TUPM-XX-XXXX (e.g., TUPM-01-0001)';
        }
      } else if (newUser.role === 'Admin') {
        if (!adminIdPattern.test(newUser.userId)) {
          newErrors.userId = 'Admin ID must be in format TUPM_XX_XXXX (e.g., TUPM_01_0001)';
        }
      }
      
      if (!newErrors.userId && userList.some(user => user.id === newUser.userId)) {
        newErrors.userId = 'User ID already exists';
      }
    }
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

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};



  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addAuditLog = async (action, resource, status = 'Success') => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const newLog = {
      time: timestamp,
      user: `${currentUser.name} (Admin)`,
      action: action,
      resource: resource,
      status: status
    };

    // Save to backend API
    try {
      await auditLogAPI.create({
        user: currentUser.username || currentUser.id,
        action: action,
        resource: resource,
        status: status
      });
      
      // Refresh audit logs after adding new log
      const logs = await auditLogAPI.getAll();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to save audit log to backend:', error);
    }

    // Also save to dataStore for backward compatibility
    if (dataStore) {
      dataStore.addAuditLog(newLog);
    }
  };

 const handleAddUser = () => {
  if (validateUserForm()) {
    if (editingUserId) {
      const updateUserAPI = async () => {
        try {
          const updateData = {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            organization_unit_id: newUser.organizationUnitId || null,
            organization_position: newUser.organizationPosition || ''
          };

          await userAPI.update(editingUserId, updateData);

          // Refresh user list from API
          const users = await userAPI.getAll();
          setUserList(transformUsers(users));

          if (dataStore) {
            dataStore.updateUser(editingUserId, {
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              email: newUser.email,
              role: newUser.role,
              organizationUnitId: newUser.organizationUnitId,
              organizationPosition: newUser.organizationPosition
            });
          }

          addAuditLog('User Updated', `${editingUserId} - Personal info updated`, 'Success');
          setShowAddUserModal(false);
          setEditingUserId(null);
          setNewUser({ 
            userId: '', 
            firstName: '', 
            lastName: '', 
            email: '', 
            role: 'User', 
            organizationUnitId: '', 
            organizationPosition: '' 
          });
          setTempUserData(null);
          setErrors({});
          alert('User information updated successfully!');
        } catch (error) {
          console.error('Failed to update user:', error);
          const message = error.status === 401
            ? 'Session expired. Please log in again.'
            : error.message;
          setErrors({ general: message });
          alert(`Failed to update user: ${message}`);
        }
      };

      updateUserAPI();
    } else {
      setTempUserData({
        userId: newUser.userId,
        firstName: newUser.firstName,   
        lastName: newUser.lastName,  
        email: newUser.email,  
        role: newUser.role,
        organizationUnitId: newUser.organizationUnitId,
        organizationPosition: newUser.organizationPosition
      });
      setShowAddUserModal(false);
      setShowPasswordModal(true);
    }
  }
};


 const handleSaveUser = () => {
  if (validatePasswordForm()) {
    if (editingUserId) {
      const updatePasswordAPI = async () => {
        try {
          await userAPI.changePassword(editingUserId, passwordData.password);

          if (dataStore) {
            dataStore.updateUser(editingUserId, {
              password: passwordData.password
            });
          }

          addAuditLog('Password Changed', `${editingUserId} - Password updated`, 'Success');
          setShowEditPasswordModal(false);
          setEditingUserId(null);
          setPasswordData({ password: '', confirmPassword: '' });
          setErrors({});
          alert('Password updated successfully!');
        } catch (error) {
          console.error('Failed to update password:', error);
          const message = error.status === 401
            ? 'Session expired. Please log in again.'
            : error.message;
          setErrors({ general: message });
          alert(`Failed to update password: ${message}`);
        }
      };

      updatePasswordAPI();
    } else {
      // Create user in backend API
      const createUserAPI = async () => {
        try {
          const userData = {
            username: tempUserData.userId,
            first_name: tempUserData.firstName,
            last_name: tempUserData.lastName,
            email: tempUserData.email,
            password: passwordData.password,
            job_title: '',
            department: '',
            organization_unit_id: tempUserData.organizationUnitId || null,
            organization_position: tempUserData.organizationPosition || '',
            status: 'Active',
            role: tempUserData.role
          };
          
          const newUser = await userAPI.create(userData);
          
          // Refresh user list from API
          const users = await userAPI.getAll();
          setUserList(transformUsers(users));
          
          addAuditLog('User Created', `${tempUserData.userId} - ${tempUserData.firstName} ${tempUserData.lastName}`, 'Success');
          
          setShowPasswordModal(false);
          setNewUser({
            userId: '',
            firstName: '',
            lastName: '',
            email: '',
            role: 'User',
            organizationUnitId: '',
            organizationPosition: ''
          });
          setPasswordData({
            password: '',
            confirmPassword: ''
          });
          setTempUserData(null);
          setErrors({});
          alert('User created successfully!');
        } catch (error) {
          console.error('Failed to create user:', error);
          const message = error.status === 401
            ? 'Session expired. Please log in again.'
            : error.message;
          setErrors({ general: message });
          alert(`Failed to create user: ${message}`);
        }
      };
      
      createUserAPI();
    }
  }
};


  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const deletedUser = userList.find(user => user.id === userId);
      
      const deleteUserAPI = async () => {
        try {
          await userAPI.delete(userId);
          
          // Refresh user list from API
          const data = await userAPI.getAll();
          setUserList(transformUsers(data));
          
          // Also update dataStore
          if (dataStore) {
            dataStore.deleteUser(userId);
          }
          
          if (deletedUser) {
            addAuditLog('User Deleted', `${deletedUser.id} - ${deletedUser.firstName} ${deletedUser.lastName}`, 'Success');
          }
          setOpenMenuUserId(null);
          alert('User deleted successfully!');
        } catch (error) {
  
          const message = error.status === 401
            ? 'Session expired. Please log in again.'
            : error.message;
          alert(`Failed to delete user: ${message}`);
        }
      };
      
      deleteUserAPI();
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
        const user = userList.find(u => u.id === editingUserId);
        if (user) {
          setNewUser({
            userId: user.id,
            firstName: user.firstName,  
            lastName: user.lastName,  
            email: user.email,  
            role: user.role,
            organizationUnitId: user.organizationUnitId || '',
            organizationPosition: user.organizationPosition || ''
          });
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
  const adminOrgId = loggedInUser?.full_data?.org;
  
  return userList.filter(user => {
    // Don't show system_admin users in user management
    if (user.role_type === 'system_admin') {
      return false;
    }
    
    // Only show users from the admin's organization
    if (!adminOrgId || user.organizationUnitId !== adminOrgId) {
      return false;
    }
    
    const matchesSearch = 
      user.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
      user.lastName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||  
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    const matchesRole = userFilterRole === 'All' || user.role?.toLowerCase() === userFilterRole.toLowerCase();
    const matchesStatus = userFilterStatus === 'All' || (user.isActive ? 'ACTIVE' : 'INACTIVE') === userFilterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
};

  const getFilteredLogs = () => {
    try {
      if (!Array.isArray(auditLogs)) {
        return [];
      }

      const adminOrgId = loggedInUser?.full_data?.org;
      const adminUserId = loggedInUser?.user_id;
      
      return auditLogs.filter(log => {
        if (!log) return false;
        
        // Exclude login and logout actions
        const action = (log?.action || '').toLowerCase();
        if (action.includes('login') || action.includes('logout')) {
          return false;
        }
        
        // Only include record-related and organization-joined actions
        const isRecordRelated = action.includes('record') || 
                               action.includes('document') || 
                               action.includes('category');
        const isOrgRelated = action.includes('organization') || 
                            action.includes('joined') || 
                            action.includes('org');
        
        if (!isRecordRelated && !isOrgRelated) {
          return false;
        }
        
        // Filter by users in the admin's organization or the admin themselves
        let userInOrgScope = false;
        const logUserId = log?.userId;
        
        // Include logs from the admin themselves
        if (logUserId === adminUserId) {
          userInOrgScope = true;
        } else if (adminOrgId) {
          // Check if user is in the admin's organization
          const userInOrg = userList.find(u => u.id === logUserId && u.organizationUnitId === adminOrgId);
          userInOrgScope = !!userInOrg;
        }
        
        if (!userInOrgScope) {
          return false;
        }
        
        // Apply manual filters
        const matchesSearch = 
          (log?.user || log?.userName || '').toString().toLowerCase().includes(logSearchQuery.toLowerCase()) ||
          (log?.action || '').toString().toLowerCase().includes(logSearchQuery.toLowerCase()) ||
          (log?.resource || '').toString().toLowerCase().includes(logSearchQuery.toLowerCase());
        
        const matchesAction = logFilterAction === 'All' || (log?.action || '') === logFilterAction;
        const matchesStatus = logFilterStatus === 'All' || (log?.status || '') === logFilterStatus;
        
        return matchesSearch && matchesAction && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering logs:', error);
      return [];
    }
  };


  const getActions = () => {
    try {
      // Get actions from the filtered logs (after our scoping and exclusion filters)
      const filteredLogs = getFilteredLogs();
      const actions = [...new Set(filteredLogs.map(log => log?.action || ''))];
      return actions.filter(action => action && action.trim()).sort();
    } catch (error) {
      console.error('Error getting actions:', error);
      return [];
    }
  };

  const generateOrgUnitId = () => {
    return 'org-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const handleSaveOrgUnit = () => {
    const newErrors = {};
    
    if (!orgUnitData.name.trim()) {
      newErrors.name = 'Unit name is required';
    }
    
    if (!orgUnitData.type) {
      newErrors.type = 'Unit type is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (selectedOrgUnit) {
      const updateNode = (nodes) => {
        return nodes.map(node => {
          if (node.id === selectedOrgUnit.id) {
            return {
              ...node,
              ...orgUnitData
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNode(node.children)
            };
          }
          return node;
        });
      };
      
      setOrganizationTree(updateNode(organizationTree));
      addAuditLog('Organization Updated', `${orgUnitData.name} - ${orgUnitData.type}`, 'Success');
    } else {
      const newUnit = {
        id: generateOrgUnitId(),
        ...orgUnitData,
        children: []
      };

      if (parentOrgUnit) {
        const addChild = (nodes) => {
          return nodes.map(node => {
            if (node.id === parentOrgUnit) {
              return {
                ...node,
                children: [...(node.children || []), newUnit]
              };
            }
            if (node.children) {
              return {
                ...node,
                children: addChild(node.children)
              };
            }
            return node;
          });
        };
        
        setOrganizationTree(addChild(organizationTree));
      } else {
        setOrganizationTree([...organizationTree, newUnit]);
      }
      
      addAuditLog('Organization Created', `${orgUnitData.name} - ${orgUnitData.type}`, 'Success');
    }

    setShowOrgUnitModal(false);
    setSelectedOrgUnit(null);
    setParentOrgUnit(null);
    setOrgUnitData({ name: '', type: '', headPosition: '', code: '', description: '' });
    setErrors({});
  };

  const handleDeleteOrgUnit = (unitId) => {
    if (window.confirm('Are you sure you want to delete this organizational unit? All child units will also be deleted.')) {
      const deleteNode = (nodes) => {
        return nodes.filter(node => {
          if (node.id === unitId) {
            addAuditLog('Organization Deleted', `${node.name} - ${node.type}`, 'Success');
            return false;
          }
          if (node.children) {
            node.children = deleteNode(node.children);
          }
          return true;
        });
      };
      
      setOrganizationTree(deleteNode(organizationTree));
    } 
    
  };
const handleViewDocument = (doc) => {
  setViewingDocument(doc);
  setShowDocumentViewer(true);
};
const handleDownloadDocument = (doc) => {
  if (doc.fileData) {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (doc.content || doc.ocrContent) {
    const content = doc.content || doc.ocrContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  addAuditLog('Document Downloaded', `Admin downloaded: ${doc.title} (ID: ${doc.id})`, 'Success');
};

const handlePrintDocument = (doc) => {
  if (doc.fileData && doc.format === 'pdf') {
    const printWindow = window.open(doc.fileData);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } else if (doc.content || doc.ocrContent) {
    const content = doc.content || doc.ocrContent;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${doc.title}</title>
            <style>
              body { font-family: Georgia, serif; padding: 40px; line-height: 1.6; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } else if (doc.fileData) {
    const printWindow = window.open(doc.fileData);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
  
  addAuditLog('Document Printed', `Admin printed: ${doc.title} (ID: ${doc.id})`, 'Success');
};
  return (
    <div className="flex h-screen bg-gray-100">
       <UserIdFormatModal
        show={showUserIdFormatModal}
        onClose={() => setShowUserIdFormatModal(false)}
        dataStore={dataStore}
        onSave={handleUserIdFormatSave}
      />
       <AdminCustomizationModal
        show={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        dataStore={dataStore}
        onSave={handleCustomizationSave}
      />
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

      <AddUserModal
        showAddUserModal={showAddUserModal}
        setShowAddUserModal={setShowAddUserModal}
        editingUserId={editingUserId}
        setEditingUserId={setEditingUserId}
        newUser={newUser}
        setNewUser={setNewUser}
        handleUserIdChange={handleUserIdChange}
        userIdFormatValid={userIdFormatValid}
        errors={errors}
        setErrors={setErrors}
        setUserIdFormatValid={setUserIdFormatValid}
        handleAddUser={handleAddUser}
        userList={userList}
        organizationTree={organizationTree}
        renderOrgUnitOptions={renderOrgUnitOptions}
      />

      <PasswordModal
        showPasswordModal={showPasswordModal}
        showEditPasswordModal={showEditPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
        setShowAddUserModal={setShowAddUserModal}
        tempUserData={tempUserData}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        errors={errors}
        setErrors={setErrors}
        handleSaveUser={handleSaveUser}
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
        handleSaveUser={handleSaveUser}
      />

      <OrgUnitModal
        show={showOrgUnitModal}
        onClose={() => {
          setShowOrgUnitModal(false);
          setSelectedOrgUnit(null);
          setParentOrgUnit(null);
          setOrgUnitData({ name: '', type: '', headPosition: '', code: '', description: '' });
          setErrors({});
        }}
        selectedOrgUnit={selectedOrgUnit}
        parentOrgUnit={parentOrgUnit}
        organizationTree={organizationTree}
        orgUnitData={orgUnitData}
        setOrgUnitData={setOrgUnitData}
        errors={errors}
        onSave={handleSaveOrgUnit}
      />

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={loggedInUser}
      />
      

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          menuItems={menuItems}
          activeSection={activeSection}
          currentUser={loggedInUser}
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <AdminDashboard
              userList={userList}
              documentList={documentList}
              auditLogs={auditLogs}
              dataStore={dataStore}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'org-users' && (
            <OrgUnitUsersView
              organizationTree={organizationTree}
              userList={userList}
              organizations={organizations}
              onRefreshUsers={refreshUserList}
            />
          )}
          {activeSection === 'users' && (
            <AdminUserManagement
              userList={userList}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userFilterRole={userFilterRole}
              setUserFilterRole={setUserFilterRole}
              userFilterStatus={userFilterStatus}
              setUserFilterStatus={setUserFilterStatus}
              getFilteredUsers={getFilteredUsers}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
              setShowAddUserModal={setShowAddUserModal}
            />
          )}
          {activeSection === 'all-documents' && (
            <AdminAllDocumentsView 
              dataStore={dataStore}
              documents={documents}
              userList={userList}
              loggedInUser={loggedInUser}
              onViewDocument={handleViewDocument}        
              onDownloadDocument={handleDownloadDocument}
            />
          )}
          {activeSection === 'org-shares' && (
            <AdminOrgSharesView 
              dataStore={dataStore}
              organizationTree={organizationTree}
              orgShares={orgShares}
              onViewDocument={handleViewDocument}     
              onDownloadDocument={handleDownloadDocument}
            />
          )}
          {activeSection === 'categories' && (
            <Category userOrg={loggedInUser.full_data?.org} />
          )}
          {activeSection === 'logs' && (
            <ErrorBoundary>
              <AdminLogAudits
                auditLogs={auditLogs}
                logSearchQuery={logSearchQuery}
                setLogSearchQuery={setLogSearchQuery}
                logFilterAction={logFilterAction}
                setLogFilterAction={setLogFilterAction}
                logFilterStatus={logFilterStatus}
                setLogFilterStatus={setLogFilterStatus}
                getActions={getActions}
                getFilteredLogs={getFilteredLogs}
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}