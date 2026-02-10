import { useState, useEffect } from 'react';
import LoginInterface from './LoginInterface';
import MainFrame from './admin/Mainframe';
import SystemAdminMainFrame from './system-admin/Mainframe';
import UserMainFrame from './user/UserMainFrame';
import { setAuthTokens, getAccessToken } from './services/api';

const createDataStore = () => ({
  allDocuments: [],
  allOrgShares: [],
  allDirectShares: [],
  auditLogs: [],
  users: [],
  organizationTree: [],
  deletedDocuments: [],
   customization: {  
    systemName: 'Record Keeping Management System',
    systemLogo: null,
    loginBackground: null,
    primaryColor: '#4F46E5',
    sidebarGradientStart: '#4F46E5',
    sidebarGradientEnd: '#7C3AED',
    
  },
    userIdFormat: {  
    format: {
      prefix: 'TUPM',
      adminSeparator: '_',
      userSeparator: '-',
      segmentCount: 2,
      segmentLength: [2, 4],
      autoIncrement: true,
      customFormat: false
    },
    customPattern: {
      admin: 'TUPM_XX_XXXX',
      user: 'TUPM-XX-XXXX'
    },
    previewIds: {
      admin: 'TUPM_01_0001',
      user: 'TUPM-01-0001'
    }
  },
  listeners: [],
  

  addAuditLog(log) {
    this.auditLogs.unshift(log);
    this.notifyListeners();
  },
  
  getAllAuditLogs() {
    return this.auditLogs;
  },
  

  addDocument(doc) {
    this.allDocuments.push(doc);
    this.notifyListeners();
  },
  
  getAllDocuments() {
    return this.allDocuments;
  },
  
  getDocumentsByUser(userId) {
    return this.allDocuments.filter(doc => doc.createdBy === userId);
  },
  updateDocument(docId, updates) {
  this.allDocuments = this.allDocuments.map(doc => 
    doc.id === docId ? { ...doc, ...updates } : doc
  );
  this.notifyListeners();
  },
  deleteDocument(docId) {
    this.allDocuments = this.allDocuments.filter(doc => doc.id !== docId);
    this.notifyListeners();
  },
  moveToRecycleBin(doc) {
  const deletedDoc = {
    ...doc,
    deletedAt: new Date().toLocaleString(),
    deletedBy: doc.createdBy
  };
  this.deletedDocuments.push(deletedDoc);
  this.deleteDocument(doc.id); 
  this.notifyListeners();
},

restoreFromRecycleBin(docId) {
  const doc = this.deletedDocuments.find(d => d.id === docId);
  if (doc) {
    const { deletedAt, deletedBy, ...restoredDoc } = doc;
    this.addDocument(restoredDoc);
    this.deletedDocuments = this.deletedDocuments.filter(d => d.id !== docId);
    this.notifyListeners();
  }
},

permanentlyDelete(docId) {
  this.deletedDocuments = this.deletedDocuments.filter(d => d.id !== docId);
  this.notifyListeners();
},

emptyRecycleBin(userId) {
  this.deletedDocuments = this.deletedDocuments.filter(d => d.createdBy !== userId);
  this.notifyListeners();
},

getDeletedDocuments() {
  return this.deletedDocuments;
},

  addOrgShare(share) {
    this.allOrgShares.push(share);
    this.notifyListeners();
  },
  
  getAllOrgShares() {
    return this.allOrgShares;
  },
  
  addDirectShare(share) {
    this.allDirectShares.push(share);
    this.notifyListeners();
  },
  
  getAllDirectShares() {
    return this.allDirectShares;
  },
  

  addUser(user) {
    this.users.push(user);
    this.notifyListeners();
  },
  
  updateUser(userId, updatedData) {
    this.users = this.users.map(user => 
      user.id === userId ? { ...user, ...updatedData } : user
    );
    this.notifyListeners();
  },
  
  deleteUser(userId) {
    this.users = this.users.filter(user => user.id !== userId);
    this.notifyListeners();
  },
  
  getAllUsers() {
    return this.users;
  },
  
  getUserById(userId) {
    return this.users.find(user => user.id === userId);
  },
  
  verifyUser(userId, password) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    
    if (user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
  
 
  setOrganizationTree(tree) {
    this.organizationTree = tree;
    this.notifyListeners();
  },
  
  getOrganizationTree() {
    return this.organizationTree;
  },
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
    setCustomization(settings) {
    this.customization = { ...this.customization, ...settings };
    
   
    try {
      localStorage.setItem('rkms_customization', JSON.stringify(this.customization));
    } catch (e) {
      console.error('Error saving customization:', e);
    }
    

    this.notifyListeners();
  },
    getCustomization() {

    const saved = localStorage.getItem('rkms_customization');
    if (saved) {
      try {
        this.customization = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading customization:', e);
      }
    }
    return this.customization;
  },
setUserIdFormat(settings) {
    this.userIdFormat = { ...settings };
    this.notifyListeners();
    

    try {
      localStorage.setItem('rkms_userid_format', JSON.stringify(this.userIdFormat));
    } catch (e) {
      console.error('Error saving user ID format:', e);
    }
  },
  
  getUserIdFormat() {
    const saved = localStorage.getItem('rkms_userid_format');
    if (saved) {
      try {
        this.userIdFormat = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading user ID format:', e);
      }
    }
    return this.userIdFormat;
  },
  
validateUserId(userId, userType) {
  const format = this.getUserIdFormat();
  
  if (!format || !format.format) {
    if (userType === 'admin') {
      return /^TUPM_\d{2}_\d{4}$/.test(userId);
    } else {
      return /^TUPM-\d{2}-\d{4}$/.test(userId);
    }
  }
  
  if (format.format.customFormat) {
    const pattern = userType === 'admin' ? format.customPattern.admin : format.customPattern.user;
    const regexPattern = pattern.replace(/X/g, '\\d');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(userId);
  } else {
    const separator = userType === 'admin' ? format.format.adminSeparator : format.format.userSeparator;
    const prefix = format.format.prefix;
    

    let regexStr = `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    for (let i = 0; i < format.format.segmentCount; i++) {
      if (separator) {
        regexStr += separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      regexStr += `\\d{${format.format.segmentLength[i] || 2}}`;
    }
    regexStr += '$';
    
    const regex = new RegExp(regexStr);
    return regex.test(userId);
  }
},
  
  determineUserType(userId) {
    const format = this.getUserIdFormat();
    
    if (format.format.customFormat) {
 
      const adminPattern = format.customPattern.admin.replace(/X/g, '\\d');
      const userPattern = format.customPattern.user.replace(/X/g, '\\d');
      
      if (new RegExp(`^${adminPattern}$`).test(userId)) return 'admin';
      if (new RegExp(`^${userPattern}$`).test(userId)) return 'user';
      return null;
    } else {
  
      if (userId.includes(format.format.adminSeparator)) {
        return 'admin';
      } else if (userId.includes(format.format.userSeparator)) {
        return 'user';
      }
      return null;
    }
  },
  

  generatePlaceholderId(userType) {
    const format = this.getUserIdFormat();
    
    if (format.format.customFormat) {
      return userType === 'admin' ? format.customPattern.admin : format.customPattern.user;
    } else {
      const separator = userType === 'admin' ? format.format.adminSeparator : format.format.userSeparator;
      let id = format.format.prefix;
      
      for (let i = 0; i < format.format.segmentCount; i++) {
        id += separator + 'X'.repeat(format.format.segmentLength[i] || 2);
      }
      
      return id;
    }
  },
  
 resetCustomization() {
    this.customization = {
      systemName: 'Record Keeping Management System',
      systemLogo: null,
      loginBackground: null,
      primaryColor: '#4F46E5',
      sidebarGradientStart: '#4F46E5',
      sidebarGradientEnd: '#7C3AED'
    };
    localStorage.removeItem('rkms_customization');
    this.notifyListeners(); 
  },
  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
});


const AppDataStore = createDataStore();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored tokens on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('currentUser');
    
    if (accessToken && refreshToken && storedUser) {
      // Restore tokens and user session
      setAuthTokens(accessToken, refreshToken);
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsLoggedIn(true);
        console.log('Restored user session from localStorage:', userData);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    // Store user data for session restoration
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    // Clear JWT tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <LoginInterface onLoginSuccess={handleLoginSuccess} dataStore={AppDataStore} />;
  }

  // Route based on user type
  if (currentUser.userType === 'system-admin') {
    return (
      <SystemAdminMainFrame 
        currentUser={currentUser} 
        onLogout={handleLogout}
        dataStore={AppDataStore}
      />
    );
  } else if (currentUser.userType === 'admin') {
    return (
      <MainFrame 
        currentUser={currentUser} 
        onLogout={handleLogout}
        dataStore={AppDataStore}
      />
    );
  } else {
    return (
      <UserMainFrame 
        currentUser={currentUser} 
        onLogout={handleLogout}
        organizationTree={AppDataStore.getOrganizationTree()}
        dataStore={AppDataStore}
      />
    );
  }
}