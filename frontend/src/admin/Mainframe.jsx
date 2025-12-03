// ============================================
// FILE: Mainframe.jsx (UPDATED - IMPORTS ALL SEPARATED COMPONENTS)
// ============================================
import { useState } from 'react';
import { LayoutDashboard, Users, FileText, ClipboardList } from 'lucide-react';

// Import separated components
import AdminSidebar from './component/AdminSidebar';
import AdminHeader from './component/AdminHeader';
import AdminDashboard from './component/AdminDashboard';
import AdminUserManagement from './component/AdminUserManagement';
import AdminDocuments from './component/AdminDocuments';
import AdminLogAudits from './component/AdminLogAudits';
import { 
  UserActionMenu, 
  AdminVerificationModal, 
  AddUserModal, 
  PasswordModal, 
  EditPasswordModal 
} from './component/AdminModals';

export default function Mainframe({ currentUser = { name: 'Administrator', role: 'Admin' }, onLogout = () => {} }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userList, setUserList] = useState([]);
  const [documentList, setDocumentList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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
    name: '',
    role: 'User',
    department: '',
    jobTitle: ''
  });
  const [userIdFormatValid, setUserIdFormatValid] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Search and Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterDepartment, setUserFilterDepartment] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('All');
  const [logFilterStatus, setLogFilterStatus] = useState('All');
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [documentFilterType, setDocumentFilterType] = useState('All');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'logs', label: 'Log Audits', icon: ClipboardList }
  ];

  const validateUserIdFormat = (userId, role) => {
    if (!userId) return null;
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

    if (!newUser.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!newUser.department) {
      newErrors.department = 'Department is required';
    }

    if (!newUser.jobTitle.trim()) {
      newErrors.jobTitle = 'Job Title is required';
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
      user: currentUser.name,
      action: action,
      resource: resource,
      status: status
    };

    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleAddUser = () => {
    if (validateUserForm()) {
      if (editingUserId) {
        // Update existing user info
        const updatedUsers = userList.map(user => 
          user.id === editingUserId 
            ? { ...user, name: newUser.name, department: newUser.department, jobTitle: newUser.jobTitle, role: newUser.role }
            : user
        );
        setUserList(updatedUsers);
        addAuditLog('User Updated', `${editingUserId} - Personal info updated`, 'Success');
        setShowAddUserModal(false);
        setEditingUserId(null);
        setNewUser({ userId: '', name: '', role: 'User', department: '', jobTitle: '' });
        setTempUserData(null);
        setErrors({});
        alert('User information updated successfully!');
      } else {
        // Create new user
        setTempUserData({
          userId: newUser.userId,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          jobTitle: newUser.jobTitle
        });
        setShowAddUserModal(false);
        setShowPasswordModal(true);
      }
    }
  };

  const handleSaveUser = () => {
    if (validatePasswordForm()) {
      if (editingUserId) {
        // Update existing user password
        addAuditLog('Password Changed', `${editingUserId} - Password updated`, 'Success');
        setShowEditPasswordModal(false);
        setEditingUserId(null);
        setPasswordData({ password: '', confirmPassword: '' });
        setErrors({});
        alert('Password updated successfully!');
      } else {
        // Create new user
        const user = {
          id: tempUserData.userId,
          name: tempUserData.name,
          role: tempUserData.role,
          department: tempUserData.department,
          jobTitle: tempUserData.jobTitle,
          status: 'Active'
        };
        
        setUserList([...userList, user]);
        addAuditLog('User Created', `${tempUserData.userId} - ${tempUserData.name}`, 'Success');
        
        setShowPasswordModal(false);
        setNewUser({
          userId: '',
          name: '',
          role: 'User',
          department: '',
          jobTitle: ''
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
      setUserList(userList.filter(user => user.id !== userId));
      
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
    // Verify admin password (in production, this should check against actual admin password)
    if (adminVerificationPassword === 'admin123') {
      setShowAdminVerificationModal(false);
      if (showEditPasswordModal) {
        // Proceed to password edit
        setPasswordData({ password: '', confirmPassword: '' });
      } else {
        // Proceed to personal info edit
        const user = userList.find(u => u.id === editingUserId);
        if (user) {
          setNewUser({
            userId: user.id,
            name: user.name,
            role: user.role,
            department: user.department,
            jobTitle: user.jobTitle
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

  const handleCustomize = () => {
    alert('Customize interface - Coming soon!');
    setShowSettingsMenu(false);
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

  // Filter Users
  const getFilteredUsers = () => {
    return userList.filter(user => {
      const matchesSearch = 
        user.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.jobTitle.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = userFilterRole === 'All' || user.role === userFilterRole;
      const matchesDepartment = userFilterDepartment === 'All' || user.department === userFilterDepartment;
      const matchesStatus = userFilterStatus === 'All' || user.status === userFilterStatus;
      
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  };

  // Filter Audit Logs
  const getFilteredLogs = () => {
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

  // Get unique departments from user list
  const getDepartments = () => {
    const departments = [...new Set(userList.map(user => user.department))];
    return departments.filter(dept => dept);
  };

  // Get unique actions from audit logs
  const getActions = () => {
    const actions = [...new Set(auditLogs.map(log => log.action))];
    return actions.filter(action => action);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* User Action Menu */}
      <UserActionMenu
        openMenuUserId={openMenuUserId}
        menuPosition={menuPosition}
        setOpenMenuUserId={setOpenMenuUserId}
        handleEditUser={handleEditUser}
        handleEditPassword={handleEditPassword}
        handleDeleteUser={handleDeleteUser}
      />

      {/* Admin Verification Modal */}
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

      {/* Add User Modal */}
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
      />

      {/* Password Modal */}
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

      {/* Edit Password Modal */}
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

      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader
          menuItems={menuItems}
          activeSection={activeSection}
          currentUser={currentUser}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          handleCustomize={handleCustomize}
          onLogout={onLogout}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <AdminDashboard
              userList={userList}
              documentList={documentList}
              auditLogs={auditLogs}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'users' && (
            <AdminUserManagement
              userList={userList}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userFilterRole={userFilterRole}
              setUserFilterRole={setUserFilterRole}
              userFilterDepartment={userFilterDepartment}
              setUserFilterDepartment={setUserFilterDepartment}
              userFilterStatus={userFilterStatus}
              setUserFilterStatus={setUserFilterStatus}
              getDepartments={getDepartments}
              getFilteredUsers={getFilteredUsers}
              handleMenuClick={handleMenuClick}
              setShowAddUserModal={setShowAddUserModal}
              openMenuUserId={openMenuUserId}
            />
          )}
          {activeSection === 'documents' && (
            <AdminDocuments
              documentList={documentList}
            />
          )}
          {activeSection === 'logs' && (
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
          )}
        </div>
      </div>
    </div>
  );
}