
import { useState ,useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Settings, LogOut, Menu, X, Bell, Folder, Share2, Trash2 } from 'lucide-react';
import SharedHeader from '../components/SharedHeader';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import FileManagement from '../components/FileManagement';
import Category from '../components/Category';
import Sidebar from './Components/Sidebar';
import { documentAPI, organizationAPI, userAPI, auditLogAPI, folderAPI, tagAPI, organizationShareAPI, authAPI, documentShareAPI, folderShareAPI, getAccessToken, categoryAPI, ocrAPI } from '../services/api';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import CreateFolderModal from '../components/modals/CreateFolderModal';
import EditFolderModal from '../components/modals/EditFolderModal';
import MoveToFolderModal from '../components/modals/MoveToFolderModal';
import DocumentViewerModal from '../components/modals/DocumentViewerModal';
import DocumentHistoryModal from '../components/modals/DocumentHistoryModal';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import RenameDetectedDocumentsModal from '../components/modals/RenameDetectedDocumentsModal';
import CategoryMatchConfirmationModal from '../components/modals/CategoryMatchConfirmationModal';
import OCRModal from '../components/modals/OCRModal';
import PersonalInfoFormModal from '../components/modals/PersonalInfoFormModal';
import SaveOptionsModal from '../components/modals/SaveOptionsModal';
import AddFieldModal from '../components/modals/AddFieldModal';
import ShareDocumentModal from '../components/modals/ShareDocumentModal';
import ShareFolderModal from '../components/modals/ShareFolderModal';
import RenameDocumentModal from '../components/modals/RenameDocumentModal';
import AddDocumentCategoriesModal from '../components/modals/AddDocumentCategoriesModal';
import AddFolderCategoryModal from '../components/modals/AddFolderCategoryModal';
import SharedDocuments from './Components/SharedDocuments';
import Notifications from './Components/Notifications';
import RecycleBin from '../components/RecycleBin';
export default function UserMainFrame({ 
  currentUser = { name: 'User', role: 'User', id: 'user1' }, 
  onLogout = () => {}, 
  organizationTree,
  dataStore 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

  // Compute the correct user_id from whatever source is available
  const currentUserId = loggedInUser?.user_id || loggedInUser?.id || currentUser?.user_id || currentUser?.id || loggedInUser?.full_data?.user_id;

  // Mapping between section IDs and URL paths
  const sectionToPath = {
    'documents': '/user/documents',
    'shared': '/user/shared-documents',
    'folders': '/user/documents',  // Redirect folders to documents (unified view)
    'fields': '/user/categories',
    'recycle-bin': '/user/recycle-bin'
  };

  const pathToSection = {
    '/user': 'documents',
    '/user/documents': 'documents',
    '/user/my-documents': 'documents',  // Support old URL
    '/user/shared-documents': 'shared',
    '/user/folders': 'documents',  // Redirect folders to documents
    '/user/categories': 'fields',
    '/user/recycle-bin': 'recycle-bin'
  };

  const [activeSection, setActiveSectionState] = useState(() => {
    // Initialize based on current URL
    const path = location.pathname;
    return pathToSection[path] || 'documents';
  });

  // Wrapper function that updates state AND navigates to the URL
  const setActiveSection = (section, options = {}) => {
    const { preserveCurrentFolder = false } = options;
    setActiveSectionState(section);
    if (!preserveCurrentFolder) {
      setCurrentFolder(null); // Reset to root when switching context unless explicitly preserving folder target.
    }
    const path = sectionToPath[section] || '/user/documents';
    navigate(path, { replace: false });
  };

  // Sync URL changes with activeSection
  useEffect(() => {
    const path = location.pathname;
    const newSection = pathToSection[path] || 'documents';
    if (newSection !== activeSection) {
      setActiveSectionState(newSection);
    }
  }, [location.pathname]);

  // Role-based access control - User only
  useEffect(() => {
    const validateAccess = async () => {
      const userRole = currentUser?.role_type || currentUser?.role;
      
      if (userRole !== 'user') {
        // Log unauthorized access attempt
        try {
          await auditLogAPI.create({
            audit_action: 'Unauthorized Access Attempt',
            audit_desc: `User ${currentUser?.user_id || 'Unknown'} (Role: ${userRole}) attempted to access User panel`,
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [, forceUpdate] = useState(0);
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [deletedDocuments, setDeletedDocuments] = useState([]);
  const [deletedFolders, setDeletedFolders] = useState([]);
  const [orgTree, setOrgTree] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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
        const newLoggedInUser = {
          name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
          role: userData.role_type || 'User',
          user_id: userData.user_id,
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

  // Fetch user documents from backend
  useEffect(() => {
    const fetchUserDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        const allDocs = await documentAPI.getAll();
        setUserDocuments(Array.isArray(allDocs) ? allDocs : []);
      } catch (error) {
        console.error('Failed to load user documents:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackDocs = dataStore.getDocumentsByUser(currentUser.id);
          setUserDocuments(fallbackDocs);
        }
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchUserDocuments();
  }, [currentUser.id, currentUser.username, dataStore]);

  // Fetch deleted documents from backend
  useEffect(() => {
    const fetchDeletedDocuments = async () => {
      try {
        const deletedDocs = await documentAPI.getDeleted();
        setDeletedDocuments(deletedDocs);
      } catch (error) {
        console.error('Failed to load deleted documents:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackDocs = dataStore.getDeletedDocuments();
          setDeletedDocuments(fallbackDocs);
        }
      }
    };

    fetchDeletedDocuments();
  }, [currentUser.id, dataStore]);

  useEffect(() => {
    const fetchDeletedFolders = async () => {
      try {
        const deleted = await folderAPI.getDeleted();
        setDeletedFolders(Array.isArray(deleted) ? deleted : []);
      } catch (error) {
        console.error('Failed to load deleted folders:', error);
        setDeletedFolders([]);
      }
    };

    fetchDeletedFolders();
  }, [currentUser.id]);

  // Fetch organization tree for Send to Organization feature
  useEffect(() => {
    const fetchOrganizationTree = async () => {
      try {
        const data = await organizationAPI.getAll();
        setOrgTree(data);
      } catch (error) {
        console.error('Failed to load organization structure:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getOrganizationTree();
          setOrgTree(fallbackData);
        }
      }
    };
    
    fetchOrganizationTree();
  }, [dataStore]);
  // Fetch organization shares from backend
  useEffect(() => {
    const fetchOrgShares = async () => {
      try {
        const data = await organizationShareAPI.getAll();
        setOrganizationShares(data);
      } catch (error) {
        console.error('Failed to load organization shares:', error);
        if (dataStore) {
          setOrganizationShares(dataStore.getAllOrgShares());
        }
      }
    };
    fetchOrgShares();
  }, [dataStore]);

  // Fetch users for Send to Organization feature
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userAPI.getAll();
        setAllUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getAllUsers();
          setAllUsers(fallbackData);
        }
      }
    };
    
    fetchUsers();
  }, [dataStore]);

  // Fetch folders from API
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await folderAPI.getAll();
        setFolders(data);
      } catch (error) {
        console.error('Failed to load folders:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getFolders();
          setFolders(fallbackData);
        }
      }
    };
    
    fetchFolders();
  }, [dataStore]);
  
  // const [userDocuments, setUserDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('blue');
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [documentToMove, setDocumentToMove] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [customFields, setCustomFields] = useState([]);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedDocFiles, setUploadedDocFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [uploadFileNames, setUploadFileNames] = useState([]);
  const [showRenameDetectedModal, setShowRenameDetectedModal] = useState(false);
  const [showCategoryMatchConfirmModal, setShowCategoryMatchConfirmModal] = useState(false);
  const [detectedUploadItems, setDetectedUploadItems] = useState([]);
  const [isDetectingUploads, setIsDetectingUploads] = useState(false);
  const [isSubmittingDetectedUpload, setIsSubmittingDetectedUpload] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrMode, setOcrMode] = useState('fast');
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showDocumentHistoryModal, setShowDocumentHistoryModal] = useState(false);
  const [documentHistoryData, setDocumentHistoryData] = useState(null);
  const [isLoadingDocumentHistory, setIsLoadingDocumentHistory] = useState(false);
  const [currentDocumentData, setCurrentDocumentData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterFormat, setFilterFormat] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [organizationFilters, setOrganizationFilters] = useState([]);
  const [filterByTag, setFilterByTag] = useState({});
  const [uploadTagValues, setUploadTagValues] = useState({});
  const [autoCategorizeUploads, setAutoCategorizeUploads] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  
