import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, ClipboardList, Building2 } from 'lucide-react';

import AdminSidebar from './component/AdminSidebar';
import AdminHeader from './component/AdminHeader';
import AdminDashboard from './component/AdminDashboard';
import AdminUserManagement from './component/AdminUserManagement';
import AdminDocuments from './component/AdminDocuments';
import AdminLogAudits from './component/AdminLogAudits';
import OrganizationalStructure from './component/OrganizationalStructure';
import OrgUnitModal from './component/OrgUnitModal';
import OrgUnitUsersView from './component/OrgUnitUsersView';
import AdminCustomizationModal from './component/AdminCustomizationModal';
import  UserIdFormatModal from './component/UserIdFormatModal';
import DocumentViewerModal from '../user/components/modals/DocumentViewerModal';
import { 
  UserActionMenu, 
  AdminVerificationModal, 
  AddUserModal, 
  PasswordModal, 
  EditPasswordModal 
} from './component/AdminModals';
import AdminAllDocumentsView from './component/AdminAllDocumentsView';
import AdminOrgSharesView from './component/AdminOrgSharesView';

export default function Mainframe({ 
  currentUser = { name: 'Administrator', role: 'Admin' }, 
  onLogout = () => {}, 
  dataStore  
}) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
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
  const userList = dataStore ? dataStore.getAllUsers() : [];
  const organizationTree = dataStore ? dataStore.getOrganizationTree() : [];
  
  const setOrganizationTree = (newTree) => {
    if (dataStore) {
      dataStore.setOrganizationTree(newTree);
    }
  };
  useEffect(() => {
    if (dataStore) {
      const custom = dataStore.getCustomization();
      if (custom) {
        setCustomization(custom);
        applyCustomization(custom);
      }
    }
  }, [dataStore]);
   useEffect(() => {
    if (dataStore) {
      const unsubscribe = dataStore.subscribe(() => {
       
        forceUpdate(prev => prev + 1);
        
       
        const custom = dataStore.getCustomization();
        if (custom) {
          setCustomization(custom);
          applyCustomization(custom);
        }
      });
      return unsubscribe;
    }
  }, [dataStore]);

  const applyCustomization = (custom) => {
    document.documentElement.style.setProperty('--primary-color', custom.primaryColor);
    document.documentElement.style.setProperty('--sidebar-gradient-start', custom.sidebarGradientStart);
    document.documentElement.style.setProperty('--sidebar-gradient-end', custom.sidebarGradientEnd);
  };
