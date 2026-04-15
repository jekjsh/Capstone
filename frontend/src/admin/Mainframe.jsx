import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList } from 'lucide-react';

import SharedHeader from '../components/SharedHeader';
import AdminSidebar from './component/AdminSidebar';
import AdminDashboard from './component/AdminDashboard';
import AdminUserManagement from './component/AdminUserManagement';
import AdminDocuments from './component/AdminDocuments';
import AdminLogAudits from './component/AdminLogAudits';
import ErrorBoundary from './component/ErrorBoundary';
import OrgUnitModal from './component/OrgUnitModal';
import OrgUnitUsersView from './component/OrgUnitUsersView';
import AdminCustomizationModal from './component/AdminCustomizationModal';
import  UserIdFormatModal from './component/UserIdFormatModal';
import DocumentViewerModal from '../components/modals/DocumentViewerModal';
import DocumentHistoryModal from '../components/modals/DocumentHistoryModal';
import OCRModal from '../components/modals/OCRModal';
import CreateFolderModal from '../components/modals/CreateFolderModal';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import RenameDetectedDocumentsModal from '../components/modals/RenameDetectedDocumentsModal';
import CategoryMatchConfirmationModal from '../components/modals/CategoryMatchConfirmationModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import UserProfileViewModal from '../components/UserProfileViewModal';
import ShareDocumentModal from '../components/modals/ShareDocumentModal';
import ShareFolderModal from '../components/modals/ShareFolderModal';
import RenameDocumentModal from '../components/modals/RenameDocumentModal';
import AddDocumentCategoriesModal from '../components/modals/AddDocumentCategoriesModal';
import AddFolderCategoryModal from '../components/modals/AddFolderCategoryModal';
import SharedDocuments from '../user/Components/SharedDocuments';
import Notifications from '../user/Components/Notifications';
import { 
  UserActionMenu, 
  AdminVerificationModal, 
  AddUserModal, 
  PasswordModal, 
  EditPasswordModal 
} from './component/AdminModals';
import AdminAllDocumentsView from './component/AdminAllDocumentsView';
import Category from '../components/Category';
import FileManagement from '../components/FileManagement';
import RecycleBin from '../components/RecycleBin';
import { organizationAPI, userAPI, auditLogAPI, documentAPI, documentShareAPI, folderAPI, folderShareAPI, systemSettingsAPI, organizationShareAPI, sessionAPI, authAPI, getAccessToken, ocrAPI, categoryAPI } from '../services/api';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export default function Mainframe({ 
  currentUser = { name: 'Administrator', role: 'Admin' }, 
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
    'dashboard': '/admin/dashboard',
    'my-files': '/admin/my-files',
    'org-users': '/admin/user-assignment',
    'users': '/admin/user-profiles',
    'all-documents': '/admin/documents-list',
    'org-shares': '/admin/file-sharing',
    'categories': '/admin/categories',
    'recycle-bin': '/admin/recycle-bin',
    'logs': '/admin/audit-logs'
  };

  const pathToSection = {
    ...Object.fromEntries(Object.entries(sectionToPath).map(([section, path]) => [path, section])),
    '/admin/users-by-organization': 'org-users',
    '/admin/user-management': 'users',
    '/admin/all-user-documents': 'all-documents',
    '/admin/organization-shares': 'org-shares',
  };

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
  const [showDocumentHistoryModal, setShowDocumentHistoryModal] = useState(false);
  const [documentHistoryData, setDocumentHistoryData] = useState(null);
  const [isLoadingDocumentHistory, setIsLoadingDocumentHistory] = useState(false);
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
  // Admin's personal files state
  const [adminFolders, setAdminFolders] = useState([]);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [adminDeletedDocuments, setAdminDeletedDocuments] = useState([]);
  const [adminDeletedFolders, setAdminDeletedFolders] = useState([]);
  const [adminSharedDocumentIds, setAdminSharedDocumentIds] = useState([]);
  const [adminSharedDocumentLabels, setAdminSharedDocumentLabels] = useState({});
  const [adminSharedFolderIds, setAdminSharedFolderIds] = useState([]);
  const [adminSharedFolderLabels, setAdminSharedFolderLabels] = useState({});
  const [adminFolderSharesData, setAdminFolderSharesData] = useState([]);
  const [adminDocumentSharesData, setAdminDocumentSharesData] = useState([]);
  const [currentAdminFolder, setCurrentAdminFolder] = useState(null);
  const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);
  const [showAdminCreateFolderModal, setShowAdminCreateFolderModal] = useState(false);
  const [showAdminOCRModal, setShowAdminOCRModal] = useState(false);
  const [showAdminShareDocumentModal, setShowAdminShareDocumentModal] = useState(false);
  const [showAdminShareFolderModal, setShowAdminShareFolderModal] = useState(false);
  const [showAdminRenameDocumentModal, setShowAdminRenameDocumentModal] = useState(false);
  const [adminDocumentToShare, setAdminDocumentToShare] = useState(null);
  const [adminFolderToShare, setAdminFolderToShare] = useState(null);
  const [adminDocumentToRename, setAdminDocumentToRename] = useState(null);
  const [showAdminAddCategoriesModal, setShowAdminAddCategoriesModal] = useState(false);
  const [adminDocumentForCategories, setAdminDocumentForCategories] = useState(null);
  const [showAdminAddFolderCategoryModal, setShowAdminAddFolderCategoryModal] = useState(false);
  const [adminFolderForCategory, setAdminFolderForCategory] = useState(null);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminShareUsers, setAdminShareUsers] = useState([]);
  const [adminNewFolderName, setAdminNewFolderName] = useState('');
  const [adminNewFolderColor, setAdminNewFolderColor] = useState('blue');
  const [adminUploadedDocFiles, setAdminUploadedDocFiles] = useState([]);
  const [adminUploadPreviews, setAdminUploadPreviews] = useState([]);
  const [adminCurrentPreviewIndex, setAdminCurrentPreviewIndex] = useState(0);
  const [adminUploadTagValues, setAdminUploadTagValues] = useState({});
  const [adminUploadFileNames, setAdminUploadFileNames] = useState([]);
  const [adminAutoCategorizeUploads, setAdminAutoCategorizeUploads] = useState(false);
  const [showAdminRenameDetectedModal, setShowAdminRenameDetectedModal] = useState(false);
  const [showAdminCategoryMatchConfirmModal, setShowAdminCategoryMatchConfirmModal] = useState(false);
  const [adminDetectedUploadItems, setAdminDetectedUploadItems] = useState([]);
  const [isAdminDetectingUploads, setIsAdminDetectingUploads] = useState(false);
  const [isAdminSubmittingDetectedUpload, setIsAdminSubmittingDetectedUpload] = useState(false);
  const [adminUploadedOCRFile, setAdminUploadedOCRFile] = useState(null);
  const [adminOcrText, setAdminOcrText] = useState('');
  const [adminIsProcessingOCR, setAdminIsProcessingOCR] = useState(false);
  const [adminOcrMode, setAdminOcrMode] = useState('fast');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminFilterFormat, setAdminFilterFormat] = useState('all');
  const [adminSortBy, setAdminSortBy] = useState('date-desc');
  const [adminFilterByTag, setAdminFilterByTag] = useState({});
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
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
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    userContact: '',
    userBirthdate: '',
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
      userContact: user.user_contact || '',
      userBirthdate: user.user_birthdate || '',
      role: user.role_type,
      isActive: user.is_active,
      joinedAt: user.joined_at,
      organizationUnitId: user.org || '',
      organizationUnitName: user.org_name || user.organization_name || user.orgName || '',
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name || '',
      last_name: user.last_name,
      user_pos: user.user_pos || '',
      email_add: user.email_add,
      user_contact: user.user_contact || '',
      user_birthdate: user.user_birthdate || '',
      role_type: user.role_type,
      is_active: user.is_active,
      joined_at: user.joined_at,
      org: user.org,
      org_name: user.org_name || user.organization_name || user.orgName || ''
    }));
  };

  const findOrganizationNameById = (orgId, nodes = organizationTree) => {
    if (!orgId || !Array.isArray(nodes)) return '';

    for (const node of nodes) {
      const currentId = node.org_id || node.id;
      if (String(currentId) === String(orgId)) {
        return node.org_name || node.name || '';
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        const found = findOrganizationNameById(orgId, node.children);
        if (found) return found;
      }
    }

    return '';
  };

  const findOrganizationCodeById = (orgId, nodes = organizationTree) => {
    if (!orgId || !Array.isArray(nodes)) return '';

    for (const node of nodes) {
      const currentId = node.org_id || node.id;
      if (String(currentId) === String(orgId)) {
        return node.org_code || node.code || '';
      }

      const children = node.children || node.sub_offices;
      if (Array.isArray(children) && children.length > 0) {
        const found = findOrganizationCodeById(orgId, children);
        if (found) return found;
      }
    }

    return '';
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

  // Role-based access control - Admin only
  useEffect(() => {
    const validateAccess = async () => {
      const userRole = currentUser?.role_type || currentUser?.role;
      
      if (userRole !== 'admin') {
        // Log unauthorized access attempt
        try {
          await auditLogAPI.create({
            audit_action: 'Unauthorized Access Attempt',
            audit_desc: `User ${currentUser?.user_id || 'Unknown'} (Role: ${userRole}) attempted to access Admin panel`,
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

  // Fetch current logged-in user's profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await authAPI.getCurrentProfile();
        const newLoggedInUser = {
          name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
          role: userData.role_type || 'Admin',
          user_id: userData.user_id,
          first_name: userData.first_name || '',
          middle_name: userData.middle_name || '',
          last_name: userData.last_name || '',
          suffix: userData.suffix || '',
          email_add: userData.email_add || '',
          full_data: userData,
          id: userData.user_id // Also set 'id' for compatibility
        };
        setLoggedInUser(newLoggedInUser);
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
        setOrganizationTree(data);
      } catch (error) {
        console.error('Failed to load organization structure:', error);
        if (dataStore) {
          const fallbackData = dataStore.getOrganizationTree();
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
        const [data, deletedData, deletedFoldersData] = await Promise.all([
          documentAPI.getAll(),
          documentAPI.getDeleted(),
          folderAPI.getDeleted(),
        ]);
        setDocuments(data);
        setDocumentList(data);
        setAdminDocuments(Array.isArray(data) ? data : []);
        setAdminDeletedDocuments(Array.isArray(deletedData) ? deletedData : []);
        setAdminDeletedFolders(Array.isArray(deletedFoldersData) ? deletedFoldersData : []);
      } catch (error) {
        console.error('Failed to load documents:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllDocuments();
          setDocuments(fallbackData);
          setDocumentList(fallbackData);
          setAdminDocuments(Array.isArray(fallbackData) ? fallbackData : []);
          setAdminDeletedDocuments([]);
        }
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    fetchDocuments();
  }, [dataStore]);

  // Fetch folders for Admin My Files (admins receive org-wide folders from backend)
  useEffect(() => {
    const fetchAdminFolders = async () => {
      try {
        const data = await folderAPI.getAll();
        setAdminFolders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load admin folders:', error);
        setAdminFolders([]);
      }
    };
    fetchAdminFolders();
  }, []);

  // Fetch folder share direction for admin My Files badges
  useEffect(() => {
    const fetchAdminFolderShares = async () => {
      const currentOrgId = loggedInUser?.org || loggedInUser?.full_data?.org;
      if (!currentOrgId) {
        setAdminSharedFolderIds([]);
        setAdminSharedFolderLabels({});
        return;
      }

      try {
        const allFolderShares = await folderShareAPI.getAll();
        setAdminFolderSharesData(Array.isArray(allFolderShares) ? allFolderShares : []);
        const folderLabelMap = {};

        allFolderShares.forEach((share) => {
          const folderId = share.folder || share.folder_data?.folder_id;
          if (!folderId) return;

          const key = String(folderId);
          const isSharer = String(share.shared_by_org) === String(currentOrgId);
          const isRecipient = String(share.shared_with_org) === String(currentOrgId);

          if (isSharer) {
            // If user is the sharer, this takes precedence over "shared to you".
            folderLabelMap[key] = 'Shared';
          } else if (isRecipient && folderLabelMap[key] !== 'Shared') {
            folderLabelMap[key] = 'Shared to you';
          }
        });

        setAdminSharedFolderLabels(folderLabelMap);
        setAdminSharedFolderIds(Object.keys(folderLabelMap));
      } catch (error) {
        console.error('Failed to load admin folder shares:', error);
        setAdminFolderSharesData([]);
        setAdminSharedFolderIds([]);
        setAdminSharedFolderLabels({});
      }
    };

    fetchAdminFolderShares();
  }, [loggedInUser?.org, loggedInUser?.full_data?.org]);

  // Fetch document share direction for admin My Files badges
  useEffect(() => {
    const fetchAdminDocumentShares = async () => {
      const currentUserIndex = loggedInUser?.user_index || loggedInUser?.full_data?.user_index;
      if (!currentUserIndex) {
        setAdminSharedDocumentIds([]);
        setAdminSharedDocumentLabels({});
        return;
      }

      try {
        const allDocumentShares = await documentShareAPI.getAll();
        setAdminDocumentSharesData(Array.isArray(allDocumentShares) ? allDocumentShares : []);
        const documentLabelMap = {};

        allDocumentShares.forEach((share) => {
          const docId = share.doc || share.document || share.doc_id;
          if (!docId) return;

          const key = String(docId);
          const isSharer = share.shared_by_user === currentUserIndex;
          const isRecipient = share.shared_to_user === currentUserIndex;

          if (isSharer) {
            documentLabelMap[key] = 'Shared';
          } else if (isRecipient && documentLabelMap[key] !== 'Shared') {
            documentLabelMap[key] = 'Shared to you';
          }
        });

        setAdminSharedDocumentLabels(documentLabelMap);
        setAdminSharedDocumentIds(Object.keys(documentLabelMap));
      } catch (error) {
        console.error('Failed to load admin document shares:', error);
        setAdminDocumentSharesData([]);
        setAdminSharedDocumentIds([]);
        setAdminSharedDocumentLabels({});
      }
    };

    fetchAdminDocumentShares();
  }, [loggedInUser?.user_index, loggedInUser?.full_data?.user_index]);

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
        setOrgShares(data);
      } catch (error) {
        console.error('Failed to load organization shares:', error);
        if (dataStore) {
          const fallbackData = dataStore.getAllOrgShares();
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
  
  const adminOrgCode = findOrganizationCodeById(loggedInUser?.full_data?.org || loggedInUser?.org);
  const adminOrgId = loggedInUser?.full_data?.org || loggedInUser?.org;
  const adminFilesLabel = `${adminOrgCode || 'Organization'} Files`;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'file-mgmt',
      label: 'Files & Sharing',
      icon: FileText,
      children: [
        { id: 'my-files', label: adminFilesLabel, icon: null },
        { id: 'org-shares', label: 'File Sharing', icon: null },
        { id: 'categories', label: 'Categories', icon: null },
        { id: 'recycle-bin', label: 'Recycle Bin', icon: null },
      ],
    },
    {
      id: 'access-mgmt',
      label: 'People & Roles',
      icon: Users,
      children: [
        { id: 'users', label: 'User Profiles', icon: null },
        { id: 'org-users', label: 'User Assignment', icon: null },
      ],
    },
    { id: 'all-documents', label: 'Documents List', icon: FileText },
    { id: 'logs', label: 'Activity Logs', icon: ClipboardList },
  ];

  // Admin My Files should reflect org ownership, not per-user ownership.
  const adminVisibleFolders = Array.isArray(adminFolders) ? adminFolders : [];
  const adminVisibleDocuments = Array.isArray(adminDocuments) ? adminDocuments : [];

  const adminFilteredDocuments = adminVisibleDocuments.filter((doc) => {
    const name = String(doc.doc_name || doc.title || '').toLowerCase();
    const searchOk = !adminSearchQuery || name.includes(adminSearchQuery.toLowerCase());

    if (!searchOk) return false;

    if (adminFilterFormat === 'all') return true;
    if (adminFilterFormat === 'pdf') return name.endsWith('.pdf');
    if (adminFilterFormat === 'docx') return name.endsWith('.docx') || name.endsWith('.doc');
    if (adminFilterFormat === 'ocr') return name.includes('ocr');

    return true;
  });

  useEffect(() => {
    if (!currentAdminFolder) return;
    const stillVisible = adminVisibleFolders.some((folder) => folder.folder_id === currentAdminFolder);
    if (!stillVisible) {
      setCurrentAdminFolder(null);
    }
  }, [currentAdminFolder, adminVisibleFolders]);

  useEffect(() => {
    if (activeSection !== 'my-files' && activeSection !== 'org-shares' && activeSection !== 'recycle-bin') return;

    const refreshAdminData = async () => {
      try {
        const [docs, foldersData, sharesData, deletedData, deletedFoldersData] = await Promise.all([
          documentAPI.getAll(),
          folderAPI.getAll(),
          organizationShareAPI.getAll(),
          documentAPI.getDeleted(),
          folderAPI.getDeleted(),
        ]);
        setDocuments(Array.isArray(docs) ? docs : []);
        setDocumentList(Array.isArray(docs) ? docs : []);
        setAdminDocuments(Array.isArray(docs) ? docs : []);
        setAdminFolders(Array.isArray(foldersData) ? foldersData : []);
        setOrgShares(Array.isArray(sharesData) ? sharesData : []);
        setAdminDeletedDocuments(Array.isArray(deletedData) ? deletedData : []);
        setAdminDeletedFolders(Array.isArray(deletedFoldersData) ? deletedFoldersData : []);
        await refreshAdminShareData();
      } catch (error) {
        console.error('Failed to auto-refresh admin file sharing data:', error);
      }
    };

    refreshAdminData();
    const intervalId = setInterval(refreshAdminData, 5000);
    return () => clearInterval(intervalId);
  }, [activeSection]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoryAPI.getAll();
        setAdminCategories(Array.isArray(categories) ? categories : []);
      } catch (error) {
        console.error('Failed to fetch admin categories:', error);
        setAdminCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const renderOrgUnitOptions = (nodes, level = 0, parentPath = '', index = 0) => {
    const options = [];
    for (let idx = 0; idx < nodes.length; idx++) {
      const node = nodes[idx];
      // Handle missing IDs with fallback
      const nodeId = node.org_id || node.id || `fallback-${index}-${idx}`;
      const uniqueKey = `${parentPath}${nodeId}`;
      const nextIndex = index + idx;
      
      options.push(
        <option key={uniqueKey} value={nodeId}>
          {'  '.repeat(level) + '└ ' + (node.org_name || node.name || 'Unknown') + ' (' + (node.org_type || node.type || '') + ')'}
        </option>
      );
      if (node.sub_offices && node.sub_offices.length > 0) {
        options.push(...renderOrgUnitOptions(node.sub_offices, level + 1, `${uniqueKey}-`, nextIndex + 1));
      } else if (node.children && node.children.length > 0) {
        options.push(...renderOrgUnitOptions(node.children, level + 1, `${uniqueKey}-`, nextIndex + 1));
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

  if (newUser.userContact && !/^\+?[0-9\-()\s]{7,20}$/.test(newUser.userContact)) {
    newErrors.userContact = 'Please enter a valid contact number';
  }

  if (newUser.userBirthdate && Number.isNaN(new Date(newUser.userBirthdate).getTime())) {
    newErrors.userBirthdate = 'Please enter a valid birthdate';
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
            middle_name: newUser.middleName || '',
            last_name: newUser.lastName,
            suffix: newUser.suffix || '',
            email: newUser.email,
            user_contact: newUser.userContact || '',
            user_birthdate: newUser.userBirthdate || null,
            user_pos: newUser.organizationPosition || '',
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
              middleName: newUser.middleName,
              lastName: newUser.lastName,
              suffix: newUser.suffix,
              email: newUser.email,
              userContact: newUser.userContact,
              userBirthdate: newUser.userBirthdate,
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
            middleName: '',
            lastName: '', 
            suffix: '',
            email: '', 
            userContact: '',
            userBirthdate: '',
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
        middleName: newUser.middleName,
        lastName: newUser.lastName,  
        suffix: newUser.suffix,
        email: newUser.email,  
        userContact: newUser.userContact,
        userBirthdate: newUser.userBirthdate,
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
            middle_name: tempUserData.middleName || '',
            last_name: tempUserData.lastName,
            suffix: tempUserData.suffix || '',
            email: tempUserData.email,
            user_contact: tempUserData.userContact || '',
            user_birthdate: tempUserData.userBirthdate || null,
            user_pos: tempUserData.organizationPosition || '',
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
            middleName: '',
            lastName: '',
            suffix: '',
            email: '',
            userContact: '',
            userBirthdate: '',
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

  const handleViewUser = (userId) => {
    const user = userList.find((u) => u.id === userId);
    if (!user) return;
    const resolvedOrgName =
      user.organizationUnitName ||
      user.org_name ||
      findOrganizationNameById(user.organizationUnitId);

    setSelectedUserProfile({
      ...user,
      organizationUnitName: resolvedOrgName || '-',
    });
    setShowUserProfileModal(true);
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
            middleName: user.middleName || '',
            lastName: user.lastName,  
            suffix: user.suffix || '',
            email: user.email,  
            userContact: user.userContact || '',
            userBirthdate: user.userBirthdate || '',
            role: user.role,
            organizationUnitId: user.organizationUnitId || '',
            organizationPosition: user.userPos || user.organizationPosition || ''
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
        
        // Include record and sharing-related actions
        const isRecordRelated = action.includes('record') || 
                               action.includes('document') || 
                   action.includes('category') ||
                   action.includes('folder') ||
                   action.includes('share') ||
                   action.includes('revoke') ||
                   action.includes('file');
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
const handleViewDocument = async (doc) => {
  if (!doc) return;

  if (doc.fileData || doc.content || doc.ocrContent) {
    setViewingDocument(doc);
    setShowDocumentViewer(true);
    return;
  }

  if (doc.can_open === false) {
    alert('You can view metadata for this file, but opening is restricted by ownership policy.');
    return;
  }

  const fileUrl = doc.doc_file_url || doc.doc_file;
  if (!fileUrl) {
    setViewingDocument(doc);
    setShowDocumentViewer(true);
    return;
  }

  try {
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to load file (${response.status})`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const fileName = doc.doc_name || doc.title || 'document';
    const ext = fileName.toLowerCase().split('.').pop();

    setViewingDocument({
      ...doc,
      title: doc.doc_name || doc.title,
      fileData: blobUrl,
      format: ext === 'pdf' ? 'pdf' : ext,
      isBlobUrl: true,
    });
    setShowDocumentViewer(true);
  } catch (error) {
    console.error('Failed to open document:', error);
    alert(`Failed to open document: ${error.message}`);
  }
};

const handleViewDocumentHistory = async (doc) => {
  try {
    const docId = doc?.doc_id || doc?.id;
    if (!docId) {
      alert('Document ID not found.');
      return;
    }

    setShowDocumentHistoryModal(true);
    setIsLoadingDocumentHistory(true);
    const historyData = await documentAPI.getHistory(docId);
    setDocumentHistoryData(historyData);
  } catch (error) {
    console.error('Failed to load document history:', error);
    setDocumentHistoryData(null);
    alert(`Failed to load document history: ${error.message}`);
  } finally {
    setIsLoadingDocumentHistory(false);
  }
};

const handleDownloadDocument = (doc) => {
  if (doc.can_open === false) {
    alert('Download is restricted by ownership policy for this shared file.');
    return;
  }

  if (doc.doc_file_url) {
    const link = document.createElement('a');
    link.href = doc.doc_file_url;
    link.download = doc.doc_name || doc.title || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (doc.fileData) {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || doc.doc_name || doc.title;
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
  
  addAuditLog('Document Downloaded', `Admin downloaded: ${doc.doc_name || doc.title} (ID: ${doc.doc_id || doc.id})`, 'Success');
};

const handlePrintDocument = (doc) => {
  if (doc.can_open === false) {
    alert('Print is restricted by ownership policy for this shared file.');
    return;
  }

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
  
  addAuditLog('Document Printed', `Admin printed: ${doc.doc_name || doc.title} (ID: ${doc.doc_id || doc.id})`, 'Success');
};

const refreshAdminShareData = async () => {
  const [folderSharesData, documentSharesData] = await Promise.all([
    folderShareAPI.getAll(),
    documentShareAPI.getAll(),
  ]);
  const safeFolderShares = Array.isArray(folderSharesData) ? folderSharesData : [];
  const safeDocumentShares = Array.isArray(documentSharesData) ? documentSharesData : [];
  setAdminFolderSharesData(safeFolderShares);
  setAdminDocumentSharesData(safeDocumentShares);

  const currentUserIndex = loggedInUser?.full_data?.user_index || loggedInUser?.user_index;
  const currentOrgId = loggedInUser?.full_data?.org || loggedInUser?.org;

  const folderLabelMap = {};
  safeFolderShares.forEach((share) => {
    const folderKey = String(share.folder);
    if (String(share.shared_by_org) === String(currentOrgId)) {
      folderLabelMap[folderKey] = 'Shared by your org';
    } else if (!folderLabelMap[folderKey]) {
      folderLabelMap[folderKey] = 'Shared to you';
    }
  });
  setAdminSharedFolderLabels(folderLabelMap);
  setAdminSharedFolderIds(Object.keys(folderLabelMap));

  const documentLabelMap = {};
  safeDocumentShares.forEach((share) => {
    const docKey = String(share.doc);
    if (String(share.shared_by_user) === String(currentUserIndex)) {
      documentLabelMap[docKey] = 'Shared by you';
    } else if (!documentLabelMap[docKey]) {
      documentLabelMap[docKey] = 'Shared to you';
    }
  });
  setAdminSharedDocumentLabels(documentLabelMap);
  setAdminSharedDocumentIds(Object.keys(documentLabelMap));
};

const openAdminShareDocumentModal = async (doc) => {
  setAdminDocumentToShare(doc);
  setShowAdminShareDocumentModal(true);
  try {
    const users = await userAPI.getAll();
    setAdminShareUsers(Array.isArray(users) ? users : []);
  } catch (error) {
    console.error('Failed to load users for share modal:', error);
    setAdminShareUsers([]);
  }
};

const openAdminShareFolderModal = (folder) => {
  setAdminFolderToShare(folder);
  setShowAdminShareFolderModal(true);
};

const openAdminRenameDocumentModal = (doc) => {
  setAdminDocumentToRename(doc);
  setShowAdminRenameDocumentModal(true);
};

const openAdminAddCategoriesModal = (doc) => {
  setAdminDocumentForCategories(doc);
  setShowAdminAddCategoriesModal(true);
};

const openAdminAddFolderCategoryModal = (folder) => {
  setAdminFolderForCategory(folder);
  setShowAdminAddFolderCategoryModal(true);
};

const refreshAdminFileLists = async () => {
  const [updatedDocs, updatedFolders] = await Promise.all([
    documentAPI.getAll(),
    folderAPI.getAll(),
  ]);
  setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);
  setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
};

const handleAdminMoveDocumentByDrop = async (docId, targetFolderId) => {
  const normalizedDocId = Number.isNaN(Number(docId)) ? docId : Number(docId);
  const normalizedTargetFolderId = targetFolderId == null
    ? null
    : (Number.isNaN(Number(targetFolderId)) ? targetFolderId : Number(targetFolderId));

  const sourceDoc = (adminDocuments || []).find(
    (doc) => String(doc.doc_id || doc.id) === String(normalizedDocId)
  );

  if (!sourceDoc) return;
  if (String(sourceDoc.folder ?? '') === String(normalizedTargetFolderId ?? '')) return;

  try {
    await documentAPI.update(normalizedDocId, {
      folder: normalizedTargetFolderId,
    });

    await refreshAdminFileLists();

    const targetFolderName = normalizedTargetFolderId == null
      ? 'root'
      : ((adminFolders || []).find((folder) => String(folder.folder_id) === String(normalizedTargetFolderId))?.folder_name || 'selected folder');

    addAuditLog(
      'Move Document',
      `Admin moved document ${(sourceDoc.doc_name || normalizedDocId)} to ${targetFolderName}`,
      'Success'
    );
  } catch (error) {
    console.error('Failed to move document by drag and drop:', error);
    alert(`Failed to move document: ${error.message}`);
  }
};

const handleAdminMoveFolderByDrop = async (folderId, targetParentFolderId) => {
  const normalizedFolderId = Number.isNaN(Number(folderId)) ? folderId : Number(folderId);
  const normalizedTargetParentFolderId = targetParentFolderId == null
    ? null
    : (Number.isNaN(Number(targetParentFolderId)) ? targetParentFolderId : Number(targetParentFolderId));

  const sourceFolder = (adminFolders || []).find(
    (folder) => String(folder.folder_id) === String(normalizedFolderId)
  );

  if (!sourceFolder) return;
  if (String(sourceFolder.parent_folder ?? '') === String(normalizedTargetParentFolderId ?? '')) return;

  try {
    await folderAPI.update(normalizedFolderId, {
      parent_folder: normalizedTargetParentFolderId,
    });

    await refreshAdminFileLists();

    const targetFolderName = normalizedTargetParentFolderId == null
      ? 'root'
      : ((adminFolders || []).find((folder) => String(folder.folder_id) === String(normalizedTargetParentFolderId))?.folder_name || 'selected folder');

    addAuditLog(
      'Move Folder',
      `Admin moved folder ${(sourceFolder.folder_name || normalizedFolderId)} to ${targetFolderName}`,
      'Success'
    );
  } catch (error) {
    console.error('Failed to move folder by drag and drop:', error);
    alert(`Failed to move folder: ${error.message}`);
  }
};

const handleAdminRenameDocument = async (renameData) => {
  await documentAPI.update(renameData.documentId, {
    doc_name: renameData.newName,
  });

  const updatedDocs = await documentAPI.getAll();
  setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);

  addAuditLog('Rename Document', `Admin renamed document to '${renameData.newName}'`, 'Success');
};

const handleAdminRenameFolder = async (folderId) => {
  const targetFolder = adminFolders.find((f) => String(f.folder_id) === String(folderId));
  if (!targetFolder) return;

  const proposedName = window.prompt('Rename folder', targetFolder.folder_name || '');
  if (!proposedName) return;

  await folderAPI.update(folderId, {
    folder_name: proposedName.trim(),
    folder_color: targetFolder.folder_color || 'blue',
    parent_folder: targetFolder.parent_folder || null,
  });

  const updatedFolders = await folderAPI.getAll();
  setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
  addAuditLog('Rename Folder', `Admin renamed folder to '${proposedName.trim()}'`, 'Success');
};

const handleAdminShareDocument = async (shareData) => {
  const sharePromises = (shareData.sharedWith || []).map((userPk) =>
    documentShareAPI.create({
      doc: shareData.documentId,
      shared_to_user: userPk,
      share_msg: shareData.message || '',
    })
  );

  await Promise.all(sharePromises);
  await refreshAdminShareData();
};

const handleAdminShareFolder = async (shareData) => {
  const orgsToShare = shareData.sharedWith || [];
  const orgsToUnshare = shareData.unsharedWith || [];
  const currentOrgId = loggedInUser?.full_data?.org || loggedInUser?.org;

  const collectFolderTreeIds = (rootFolderId) => {
    const result = new Set();
    const queue = [String(rootFolderId)];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || result.has(current)) continue;
      result.add(current);

      (adminFolders || [])
        .filter((f) => String(f.parent_folder) === String(current))
        .forEach((child) => queue.push(String(child.folder_id)));
    }

    return Array.from(result);
  };

  const folderTreeIds = collectFolderTreeIds(shareData.folderId);
  const existingShares = await folderShareAPI.getAll();
  const existingShareMap = new Map();

  (existingShares || []).forEach((share) => {
    if (String(share.shared_by_org) !== String(currentOrgId)) return;
    existingShareMap.set(`${String(share.folder)}:${String(share.shared_with_org)}`, share.share_id);
  });

  const createOps = [];
  folderTreeIds.forEach((folderId) => {
    orgsToShare.forEach((orgId) => {
      if (String(orgId) === String(currentOrgId)) return;
      const key = `${String(folderId)}:${String(orgId)}`;
      if (!existingShareMap.has(key)) {
        createOps.push(
          folderShareAPI.create({
            folder: folderId,
            shared_with_org: orgId,
            share_msg: shareData.message || '',
          })
        );
      }
    });
  });

  const deleteOps = [];
  folderTreeIds.forEach((folderId) => {
    orgsToUnshare.forEach((orgId) => {
      const key = `${String(folderId)}:${String(orgId)}`;
      const shareId = existingShareMap.get(key);
      if (shareId) {
        deleteOps.push(folderShareAPI.delete(shareId));
      }
    });
  });

  await Promise.all([...createOps, ...deleteOps]);
  await refreshAdminShareData();
};

const handleAdminCreateFolder = async () => {
  if (!adminNewFolderName.trim()) {
    setErrors({ folderName: 'Folder name is required' });
    return;
  }

  try {
    const payload = {
      folder_name: adminNewFolderName.trim(),
      folder_color: adminNewFolderColor,
    };
    if (currentAdminFolder) payload.parent_folder = currentAdminFolder;

    await folderAPI.create(payload);
    const [updatedFolders, updatedDocs] = await Promise.all([folderAPI.getAll(), documentAPI.getAll()]);
    setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
    setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);

    setShowAdminCreateFolderModal(false);
    setAdminNewFolderName('');
    setAdminNewFolderColor('blue');
    setErrors({});
    addAuditLog('Folder Created', `Admin created folder ${payload.folder_name}`, 'Success');
  } catch (error) {
    console.error('Failed to create admin folder:', error);
    setErrors({ folderName: error.message || 'Failed to create folder' });
  }
};

const handleAdminDocumentFileUpload = async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const previews = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const lower = file.name.toLowerCase();
          if (lower.endsWith('.pdf')) {
            resolve({ type: 'pdf', url: URL.createObjectURL(file), fileName: file.name });
            return;
          }
          if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(lower)) {
            resolve({ type: 'image', url: URL.createObjectURL(file), fileName: file.name });
            return;
          }
          if (lower.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = () => resolve({ type: 'text', content: String(reader.result || ''), fileName: file.name });
            reader.onerror = () => resolve({ type: 'other', fileName: file.name, fileSize: `${(file.size / 1024).toFixed(2)} KB`, fileType: file.type || 'unknown' });
            reader.readAsText(file);
            return;
          }
          resolve({ type: 'other', fileName: file.name, fileSize: `${(file.size / 1024).toFixed(2)} KB`, fileType: file.type || 'unknown' });
        })
    )
  );

  setAdminUploadedDocFiles((prev) => [...prev, ...files]);
  setAdminUploadPreviews((prev) => [...prev, ...previews]);
  setAdminUploadFileNames((prev) => [...prev, ...files.map((file) => file.name)]);
  if (adminUploadedDocFiles.length === 0) setAdminCurrentPreviewIndex(0);
};

const removeAdminFileFromUpload = (index) => {
  const preview = adminUploadPreviews[index];
  if (preview?.url && preview.url.startsWith('blob:')) {
    URL.revokeObjectURL(preview.url);
  }

  const nextFiles = adminUploadedDocFiles.filter((_, i) => i !== index);
  const nextPreviews = adminUploadPreviews.filter((_, i) => i !== index);
  const nextNames = adminUploadFileNames.filter((_, i) => i !== index);
  setAdminUploadedDocFiles(nextFiles);
  setAdminUploadPreviews(nextPreviews);
  setAdminUploadFileNames(nextNames);
  setAdminCurrentPreviewIndex((prev) => Math.max(0, Math.min(prev, nextFiles.length - 1)));
};

const buildSuggestedUploadNameFromCategory = (fileName, detectedCategoryName) => {
  const originalName = String(fileName || 'file');
  const extensionMatch = originalName.match(/(\.[^.]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : '';

  const userLastName =
    loggedInUser?.last_name ||
    loggedInUser?.full_data?.last_name ||
    currentUser?.last_name ||
    'user';

  const safeLastName = String(userLastName).trim().replace(/\s+/g, '_');
  const safeCategory = String(detectedCategoryName || 'category').trim().replace(/\s+/g, '_');
  return `${safeLastName}_${safeCategory}${extension}`;
};

const pickBestCategoryFromDetectedText = (fileName, extractedText, categories = []) => {
  const combined = `${String(fileName || '')} ${String(extractedText || '')}`.toLowerCase();
  if (!combined.trim() || !Array.isArray(categories) || categories.length === 0) {
    return { category: null, confidence: 0 };
  }

  let bestMatch = null;
  let bestScore = 0;
  let bestPercent = 0;

  categories.forEach((category) => {
    const categoryName = String(category?.category_name || '').toLowerCase().trim();
    const categoryDesc = String(category?.category_desc || '').toLowerCase().trim();
    if (!categoryName && !categoryDesc) return;

    const categoryText = `${categoryName} ${categoryDesc}`.trim();
    if (!categoryText) return;

    let score = 0;
    if (categoryName && combined.includes(categoryName)) score += categoryName.length + 5;
    if (categoryDesc && combined.includes(categoryDesc)) score += categoryDesc.length + 3;

    const words = categoryText.split(/\s+/).filter(Boolean);
    words.forEach((word) => {
      if (word.length >= 3 && combined.includes(word)) score += word.length;
    });

    const maxScore =
      (categoryName ? categoryName.length + 5 : 0) +
      (categoryDesc ? categoryDesc.length + 3 : 0) +
      words.reduce((sum, word) => (word.length >= 3 ? sum + word.length : sum), 0);
    const percent = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;

    if (score > bestScore || (score === bestScore && percent > bestPercent)) {
      bestScore = score;
      bestPercent = percent;
      bestMatch = category;
    }
  });

  return {
    category: bestScore > 0 ? bestMatch : null,
    confidence: bestScore > 0 ? bestPercent : 0,
  };
};

const splitNameAndExtension = (fullName) => {
  const lastDot = String(fullName || '').lastIndexOf('.');
  if (lastDot <= 0) return { base: String(fullName || ''), extension: '' };
  return {
    base: String(fullName || '').slice(0, lastDot),
    extension: String(fullName || '').slice(lastDot),
  };
};

const hasOcrDetectableFiles = (files = []) => {
  const ocrFileRegex = /\.(pdf|png|jpe?g|bmp|gif|webp|tiff?)$/i;
  return files.some((file) => ocrFileRegex.test(file?.name || ''));
};

const runAdminDetectionForUploads = async () => {
  if (!adminAutoCategorizeUploads || adminUploadedDocFiles.length === 0) return;

  setIsAdminDetectingUploads(true);
  try {
    const ocrFileRegex = /\.(pdf|png|jpe?g|bmp|gif|webp|tiff?)$/i;

    const extractDetectionTextFromFile = async (file, isOcrFile) => {
      const lowerName = String(file?.name || '').toLowerCase();

      if (isOcrFile) {
        try {
          const result = await ocrAPI.extractText(file, {
            engine: 'tesseract',
            mode: 'fast',
            lang: 'eng',
          });
          return result?.text || '';
        } catch (error) {
          console.error('Admin detection OCR failed for file:', file.name, error);
          return '';
        }
      }

      if (lowerName.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          return result?.value || '';
        } catch (error) {
          console.error('Admin DOCX detection text extraction failed:', file.name, error);
          return '';
        }
      }

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const extracted = workbook.SheetNames.map((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_csv(sheet || {});
          }).join('\n');
          return extracted || '';
        } catch (error) {
          console.error('Admin excel detection text extraction failed:', file.name, error);
          return '';
        }
      }

      if (lowerName.endsWith('.txt')) {
        try {
          return await file.text();
        } catch (error) {
          console.error('Admin TXT detection text extraction failed:', file.name, error);
          return '';
        }
      }

      return '';
    };

    const detected = await Promise.all(
      adminUploadedDocFiles.map(async (file, index) => {
        const isOcrFile = ocrFileRegex.test(file.name || '');
        const extractedText = await extractDetectionTextFromFile(file, isOcrFile);

        const predicted = pickBestCategoryFromDetectedText(file.name, extractedText, adminCategories);
        const predictedCategory = predicted.category;

        return {
          fileName: file.name,
          finalName: buildSuggestedUploadNameFromCategory(file.name, predictedCategory?.category_name || 'category'),
          extractedText,
          isOcrFile,
          predictedCategoryName: predictedCategory?.category_name || '',
          predictedMatchPercent: predicted.confidence || 0,
        };
      })
    );

    setAdminDetectedUploadItems(detected);
    setShowAdminCategoryMatchConfirmModal(true);
  } finally {
    setIsAdminDetectingUploads(false);
  }
};

const performAdminUploadDocument = async (namesOverride = null) => {
  if (!adminUploadedDocFiles.length) return;

  try {
    for (let index = 0; index < adminUploadedDocFiles.length; index += 1) {
      const file = adminUploadedDocFiles[index];
      const resolvedDocName = ((namesOverride || adminUploadFileNames)[index] || file.name || '').trim() || file.name;
      await documentAPI.uploadFiles(
        [file],
        resolvedDocName,
        '',
        currentAdminFolder || null,
        undefined,
        { autoCategorize: adminAutoCategorizeUploads }
      );
    }

    const [updatedDocs, updatedFolders] = await Promise.all([documentAPI.getAll(), folderAPI.getAll()]);
    setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);
    setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);

    adminUploadPreviews.forEach((preview) => {
      if (preview?.url && preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setShowAdminUploadModal(false);
    setShowAdminCategoryMatchConfirmModal(false);
    setShowAdminRenameDetectedModal(false);
    setAdminUploadedDocFiles([]);
    setAdminUploadPreviews([]);
    setAdminCurrentPreviewIndex(0);
    setAdminUploadTagValues({});
    setAdminUploadFileNames([]);
    setAdminDetectedUploadItems([]);
    setAdminAutoCategorizeUploads(false);

    addAuditLog('Upload Document', `Admin uploaded ${adminUploadedDocFiles.length} document(s)`, 'Success');
    alert(`Uploaded ${adminUploadedDocFiles.length} document(s) successfully.`);
  } catch (error) {
    console.error('Failed to upload admin documents:', error);
    alert(`Failed to upload documents: ${error.message}`);
  }
};

const handleAdminUploadDocument = async () => {
  if (!adminUploadedDocFiles.length) return;

  if (adminAutoCategorizeUploads) {
    await runAdminDetectionForUploads();
    return;
  }

  await performAdminUploadDocument();
};

const handleAdminChangeDetectedUploadName = (index, newBaseName) => {
  const file = adminUploadedDocFiles[index];
  if (!file) return;

  const { extension } = splitNameAndExtension(file.name);
  const safeBase = String(newBaseName || '').trim();
  const nextName = safeBase ? `${safeBase}${extension}` : file.name;

  setAdminDetectedUploadItems((prev) => prev.map((item, i) => (i === index ? { ...item, finalName: nextName } : item)));
};

const handleAdminConfirmDetectedUpload = async () => {
  setIsAdminSubmittingDetectedUpload(true);
  try {
    const confirmedNames = adminDetectedUploadItems.map((item, index) => item.finalName || adminUploadedDocFiles[index]?.name || 'file');
    setAdminUploadFileNames(confirmedNames);
    await performAdminUploadDocument(confirmedNames);
  } finally {
    setIsAdminSubmittingDetectedUpload(false);
  }
};

const handleAdminProceedFromCategoryConfirm = () => {
  setShowAdminCategoryMatchConfirmModal(false);
  setShowAdminRenameDetectedModal(true);
};

const handleAdminDeleteDocument = async (docId) => {
  const targetId = docId?.doc_id || docId;
  if (!targetId) return;

  const targetDoc = (adminDocuments || []).find(
    (doc) => String(doc.doc_id || doc.id) === String(targetId)
  );

  if (!targetDoc) return;

  const isOwnedByAdminOrg = String(targetDoc.owning_org || '') === String(adminOrgId || '');
  if (!isOwnedByAdminOrg) {
    alert('You can only delete documents owned by your organization.');
    return;
  }

  if (!window.confirm('Move this document to Recycle Bin?')) return;

  try {
    await documentAPI.delete(targetId);
    const [updatedDocs, deletedDocs] = await Promise.all([documentAPI.getAll(), documentAPI.getDeleted()]);
    setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);
    setAdminDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
    addAuditLog('Delete Document', `Admin moved document ${targetId} to recycle bin`, 'Success');
    alert('Document moved to recycle bin successfully.');
  } catch (error) {
    console.error('Failed to delete document:', error);
    alert(`Failed to delete document: ${error.message}`);
  }
};

const handleAdminRestoreDocument = async (docId) => {
  await documentAPI.restore(docId);
  const [updatedDocs, deletedDocs] = await Promise.all([documentAPI.getAll(), documentAPI.getDeleted()]);
  setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);
  setAdminDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
  addAuditLog('Restore Document', `Admin restored document ${docId}`, 'Success');
  alert('Document restored successfully.');
};

const handleAdminRestoreAllDocuments = async () => {
  if (!adminDeletedDocuments.length) return;

  await Promise.all(
    adminDeletedDocuments.map((doc) => documentAPI.restore(doc.doc_id || doc.id))
  );

  const [updatedDocs, deletedDocs] = await Promise.all([documentAPI.getAll(), documentAPI.getDeleted()]);
  setAdminDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  setDocumentList(Array.isArray(updatedDocs) ? updatedDocs : []);
  setAdminDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
  addAuditLog('Restore All Documents', 'Admin restored all deleted documents in recycle bin', 'Success');
  alert('All deleted documents were restored successfully.');
};

const handleAdminRestoreFolder = async (folderId) => {
  await folderAPI.restore(folderId);
  const [updatedFolders, deletedFolders] = await Promise.all([
    folderAPI.getAll(),
    folderAPI.getDeleted(),
  ]);
  setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
  setAdminDeletedFolders(Array.isArray(deletedFolders) ? deletedFolders : []);
  addAuditLog('Restore Folder', `Admin restored folder ${folderId}`, 'Success');
  alert('Folder restored successfully.');
};

const handleAdminPermanentDeleteFolder = async (folderId) => {
  await folderAPI.permanentDelete(folderId);
  const [updatedFolders, deletedFolders] = await Promise.all([
    folderAPI.getAll(),
    folderAPI.getDeleted(),
  ]);
  setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
  setAdminDeletedFolders(Array.isArray(deletedFolders) ? deletedFolders : []);
  addAuditLog('Permanent Delete Folder', `Admin permanently deleted folder ${folderId}`, 'Success');
  alert('Folder permanently deleted successfully.');
};

const handleAdminPermanentDeleteDocument = async (docId) => {
  await documentAPI.permanentDelete(docId);
  const deletedDocs = await documentAPI.getDeleted();
  setAdminDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
  addAuditLog('Permanent Delete Document', `Admin permanently deleted document ${docId}`, 'Success');
  alert('Document permanently deleted successfully.');
};

const handleAdminEmptyRecycleBin = async () => {
  await documentAPI.emptyTrash();
  setAdminDeletedDocuments([]);
  addAuditLog('Empty Recycle Bin', 'Admin emptied recycle bin', 'Success');
  alert('Recycle bin emptied successfully.');
};

const handleAdminDeleteFolder = async (folderId) => {
  if (!folderId) return;

  const targetFolder = (adminFolders || []).find(
    (folder) => String(folder.folder_id) === String(folderId)
  );

  if (!targetFolder) return;

  const isOwnedByAdminOrg = String(targetFolder.owning_org || '') === String(adminOrgId || '');
  if (!isOwnedByAdminOrg) {
    alert('You can only delete folders owned by your organization.');
    return;
  }

  if (!window.confirm('Delete this folder?')) return;

  try {
    await folderAPI.delete(folderId);
    const [updatedFolders, deletedFolders] = await Promise.all([folderAPI.getAll(), folderAPI.getDeleted()]);
    setAdminFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
    setAdminDeletedFolders(Array.isArray(deletedFolders) ? deletedFolders : []);
    if (String(currentAdminFolder) === String(folderId)) {
      setCurrentAdminFolder(null);
    }
    addAuditLog('Delete Folder', `Admin deleted folder ${folderId}`, 'Success');
    alert('Folder moved to recycle bin successfully.');
  } catch (error) {
    console.error('Failed to delete folder:', error);
    alert(`Failed to delete folder: ${error.message}`);
  }
};

const handleAdminOCRFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  setAdminUploadedOCRFile(file);
  setAdminOcrText('');
};

const handleAdminProcessOCR = async () => {
  if (!adminUploadedOCRFile) return;

  setAdminIsProcessingOCR(true);
  try {
    const result = await ocrAPI.extractText(adminUploadedOCRFile, {
      engine: 'tesseract',
      mode: adminOcrMode,
      lang: 'eng',
    });
    setAdminOcrText(result.text || '');
    if (!result.text) {
      alert('OCR completed but no readable text was found in the file.');
    }
  } catch (error) {
    console.error('Failed to process admin OCR:', error);
    alert(`OCR failed: ${error.message}`);
  } finally {
    setAdminIsProcessingOCR(false);
  }
};

const handleAdminUseOCRText = () => {
  if (!adminOcrText) {
    alert('Please process OCR first');
    return;
  }

  const sourceName = adminUploadedOCRFile?.name || 'ocr-result';
  const baseName = sourceName.replace(/\.[^/.]+$/, '');
  const outputName = `${baseName}-ocr.txt`;

  const textBlob = new Blob([adminOcrText], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(textBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = outputName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  addAuditLog('OCR Text Extracted', `Admin extracted OCR text file from ${sourceName}`, 'Success');

  setShowAdminOCRModal(false);
  setAdminUploadedOCRFile(null);
  setAdminOcrText('');
  alert(`Extracted text saved as ${outputName}`);
};

const closeAdminOCRModal = () => {
  setShowAdminOCRModal(false);
  setAdminUploadedOCRFile(null);
  setAdminOcrText('');
  setAdminIsProcessingOCR(false);
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
      onViewHistory={handleViewDocumentHistory}
    />

    <DocumentHistoryModal
      show={showDocumentHistoryModal}
      onClose={() => {
        setShowDocumentHistoryModal(false);
        setDocumentHistoryData(null);
      }}
      data={documentHistoryData}
      isLoading={isLoadingDocumentHistory}
    />

    <OCRModal
      show={showAdminOCRModal}
      onClose={closeAdminOCRModal}
      uploadedFile={adminUploadedOCRFile}
      ocrText={adminOcrText}
      setOcrText={setAdminOcrText}
      ocrMode={adminOcrMode}
      setOcrMode={setAdminOcrMode}
      isProcessingOCR={adminIsProcessingOCR}
      onFileUpload={handleAdminOCRFileUpload}
      onProcessOCR={handleAdminProcessOCR}
      onUseOCRText={handleAdminUseOCRText}
    />

    <CreateFolderModal
      show={showAdminCreateFolderModal}
      onClose={() => {
        setShowAdminCreateFolderModal(false);
        setAdminNewFolderName('');
        setAdminNewFolderColor('blue');
        setErrors({});
      }}
      newFolderName={adminNewFolderName}
      setNewFolderName={setAdminNewFolderName}
      newFolderColor={adminNewFolderColor}
      setNewFolderColor={setAdminNewFolderColor}
      errors={errors}
      onCreateFolder={handleAdminCreateFolder}
    />

    <UploadDocumentModal
      show={showAdminUploadModal}
      onClose={() => {
        if (isAdminDetectingUploads) return;
        adminUploadPreviews.forEach((preview) => {
          if (preview?.url && preview.url.startsWith('blob:')) {
            URL.revokeObjectURL(preview.url);
          }
        });
        setShowAdminUploadModal(false);
        setShowAdminCategoryMatchConfirmModal(false);
        setShowAdminRenameDetectedModal(false);
        setAdminUploadedDocFiles([]);
        setAdminUploadPreviews([]);
        setAdminCurrentPreviewIndex(0);
        setAdminUploadTagValues({});
        setAdminUploadFileNames([]);
        setAdminDetectedUploadItems([]);
        setAdminAutoCategorizeUploads(false);
      }}
      uploadedDocFiles={adminUploadedDocFiles}
      uploadPreviews={adminUploadPreviews}
      currentPreviewIndex={adminCurrentPreviewIndex}
      setCurrentPreviewIndex={setAdminCurrentPreviewIndex}
      onFileUpload={handleAdminDocumentFileUpload}
      onRemoveFile={removeAdminFileFromUpload}
      onUpload={handleAdminUploadDocument}
      customFields={[]}
      uploadTagValues={adminUploadTagValues}
      setUploadTagValues={setAdminUploadTagValues}
      autoCategorizeEnabled={adminAutoCategorizeUploads}
      setAutoCategorizeEnabled={(enabled) => {
        setAdminAutoCategorizeUploads(enabled);
        setAdminUploadFileNames(adminUploadedDocFiles.map((file) => file.name));
      }}
      autoCategorizeWarning="Uploads may take a little longer while your files are organized automatically."
      primaryActionLabel={adminAutoCategorizeUploads ? 'Detect' : 'Upload'}
      primaryActionLoading={isAdminDetectingUploads}
      primaryActionLoadingLabel="Detecting documents..."
      lockInteractionWhenLoading
      loadingOverlayText="Detection in progress. Please wait until it finishes."
    />

    <RenameDetectedDocumentsModal
      show={showAdminRenameDetectedModal}
      onClose={() => {
        if (isAdminSubmittingDetectedUpload) return;
        setShowAdminRenameDetectedModal(false);
        setAdminDetectedUploadItems([]);
      }}
      detectedItems={adminDetectedUploadItems}
      onChangeName={handleAdminChangeDetectedUploadName}
      onConfirm={handleAdminConfirmDetectedUpload}
      isSubmitting={isAdminSubmittingDetectedUpload}
    />

    <CategoryMatchConfirmationModal
      show={showAdminCategoryMatchConfirmModal}
      items={adminDetectedUploadItems}
      onClose={() => {
        if (isAdminSubmittingDetectedUpload) return;
        setShowAdminCategoryMatchConfirmModal(false);
      }}
      onConfirm={handleAdminProceedFromCategoryConfirm}
      isBusy={isAdminSubmittingDetectedUpload}
    />

    <ShareDocumentModal
      show={showAdminShareDocumentModal}
      onClose={() => {
        setShowAdminShareDocumentModal(false);
        setAdminDocumentToShare(null);
      }}
      document={adminDocumentToShare}
      allUsers={adminShareUsers}
      organizationTree={organizationTree}
      currentUser={{
        ...loggedInUser,
        user_index: loggedInUser?.full_data?.user_index,
        org: loggedInUser?.full_data?.org || loggedInUser?.org,
      }}
      onShareDocument={handleAdminShareDocument}
      onSharesUpdated={refreshAdminShareData}
    />

    <ShareFolderModal
      show={showAdminShareFolderModal}
      onClose={() => {
        setShowAdminShareFolderModal(false);
        setAdminFolderToShare(null);
      }}
      folder={adminFolderToShare}
      organizationTree={organizationTree}
      currentUser={{
        ...loggedInUser,
        org: loggedInUser?.full_data?.org || loggedInUser?.org,
      }}
      onShareFolder={handleAdminShareFolder}
      onSharesUpdated={refreshAdminShareData}
    />

    <RenameDocumentModal
      show={showAdminRenameDocumentModal}
      onClose={() => {
        setShowAdminRenameDocumentModal(false);
        setAdminDocumentToRename(null);
      }}
      document={adminDocumentToRename}
      onRename={handleAdminRenameDocument}
    />

    <AddDocumentCategoriesModal
      show={showAdminAddCategoriesModal}
      onClose={() => {
        setShowAdminAddCategoriesModal(false);
        setAdminDocumentForCategories(null);
      }}
      document={adminDocumentForCategories}
      categories={adminCategories}
      onCategoriesUpdated={async () => {
        try {
          await refreshAdminFileLists();
          if (adminDocumentForCategories) {
            const latestDocs = await documentAPI.getAll();
            const refreshedDoc = (latestDocs || []).find((d) => String(d.doc_id || d.id) === String(adminDocumentForCategories.doc_id || adminDocumentForCategories.id));
            if (refreshedDoc) {
              setAdminDocumentForCategories(refreshedDoc);
            }
          }
        } catch (error) {
          console.error('Failed to refresh admin documents after category update:', error);
        }
      }}
    />

    <AddFolderCategoryModal
      show={showAdminAddFolderCategoryModal}
      onClose={() => {
        setShowAdminAddFolderCategoryModal(false);
        setAdminFolderForCategory(null);
      }}
      folder={adminFolderForCategory}
      categories={adminCategories}
      onCategoryUpdated={async () => {
        try {
          await refreshAdminFileLists();
          if (adminFolderForCategory) {
            const latestFolders = await folderAPI.getAll();
            const refreshedFolder = (latestFolders || []).find((f) => String(f.folder_id) === String(adminFolderForCategory.folder_id));
            if (refreshedFolder) {
              setAdminFolderForCategory(refreshedFolder);
            }
          }
        } catch (error) {
          console.error('Failed to refresh admin folders after category update:', error);
        }
      }}
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
          const fetchCurrentUser = async () => {
            try {
              const userData = await authAPI.getCurrentProfile();
              setLoggedInUser({
                name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
                role: userData.role_type || 'Admin',
                user_id: userData.user_id,
                first_name: userData.first_name || '',
                middle_name: userData.middle_name || '',
                last_name: userData.last_name || '',
                suffix: userData.suffix || '',
                email_add: userData.email_add || '',
                full_data: userData,
                id: userData.user_id,
              });
            } catch (error) {
              console.error('Failed to refresh current user profile:', error);
            }
          };
          fetchCurrentUser();
        }}
      />

      <UserProfileViewModal
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserProfile(null);
        }}
        user={selectedUserProfile}
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
        <SharedHeader
          currentUser={loggedInUser}
          onLogout={onLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
          onEditProfile={() => setShowEditProfileModal(true)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          Notifications={Notifications}
          onNotificationNavigate={() => setActiveSection('org-shares')}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <AdminDashboard
              userList={userList}
              documentList={documentList}
              folderShares={adminFolderSharesData}
              documentShares={adminDocumentSharesData}
              auditLogs={auditLogs}
              dataStore={dataStore}
              setActiveSection={setActiveSection}
              currentUser={loggedInUser}
              organizationTree={organizationTree}
              organizations={organizations}
            />
          )}
          {activeSection === 'org-users' && (
            <OrgUnitUsersView
              organizationTree={organizationTree}
              userList={userList}
              organizations={organizations}
              onRefreshUsers={refreshUserList}
              loggedInUser={loggedInUser}
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
              handleViewUser={handleViewUser}
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
            (() => {
              const docById = new Map((adminDocuments || []).map((doc) => [String(doc.doc_id || doc.id), doc]));
              const adminSharedDocumentsForTab = (adminDocumentSharesData || []).map((share) => ({
                ...share,
                id: share.share_id,
                document: docById.get(String(share.doc)) || null,
                sharedAt: share.share_timestamp,
              }));

              return (
            <SharedDocuments
              sharedDocuments={adminSharedDocumentsForTab}
              sharedFolders={[]}
              organizationShares={adminFolderSharesData}
              allFolders={adminFolders}
              currentUser={loggedInUser}
              allUsers={userList}
              organizationTree={organizationTree}
              onOpenDocument={handleViewDocument}
              onOpenFolder={(folderId) => {
                const normalizedFolderId = Number.isNaN(Number(folderId)) ? folderId : Number(folderId);
                setCurrentAdminFolder(normalizedFolderId);
                setActiveSection('my-files');
              }}
              onSaveToMyDocuments={(doc) => handleDownloadDocument(doc)}
            />
              );
            })()
          )}
          {activeSection === 'categories' && (
            <Category userOrg={loggedInUser.full_data?.org} role_type='admin' />
          )}

          {activeSection === 'my-files' && (
            <FileManagement
              rootLabel={adminFilesLabel}
              currentFolder={currentAdminFolder}
              setCurrentFolder={setCurrentAdminFolder}
              folders={adminVisibleFolders}
              userDocuments={adminVisibleDocuments}
              sharedDocumentIds={adminSharedDocumentIds}
              sharedDocumentLabels={adminSharedDocumentLabels}
              sharedFolderIds={adminSharedFolderIds}
              sharedFolderLabels={adminSharedFolderLabels}
              filteredDocuments={adminFilteredDocuments}
              searchQuery={adminSearchQuery}
              setSearchQuery={setAdminSearchQuery}
              filterFormat={adminFilterFormat}
              setFilterFormat={setAdminFilterFormat}
              sortBy={adminSortBy}
              setSortBy={setAdminSortBy}
              filterByTag={adminFilterByTag}
              setFilterByTag={setAdminFilterByTag}
              setShowUploadDocumentModal={setShowAdminUploadModal}
              setShowCreateFolderModal={setShowAdminCreateFolderModal}
              setShowOCRModal={setShowAdminOCRModal}
              onOpenDocument={handleViewDocument}
              onDeleteDocument={handleAdminDeleteDocument}
              onDownloadDocument={handleDownloadDocument}
              onPrintDocument={handlePrintDocument}
              onMoveToFolder={() => {}}
              onMoveDocumentByDrop={handleAdminMoveDocumentByDrop}
              enableDocumentDragDrop={true}
              canDragDocument={(doc) => String(doc?.owning_org || '') === String(adminOrgId || '')}
              canDropToFolder={(folder, draggedDoc) => {
                const docOwnedByAdminOrg = String(draggedDoc?.owning_org || '') === String(adminOrgId || '');
                return !!folder && docOwnedByAdminOrg;
              }}
              canDropToRoot={(draggedDoc) => String(draggedDoc?.owning_org || '') === String(adminOrgId || '')}
              onMoveFolderByDrop={handleAdminMoveFolderByDrop}
              enableFolderDragDrop={true}
              canDragFolder={(folder) => String(folder?.owning_org || '') === String(adminOrgId || '')}
              canDropFolderToFolder={(targetFolder, draggedFolder) => {
                const targetOwnedByAdminOrg = String(targetFolder?.owning_org || '') === String(adminOrgId || '');
                const draggedOwnedByAdminOrg = String(draggedFolder?.owning_org || '') === String(adminOrgId || '');
                return targetOwnedByAdminOrg && draggedOwnedByAdminOrg;
              }}
              canDropFolderToRoot={(draggedFolder) => String(draggedFolder?.owning_org || '') === String(adminOrgId || '')}
              onShareDocument={openAdminShareDocumentModal}
              onRenameDocument={openAdminRenameDocumentModal}
              onAddCategories={openAdminAddCategoriesModal}
              onDeleteFolder={handleAdminDeleteFolder}
              onShareFolder={openAdminShareFolderModal}
              onRenameFolder={handleAdminRenameFolder}
              onAddFolderCategory={openAdminAddFolderCategoryModal}
            />
          )}

          {activeSection === 'recycle-bin' && (
            <RecycleBin
              deletedDocuments={adminDeletedDocuments}
              deletedFolders={adminDeletedFolders}
              currentUser={loggedInUser}
              onRestore={handleAdminRestoreDocument}
              onRestoreAll={handleAdminRestoreAllDocuments}
              onRestoreFolder={handleAdminRestoreFolder}
              onPermanentDeleteFolder={handleAdminPermanentDeleteFolder}
              onPermanentDelete={handleAdminPermanentDeleteDocument}
              onEmptyBin={handleAdminEmptyRecycleBin}
              showAll={true}
            />
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