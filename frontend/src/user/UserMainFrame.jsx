
import { useState ,useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Settings, LogOut, Menu, X, Bell, Folder, Share2, Trash2 } from 'lucide-react';
import Header from './Components/Header';
import DocumentsManager from './Components/DocumentsManager';
import Category from './component/Category';
import Sidebar from './Components/Sidebar';
import { documentAPI, organizationAPI, userAPI, auditLogAPI, folderAPI, tagAPI, organizationShareAPI, authAPI, documentShareAPI, folderShareAPI, getAccessToken, categoryAPI } from '../services/api';
import mammoth from 'mammoth';
import CreateFolderModal from './Components/modals/CreateFolderModal';
import EditFolderModal from './Components/modals/EditFolderModal';
import MoveToFolderModal from './Components/modals/MoveToFolderModal';
import DocumentViewerModal from './Components/modals/DocumentViewerModal';
import UploadDocumentModal from './Components/modals/UploadDocumentModal';
import OCRModal from './Components/modals/OCRModal';
import PersonalInfoFormModal from './Components/modals/PersonalInfoFormModal';
import SaveOptionsModal from './Components/modals/SaveOptionsModal';
import AddFieldModal from './Components/modals/AddFieldModal';
import ShareDocumentModal from './Components/modals/ShareDocumentModal';
import ShareFolderModal from './Components/modals/ShareFolderModal';
import RenameDocumentModal from './Components/modals/RenameDocumentModal';
import ChangePasswordModal from './Components/modals/ChangePasswordModal';
import AddDocumentCategoriesModal from './Components/modals/AddDocumentCategoriesModal';
import SharedDocuments from './Components/SharedDocuments';
import RecycleBin from './Components/RecycleBin';
export default function UserMainFrame({ 
  currentUser = { name: 'User', role: 'User', id: 'user1' }, 
  onLogout = () => {}, 
  organizationTree,
  dataStore 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

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
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    setCurrentFolder(null); // Reset to My Files when changing sections
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
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [, forceUpdate] = useState(0);
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [deletedDocuments, setDeletedDocuments] = useState([]);
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
        setLoggedInUser({
          name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : userData.user_id,
          role: userData.role_type || 'User',
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

  // Fetch user documents from backend
  useEffect(() => {
    const fetchUserDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        const allDocs = await documentAPI.getAll();
        // Filter to only show documents created by current user
        const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
        setUserDocuments(myDocs);
        console.log('User documents fetched from API:', myDocs);
      } catch (error) {
        console.error('Failed to load user documents:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackDocs = dataStore.getDocumentsByUser(currentUser.id);
          setUserDocuments(fallbackDocs);
          console.log('Using fallback documents from dataStore:', fallbackDocs);
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
        console.log('Deleted documents fetched from API:', deletedDocs);
      } catch (error) {
        console.error('Failed to load deleted documents:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackDocs = dataStore.getDeletedDocuments();
          setDeletedDocuments(fallbackDocs);
          console.log('Using fallback deleted documents from dataStore:', fallbackDocs);
        }
      }
    };

    fetchDeletedDocuments();
  }, [currentUser.id, dataStore]);

  // Fetch organization tree for Send to Organization feature
  useEffect(() => {
    const fetchOrganizationTree = async () => {
      try {
        const data = await organizationAPI.getAll();
        console.log('Organization structure fetched for Send to Organization modal:', data);
        setOrgTree(data);
      } catch (error) {
        console.error('Failed to load organization structure:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getOrganizationTree();
          console.log('Using fallback organization structure from dataStore:', fallbackData);
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
        console.log('Users fetched for Send to Organization:', data);
        setAllUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getAllUsers();
          console.log('Using fallback users from dataStore:', fallbackData);
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
        console.log('Folders fetched from API:', data);
        setFolders(data);
      } catch (error) {
        console.error('Failed to load folders:', error);
        // Fallback to dataStore
        if (dataStore) {
          const fallbackData = dataStore.getFolders();
          console.log('Using fallback folders from dataStore:', fallbackData);
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
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [currentDocumentData, setCurrentDocumentData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterByTag, setFilterByTag] = useState({});
  const [uploadTagValues, setUploadTagValues] = useState({});

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
  const [userCategories, setUserCategories] = useState([]);

  // Fetch shared documents from backend
  useEffect(() => {
    const fetchSharedDocuments = async () => {
      try {
        const [sharedWithMs, sharedByMeData] = await Promise.all([
          documentAPI.getSharedWithMe(),
          documentAPI.getSharedByMe()
        ]);
        
        // Combine both types of shares into one array
        const allShares = [];
        
        // Add documents shared with me (sharedBy = creator, sharedWith = [me])
        sharedWithMs.forEach(doc => {
          allShares.push({
            id: doc.id,
            document: doc,
            sharedBy: doc.created_by,
            sharedWith: [currentUser.id], // Only me in sharedWith
            permission: 'view',
            sharedAt: doc.created_at
          });
        });
        
        // Add documents shared by me (sharedBy = me, sharedWith = [others])
        sharedByMeData.forEach(doc => {
          allShares.push({
            id: doc.id,
            document: doc,
            sharedBy: currentUser.id,
            sharedWith: doc.shared_with || [], // The users it's shared with
            permission: 'view',
            sharedAt: doc.created_at
          });
        });

        console.log('All shares:', allShares);
        setSharedDocuments(allShares);
      } catch (error) {
        console.error('Failed to fetch shared documents:', error);
        // Fall back to dataStore
        setSharedDocuments(dataStore ? dataStore.getAllDirectShares() : []);
      }
    };

    if (currentUser.id) {
      fetchSharedDocuments();
    }
  }, [currentUser.id]);

  // Fetch shared folders from backend
  useEffect(() => {
    const fetchSharedFolders = async () => {
      try {
        const allFolderShares = await folderShareAPI.getAll();
        
        // Filter: shared with me (I'm the shared_to_user)
        const sharedWithMe = allFolderShares.filter(share => 
          share.shared_to_user === currentUser.user_index
        ).map(share => ({
          id: `folder-share-${share.share_id}`,
          folder: share.folder_data || folders.find(f => f.folder_id === share.folder),
          folderId: share.folder,
          sharedBy: share.shared_by_user,
          sharedWith: [currentUser.user_index],
          permission: 'view',
          sharedAt: share.created_at,
          isFolder: true
        }));

        // Filter: shared by me (I'm the shared_by_user)
        const sharedByMe = allFolderShares.filter(share => 
          share.shared_by_user === currentUser.user_index
        ).map(share => ({
          id: `folder-share-${share.share_id}`,
          folder: share.folder_data || folders.find(f => f.folder_id === share.folder),
          folderId: share.folder,
          sharedBy: currentUser.user_index,
          sharedWith: [share.shared_to_user],
          permission: 'view',
          sharedAt: share.created_at,
          isFolder: true,
          shareId: share.share_id
        }));

        const allFolderShares_ = [...sharedWithMe, ...sharedByMe];
        console.log('All folder shares:', allFolderShares_);
        setSharedFolders(allFolderShares_);
      } catch (error) {
        console.error('Failed to fetch shared folders:', error);
        setSharedFolders([]);
      }
    };

    if (currentUser.user_index) {
      fetchSharedFolders();
    }
  }, [currentUser.user_index, folders]);

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
        console.log('Tags fetched from API:', formattedTags);
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
        console.log('Categories fetched from API:', categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to empty array
        setUserCategories([]);
      }
    };

    fetchCategories();
  }, []);
  
 const menuItems = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'shared', label: 'Shared Documents', icon: Share2 },
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
      console.log('Folder created:', newFolder);
      
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
        
        addAuditLog('Folder Deleted', `${folderName}`, 'Success');
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
        folderId: folderIdToSave
      });
      
      console.log(`Document ${documentToMove} moved to folder ${folderIdToSave || 'root'}`);
      
      // Refresh documents from API
      const updatedDocs = await documentAPI.getAll();
      setUserDocuments(updatedDocs);
      
      // Also update in dataStore for backward compatibility
      if (dataStore) {
        dataStore.updateDocument(documentToMove, { folderId: folderId });
      }
      
      // Log the action
      const doc = userDocuments.find(d => d.id === documentToMove);
      const folderName = folders.find(f => f.id === folderId)?.name || 'Root';
      addAuditLog(
        'Document Moved',
        `"${doc?.title}" moved to folder "${folderName}"`,
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
      console.log('Document created successfully:', createdDoc);
      
      // Refresh documents list
      const allDocs = await documentAPI.getAll();
      const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
      setUserDocuments(myDocs);
      
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
  const docToDelete = userDocuments.find(doc => doc.id === docId);
  if (window.confirm('Move this document to Recycle Bin?')) {
    try {
      // Soft delete via API (sets is_deleted = true)
      await documentAPI.delete(docId);
      
      // Refresh documents list
      const allDocs = await documentAPI.getAll();
      const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
      setUserDocuments(myDocs);
      
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
    const doc = deletedDocuments.find(d => d.id === docId);
    if (!doc) {
      alert('Document not found');
      return;
    }

    await documentAPI.restore(docId);
    
    if (dataStore) {
      dataStore.restoreFromRecycleBin(docId);
      addAuditLog('Document Restored', `${doc.title} - ID: ${docId}`, 'Success');
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
      const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
      setUserDocuments(myDocs);
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
    const doc = deletedDocuments.find(d => d.id === docId);
    if (!doc) {
      alert('Document not found');
      return;
    }

    await documentAPI.permanentDelete(docId);

    if (dataStore) {
      dataStore.permanentlyDelete(docId);
      addAuditLog('Document Permanently Deleted', `${doc.title} - ID: ${docId}`, 'Success');
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
  const count = deletedDocuments.filter(d => d.createdBy === currentUser.id).length;
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

  const handleOpenDocument = async (doc) => {
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

  const handleDownloadDocument = (doc) => {
    try {
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

  const handlePrintDocument = (doc) => {
    try {
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

  const handleProcessOCR = () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }
    setIsProcessingOCR(true);
    setTimeout(() => {
      setOcrText(`[OCR Extracted Text from ${uploadedFile.name}]\n\nThis is a simulated OCR result. In a real implementation, this would contain the actual text extracted from the uploaded image or PDF document using OCR technology.\n\nSample extracted content:\n- Name: John Doe\n- Address: 123 Main Street\n- Date: November 11, 2025\n- Document Type: Official Record`);
      setIsProcessingOCR(false);
    }, 2000);
  };

  
  const handleUseOCRText = () => {
    if (!ocrText) {
      alert('Please process OCR first');
      return;
    }
    const doc = {
      id: Date.now().toString(),
      title: `OCR Document - ${uploadedFile.name}`,
      description: 'Document created from OCR extraction',
      customFieldValues: {},
      personalInfo: {},
      format: 'ocr',
      folderId: currentFolder,
      ocrContent: ocrText,
      createdAt: new Date().toLocaleString(),
      createdBy: currentUser.id 
    };
    
    
    if (dataStore) {
      dataStore.addDocument(doc);

       addAuditLog(
        'OCR Document Created',
        `${doc.title} - Extracted from ${uploadedFile.name}`,
        'Success'
      );
    }
    
    setShowOCRModal(false);
    setUploadedFile(null);
    setOcrText('');
    alert('Document created from OCR text!');
  };

  const handleDocumentFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedDocFiles(files);
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
    setUploadedDocFiles(newFiles);
    setUploadPreviews(newPreviews);
    
    if (currentPreviewIndex >= newFiles.length && newFiles.length > 0) {
      setCurrentPreviewIndex(newFiles.length - 1);
    } else if (newFiles.length === 0) {
      setCurrentPreviewIndex(0);
    }
  };

  
  const handleUploadDocument = async () => {
    if (!uploadedDocFiles || uploadedDocFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    
    try {
      const uploadPromises = uploadedDocFiles.map(async (file) => {
        try {
          // Upload file using multipart form data
          const uploadedDoc = await documentAPI.uploadFiles(
            [file],
            file.name,
            'Uploaded document',
            currentFolder
          );
          
          console.log('Document uploaded successfully:', uploadedDoc);
          
          // Audit log
          addAuditLog(
            'Document Uploaded',
            `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
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
      setUploadedDocFiles([]);
      setUploadPreviews([]);
      setCurrentPreviewIndex(0);
      setUploadTagValues({});
      alert(`${uploadedDocs.length} document${uploadedDocs.length > 1 ? 's' : ''} uploaded successfully!`);
    } catch (error) {
      console.error('Failed to upload documents:', error);
      alert(`Failed to upload documents: ${error.message}`);
    }
  };

  const getFilteredAndSortedDocuments = () => {
    let filtered = [...userDocuments];

    if (currentFolder) {
      filtered = filtered.filter(doc => String(doc.folderId) === String(currentFolder));
    } else if (activeSection === 'documents') {
      filtered = filtered.filter(doc => !doc.folderId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.personalInfo?.fullName?.toLowerCase().includes(query) ||
        doc.personalInfo?.email?.toLowerCase().includes(query)
      );
    }

    if (filterFormat !== 'all') {
      filtered = filtered.filter(doc => doc.format === filterFormat);
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
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredDocuments = getFilteredAndSortedDocuments();

  const getFolderDocumentCount = (folderId) => {
    return userDocuments.filter(doc => String(doc.folderId) === String(folderId)).length;
  };

  const handleShareDocument = async (shareData) => {
  const documentToShare = userDocuments.find(doc => doc.id === shareData.documentId);
  
  if (!documentToShare) {
    alert('❌ Error: Document not found');
    return;
  }

  try {
    // Share with each selected user
    const sharePromises = shareData.sharedWith.map(userId =>
      documentShareAPI.create({
        doc: shareData.documentId,
        shared_to_user: userId
      })
    );

    await Promise.all(sharePromises);

    const recipientNames = shareData.sharedWith
      .map(userId => {
        const user = allUsers.find(u => u.user_index === userId);
        return user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.user_id) : userId;
      })
      .join(', ');

    addAuditLog(
      'Document Shared',
      `"${documentToShare.title}" shared with ${recipientNames}`,
      'Success'
    );

    alert(`Document "${documentToShare.title}" successfully shared!`);
    setShowShareModal(false);
    setDocumentToShare(null);
  } catch (error) {
    console.error('❌ Failed to share document:', error);
    alert(`❌ Failed to share document: ${error.message}`);
  }
};

  const handleShareFolder = async (shareData) => {
    const folderToShare = folders.find(f => f.folder_id === shareData.folderId);
    
    if (!folderToShare) {
      alert('❌ Error: Folder not found');
      return;
    }

    try {
      // Share with each selected user
      const sharePromises = shareData.sharedWith.map(userId =>
        folderShareAPI.create({
          folder: shareData.folderId,
          shared_to_user: userId
        })
      );

      await Promise.all(sharePromises);

      const recipientNames = shareData.sharedWith
        .map(userId => {
          const user = allUsers.find(u => u.user_index === userId);
          return user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.user_id) : userId;
        })
        .join(', ');

      addAuditLog(
        'Folder Shared',
        `"${folderToShare.folder_name}" shared with ${recipientNames}`,
        'Success'
      );

      alert(`Folder "${folderToShare.folder_name}" successfully shared!`);
      setShowShareFolderModal(false);
      setFolderToShare(null);
    } catch (error) {
      console.error('❌ Failed to share folder:', error);
      alert(`❌ Failed to share folder: ${error.message}`);
    }
  };

  const openShareModal = (doc) => {
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

  const openAddCategoriesModal = (doc) => {
    setDocumentForCategories(doc);
    setShowAddCategoriesModal(true);
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
        `Document: "${documentToShare.title}" sent to ${newShare.recipients.length} recipients via ${shareData.distributionMode}`,
        'Success'
      );
    }

    setOrganizationShares((prev) => [createdShare, ...prev]);

    // Refresh documents list from backend
    const allDocs = await documentAPI.getAll();
    const myDocs = allDocs.filter(doc => doc.createdBy === currentUser.id || doc.createdBy === currentUser.username);
    setUserDocuments(myDocs);

    alert(`✅ Document "${documentToShare.title}" successfully sent to ${shareData.recipients.length} user(s) in your organization!`);

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

      <UploadDocumentModal
        show={showUploadDocumentModal}
        onClose={() => { 
          setShowUploadDocumentModal(false); 
          setUploadedDocFiles([]); 
          setUploadPreviews([]); 
          setCurrentPreviewIndex(0); 
          setUploadTagValues({});
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
      />

      <OCRModal
        show={showOCRModal}
        onClose={() => { setShowOCRModal(false); setUploadedFile(null); setOcrText(''); }}
        uploadedFile={uploadedFile}
        ocrText={ocrText}
        setOcrText={setOcrText}
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
        currentUser={currentUser}
        onShareDocument={handleShareDocument}
      />

      <ShareFolderModal
        show={showShareFolderModal}
        onClose={() => {
          setShowShareFolderModal(false);
          setFolderToShare(null);
        }}
        folder={folderToShare}
        allUsers={allUsers}
        currentUser={currentUser}
        onShareFolder={handleShareFolder}
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
        currentUsername={loggedInUser.user_id}
      />

      <AddDocumentCategoriesModal
        show={showAddCategoriesModal}
        onClose={() => {
          setShowAddCategoriesModal(false);
          setDocumentForCategories(null);
        }}
        document={documentForCategories}
        categories={userCategories}
        onCategoriesUpdated={() => {
          // Optional: refresh documents or categories list
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
        <Header
          activeSection={activeSection}
          menuItems={menuItems}
          currentUser={loggedInUser}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          onLogout={onLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'documents' && (
            <DocumentsManager
              currentFolder={currentFolder}
              setCurrentFolder={setCurrentFolder}
              folders={folders}
              userDocuments={userDocuments}
              filteredDocuments={filteredDocuments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterFormat={filterFormat}
              setFilterFormat={setFilterFormat}
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
              onShareDocument={openShareModal}
              onRenameDocument={openRenameModal}
              onAddCategories={openAddCategoriesModal}
              onDeleteFolder={handleDeleteFolder}
              onShareFolder={(folder) => openShareFolderModal(folder)}
              onRenameFolder={handleRenameFolder}
              getFolderDocumentCount={getFolderDocumentCount}
            />
          )}
          {activeSection === 'shared' && (
            <SharedDocuments
              sharedDocuments={sharedDocuments}
              sharedFolders={sharedFolders}
              organizationShares={organizationShares}
              currentUser={currentUser}
              onOpenDocument={handleOpenDocument}
              onRemoveShare={handleRemoveShare}
              allUsers={allUsers}
              organizationTree={orgTree}
              onSaveToMyDocuments={handleSaveToMyDocuments}
            />
          )}
          {activeSection === 'fields' && (
            <Category userOrg={loggedInUser.full_data?.org} />
          )}
          {activeSection === 'recycle-bin' && (
           <RecycleBin
            deletedDocuments={deletedDocuments}
            currentUser={currentUser}
           onRestore={handleRestoreDocument}
           onPermanentDelete={handlePermanentDelete}
           onEmptyBin={handleEmptyRecycleBin}
         />
          )}
        </div>
      </div>
    </div>
  );
}