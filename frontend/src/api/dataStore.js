import {
  userService,
  organizationService,
  customFieldService,
  folderService,
  documentService,
  directShareService,
  organizationShareService,
  auditLogService,
  customizationService,
  userIdFormatService,
} from './services';

const createDataStore = () => ({
  // Cache
  cache: {
    users: [],
    documents: [],
    organizationTree: [],
    auditLogs: [],
    customFields: [],
    folders: [],
    directShares: [],
    orgShares: [],
    deletedDocuments: [],
    customization: null,
    userIdFormat: null,
  },
  
  listeners: [],
  isInitialized: false,

  // Initialize data from backend
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await Promise.all([
        this.loadUsers(),
        this.loadOrganizationTree(),
        this.loadCustomization(),
        this.loadUserIdFormat(),
        this.loadAuditLogs(),      
        this.loadOrgShares(),     
        this.loadDocuments(), 
      ]);
      
      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize data store:', error);
      throw error;
    }
  },

  // Users
  async loadUsers() {
    try {
      this.cache.users = await userService.getAll();
      this.notifyListeners();
      return this.cache.users;
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  },

  async addUser(user) {
    try {
      const newUser = await userService.create(user);
      this.cache.users.push(newUser);
      this.notifyListeners();
      return newUser;
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  },

  async updateUser(userId, updatedData) {
    try {
      const updated = await userService.update(userId, updatedData);
      this.cache.users = this.cache.users.map(user =>
        user.user_id === userId ? updated : user
      );
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      await userService.delete(userId);
      this.cache.users = this.cache.users.filter(user => user.user_id !== userId);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  getAllUsers() {
    return this.cache.users;
  },

  getUserById(userId) {
    return this.cache.users.find(user => user.user_id === userId);
  },

  // Organization Tree
  async loadOrganizationTree() {
    try {
      this.cache.organizationTree = await organizationService.getAll();
      this.notifyListeners();
      return this.cache.organizationTree;
    } catch (error) {
      console.error('Failed to load organization tree:', error);
      return [];
    }
  },

  async addOrgUnit(data) {
    try {
      await organizationService.create(data);
      await this.loadOrganizationTree();
    } catch (error) {
      console.error('Failed to add org unit:', error);
      throw error;
    }
  },

  async updateOrgUnit(id, data) {
    try {
      await organizationService.update(id, data);
      await this.loadOrganizationTree();
    } catch (error) {
      console.error('Failed to update org unit:', error);
      throw error;
    }
  },

  async deleteOrgUnit(id) {
    try {
      await organizationService.delete(id);
      await this.loadOrganizationTree();
    } catch (error) {
      console.error('Failed to delete org unit:', error);
      throw error;
    }
  },

  getOrganizationTree() {
    return this.cache.organizationTree;
  },

  setOrganizationTree(tree) {
    this.cache.organizationTree = tree;
    this.notifyListeners();
  },

  // Custom Fields
  async loadCustomFields() {
    try {
      this.cache.customFields = await customFieldService.getAll();
      this.notifyListeners();
      return this.cache.customFields;
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      return [];
    }
  },

  async addCustomField(field) {
    try {
      const newField = await customFieldService.create(field);
      this.cache.customFields.push(newField);
      this.notifyListeners();
      return newField;
    } catch (error) {
      console.error('Failed to add custom field:', error);
      throw error;
    }
  },

  async deleteCustomField(id) {
    try {
      await customFieldService.delete(id);
      this.cache.customFields = this.cache.customFields.filter(f => f.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      throw error;
    }
  },

  // Folders
  async loadFolders() {
    try {
      this.cache.folders = await folderService.getAll();
      this.notifyListeners();
      return this.cache.folders;
    } catch (error) {
      console.error('Failed to load folders:', error);
      return [];
    }
  },

  async addFolder(folder) {
    try {
      const newFolder = await folderService.create(folder);
      this.cache.folders.push(newFolder);
      this.notifyListeners();
      return newFolder;
    } catch (error) {
      console.error('Failed to add folder:', error);
      throw error;
    }
  },

  async deleteFolder(id) {
    try {
      await folderService.delete(id);
      this.cache.folders = this.cache.folders.filter(f => f.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  // Documents
  async loadDocuments(userId) {
    try {
      const allDocs = await documentService.getAll();
      this.cache.documents = allDocs.filter(doc => doc.user === userId);
      this.notifyListeners();
      return this.cache.documents;
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  },

  async addDocument(doc) {
    try {
      const newDoc = await documentService.create(doc);
      this.cache.documents.push(newDoc);
      this.notifyListeners();
      return newDoc;
    } catch (error) {
      console.error('Failed to add document:', error);
      throw error;
    }
  },

  async updateDocument(docId, updates) {
    try {
      const updated = await documentService.update(docId, updates);
      this.cache.documents = this.cache.documents.map(doc =>
        doc.id === docId ? updated : doc
      );
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  },

  async deleteDocument(docId) {
    try {
      await documentService.delete(docId);
      this.cache.documents = this.cache.documents.filter(doc => doc.id !== docId);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },

  async moveToRecycleBin(doc) {
    try {
      await documentService.moveToRecycleBin(doc.id);
      this.cache.documents = this.cache.documents.filter(d => d.id !== doc.id);
      await this.loadDeletedDocuments();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to move to recycle bin:', error);
      throw error;
    }
  },

  async restoreFromRecycleBin(docId) {
    try {
      await documentService.restore(docId);
      await this.loadDeletedDocuments();
      // Reload documents to get the restored one
      const currentUser = JSON.parse(localStorage.getItem('user_data'));
      await this.loadDocuments(currentUser.user_id);
    } catch (error) {
      console.error('Failed to restore document:', error);
      throw error;
    }
  },

  async permanentlyDelete(docId) {
    try {
      await documentService.delete(docId);
      this.cache.deletedDocuments = this.cache.deletedDocuments.filter(d => d.id !== docId);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to permanently delete:', error);
      throw error;
    }
  },

  async emptyRecycleBin() {
    try {
      await documentService.emptyRecycleBin();
      this.cache.deletedDocuments = [];
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to empty recycle bin:', error);
      throw error;
    }
  },

  async loadDeletedDocuments() {
    try {
      this.cache.deletedDocuments = await documentService.getDeleted();
      this.notifyListeners();
      return this.cache.deletedDocuments;
    } catch (error) {
      console.error('Failed to load deleted documents:', error);
      return [];
    }
  },

  getAllDocuments() {
    return this.cache.documents;
  },

  getDocumentsByUser(userId) {
    return this.cache.documents.filter(doc => doc.user === userId);
  },

  getDeletedDocuments() {
    return this.cache.deletedDocuments;
  },

  // Direct Shares
  async loadDirectShares() {
    try {
      this.cache.directShares = await directShareService.getAll();
      this.notifyListeners();
      return this.cache.directShares;
    } catch (error) {
      console.error('Failed to load direct shares:', error);
      return [];
    }
  },

  async addDirectShare(share) {
    try {
      await directShareService.create(share);
      await this.loadDirectShares();
    } catch (error) {
      console.error('Failed to add direct share:', error);
      throw error;
    }
  },

  async removeDirectShare(id) {
    try {
      await directShareService.delete(id);
      this.cache.directShares = this.cache.directShares.filter(s => s.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove direct share:', error);
      throw error;
    }
  },

  getAllDirectShares() {
    return this.cache.directShares;
  },

  // Organization Shares
  async loadOrgShares() {
    try {
      this.cache.orgShares = await organizationShareService.getAll();
      this.notifyListeners();
      return this.cache.orgShares;
    } catch (error) {
      console.error('Failed to load org shares:', error);
      return [];
    }
  },

  async addOrgShare(share) {
    try {
      await organizationShareService.create(share);
      await this.loadOrgShares();
    } catch (error) {
      console.error('Failed to add org share:', error);
      throw error;
    }
  },

  getAllOrgShares() {
    return this.cache.orgShares;
  },

  // Audit Logs
  async loadAuditLogs() {
    try {
      this.cache.auditLogs = await auditLogService.getAll();
      this.notifyListeners();
      return this.cache.auditLogs;
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  },

  addAuditLog(log) {
    // Logs are created on the backend automatically
    // Just reload to get the latest
    this.loadAuditLogs();
  },

  getAllAuditLogs() {
    return this.cache.auditLogs;
  },

  // Customization
  async loadCustomization() {
    try {
      this.cache.customization = await customizationService.getCurrent();
      this.notifyListeners();
      return this.cache.customization;
    } catch (error) {
      console.error('Failed to load customization:', error);
      return null;
    }
  },

  async setCustomization(settings) {
    try {
      this.cache.customization = await customizationService.update(settings);
      this.notifyListeners();
      return this.cache.customization;
    } catch (error) {
      console.error('Failed to update customization:', error);
      throw error;
    }
  },

  getCustomization() {
    return this.cache.customization;
  },

  // User ID Format
  async loadUserIdFormat() {
    try {
      this.cache.userIdFormat = await userIdFormatService.getCurrent();
      this.notifyListeners();
      return this.cache.userIdFormat;
    } catch (error) {
      console.error('Failed to load user ID format:', error);
      return null;
    }
  },

  async setUserIdFormat(settings) {
    try {
      this.cache.userIdFormat = await userIdFormatService.update(settings);
      this.notifyListeners();
      return this.cache.userIdFormat;
    } catch (error) {
      console.error('Failed to update user ID format:', error);
      throw error;
    }
  },

  getUserIdFormat() {
    return this.cache.userIdFormat;
  },

  // Validation helpers
  validateUserId(userId, userType) {
    const format = this.getUserIdFormat();
    if (!format) return true; // Skip validation if format not loaded
    
    // Implement validation logic based on format
    return true; // Simplified for now
  },

  // Listeners
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  },
});

export default createDataStore();