useEffect(() => {
    if (dataStore) {
      const format = dataStore.getUserIdFormat();
      if (format) {
        setUserIdFormat(format);
      }
    }
  }, [dataStore]);
 const handleCustomizationSave = (newSettings) => {
   
    if (dataStore) {
      dataStore.setCustomization(newSettings);
    }
    
   
    setCustomization(newSettings);
    applyCustomization(newSettings);
    
   
    addAuditLog(
      'System Customization Updated',
      `System Name: ${newSettings.systemName}, Colors updated`,
      'Success'
    );
    
    alert('Customization saved successfully!');
  };

  const handleCustomize = () => {
    setShowCustomizationModal(true);
    setShowSettingsMenu(false);
  };


   const handleConfigureUserId = () => {
    setShowUserIdFormatModal(true);
    setShowSettingsMenu(false);
  };
  const handleUserIdFormatSave = (newFormat) => {
    setUserIdFormat(newFormat);
    forceUpdate(prev => prev + 1);
    
    addAuditLog(
      'User ID Format Updated',
      `Admin: ${newFormat.previewIds.admin}, User: ${newFormat.previewIds.user}`,
      'Success'
    );
    
    alert('User ID format updated successfully! New users will use this format.');
  };
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organization', label: 'Organization Structure', icon: Building2 },
    { id: 'org-users', label: 'Users by Organization', icon: Users },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'all-documents', label: 'All User Documents', icon: FileText },
    { id: 'org-shares', label: 'Organization Shares', icon: Building2 },
    { id: 'logs', label: 'Log Audits', icon: ClipboardList }
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
    } else if (passwordData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordData.password)) {
      newErrors.password = 'Password must contain at least 1 uppercase letter';
    } else if (!/[a-z]/.test(passwordData.password)) {
      newErrors.password = 'Password must contain at least 1 lowercase letter';
    } else if (!/[0-9]/.test(passwordData.password)) {
      newErrors.password = 'Password must contain at least 1 digit (0-9)';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.password)) {
      newErrors.password = 'Password must contain at least 1 symbol (!@#$%^&*...)';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addAuditLog = (action, resource, status = 'Success') => {
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

    if (dataStore) {
      dataStore.addAuditLog(newLog);
    }
  };

 const handleAddUser = () => {
  if (validateUserForm()) {
    if (editingUserId) {
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
    } else {
      const user = {
        id: tempUserData.userId,
        firstName: tempUserData.firstName,  
        lastName: tempUserData.lastName,   
        name: `${tempUserData.firstName} ${tempUserData.lastName}`,
        email: tempUserData.email, 
         role: tempUserData.role,
        organizationUnitId: tempUserData.organizationUnitId,
        organizationPosition: tempUserData.organizationPosition,
        status: 'Active',
        password: passwordData.password 
      };
      
      if (dataStore) {
        dataStore.addUser(user);
      }
      addAuditLog('User Created', `${tempUserData.userId} - ${user.name}`, 'Success');
      
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
    }
  }
};


  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const deletedUser = userList.find(user => user.id === userId);
      
    
      if (dataStore) {
        dataStore.deleteUser(userId);
      }
      
      if (deletedUser) {
        addAuditLog('User Deleted', `${deletedUser.id} - ${deletedUser.name}`, 'Success');
      }
      setOpenMenuUserId(null);
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

 const handleVerifyAdmin = () => {
  if (adminVerificationPassword === 'admin123') {
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
    setErrors({ adminPassword: 'Incorrect admin password' });
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
    const matchesStatus = userFilterStatus === 'All' || user.status === userFilterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
};

  const getFilteredLogs = () => {
    const auditLogs = dataStore ? dataStore.getAllAuditLogs() : [];
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(logSearchQuery.toLowerCase());
      
      const matchesAction = logFilterAction === 'All' || log.action === logFilterAction;
      const matchesStatus = logFilterStatus === 'All' || log.status === logFilterStatus;
      
      return matchesSearch && matchesAction && matchesStatus;
    });
  };


  const getActions = () => {
    const auditLogs = dataStore ? dataStore.getAllAuditLogs() : [];
    const actions = [...new Set(auditLogs.map(log => log.action))];
    return actions.filter(action => action);
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
        currentUser={currentUser}
         customization={customization}
         dataStore={dataStore}
      />
      

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          menuItems={menuItems}
          activeSection={activeSection}
          currentUser={currentUser}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          onCustomize={handleCustomize}
          onConfigureUserId={handleConfigureUserId}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <AdminDashboard
              userList={userList}
              documentList={documentList}
              dataStore={dataStore}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'organization' && (
            <OrganizationalStructure
              organizationTree={organizationTree}
              setOrganizationTree={setOrganizationTree}
              userList={userList}
              setShowOrgUnitModal={setShowOrgUnitModal}
              setSelectedOrgUnit={setSelectedOrgUnit}
              setParentOrgUnit={setParentOrgUnit}
              onDeleteOrgUnit={handleDeleteOrgUnit}
            />
          )}
          {activeSection === 'org-users' && (
            <OrgUnitUsersView
              organizationTree={organizationTree}
              userList={userList}
              onUserClick={(user) => {
                console.log('User clicked:', user);
              }}
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
              handleMenuClick={handleMenuClick}
              setShowAddUserModal={setShowAddUserModal}
              openMenuUserId={openMenuUserId}
            />
          )}
          {activeSection === 'all-documents' && (
            <AdminAllDocumentsView 
              dataStore={dataStore}
              userList={userList}
              onViewDocument={handleViewDocument}        
              onDownloadDocument={handleDownloadDocument}
            />
          )}
          {activeSection === 'org-shares' && (
            <AdminOrgSharesView 
              dataStore={dataStore}
              organizationTree={organizationTree}
              onViewDocument={handleViewDocument}     
             onDownloadDocument={handleDownloadDocument}
            />
          )}
          {activeSection === 'logs' && (
            <AdminLogAudits
              auditLogs={dataStore ? dataStore.getAllAuditLogs() : []}
              logSearchQuery={logSearchQuery}
              setLogSearchQuery={setLogSearchQuery}
              logFilterAction={logFilterAction}
              setLogFilterAction={setLogFilterAction}
              logFilterStatus={logFilterStatus}
              setLogFilterStatus={setLogFilterStatus}
              getActions={getActions}
              getFilteredLogs={getFilteredLogs}
            />
          )}
        </div>
      </div>
    </div>
  );
}