const [newField, setNewField] = useState({
  fieldName: '',
  fieldType: 'text',
  showInDocuments: true
});
  const [errors, setErrors] = useState({});
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [sharedFolders, setSharedFolders] = useState([]);
  const [sharedOutDocumentIds, setSharedOutDocumentIds] = useState([]);
  const [sharedDocumentLabels, setSharedDocumentLabels] = useState({});
  const [sharedOutFolderIds, setSharedOutFolderIds] = useState([]);
  const [sharedFolderLabels, setSharedFolderLabels] = useState({});
  const [sharedByMe, setSharedByMe] = useState([]);
  const [organizationShares, setOrganizationShares] = useState(dataStore ? dataStore.getAllOrgShares() : []);
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState(null);
  const [showShareFolderModal, setShowShareFolderModal] = useState(false);
  const [folderToShare, setFolderToShare] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [showSendToOrgModal, setShowSendToOrgModal] = useState(false);
  const [selectedDocForOrgShare, setSelectedDocForOrgShare] = useState(null);
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState(false);
  const [documentForCategories, setDocumentForCategories] = useState(null);
  const [showAddFolderCategoryModal, setShowAddFolderCategoryModal] = useState(false);
  const [folderForCategory, setFolderForCategory] = useState(null);
  const [userCategories, setUserCategories] = useState([]);

  const refreshSharedDocuments = async () => {
    try {
      const currentUserIndex = loggedInUser?.full_data?.user_index || currentUser?.user_index;
      if (!currentUserIndex) {
        setSharedDocuments([]);
        setSharedOutDocumentIds([]);
        setSharedDocumentLabels({});
        return;
      }

      const [allShares, allDocs] = await Promise.all([
        documentShareAPI.getAll(),
        documentAPI.getAll()
      ]);

      const docById = new Map((allDocs || []).map((doc) => [String(doc.doc_id || doc.id), doc]));

      const normalizedShares = (allShares || []).map((share) => {
        const docRef = docById.get(String(share.doc)) || null;
        return {
          id: share.share_id,
          share_id: share.share_id,
          doc: share.doc,
          document: docRef,
          shared_by_user: share.shared_by_user,
          shared_by: share.shared_by,
          shared_to_user: share.shared_to_user,
          shared_to: share.shared_to,
          share_msg: share.share_msg,
          share_timestamp: share.share_timestamp,
          sharedAt: share.share_timestamp,
        };
      });

      const sharedByMeData = normalizedShares.filter((share) => String(share.shared_by_user) === String(currentUserIndex));

      const labelMap = {};
      normalizedShares.forEach((share) => {
        const docKey = String(share.doc);
        if (String(share.shared_by_user) === String(currentUserIndex)) {
          labelMap[docKey] = 'Shared';
        } else if (String(share.shared_to_user) === String(currentUserIndex) && !labelMap[docKey]) {
          labelMap[docKey] = 'Shared to you';
        }
      });

      setSharedOutDocumentIds(
        Array.from(new Set(Object.keys(labelMap)))
      );
      setSharedDocumentLabels(labelMap);
      setSharedDocuments(normalizedShares);
    } catch (error) {
      console.error('Failed to refresh shared documents:', error);
      setSharedDocuments(dataStore ? dataStore.getAllDirectShares() : []);
      setSharedOutDocumentIds([]);
      setSharedDocumentLabels({});
    }
  };

  const refreshSharedFolders = async () => {
    try {
      const allFolderShares = await folderShareAPI.getAll();
      const currentOrgId = currentUser.org || currentUser.full_data?.org;

      const sharedWithMe = allFolderShares.filter(share =>
        String(share.shared_with_org) === String(currentOrgId)
      ).map(share => ({
        id: `folder-share-${share.share_id}`,
        folder: share.folder_data || folders.find(f => f.folder_id === share.folder),
        folderId: share.folder,
        sharedBy: share.shared_by_org_name || share.shared_by_org_details?.org_name || `Org ${share.shared_by_org}`,
        shared_by_org_name: share.shared_by_org_name,
        shared_by_org_details: share.shared_by_org_details,
        sharedWith: [share.shared_with_org],
        permission: 'view',
        sharedAt: share.created_at,
        isFolder: true
      }));

      const sharedByMeData = allFolderShares.filter(share =>
        String(share.shared_by_org) === String(currentOrgId)
      ).map(share => ({
        id: `folder-share-${share.share_id}`,
        folder: share.folder_data || folders.find(f => f.folder_id === share.folder),
        folderId: share.folder,
        sharedBy: share.shared_by_org_name || share.shared_by_org_details?.org_name || `Org ${share.shared_by_org}`,
        shared_by_org_name: share.shared_by_org_name,
        shared_by_org_details: share.shared_by_org_details,
        sharedWith: [share.shared_with_org],
        permission: 'view',
        sharedAt: share.created_at,
        isFolder: true,
        shareId: share.share_id
      }));

      const allFolderSharesCombined = [...sharedWithMe, ...sharedByMeData];
      const folderLabelMap = {};
      allFolderSharesCombined.forEach((share) => {
        const folderKey = String(share.folderId || share.folder?.folder_id || '');
        if (!folderKey) return;
        if (String(share.sharedBy) === String(currentOrgId)) {
          folderLabelMap[folderKey] = 'Shared';
        }
      });

      allFolderShares.forEach((share) => {
        const folderKey = String(share.folder || '');
        if (!folderKey) return;
        if (String(share.shared_by_org) === String(currentOrgId)) {
          folderLabelMap[folderKey] = 'Shared';
        } else if (String(share.shared_with_org) === String(currentOrgId) && !folderLabelMap[folderKey]) {
          folderLabelMap[folderKey] = 'Shared to you';
        }
      });

      setSharedFolders(allFolderSharesCombined);
      setSharedOutFolderIds(
        Array.from(new Set(Object.keys(folderLabelMap)))
      );
      setSharedFolderLabels(folderLabelMap);
    } catch (error) {
      console.error('Failed to refresh shared folders:', error);
      setSharedFolders([]);
      setSharedOutFolderIds([]);
      setSharedFolderLabels({});
    }
  };

  const refreshUserFileLists = async () => {
    const [docs, foldersData, deletedDocs, deletedFoldersData] = await Promise.all([
      documentAPI.getAll(),
      folderAPI.getAll(),
      documentAPI.getDeleted(),
      folderAPI.getDeleted(),
    ]);

    setUserDocuments(Array.isArray(docs) ? docs : []);
    setFolders(Array.isArray(foldersData) ? foldersData : []);
    setDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
    setDeletedFolders(Array.isArray(deletedFoldersData) ? deletedFoldersData : []);
  };

  const refreshWorkspaceAfterShare = async () => {
    await Promise.all([
      refreshUserFileLists(),
      refreshSharedDocuments(),
      refreshSharedFolders(),
    ]);
  };

  // Fetch shared documents from backend
  useEffect(() => {
    if (loggedInUser?.full_data?.user_index || currentUser?.user_index) {
      refreshSharedDocuments();
    }
  }, [loggedInUser?.full_data?.user_index, currentUser?.user_index]);

  // Fetch shared folders from backend
  useEffect(() => {
    if (currentUser.user_index) {
      refreshSharedFolders();
    }
  }, [currentUser.user_index, folders]);

  useEffect(() => {
    if (activeSection !== 'documents' && activeSection !== 'shared' && activeSection !== 'recycle-bin') return;

    const refreshWorkspace = async () => {
      try {
        const [docs, foldersData, deletedDocs, deletedFoldersData] = await Promise.all([
          documentAPI.getAll(),
          folderAPI.getAll(),
          documentAPI.getDeleted(),
          folderAPI.getDeleted(),
        ]);
        setUserDocuments(Array.isArray(docs) ? docs : []);
        setFolders(Array.isArray(foldersData) ? foldersData : []);
        setDeletedDocuments(Array.isArray(deletedDocs) ? deletedDocs : []);
        setDeletedFolders(Array.isArray(deletedFoldersData) ? deletedFoldersData : []);

        if (activeSection === 'shared') {
          await Promise.all([refreshSharedDocuments(), refreshSharedFolders()]);
        }
      } catch (error) {
        console.error('Failed to auto-refresh user workspace:', error);
      }
    };

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(refreshWorkspace, 30000);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWorkspace();
        startPolling();
      } else {
        stopPolling();
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSection, currentUser.user_index, loggedInUser?.full_data?.user_index]);

  // Fetch tags from backend
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await tagAPI.getAll();
        // Transform API response to match component expectations
        const formattedTags = tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          type: tag.type,
          showInDocuments: tag.showInDocuments
        }));
        setCustomFields(formattedTags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        // Fallback to empty array
        setCustomFields([]);
      }
    };

    fetchTags();
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoryAPI.getAll();
        setUserCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to empty array
        setUserCategories([]);
      }
    };

    fetchCategories();
  }, []);
  
 const findOrgCodeById = (targetOrgId, nodes = orgTree) => {
  if (!targetOrgId || !Array.isArray(nodes)) return '';

  for (const node of nodes) {
    const nodeId = node.org_id || node.id;
    if (String(nodeId) === String(targetOrgId)) {
      return node.org_code || node.code || '';
    }
    const children = node.sub_offices || node.children;
    if (Array.isArray(children) && children.length > 0) {
      const found = findOrgCodeById(targetOrgId, children);
      if (found) return found;
    }
  }

  return '';
 };

 const userOrgCode = findOrgCodeById(loggedInUser?.full_data?.org || loggedInUser?.org || currentUser?.org);
 const hasPrivilegedDeleteRole = ['admin', 'system_admin'].includes(
  String(loggedInUser?.full_data?.role_type || loggedInUser?.role_type || currentUser?.role_type || currentUser?.role || '').toLowerCase()
 );

 const menuItems = [
  { id: 'documents', label: `${userOrgCode || 'Organization'} Files`, icon: FileText },
  { id: 'shared', label: 'File Sharing', icon: Share2 },
  { id: 'folders', label: 'Folders', icon: Folder },
  { id: 'fields', label: 'Categories', icon: Settings },
  { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 }
];
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
    const logEntry = {
      time: timestamp,
      user: `${currentUser.name} (${currentUser.id})`,
      action: action,
      resource: resource,
      status: status
    };
    
    // Save to backend API
    try {
      await auditLogAPI.create({
        action: action,
        resource: resource,
        status: status
      });
    } catch (error) {
      console.error('Failed to save audit log to backend:', error);
    }
    
    // Also save to dataStore for backward compatibility
    if (dataStore) {
      dataStore.addAuditLog(logEntry);
    }
  };
 const handleAddField = async () => {
  if (!newField.fieldName.trim()) {
    setErrors({ fieldName: 'Field name is required' });
    return;
  }
  if (customFields.some(field => field.name === newField.fieldName)) {
    setErrors({ fieldName: 'Field name already exists' });
    return;
  }

  try {
    const tagData = {
      name: newField.fieldName,
      type: newField.fieldType,
      showInDocuments: newField.showInDocuments !== false
    };

    const createdTag = await tagAPI.create(tagData);
    
    // Add the created tag to the list
    const formattedTag = {
      id: createdTag.id,
      name: createdTag.name,
      type: createdTag.type,
      showInDocuments: createdTag.showInDocuments
    };
    
    setCustomFields([...customFields, formattedTag]);
    addAuditLog('Tag Created', `Tag "${newField.fieldName}" created`, 'Success');
    setShowAddFieldModal(false);
    setNewField({ fieldName: '', fieldType: 'text', showInDocuments: true });
    setErrors({});
  } catch (error) {
    console.error('Failed to create tag:', error);
    setErrors({ fieldName: error.message });
  }
};
const handleToggleFieldActive = async (fieldId) => {
  try {
    const field = customFields.find(f => f.id === fieldId);
    if (!field) return;

    const updatedTag = await tagAPI.update(fieldId, {
      showInDocuments: !field.showInDocuments
    });

    setCustomFields(customFields.map(f =>
      f.id === fieldId
        ? { ...f, showInDocuments: updatedTag.showInDocuments }
        : f
    ));
  } catch (error) {
    console.error('Failed to update tag:', error);
    alert(`Failed to update tag: ${error.message}`);
  }
};
  const handleDeleteField = async (fieldId) => {
    if (window.confirm('Are you sure you want to delete this tag? This will remove the tag from all documents.')) {
      try {
        await tagAPI.delete(fieldId);
        
        const field = customFields.find(f => f.id === fieldId);
        setCustomFields(customFields.filter(f => f.id !== fieldId));
        addAuditLog('Tag Deleted', `Tag "${field?.name}" deleted`, 'Success');
      } catch (error) {
        console.error('Failed to delete tag:', error);
        alert(`Failed to delete tag: ${error.message}`);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setErrors({ folderName: 'Folder name is required' });
      return;
    }
    if (folders.some(folder => folder.folder_name === newFolderName && folder.parent_folder === currentFolder)) {
      setErrors({ folderName: 'Folder name already exists in this location' });
      return;
    }
    
    try {
      const folderData = {
        folder_name: newFolderName,
        folder_color: newFolderColor
      };
      
      // If creating a subfolder, set parent_folder
      if (currentFolder) {
        folderData.parent_folder = currentFolder;
      }
      
      const newFolder = await folderAPI.create(folderData);
      
      setFolders([...folders, newFolder]);
      
      addAuditLog('Folder Created', `${newFolderName} - Color: ${newFolderColor}`, 'Success');
      
      setShowCreateFolderModal(false);
      setNewFolderName('');
      setNewFolderColor('blue');
      setErrors({});
    } catch (error) {
      console.error('Failed to create folder:', error);
      setErrors({ general: error.message });
    }
  };

 const handleDeleteFolder = async (folderId) => {
    // Get folder name
    const folder = folders.find(f => f.folder_id === folderId);
    if (!folder) {
      alert('Folder not found.');
      return;
    }

    if (!hasPrivilegedDeleteRole && !isFolderOwnedByCurrentUser(folder)) {
      alert('You can only delete folders that you own.');
      return;
    }

    const folderName = folder?.folder_name || 'Folder';
    
    // Get documents in this folder
    const documentsInFolder = userDocuments.filter(doc => doc.folder === folderId);
    
    let confirmMessage = `Are you sure you want to delete "${folderName}"?`;
    if (documentsInFolder.length > 0) {
      confirmMessage = `This folder contains ${documentsInFolder.length} document(s). Are you sure you want to delete "${folderName}"?`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        await folderAPI.delete(folderId);
        
        // Remove folder from state
        setFolders(folders.filter(f => f.folder_id !== folderId));
        
        // If we're currently viewing this folder, go back
        if (currentFolder === folderId) {
          setCurrentFolder(null);
        }

        try {
          const deleted = await folderAPI.getDeleted();
          setDeletedFolders(Array.isArray(deleted) ? deleted : []);
        } catch (refreshError) {
          console.error('Failed to refresh deleted folders:', refreshError);
        }
        
        addAuditLog('Folder Deleted', `${folderName}`, 'Success');
        alert('Folder moved to recycle bin successfully!');
      } catch (error) {
        console.error('Failed to delete folder:', error);
        alert(`Failed to delete folder: ${error.message}`);
      }
    }
  };

  const handleRenameFolder = async (folderId) => {
    const folder = folders.find(f => f.folder_id === folderId);
    if (folder) {
      setEditingFolderId(folderId);
      setEditFolderName(folder.folder_name);
      setEditFolderColor(folder.folder_color || 'blue');
      setShowEditFolderModal(true);
    }
  };

  const handleSaveFolder = async () => {
    if (!editFolderName.trim()) {
      setErrors({ folderName: 'Folder name is required' });
      return;
    }

    // Check for duplicate names at same level
    const folder = folders.find(f => f.folder_id === editingFolderId);
    if (folders.some(f => 
      f.folder_id !== editingFolderId && 
      f.folder_name === editFolderName && 
      f.parent_folder === folder?.parent_folder
    )) {
      setErrors({ folderName: 'A folder with this name already exists in this location' });
      return;
    }

    try {
      const updatedData = {
        folder_name: editFolderName,
        folder_color: editFolderColor
      };

      const updatedFolder = await folderAPI.update(editingFolderId, updatedData);
      
      // Update folders state
      setFolders(folders.map(f => f.folder_id === editingFolderId ? updatedFolder : f));
      
      addAuditLog('Folder Renamed', `${updatedFolder.folder_name} - Color: ${editFolderColor}`, 'Success');
      
      setShowEditFolderModal(false);
      setEditingFolderId(null);
      setEditFolderName('');
      setEditFolderColor('blue');
      setErrors({});
    } catch (error) {
      console.error('Failed to save folder:', error);
      setErrors({ general: error.message });
    }
  };

  const handleMoveToFolder = async (folderId) => {
    if (!documentToMove) return;
    
    try {
      // Convert folderId to string if it exists (folder_id is a CharField in backend)
      const folderIdToSave = folderId ? String(folderId) : null;
      
      // Update document in backend API
      await documentAPI.update(documentToMove, {
        folder: folderIdToSave
      });
      
      // Refresh documents from API
      const updatedDocs = await documentAPI.getAll();
      setUserDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
      
      // Also update in dataStore for backward compatibility
      if (dataStore) {
        dataStore.updateDocument(documentToMove, { folderId: folderId });
      }
      
      // Log the action
      const doc = userDocuments.find(d => String(d.doc_id || d.id) === String(documentToMove));
      const folderName = folders.find(f => String(f.folder_id) === String(folderId))?.folder_name || 'Root';
      addAuditLog(
        'Document Moved',
        `"${doc?.doc_name || doc?.title || documentToMove}" moved to folder "${folderName}"`,
        'Success'
      );
      
      setShowMoveToFolderModal(false);
      setDocumentToMove(null);
    } catch (error) {
      console.error('Failed to move document:', error);
      alert(`Failed to move document: ${error.message}`);
    }
  };

  const openMoveToFolderModal = (docId) => {
    setDocumentToMove(docId);
    setShowMoveToFolderModal(true);
  };

  const handleMoveDocumentByDrop = async (docId, targetFolderId) => {
    const normalizedDocId = Number.isNaN(Number(docId)) ? docId : Number(docId);
    const normalizedTargetFolderId = targetFolderId == null
      ? null
      : (Number.isNaN(Number(targetFolderId)) ? targetFolderId : Number(targetFolderId));

    const sourceDoc = (userDocuments || []).find(
      (doc) => String(doc.doc_id || doc.id) === String(normalizedDocId)
    );

    if (!sourceDoc) return;
    if (String(sourceDoc.folder ?? '') === String(normalizedTargetFolderId ?? '')) return;

    try {
      await documentAPI.update(normalizedDocId, {
        folder: normalizedTargetFolderId,
      });

      const [updatedDocs, updatedFolders] = await Promise.all([
        documentAPI.getAll(),
        folderAPI.getAll(),
      ]);
      setUserDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
      setFolders(Array.isArray(updatedFolders) ? updatedFolders : []);

      const targetFolderName = normalizedTargetFolderId == null
        ? 'root'
        : ((folders || []).find((folder) => String(folder.folder_id) === String(normalizedTargetFolderId))?.folder_name || 'selected folder');

      addAuditLog(
        'Move Document',
        `Moved document ${(sourceDoc.doc_name || normalizedDocId)} to ${targetFolderName}`,
        'Success'
      );
    } catch (error) {
      console.error('Failed to move document by drag and drop:', error);
      alert(`Failed to move document: ${error.message}`);
    }
  };

  const handleMoveFolderByDrop = async (folderId, targetParentFolderId) => {
    const normalizedFolderId = Number.isNaN(Number(folderId)) ? folderId : Number(folderId);
    const normalizedTargetParentFolderId = targetParentFolderId == null
      ? null
      : (Number.isNaN(Number(targetParentFolderId)) ? targetParentFolderId : Number(targetParentFolderId));

    const sourceFolder = (folders || []).find(
      (folder) => String(folder.folder_id) === String(normalizedFolderId)
    );

    if (!sourceFolder) return;
    if (String(sourceFolder.parent_folder ?? '') === String(normalizedTargetParentFolderId ?? '')) return;

    try {
      await folderAPI.update(normalizedFolderId, {
        parent_folder: normalizedTargetParentFolderId,
      });

      const [updatedDocs, updatedFolders] = await Promise.all([
        documentAPI.getAll(),
        folderAPI.getAll(),
      ]);
      setUserDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
      setFolders(Array.isArray(updatedFolders) ? updatedFolders : []);

      const targetFolderName = normalizedTargetParentFolderId == null
        ? 'root'
        : ((folders || []).find((folder) => String(folder.folder_id) === String(normalizedTargetParentFolderId))?.folder_name || 'selected folder');

      addAuditLog(
        'Move Folder',
        `Moved folder ${(sourceFolder.folder_name || normalizedFolderId)} to ${targetFolderName}`,
        'Success'
      );
    } catch (error) {
      console.error('Failed to move folder by drag and drop:', error);
      alert(`Failed to move folder: ${error.message}`);
    }
  };

  const handleSavePersonalInfo = () => {
    if (!personalInfo.fullName.trim() || !personalInfo.email.trim()) {
      setErrors({ personalInfo: 'Full Name and Email are required' });
      return;
    }
    setShowPersonalInfoForm(false);
    setShowSaveOptionsModal(true);
    setErrors({});
  };

  const generateDocumentContent = (title, personalInfo, customFields) => {
    return `
OFFICIAL DOCUMENT

${title}

This document contains the official records and information as submitted and verified by the Record Keeping Management System.

PERSONAL INFORMATION
────────────────────────────────────────────────────────────

Full Name: ${personalInfo.fullName || 'N/A'}
Date of Birth: ${personalInfo.dateOfBirth || 'N/A'}
Gender: ${personalInfo.gender || 'N/A'}
Occupation: ${personalInfo.occupation || 'N/A'}

CONTACT INFORMATION
────────────────────────────────────────────────────────────

Email: ${personalInfo.email || 'N/A'}
Phone: ${personalInfo.phoneNumber || 'N/A'}
Address: ${personalInfo.address || 'N/A'}
City: ${personalInfo.city || 'N/A'}
State: ${personalInfo.state || 'N/A'}
ZIP Code: ${personalInfo.zipCode || 'N/A'}

${personalInfo.emergencyContact ? `EMERGENCY CONTACT
────────────────────────────────────────────────────────────

Contact Name: ${personalInfo.emergencyContact}
Contact Phone: ${personalInfo.emergencyPhone || 'N/A'}

` : ''}${Object.keys(customFields).length > 0 ? `ADDITIONAL INFORMATION
────────────────────────────────────────────────────────────

${Object.entries(customFields).map(([key, value]) => `${key}: ${value || 'N/A'}`).join('\n')}

` : ''}
DOCUMENT CERTIFICATION
────────────────────────────────────────────────────────────

This document has been generated and stored in the Record Keeping Management System.

I hereby certify that the information provided in this document is true and accurate to the best of my knowledge.

Signature: _________________________

Date: _____________________________


────────────────────────────────────────────────────────────
Record Keeping Management System
Generated: ${new Date().toLocaleString()}
Document ID: ${Date.now()}
────────────────────────────────────────────────────────────
    `;
  };
  const handleFinalSave = async (format) => {
    const content = generateDocumentContent(currentDocumentData.title, personalInfo, currentDocumentData.customFieldValues);
    
    const docData = {
      title: currentDocumentData.title,
      description: currentDocumentData.description,
      format: format,
      folder_id: currentFolder,
      content: content,
      personal_info: personalInfo,
      custom_field_values: currentDocumentData.customFieldValues
    };
    
    try {
      const createdDoc = await documentAPI.create(docData);
      
      // Refresh documents list
      const allDocs = await documentAPI.getAll();
      setUserDocuments(Array.isArray(allDocs) ? allDocs : []);
      
      // Also update dataStore
      if (dataStore) {
        const doc = {
          id: createdDoc.id,
          title: createdDoc.title,
          description: createdDoc.description,
          customFieldValues: currentDocumentData.customFieldValues,
          personalInfo: personalInfo,
          format: format,
          folderId: currentFolder,
          content: content,
          createdAt: createdDoc.createdAt || new Date().toLocaleString(),
          createdBy: currentUser.id
        };
        dataStore.addDocument(doc);
        addAuditLog(
          'Document Created',
          `${doc.title} (${format.toUpperCase()}) - ID: ${doc.id}`,
          'Success'
        );
      }
      
      setShowSaveOptionsModal(false);
      setPersonalInfo({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        occupation: '',
        emergencyContact: '',
        emergencyPhone: ''
      });
      setCurrentDocumentData(null);
      setErrors({});
      alert(`Document saved as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert(`Failed to save document: ${error.message}`);
    }
  };

  
  const handleDeleteDocument = async (docId) => {
    const docToDelete = userDocuments.find(doc => String(doc.id || doc.doc_id) === String(docId));
    if (!docToDelete) {
      alert('Document not found.');
      return;
    }

    if (!hasPrivilegedDeleteRole && !isDocumentOwnedByCurrentUser(docToDelete)) {
      alert('You can only delete documents that you own.');
      return;
    }

  if (window.confirm('Move this document to Recycle Bin?')) {
    try {
      // Soft delete via API (sets is_deleted = true)
      await documentAPI.delete(docId);
      
      // Refresh documents list
      const allDocs = await documentAPI.getAll();
      setUserDocuments(Array.isArray(allDocs) ? allDocs : []);
      
      // Also update dataStore
      if (dataStore) {
        dataStore.moveToRecycleBin(docToDelete);
        addAuditLog(
          'Document Moved to Recycle Bin',
          `${docToDelete.title} - ID: ${docId}`,
          'Success'
        );
      }

      // Refresh deleted documents from API
      try {
        const deletedDocs = await documentAPI.getDeleted();
        setDeletedDocuments(deletedDocs);
      } catch (error) {
        console.error('Failed to refresh deleted documents:', error);
      }
      
      alert('Document moved to recycle bin!');
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(`Failed to delete document: ${error.message}`);
    }
  }
};
const handleRestoreDocument = async (docId) => {
  try {
    const doc = deletedDocuments.find(d => String(d.id || d.doc_id) === String(docId));
    if (!doc) {
      alert('Document not found');
      return;
    }

    const targetId = doc.doc_id || doc.id || docId;
    await documentAPI.restore(targetId);
    
    if (dataStore) {
      dataStore.restoreFromRecycleBin(targetId);
      addAuditLog('Document Restored', `${doc.title || doc.doc_name} - ID: ${targetId}`, 'Success');
    }

    // Refresh deleted documents list
    try {
      const updatedDeleted = await documentAPI.getDeleted();
      setDeletedDocuments(updatedDeleted);
    } catch (error) {
      console.error('Failed to refresh deleted documents:', error);
    }

    // Refresh user documents list
    try {
      const allDocs = await documentAPI.getAll();
      setUserDocuments(Array.isArray(allDocs) ? allDocs : []);
    } catch (error) {
      console.error('Failed to refresh user documents:', error);
    }

    alert('Document restored successfully!');
  } catch (error) {
    console.error('Failed to restore document:', error);
    alert(`Failed to restore document: ${error.message}`);
  }
};

const handlePermanentDelete = async (docId) => {
  if (!window.confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
    return;
  }

  try {
    const doc = deletedDocuments.find(d => String(d.id || d.doc_id) === String(docId));
    if (!doc) {
      alert('Document not found');
      return;
    }

    const targetId = doc.doc_id || doc.id || docId;
    await documentAPI.permanentDelete(targetId);

    if (dataStore) {
      dataStore.permanentlyDelete(targetId);
      addAuditLog('Document Permanently Deleted', `${doc.title || doc.doc_name} - ID: ${targetId}`, 'Success');
    }

    // Refresh deleted documents list
    try {
      const updatedDeleted = await documentAPI.getDeleted();
      setDeletedDocuments(updatedDeleted);
    } catch (error) {
      console.error('Failed to refresh deleted documents:', error);
    }

    alert('Document permanently deleted!');
  } catch (error) {
    console.error('Failed to permanently delete document:', error);
    alert(`Failed to permanently delete document: ${error.message}`);
  }
};
const handleEmptyRecycleBin = async () => {
  const count = deletedDocuments.length;
  if (!window.confirm(`Are you sure you want to permanently delete ALL ${count} documents? This action cannot be undone.`)) {
    return;
  }

  try {
    await documentAPI.emptyTrash();

    if (dataStore) {
      dataStore.emptyRecycleBin(currentUser.id);
      addAuditLog('Recycle Bin Emptied', `${count} documents permanently deleted`, 'Success');
    }

    // Clear deleted documents list
    setDeletedDocuments([]);

    alert('Recycle bin emptied!');
  } catch (error) {
    console.error('Failed to empty recycle bin:', error);
    alert(`Failed to empty recycle bin: ${error.message}`);
  }
};

const handleRestoreAllRecycleBin = async () => {
  const docsToRestore = deletedDocuments;

  if (!docsToRestore.length) return;

  try {
    await Promise.all(
      docsToRestore.map((doc) => documentAPI.restore(doc.doc_id || doc.id))
    );

    const [updatedDeleted, allDocs] = await Promise.all([
      documentAPI.getDeleted(),
      documentAPI.getAll(),
    ]);
    setDeletedDocuments(updatedDeleted);
    setUserDocuments(Array.isArray(allDocs) ? allDocs : []);
    alert('All eligible deleted documents were restored successfully.');
  } catch (error) {
    console.error('Failed to restore all documents:', error);
    alert(`Failed to restore all documents: ${error.message}`);
  }
};

const handleRestoreFolder = async (folderId) => {
  try {
    await folderAPI.restore(folderId);
    const [updatedFolders, updatedDeletedFolders] = await Promise.all([
      folderAPI.getAll(),
      folderAPI.getDeleted(),
    ]);
    setFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
    setDeletedFolders(Array.isArray(updatedDeletedFolders) ? updatedDeletedFolders : []);
    alert('Folder restored successfully.');
  } catch (error) {
    console.error('Failed to restore folder:', error);
    alert(`Failed to restore folder: ${error.message}`);
  }
};

const handlePermanentDeleteFolder = async (folderId) => {
  try {
    await folderAPI.permanentDelete(folderId);
    const [updatedFolders, updatedDeletedFolders] = await Promise.all([
      folderAPI.getAll(),
      folderAPI.getDeleted(),
    ]);
    setFolders(Array.isArray(updatedFolders) ? updatedFolders : []);
    setDeletedFolders(Array.isArray(updatedDeletedFolders) ? updatedDeletedFolders : []);
    alert('Folder permanently deleted successfully.');
  } catch (error) {
    console.error('Failed to permanently delete folder:', error);
    alert(`Failed to permanently delete folder: ${error.message}`);
  }
};

  const handleOpenDocument = async (doc) => {
    if (!doc) return;

    if (doc.can_open === false) {
      alert('You can see this file in the list, but you are not allowed to open it.');
      return;
    }

    // Check if document already has content loaded
    if (doc.fileData || doc.content || doc.ocrContent) {
      setViewingDocument(doc);
      setShowDocumentViewer(true);
      return;
    }

    // If document has a file URL, try to load the content
    if (doc.doc_file_url || doc.doc_file) {
      try {
        const fileUrl = doc.doc_file_url || doc.doc_file;
        const fileName = doc.doc_name || 'document';
        const fileExtension = fileName.toLowerCase().split('.').pop();

        // For PDFs, fetch as blob to create a usable data URL for iframe
        if (fileExtension === 'pdf') {
          try {
            const response = await fetch(fileUrl, { 
              method: 'GET',
              headers: { 'Authorization': `Bearer ${getAccessToken()}` }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            setViewingDocument({
              ...doc,
              fileData: blobUrl,
              format: 'pdf',
              doc_name: doc.doc_name || doc.title,
              title: doc.doc_name || doc.title,
              isBlobUrl: true
            });
            setShowDocumentViewer(true);
          } catch (pdfError) {
            console.error('PDF fetch error:', pdfError);
            alert('Failed to load PDF: ' + pdfError.message);
          }
        }
        // For images, fetch as blob
        else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
          try {
            const response = await fetch(fileUrl, { 
              method: 'GET',
              headers: { 'Authorization': `Bearer ${getAccessToken()}` }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            setViewingDocument({
              ...doc,
              fileData: blobUrl,
              format: 'image',
              doc_name: doc.doc_name || doc.title,
              title: doc.doc_name || doc.title,
              isBlobUrl: true
            });
            setShowDocumentViewer(true);
          } catch (imgError) {
            console.error('Image fetch error:', imgError);
            alert('Failed to load image: ' + imgError.message);
          }
        }
        // For text files, fetch and display content
        else if (['txt', 'docx', 'doc'].includes(fileExtension)) {
          try {
            const response = await fetch(fileUrl, { 
              method: 'GET',
              headers: { 'Authorization': `Bearer ${getAccessToken()}` }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }

            if (fileExtension === 'txt') {
              const textContent = await response.text();
              setViewingDocument({
                ...doc,
                content: textContent,
                format: 'text',
                doc_name: doc.doc_name || doc.title,
                title: doc.doc_name || doc.title
              });
            } else if (fileExtension === 'docx' || fileExtension === 'doc') {
              // For docx files, try to extract text using mammoth
              const arrayBuffer = await response.arrayBuffer();
              try {
                const result = await mammoth.extractText({ arrayBuffer });
                setViewingDocument({
                  ...doc,
                  content: result.value,
                  format: 'docx',
                  doc_name: doc.doc_name || doc.title,
                  title: doc.doc_name || doc.title
                });
              } catch (mammothError) {
                console.error('Error parsing docx:', mammothError);
                // Fall back to showing download option
                setViewingDocument({
                  ...doc,
                  fileData: fileUrl,
                  format: 'docx',
                  doc_name: doc.doc_name || doc.title,
                  title: doc.doc_name || doc.title
                });
              }
            }
            setShowDocumentViewer(true);
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            // If fetch fails, still show the document with download option
            setViewingDocument({
              ...doc,
              fileData: fileUrl,
              format: fileExtension,
              doc_name: doc.doc_name || doc.title,
              title: doc.doc_name || doc.title,
              fetchError: 'Preview not available, but you can download the file'
            });
            setShowDocumentViewer(true);
          }
        } 
        // For other files, show the download option
        else {
          setViewingDocument({
            ...doc,
            fileData: fileUrl,
            format: fileExtension,
            doc_name: doc.doc_name || doc.title,
            title: doc.doc_name || doc.title
          });
          setShowDocumentViewer(true);
        }
      } catch (error) {
        console.error('Error loading document:', error);
        alert('Failed to load document. Please try again.');
      }
    } else {
      // No file available, show empty document
      setViewingDocument({
        ...doc,
        doc_name: doc.doc_name || doc.title,
        title: doc.doc_name || doc.title
      });
      setShowDocumentViewer(true);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      if (doc.can_open === false) {
        alert('Download is restricted by ownership policy for this shared file.');
        return;
      }

      const docId = doc.doc_id || doc.id;
      if (docId) {
        const { blob, filename } = await documentAPI.downloadFile(docId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || doc.doc_name || doc.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      if (doc.fileData && (doc.format === 'pdf' || ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'docx', 'doc'].includes(doc.format))) {
        // For binary files directly from URL
        const link = document.createElement('a');
        link.href = doc.fileData;
        link.download = doc.doc_name || doc.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (doc.content || doc.ocrContent) {
        // For text content
        const content = doc.content || doc.ocrContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(doc.doc_name || doc.title || 'document').replace(/[^a-z0-9]/gi, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('No content available to download');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const handleDownloadFolder = async (folder) => {
    try {
      const folderId = folder?.folder_id || folder?.id;
      if (!folderId) {
        alert('Folder ID not found.');
        return;
      }

      const { blob, filename } = await folderAPI.downloadZip(folderId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${folder.folder_name || 'folder'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download folder ZIP:', error);
      alert(`Failed to download folder: ${error.message}`);
    }
  };

  const handlePrintDocument = (doc) => {
    try {
      if (doc.can_open === false) {
        alert('Print is restricted by ownership policy for this shared file.');
        return;
      }

      if (doc.fileData && (doc.format === 'pdf' || ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(doc.format))) {
        // For PDFs and images, open in new tab for printing
        window.open(doc.fileData, '_blank');
      } else if (doc.content || doc.ocrContent) {
        // For text content, create a new tab with formatted content
        const content = doc.content || doc.ocrContent;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${doc.doc_name || doc.title || 'Document'}</title>
                <style>
                  body { font-family: Georgia, serif; padding: 40px; line-height: 1.6; color: #333; }
                  pre { white-space: pre-wrap; word-wrap: break-word; }
                  h1 { text-align: center; color: #000; margin-bottom: 30px; }
                </style>
              </head>
              <body>
                <h1>${doc.doc_name || doc.title || 'Document'}</h1>
                <pre>${content}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        alert('No content available to print');
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print document');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setOcrText('');
    }
  };

  const handleProcessOCR = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }
    setIsProcessingOCR(true);
    try {
      const result = await ocrAPI.extractText(uploadedFile, {
        engine: 'tesseract',
        mode: ocrMode,
        lang: 'eng',
      });
      setOcrText(result.text || '');
      if (!result.text) {
        alert('OCR completed but no readable text was found in the file.');
      }
    } catch (error) {
      console.error('Failed to process OCR:', error);
      alert(`OCR failed: ${error.message}`);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  
  const handleUseOCRText = () => {
    if (!ocrText) {
      alert('Please process OCR first');
      return;
    }

    const sourceName = uploadedFile?.name || 'ocr-result';
    const baseName = sourceName.replace(/\.[^/.]+$/, '');
    const outputName = `${baseName}-ocr.txt`;

    const textBlob = new Blob([ocrText], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(textBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    addAuditLog(
      'OCR Text Extracted',
      `Extracted OCR text file from ${sourceName}`,
      'Success'
    );
    
    setShowOCRModal(false);
    setUploadedFile(null);
    setOcrText('');
    alert(`Extracted text saved as ${outputName}`);
  };

  const handleDocumentFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedDocFiles(files);
      setUploadFileNames(files.map((file) => file.name));
      setCurrentPreviewIndex(0);
      
      const previews = [];
      let processedCount = 0;
      
      files.forEach((file, index) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        const reader = new FileReader();
        
        if (fileType.startsWith('image/')) {
          reader.onload = (e) => {
            previews[index] = {
              type: 'image',
              url: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsDataURL(file);
        } else if (fileType === 'application/pdf') {
          reader.onload = (e) => {
            previews[index] = {
              type: 'pdf',
              url: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsDataURL(file);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target.result;
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              previews[index] = {
                type: 'docx',
                content: result.value,
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(2) + ' KB'
              };
            } catch (error) {
              console.error('Error converting DOCX:', error);
              previews[index] = {
                type: 'other',
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(2) + ' KB',
                fileType: 'DOCX (Preview failed)'
              };
            }
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsArrayBuffer(file);
        } else if (fileType.includes('text/') || fileName.endsWith('.txt')) {
          reader.onload = (e) => {
            previews[index] = {
              type: 'text',
              content: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsText(file);
        } else {
          previews[index] = {
            type: 'other',
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(2) + ' KB',
            fileType: fileType || 'Unknown'
          };
          processedCount++;
          if (processedCount === files.length) {
            setUploadPreviews([...previews]);
          }
        }
      });
    }
  };

  const removeFileFromUpload = (index) => {
    const newFiles = uploadedDocFiles.filter((_, i) => i !== index);
    const newPreviews = uploadPreviews.filter((_, i) => i !== index);
    const newNames = uploadFileNames.filter((_, i) => i !== index);
    setUploadedDocFiles(newFiles);
    setUploadPreviews(newPreviews);
    setUploadFileNames(newNames);
    
    if (currentPreviewIndex >= newFiles.length && newFiles.length > 0) {
      setCurrentPreviewIndex(newFiles.length - 1);
    } else if (newFiles.length === 0) {
      setCurrentPreviewIndex(0);
    }
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

  const normalizeTextForMatching = (value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const toInitials = (value) => {
    const words = normalizeTextForMatching(value).split(' ').filter(Boolean);
    if (words.length < 2) return '';
    return words.map((word) => word[0]).join('');
  };

  const findMatchedFolderForCategoryName = (categoryName, folderList = []) => {
    const normalizedCategory = normalizeTextForMatching(categoryName);
    if (!normalizedCategory) return null;

    const exact = (folderList || []).find((folder) => normalizeTextForMatching(folder?.folder_name) === normalizedCategory);
    if (exact) return exact;

    const partial = (folderList || []).find((folder) => {
      const folderName = normalizeTextForMatching(folder?.folder_name);
      return folderName && (folderName.includes(normalizedCategory) || normalizedCategory.includes(folderName));
    });

    return partial || null;
  };

  const findMatchedFolderFromText = (fileName, extractedText, folderList = []) => {
    const combined = normalizeTextForMatching(`${fileName || ''} ${extractedText || ''}`);
    if (!combined) return { folder: null, confidence: 0 };

    let bestFolder = null;
    let bestScore = 0;
    let bestPercent = 0;

    (folderList || []).forEach((folder) => {
      const folderName = normalizeTextForMatching(folder?.folder_name || '');
      if (!folderName) return;

      let score = 0;
      if (combined.includes(folderName)) {
        score += folderName.length + 8;
      }

      folderName.split(' ').forEach((word) => {
        if (word.length >= 3 && combined.includes(word)) {
          score += word.length;
        }
      });

      const maxScore =
        (folderName ? folderName.length + 8 : 0) +
        folderName.split(' ').reduce((sum, word) => (word.length >= 3 ? sum + word.length : sum), 0);
      const percent = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;

      if (score > bestScore) {
        bestScore = score;
        bestPercent = percent;
        bestFolder = folder;
      }
    });

    return {
      folder: bestScore > 0 ? bestFolder : null,
      confidence: bestScore > 0 ? bestPercent : 0,
    };
  };

  const pickBestCategoryFromDetectedText = (fileName, extractedText, categories = []) => {
    const combined = normalizeTextForMatching(`${String(fileName || '')} ${String(extractedText || '')}`);
    if (!combined || !Array.isArray(categories) || categories.length === 0) {
      return { category: null, confidence: 0 };
    }

    let bestMatch = null;
    let bestScore = 0;
    let bestPercent = 0;

    categories.forEach((category) => {
      const categoryName = normalizeTextForMatching(category?.category_name || '');
      const categoryDesc = normalizeTextForMatching(category?.category_desc || '');
      if (!categoryName && !categoryDesc) return;

      const categoryText = `${categoryName} ${categoryDesc}`.trim();
      if (!categoryText) return;

      let score = 0;
      if (categoryName && combined.includes(categoryName)) score += categoryName.length + 5;
      if (categoryDesc && combined.includes(categoryDesc)) score += categoryDesc.length + 3;

      const nameInitials = toInitials(categoryName);
      if (nameInitials && combined.includes(nameInitials)) {
        score += nameInitials.length + 2;
      }

      const descInitials = toInitials(categoryDesc);
      if (descInitials && combined.includes(descInitials)) {
        score += descInitials.length + 1;
      }

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

  const runDetectionForUploads = async () => {
    if (!autoCategorizeUploads || uploadedDocFiles.length === 0) return;

    setIsDetectingUploads(true);
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
            console.error('Detection OCR failed for file:', file.name, error);
            return '';
          }
        }

        if (lowerName.endsWith('.docx')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result?.value || '';
          } catch (error) {
            console.error('DOCX detection text extraction failed:', file.name, error);
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
            console.error('Excel detection text extraction failed:', file.name, error);
            return '';
          }
        }

        if (lowerName.endsWith('.txt')) {
          try {
            return await file.text();
          } catch (error) {
            console.error('TXT detection text extraction failed:', file.name, error);
            return '';
          }
        }

        return '';
      };

      const detected = await Promise.all(
        uploadedDocFiles.map(async (file, index) => {
          const isOcrFile = ocrFileRegex.test(file.name || '');
          const extractedText = await extractDetectionTextFromFile(file, isOcrFile);

          const predicted = pickBestCategoryFromDetectedText(file.name, extractedText, userCategories);
          const predictedCategory = predicted.category;
          const matchedFolderByCategory = findMatchedFolderForCategoryName(predictedCategory?.category_name || '', folders);
          const folderNameMatch = findMatchedFolderFromText(file.name, extractedText, folders);
          const matchedFolderByName = matchedFolderByCategory ? null : folderNameMatch.folder;
          const matchedFolder = matchedFolderByCategory || matchedFolderByName;
          const matchReason = matchedFolderByCategory
            ? 'category'
            : matchedFolderByName
              ? 'folder-name'
              : '';
          const matchConfidence = matchedFolderByCategory
            ? (predicted.confidence || 0)
            : (matchedFolderByName ? (folderNameMatch.confidence || 0) : 0);

          return {
            fileName: file.name,
            finalName: buildSuggestedUploadNameFromCategory(file.name, predictedCategory?.category_name || 'category'),
            extractedText,
            isOcrFile,
            predictedCategoryName: predictedCategory?.category_name || '',
            predictedMatchPercent: predicted.confidence || 0,
            matchedFolderId: matchedFolder?.folder_id || null,
            matchedFolderName: matchedFolder?.folder_name || '',
            routeToMatchedFolder: Boolean(matchedFolder?.folder_id),
            matchReason,
            matchConfidence,
          };
        })
      );

      setDetectedUploadItems(detected);
      setShowCategoryMatchConfirmModal(true);
    } finally {
      setIsDetectingUploads(false);
    }
  };

  const performUploadDocument = async (namesOverride = null, folderTargetsOverride = null) => {
    if (!uploadedDocFiles || uploadedDocFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    
    try {
      const uploadPromises = uploadedDocFiles.map(async (file, index) => {
        try {
          const resolvedDocName = ((namesOverride || uploadFileNames)[index] || file.name || '').trim() || file.name;
          const resolvedFolderId = Array.isArray(folderTargetsOverride)
            ? (folderTargetsOverride[index] ?? currentFolder ?? null)
            : currentFolder;

          // Upload file using multipart form data
          const uploadedDoc = await documentAPI.uploadFiles(
            [file],
            resolvedDocName,
            'Uploaded document',
            resolvedFolderId,
            undefined,
            { autoCategorize: autoCategorizeUploads }
          );

          // Audit log
          addAuditLog(
            'Document Uploaded',
            `${resolvedDocName} (${(file.size / 1024).toFixed(2)} KB)`,
            'Success'
          );
          
          return uploadedDoc;
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          throw error;
        }
      });
      
      const uploadedDocs = await Promise.all(uploadPromises);
      
      // Refresh documents list from backend
      const allDocs = await documentAPI.getAll();
      setUserDocuments(allDocs);
      
      // Load updated folders to get correct doc counts
      const allFolders = await folderAPI.getAll();
      setFolders(allFolders);
      
      setShowUploadDocumentModal(false);
      setShowCategoryMatchConfirmModal(false);
      setShowRenameDetectedModal(false);
      setUploadedDocFiles([]);
      setUploadPreviews([]);
      setUploadFileNames([]);
      setDetectedUploadItems([]);
      setCurrentPreviewIndex(0);
      setUploadTagValues({});
      setAutoCategorizeUploads(false);
      alert(`${uploadedDocs.length} document${uploadedDocs.length > 1 ? 's' : ''} uploaded successfully!`);
    } catch (error) {
      console.error('Failed to upload documents:', error);
      alert(`Failed to upload documents: ${error.message}`);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadedDocFiles || uploadedDocFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }

    if (autoCategorizeUploads) {
      await runDetectionForUploads();
      return;
    }

    await performUploadDocument();
  };

  const handleChangeDetectedUploadName = (index, newBaseName) => {
    const file = uploadedDocFiles[index];
    if (!file) return;

    const { extension } = splitNameAndExtension(file.name);
    const safeBase = String(newBaseName || '').trim();
    const nextName = safeBase ? `${safeBase}${extension}` : file.name;

    setDetectedUploadItems((prev) => prev.map((item, i) => (i === index ? { ...item, finalName: nextName } : item)));
  };

  const handleConfirmDetectedUpload = async () => {
    setIsSubmittingDetectedUpload(true);
    try {
      const confirmedNames = detectedUploadItems.map((item, index) => item.finalName || uploadedDocFiles[index]?.name || 'file');
      const folderTargets = detectedUploadItems.map((item) => {
        if (item.routeToMatchedFolder && item.matchedFolderId) {
          return item.matchedFolderId;
        }
        return currentFolder;
      });
      setUploadFileNames(confirmedNames);
      await performUploadDocument(confirmedNames, folderTargets);
    } finally {
      setIsSubmittingDetectedUpload(false);
    }
  };

  const handleProceedFromCategoryConfirm = () => {
    setShowCategoryMatchConfirmModal(false);
    setShowRenameDetectedModal(true);
  };

  const currentUserIdForFilter = String(loggedInUser?.user_id || loggedInUser?.id || currentUser?.user_id || currentUser?.id || '').trim();
  const currentUserIndexForFilter = String(loggedInUser?.full_data?.user_index || loggedInUser?.user_index || currentUser?.user_index || '').trim();

  const getItemCreatorInfo = (item) => {
    const ownerUser = item?.uploaded_by_user || item?.created_by_user || item?.user_index || null;
    if (!ownerUser || typeof ownerUser !== 'object') {
      return {
        key: '',
        userId: '',
        userIndex: '',
        label: 'Unknown',
      };
    }

    const userId = String(ownerUser.user_id || ownerUser.id || '').trim();
    const userIndex = String(ownerUser.user_index || '').trim();
    const key = userId || (userIndex ? `idx:${userIndex}` : '');
    const middleInitial = ownerUser.middle_name ? `${String(ownerUser.middle_name).trim().charAt(0)}.` : '';
    const fullName = [ownerUser.first_name, middleInitial, ownerUser.last_name, ownerUser.suffix]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      key,
      userId,
      userIndex,
      label: fullName || userId || (userIndex ? `User ${userIndex}` : 'Unknown'),
    };
  };

  const isCurrentUserCreator = (creatorInfo) => {
    if (!creatorInfo) return false;
    const sameUserId = creatorInfo.userId && currentUserIdForFilter && String(creatorInfo.userId) === String(currentUserIdForFilter);
    const sameUserIndex = creatorInfo.userIndex && currentUserIndexForFilter && String(creatorInfo.userIndex) === String(currentUserIndexForFilter);
    return Boolean(sameUserId || sameUserIndex);
  };

  const ownerFilterOptions = (() => {
    const creatorMap = new Map();

    (userDocuments || []).forEach((doc) => {
      const creator = getItemCreatorInfo(doc);
      if (!creator.key) return;
      creatorMap.set(creator.key, creator.label);
    });

    (folders || []).forEach((folder) => {
      const creator = getItemCreatorInfo(folder);
      if (!creator.key) return;
      creatorMap.set(creator.key, creator.label);
    });

    const dynamicOptions = Array.from(creatorMap.entries())
      .filter(([value]) => {
        const matchByUserId = value === currentUserIdForFilter;
        const matchByUserIndex = currentUserIndexForFilter && value === `idx:${currentUserIndexForFilter}`;
        return !(matchByUserId || matchByUserIndex);
      })
      .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
      .map(([value, label]) => ({ value, label }));

    return [
      { value: 'all', label: 'All creators' },
      { value: 'me', label: 'Created by me' },
      ...dynamicOptions,
    ];
  })();

  const matchesOwnerFilter = (item) => {
    if (ownerFilter === 'all') return true;
    const creator = getItemCreatorInfo(item);
    if (ownerFilter === 'me') return isCurrentUserCreator(creator);
    return String(creator.key) === String(ownerFilter);
  };

  const getItemOrganizationInfo = (item) => {
    const orgId = String(item?.owning_org || item?.org || '').trim();
    const orgName = String(item?.owning_org_name || item?.org_name || '').trim();
    return {
      id: orgId,
      name: orgName || (orgId ? `Organization ${orgId}` : 'Unknown Organization'),
    };
  };

  const organizationFilterOptions = (() => {
    const orgMap = new Map();

    const walkOrgNodes = (nodes = []) => {
      nodes.forEach((node) => {
        const orgId = String(node?.org_id || node?.id || '').trim();
        const orgName = String(node?.org_name || node?.name || '').trim();
        if (orgId) {
          orgMap.set(orgId, orgName || `Organization ${orgId}`);
        }

        const children = node?.sub_offices || node?.children || [];
        if (Array.isArray(children) && children.length > 0) {
          walkOrgNodes(children);
        }
      });
    };

    walkOrgNodes(Array.isArray(orgTree) ? orgTree : []);

    (userDocuments || []).forEach((doc) => {
      const org = getItemOrganizationInfo(doc);
      if (!org.id) return;
      orgMap.set(org.id, org.name);
    });

    (folders || []).forEach((folder) => {
      const org = getItemOrganizationInfo(folder);
      if (!org.id) return;
      orgMap.set(org.id, org.name);
    });

    return Array.from(orgMap.entries())
      .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
      .map(([value, label]) => ({ value, label }));
  })();

  const matchesOrganizationFilter = (item) => {
    if (!organizationFilters.length) return true;
    const org = getItemOrganizationInfo(item);
    return organizationFilters.includes(String(org.id));
  };

  const getDocumentFolderId = (doc) => {
    return doc?.folder ?? doc?.folderId ?? null;
  };

  const getDocumentName = (doc) => {
    return String(doc?.doc_name || doc?.title || '').trim();
  };

  const getDocumentDescription = (doc) => {
    return String(doc?.doc_desc || doc?.description || '').trim();
  };

  const getDocumentCreatedAt = (doc) => {
    return doc?.doc_uploaded || doc?.createdAt || doc?.created_at || null;
  };

  const getDocumentFormat = (doc) => {
    if (doc?.format) return String(doc.format).toLowerCase();
    const fileName = getDocumentName(doc).toLowerCase();
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'docx';
    if (fileName.includes('ocr')) return 'ocr';
    return 'other';
  };

  const getFilteredAndSortedDocuments = () => {
    let filtered = [...userDocuments].filter((doc) => matchesOwnerFilter(doc) && matchesOrganizationFilter(doc));

    if (currentFolder) {
      filtered = filtered.filter((doc) => String(getDocumentFolderId(doc)) === String(currentFolder));
    } else if (activeSection === 'documents') {
      filtered = filtered.filter((doc) => !getDocumentFolderId(doc));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        getDocumentName(doc).toLowerCase().includes(query) ||
        getDocumentDescription(doc).toLowerCase().includes(query) ||
        doc.personalInfo?.fullName?.toLowerCase().includes(query) ||
        doc.personalInfo?.email?.toLowerCase().includes(query)
      );
    }

    if (Object.keys(filterByTag).length > 0) {
      filtered = filtered.filter(doc => {
        return Object.entries(filterByTag).every(([tagName, tagValue]) => {
          if (!tagValue) return true;
          const docTagValue = doc.customFieldValues?.[tagName];
          return String(docTagValue).toLowerCase() === String(tagValue).toLowerCase();
        });
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(getDocumentCreatedAt(b) || 0) - new Date(getDocumentCreatedAt(a) || 0);
        case 'date-asc':
          return new Date(getDocumentCreatedAt(a) || 0) - new Date(getDocumentCreatedAt(b) || 0);
        case 'title-asc':
          return getDocumentName(a).localeCompare(getDocumentName(b));
        case 'title-desc':
          return getDocumentName(b).localeCompare(getDocumentName(a));
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredDocuments = getFilteredAndSortedDocuments();
  const ownerFilteredDocuments = (userDocuments || []).filter((doc) => matchesOwnerFilter(doc) && matchesOrganizationFilter(doc));
  const ownerFilteredFolders = (folders || []).filter((folder) => matchesOwnerFilter(folder) && matchesOrganizationFilter(folder));

  useEffect(() => {
    if (!currentFolder) return;
    const stillVisible = ownerFilteredFolders.some((folder) => String(folder.folder_id) === String(currentFolder));
    if (!stillVisible) {
      setCurrentFolder(null);
    }
  }, [currentFolder, ownerFilteredFolders]);

  const getFolderDocumentCount = (folderId) => {
    return ownerFilteredDocuments.filter((doc) => String(getDocumentFolderId(doc)) === String(folderId)).length;
  };

  const isDocumentOwnedByCurrentUser = (doc) => {
    if (!doc) return false;
    const currentUserIndex = String(loggedInUser?.full_data?.user_index || loggedInUser?.user_index || currentUser?.user_index || '').trim();
    const currentOrgId = String(loggedInUser?.full_data?.org || loggedInUser?.org || currentUser?.org || '').trim();
    const ownerRef = doc.uploaded_by_user || doc.user_index || null;
    const ownerIndex = String(ownerRef?.user_index || doc.uploaded_by_user_id || doc.user_index_id || '').trim();
    const owningOrgId = String(doc?.owning_org || doc?.org || '').trim();
    return Boolean(currentUserIndex) && Boolean(ownerIndex) && currentUserIndex === ownerIndex && Boolean(currentOrgId) && currentOrgId === owningOrgId;
  };

  const isFolderOwnedByCurrentUser = (folder) => {
    if (!folder) return false;
    const currentUserIndex = String(loggedInUser?.full_data?.user_index || loggedInUser?.user_index || currentUser?.user_index || '').trim();
    const currentOrgId = String(loggedInUser?.full_data?.org || loggedInUser?.org || currentUser?.org || '').trim();
    const ownerRef = folder.created_by_user || folder.user_index || null;
    const ownerIndex = String(ownerRef?.user_index || folder.created_by_user_id || folder.user_index_id || '').trim();
    const owningOrgId = String(folder?.owning_org || folder?.org || '').trim();
    return Boolean(currentUserIndex) && Boolean(ownerIndex) && currentUserIndex === ownerIndex && Boolean(currentOrgId) && currentOrgId === owningOrgId;
  };

  const handleShareDocument = async (shareData) => {
  const documentToShare = userDocuments.find(doc => String(doc.id || doc.doc_id) === String(shareData.documentId));
  const documentName = getDocumentName(documentToShare);
  
  if (!documentToShare) {
    alert('❌ Error: Document not found');
    return;
  }

  if (!isDocumentOwnedByCurrentUser(documentToShare)) {
    alert('❌ Only the owner of this document can share or unshare it.');
    return;
  }

  try {
    // Share with each selected user
    const sharePromises = shareData.sharedWith.map(userId =>
      documentShareAPI.create({
        doc: shareData.documentId,
        shared_to_user: userId,
        share_msg: shareData.message || ''
      })
    );

    await Promise.all(sharePromises);
    await refreshWorkspaceAfterShare();

    const recipientNames = shareData.sharedWith
      .map(userId => {
        const user = allUsers.find(u => u.user_index === userId);
        return user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.user_id) : userId;
      })
      .join(', ');

    addAuditLog(
      'Document Shared',
      `"${documentName}" shared with ${recipientNames}`,
      'Success'
    );

    alert(`Document "${documentName}" successfully shared!`);
    setShowShareModal(false);
    setDocumentToShare(null);
  } catch (error) {
    console.error('❌ Failed to share document:', error);
    alert(`❌ Failed to share document: ${error.message}`);
  }
};

  const handleRequestApproval = async (document) => {
    if (!document) {
      alert('❌ Error: Document not found');
      return;
    }

    try {
      await documentAPI.createApproval(document.doc_id || document.id, 'Please approve this document for sharing');
      
      addAuditLog(
        'Request Document Approval',
        `Requested approval for "${getDocumentName(document)}"`,
        'Success'
      );

      alert(`✅ Approval request sent for "${getDocumentName(document)}" to your organization admin!`);
      setShowShareModal(false);
      setDocumentToShare(null);
    } catch (error) {
      console.error('❌ Failed to request approval:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      alert(`❌ Failed to request approval:\n\n${errorMsg}`);
    }
  };

  const handleShareFolder = async (shareData) => {
    const folderToShare = folders.find(f => f.folder_id === shareData.folderId);
    
    if (!folderToShare) {
      alert('❌ Error: Folder not found');
      return;
    }

    try {
      const orgsToShare = shareData.sharedWith || [];
      const orgsToUnshare = shareData.unsharedWith || [];
      const currentOrgId = currentUser.org || currentUser.full_data?.org;

      // Collect all descendant folders (including root) for inherited sharing.
      const collectFolderTreeIds = (rootFolderId) => {
        const result = new Set();
        const queue = [String(rootFolderId)];

        while (queue.length > 0) {
          const current = queue.shift();
          if (!current || result.has(current)) continue;
          result.add(current);

          folders
            .filter((f) => String(f.parent_folder) === String(current))
            .forEach((child) => queue.push(String(child.folder_id)));
        }

        return Array.from(result);
      };

      const folderTreeIds = collectFolderTreeIds(shareData.folderId);
      const folderTreeIdSet = new Set(folderTreeIds.map((id) => String(id)));

      const existingFolderShares = await folderShareAPI.getAll();
      const existingFolderShareMap = new Map();
      existingFolderShares.forEach((share) => {
        if (String(share.shared_by_org) !== String(currentOrgId)) return;
        const key = `${String(share.folder)}:${String(share.shared_with_org)}`;
        existingFolderShareMap.set(key, share.share_id);
      });

      // Share folder tree to newly selected organizations.
      const folderSharePromises = [];
      folderTreeIds.forEach((folderId) => {
        orgsToShare.forEach((orgId) => {
          if (String(orgId) === String(currentOrgId)) return;
          const key = `${String(folderId)}:${String(orgId)}`;
          if (!existingFolderShareMap.has(key)) {
            folderSharePromises.push(
              folderShareAPI.create({
                folder: folderId,
                shared_with_org: orgId,
                share_msg: shareData.message || ''
              })
            );
          }
        });
      });

      // Unshare folder tree for removed organizations.
      const folderUnsharePromises = [];
      folderTreeIds.forEach((folderId) => {
        orgsToUnshare.forEach((orgId) => {
          const key = `${String(folderId)}:${String(orgId)}`;
          const shareId = existingFolderShareMap.get(key);
          if (shareId) {
            folderUnsharePromises.push(folderShareAPI.delete(shareId));
          }
        });
      });

      await Promise.all([
        ...folderSharePromises,
        ...folderUnsharePromises,
      ]);
      await refreshWorkspaceAfterShare();

      const recipientNames = orgsToShare
        .map(orgId => {
          const orgUsers = allUsers.filter(u => String(u.org) === String(orgId));
          const sample = orgUsers[0];
          return sample?.org_name || sample?.organization || `Org ${orgId}`;
        })
        .join(', ');

      const unshareNames = orgsToUnshare
        .map(orgId => {
          const orgUsers = allUsers.filter(u => String(u.org) === String(orgId));
          const sample = orgUsers[0];
          return sample?.org_name || sample?.organization || `Org ${orgId}`;
        })
        .join(', ');

      if (orgsToShare.length > 0) {
        addAuditLog(
          'Folder Shared',
          `"${folderToShare.folder_name}" shared with orgs: ${recipientNames}`,
          'Success'
        );
      }

      if (orgsToUnshare.length > 0) {
        addAuditLog(
          'Folder Unshared',
          `"${folderToShare.folder_name}" unshared from orgs: ${unshareNames}`,
          'Success'
        );
      }

      if (orgsToShare.length > 0 && orgsToUnshare.length > 0) {
        alert(`Folder "${folderToShare.folder_name}" share updated.`);
      } else if (orgsToShare.length > 0) {
        alert(`Folder "${folderToShare.folder_name}" successfully shared!`);
      } else if (orgsToUnshare.length > 0) {
        alert(`Folder "${folderToShare.folder_name}" successfully unshared!`);
      }
      setShowShareFolderModal(false);
      setFolderToShare(null);
    } catch (error) {
      console.error('❌ Failed to share folder:', error);
      alert(`❌ Failed to share folder: ${error.message}`);
    }
  };

  const openShareModal = (doc) => {
  if (!isDocumentOwnedByCurrentUser(doc)) {
    alert('❌ You can only share documents that you own.');
    return;
  }
  setDocumentToShare(doc);
  setShowShareModal(true);
};  

  const openShareFolderModal = (folder) => {
    setFolderToShare(folder);
    setShowShareFolderModal(true);
  };

  const openRenameModal = (doc) => {
    setDocumentToRename(doc);
    setShowRenameModal(true);
  };

  const openDocumentHistoryModal = async (doc) => {
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

  const openAddCategoriesModal = (doc) => {
    setDocumentForCategories(doc);
    setShowAddCategoriesModal(true);
  };

  const openAddFolderCategoryModal = (folder) => {
    setFolderForCategory(folder);
    setShowAddFolderCategoryModal(true);
  };

  const handleRenameDocument = async (renameData) => {
    try {
      const document = userDocuments.find(doc => doc.doc_id === renameData.documentId || doc.id === renameData.documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }

      // Update the document via API
      await documentAPI.update(document.id || document.doc_id, {
        doc_name: renameData.newName
      });

      // Update local state
      setUserDocuments(userDocuments.map(doc => 
        doc.id === renameData.documentId || doc.doc_id === renameData.documentId
          ? { ...doc, doc_name: renameData.newName }
          : doc
      ));

      addAuditLog('Document Renamed', `"${renameData.newName}"`, 'Success');
      setShowRenameModal(false);
      setDocumentToRename(null);
    } catch (error) {
      console.error('Error renaming document:', error);
      throw error;
    }
  };

  const handleRemoveShare = (shareId) => {
  if (!window.confirm('Are you sure you want to stop sharing this document?')) {
    return;
  }

  if (dataStore) {
    const share = dataStore.getAllDirectShares().find(s => s.id === shareId);
    
    dataStore.removeDirectShare(shareId);
    if (share) {
      addAuditLog(
        'Share Removed',
        `Stopped sharing "${share.document?.title || 'Unknown'}"`,
        'Success'
      );
    }

    alert('✅ Share removed successfully!');
  }
};



  
 const handleSendToOrganization = (doc) => {
  setSelectedDocForOrgShare(doc);
  setShowSendToOrgModal(true);
};
const handleConfirmSendToOrganization = async (shareData) => {
  const documentToShare = userDocuments.find(d => d.id === shareData.documentId);
  const documentName = getDocumentName(documentToShare);
  
  if (!documentToShare) {
    alert('❌ Error: Document not found');
    return;
  }

  try {
    // Update the document's shared_with field in the backend
    const currentSharedWith = documentToShare.sharedWith || [];
    const updatedSharedWith = [...new Set([...currentSharedWith, ...shareData.recipients])];
    
    await documentAPI.update(documentToShare.id, {
      shared_with: updatedSharedWith
    });

    const createdShare = await organizationShareAPI.create({
      documentId: shareData.documentId,
      recipients: shareData.recipients,
      distributionMode: shareData.distributionMode,
      selectedUnits: shareData.selectedUnits || [],
      message: shareData.message,
      sentFrom: shareData.sentFrom
    });

    const newShare = {
      id: 'org-share-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      documentId: shareData.documentId,
      document: documentToShare,
      recipients: shareData.recipients,
      distributionMode: shareData.distributionMode,
      selectedUnits: shareData.selectedUnits,
      message: shareData.message,
      sentBy: shareData.sentBy,
      sentFrom: shareData.sentFrom,
      sentAt: shareData.sentAt
    };

    if (dataStore) {
      dataStore.addOrgShare(newShare);
      addAuditLog(
        'Organization Distribution',
        `Document: "${documentName}" sent to ${newShare.recipients.length} recipients via ${shareData.distributionMode}`,
        'Success'
      );
    }

    setOrganizationShares((prev) => [createdShare, ...prev]);

    // Refresh documents list from backend
    const allDocs = await documentAPI.getAll();
    const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
    setUserDocuments(myDocs);

    alert(`✅ Document "${documentName}" successfully sent to ${shareData.recipients.length} user(s) in your organization!`);

    setShowSendToOrgModal(false);
    setSelectedDocForOrgShare(null);
  } catch (error) {
    console.error('❌ Failed to send to organization:', error);
    alert(`❌ Failed to send document: ${error.message}`);
  }
};
const handleSaveToMyDocuments = (document, source) => {
  if (!document) {
    alert('❌ Invalid document');
    return;
  }
  const existingDoc = userDocuments.find(doc => 
    doc.originalDocumentId === document.id && doc.createdBy === currentUser.id
  );

  if (existingDoc) {
    const shouldProceed = window.confirm(
      `You've already saved this document as "${existingDoc.title}". Do you want to save another copy?`
    );
    if (!shouldProceed) return;
  }
  const savedDoc = {
    ...document,
    id: Date.now().toString() + '-saved-' + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toLocaleString(),
    createdBy: currentUser.id,
    savedFrom: source,
    originalDocumentId: document.id,
    originalCreatedBy: document.createdBy,
    originalCreatedAt: document.createdAt,
    folderId: null
  };

  if (dataStore) {
    dataStore.addDocument(savedDoc);
    addAuditLog(
      'Document Saved from Shared',
      `"${savedDoc.title}" - Saved from ${source === 'org-share' ? 'Organization Share' : 'Direct Share'}`,
      'Success'
    );
    
    const goToMyDocs = window.confirm(
      `✅ Document "${document.title}" has been saved to your "My Documents"!\n\nWould you like to go to My Documents now?`
    );
    
    if (goToMyDocs) {
      setActiveSection('documents');
      setCurrentFolder(null);
    }
  } else {
    console.error('❌ DataStore not available');
    alert('❌ Error: Could not save document');
  }
};
  return (
    <div className="flex h-screen bg-gray-100">
      <CreateFolderModal
        show={showCreateFolderModal}
        onClose={() => { 
          setShowCreateFolderModal(false); 
          setNewFolderName(''); 
          setNewFolderColor('blue');
          setErrors({}); 
        }}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        newFolderColor={newFolderColor}
        setNewFolderColor={setNewFolderColor}
        errors={errors}
        onCreateFolder={handleCreateFolder}
      />

      <EditFolderModal
        show={showEditFolderModal}
        onClose={() => { 
          setShowEditFolderModal(false); 
          setEditingFolderId(null);
          setEditFolderName(''); 
          setEditFolderColor('blue');
          setErrors({}); 
        }}
        folderName={editFolderName}
        setFolderName={setEditFolderName}
        folderColor={editFolderColor}
        setFolderColor={setEditFolderColor}
        errors={errors}
        onSaveFolder={handleSaveFolder}
      />

      <MoveToFolderModal
        show={showMoveToFolderModal}
        onClose={() => { 
          setShowMoveToFolderModal(false); 
          setDocumentToMove(null); 
        }}
        folders={folders}
        onMoveToFolder={handleMoveToFolder}
        getFolderDocumentCount={getFolderDocumentCount}
      />

      <DocumentViewerModal
        show={showDocumentViewer}
        document={viewingDocument}
        onClose={() => { 
          // Clean up blob URLs to prevent memory leaks
          if (viewingDocument?.isBlobUrl && viewingDocument?.fileData) {
            URL.revokeObjectURL(viewingDocument.fileData);
          }
          setShowDocumentViewer(false); 
          setViewingDocument(null); 
        }}
        onPrint={handlePrintDocument}
        onDownload={handleDownloadDocument}
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

      <UploadDocumentModal
        show={showUploadDocumentModal}
        onClose={() => { 
          if (isDetectingUploads) return;
          setShowUploadDocumentModal(false); 
          setShowCategoryMatchConfirmModal(false);
          setShowRenameDetectedModal(false);
          setUploadedDocFiles([]); 
          setUploadPreviews([]); 
          setUploadFileNames([]);
          setDetectedUploadItems([]);
          setCurrentPreviewIndex(0); 
          setUploadTagValues({});
          setAutoCategorizeUploads(false);
        }}
        uploadedDocFiles={uploadedDocFiles}
        uploadPreviews={uploadPreviews}
        currentPreviewIndex={currentPreviewIndex}
        setCurrentPreviewIndex={setCurrentPreviewIndex}
        onFileUpload={handleDocumentFileUpload}
        onRemoveFile={removeFileFromUpload}
        onUpload={handleUploadDocument}
        customFields={customFields}
        uploadTagValues={uploadTagValues}
        setUploadTagValues={setUploadTagValues}
        autoCategorizeEnabled={autoCategorizeUploads}
        setAutoCategorizeEnabled={(enabled) => {
          setAutoCategorizeUploads(enabled);
          setUploadFileNames(uploadedDocFiles.map((file) => file.name));
        }}
        autoCategorizeWarning="Uploads may take a little longer while your files are organized automatically."
        primaryActionLabel={autoCategorizeUploads ? 'Detect' : 'Upload'}
        primaryActionLoading={isDetectingUploads}
        primaryActionLoadingLabel="Detecting documents..."
        lockInteractionWhenLoading
        loadingOverlayText="Detection in progress. Please wait until it finishes."
      />

      <RenameDetectedDocumentsModal
        show={showRenameDetectedModal}
        onClose={() => {
          if (isSubmittingDetectedUpload) return;
          setShowRenameDetectedModal(false);
          setDetectedUploadItems([]);
        }}
        detectedItems={detectedUploadItems}
        onChangeName={handleChangeDetectedUploadName}
        onConfirm={handleConfirmDetectedUpload}
        isSubmitting={isSubmittingDetectedUpload}
      />

      <CategoryMatchConfirmationModal
        show={showCategoryMatchConfirmModal}
        items={detectedUploadItems}
        onClose={() => {
          if (isSubmittingDetectedUpload) return;
          setShowCategoryMatchConfirmModal(false);
        }}
        onConfirm={handleProceedFromCategoryConfirm}
        isBusy={isSubmittingDetectedUpload}
      />

      <OCRModal
        show={showOCRModal}
        onClose={() => { setShowOCRModal(false); setUploadedFile(null); setOcrText(''); }}
        uploadedFile={uploadedFile}
        ocrText={ocrText}
        setOcrText={setOcrText}
        ocrMode={ocrMode}
        setOcrMode={setOcrMode}
        isProcessingOCR={isProcessingOCR}
        onFileUpload={handleFileUpload}
        onProcessOCR={handleProcessOCR}
        onUseOCRText={handleUseOCRText}
      />

      <PersonalInfoFormModal
        show={showPersonalInfoForm}
        onClose={() => { 
          setShowPersonalInfoForm(false); 
          setPersonalInfo({
            fullName: '', dateOfBirth: '', gender: '', email: '', phoneNumber: '',
            address: '', city: '', state: '', zipCode: '', occupation: '',
            emergencyContact: '', emergencyPhone: ''
          }); 
        }}
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        errors={errors}
        onSave={handleSavePersonalInfo}
        onBack={() => { setShowPersonalInfoForm(false); }}
      />

      <SaveOptionsModal
        show={showSaveOptionsModal}
        onClose={() => { setShowSaveOptionsModal(false); setShowPersonalInfoForm(true); }}
        onSave={handleFinalSave}
      />

      <AddFieldModal
        show={showAddFieldModal}
        onClose={() => { 
          setShowAddFieldModal(false); 
          setErrors({}); 
          setNewField({ fieldName: '', fieldType: 'text', showInDocuments: true }); 
          
        }}
        newField={newField}
        setNewField={setNewField}
        errors={errors}
        onAddField={handleAddField}
      />

      <ShareDocumentModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setDocumentToShare(null);
        }}
        document={documentToShare}
        allUsers={allUsers}
        organizationTree={orgTree}
        currentUser={currentUser}
        onShareDocument={handleShareDocument}
        onSharesUpdated={refreshWorkspaceAfterShare}
        allowOrgSharing={false}
        onRequestApproval={handleRequestApproval}
      />

      <ShareFolderModal
        show={showShareFolderModal}
        onClose={() => {
          setShowShareFolderModal(false);
          setFolderToShare(null);
        }}
        folder={folderToShare}
        allUsers={allUsers}
        organizationTree={orgTree}
        currentUser={currentUser}
        onShareFolder={handleShareFolder}
        onSharesUpdated={refreshWorkspaceAfterShare}
      />

      <RenameDocumentModal
        show={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setDocumentToRename(null);
        }}
        document={documentToRename}
        onRename={handleRenameDocument}
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
                role: userData.role_type || 'User',
                user_id: userData.user_id,
                first_name: userData.first_name || '',
                middle_name: userData.middle_name || '',
                last_name: userData.last_name || '',
                suffix: userData.suffix || '',
                email_add: userData.email_add || '',
                full_data: userData,
                id: userData.user_id
              });
            } catch (error) {
              console.error('Failed to refresh current user profile:', error);
            }
          };
          fetchCurrentUser();
        }}
      />

      <AddDocumentCategoriesModal
        show={showAddCategoriesModal}
        onClose={() => {
          setShowAddCategoriesModal(false);
          setDocumentForCategories(null);
        }}
        document={documentForCategories}
        categories={userCategories}
        onCategoriesUpdated={async () => {
          try {
            const allDocs = await documentAPI.getAll();
            const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username || doc.uploaded_by_user?.user_id === currentUser.id);
            setUserDocuments(myDocs);

            if (documentForCategories) {
              const refreshedDoc = myDocs.find((d) => String(d.doc_id || d.id) === String(documentForCategories.doc_id || documentForCategories.id));
              if (refreshedDoc) {
                setDocumentForCategories(refreshedDoc);
              }
            }
          } catch (error) {
            console.error('Failed to refresh documents after category update:', error);
          }
        }}
      />

      <AddFolderCategoryModal
        show={showAddFolderCategoryModal}
        onClose={() => {
          setShowAddFolderCategoryModal(false);
          setFolderForCategory(null);
        }}
        folder={folderForCategory}
        categories={userCategories}
        onCategoryUpdated={async () => {
          try {
            const allFolders = await folderAPI.getAll();
            setFolders(Array.isArray(allFolders) ? allFolders : []);
            if (folderForCategory) {
              const refreshed = (allFolders || []).find((f) => String(f.folder_id) === String(folderForCategory.folder_id));
              if (refreshed) {
                setFolderForCategory(refreshed);
              }
            }
          } catch (error) {
            console.error('Failed to refresh folders after category update:', error);
          }
        }}
      />

      {/* SendToOrganizationModal removed - consolidated into Share To modal */}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={loggedInUser}
        dataStore={dataStore}
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
          onNotificationNavigate={() => setActiveSection('shared')}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'documents' && (
            <FileManagement
              rootLabel={`${userOrgCode || 'Organization'} Files`}
              currentFolder={currentFolder}
              setCurrentFolder={setCurrentFolder}
              folders={ownerFilteredFolders}
              userDocuments={ownerFilteredDocuments}
              sharedDocumentIds={sharedOutDocumentIds}
              sharedDocumentLabels={sharedDocumentLabels}
              sharedFolderIds={sharedOutFolderIds}
              sharedFolderLabels={sharedFolderLabels}
              ownerDisplayMode="full"
              filteredDocuments={filteredDocuments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              organizationFilters={organizationFilters}
              setOrganizationFilters={setOrganizationFilters}
              organizationFilterOptions={organizationFilterOptions}
              ownerFilter={ownerFilter}
              setOwnerFilter={setOwnerFilter}
              ownerFilterOptions={ownerFilterOptions}
              sortBy={sortBy}
              setSortBy={setSortBy}
              customFields={customFields}
              filterByTag={filterByTag}
              setFilterByTag={setFilterByTag}
              setShowUploadDocumentModal={setShowUploadDocumentModal}
              setShowCreateFolderModal={setShowCreateFolderModal}
              setShowOCRModal={setShowOCRModal}
              onOpenDocument={handleOpenDocument}
              onDeleteDocument={handleDeleteDocument}
              onDownloadDocument={handleDownloadDocument}
              onPrintDocument={handlePrintDocument}
              onMoveToFolder={openMoveToFolderModal}
              onMoveDocumentByDrop={handleMoveDocumentByDrop}
              enableDocumentDragDrop={true}
              canDragDocument={(doc) => String(doc?.owning_org || '') === String((loggedInUser?.full_data?.org || currentUser?.org || ''))}
              canDropToFolder={(folder, draggedDoc) => {
                const currentOrgId = loggedInUser?.full_data?.org || currentUser?.org || '';
                return String(folder?.owning_org || '') === String(currentOrgId) && String(draggedDoc?.owning_org || '') === String(currentOrgId);
              }}
              canDropToRoot={(draggedDoc) => String(draggedDoc?.owning_org || '') === String((loggedInUser?.full_data?.org || currentUser?.org || ''))}
              onMoveFolderByDrop={handleMoveFolderByDrop}
              enableFolderDragDrop={true}
              canDragFolder={(folder) => String(folder?.owning_org || '') === String((loggedInUser?.full_data?.org || currentUser?.org || ''))}
              canDropFolderToFolder={(targetFolder, draggedFolder) => {
                const currentOrgId = loggedInUser?.full_data?.org || currentUser?.org || '';
                return String(targetFolder?.owning_org || '') === String(currentOrgId) && String(draggedFolder?.owning_org || '') === String(currentOrgId);
              }}
              canDropFolderToRoot={(draggedFolder) => String(draggedFolder?.owning_org || '') === String((loggedInUser?.full_data?.org || currentUser?.org || ''))}
              onShareDocument={openShareModal}
              onRenameDocument={openRenameModal}
              onAddCategories={openAddCategoriesModal}
              onDeleteFolder={handleDeleteFolder}
              onDownloadFolder={handleDownloadFolder}
              onShareFolder={(folder) => openShareFolderModal(folder)}
              onRenameFolder={handleRenameFolder}
              onAddFolderCategory={openAddFolderCategoryModal}
              getFolderDocumentCount={getFolderDocumentCount}
            />
          )}
          {activeSection === 'shared' && (
            <SharedDocuments
              sharedDocuments={sharedDocuments}
              sharedFolders={sharedFolders}
              organizationShares={[]}
              allFolders={folders}
              currentUser={currentUser}
              onOpenDocument={handleOpenDocument}
              onOpenFolder={(folderId, navigateToDocuments = false) => {
                const normalizedFolderId = Number.isNaN(Number(folderId)) ? folderId : Number(folderId);
                setCurrentFolder(normalizedFolderId);
                if (navigateToDocuments) {
                  setActiveSection('documents', { preserveCurrentFolder: true });
                }
              }}
              onRemoveShare={handleRemoveShare}
              allUsers={allUsers}
              organizationTree={orgTree}
              onSaveToMyDocuments={handleSaveToMyDocuments}
            />
          )}
          {activeSection === 'fields' && (
            <Category userOrg={loggedInUser.full_data?.org} role_type='user' />
          )}
          {activeSection === 'recycle-bin' && (
           <RecycleBin
            deletedDocuments={deletedDocuments}
            deletedFolders={deletedFolders}
            currentUser={currentUser}
           onRestore={handleRestoreDocument}
           onRestoreAll={handleRestoreAllRecycleBin}
           onRestoreFolder={handleRestoreFolder}
           onPermanentDeleteFolder={handlePermanentDeleteFolder}
           onPermanentDelete={handlePermanentDelete}
           onEmptyBin={handleEmptyRecycleBin}
         />
          )}
        </div>
      </div>
    </div>
  );
}