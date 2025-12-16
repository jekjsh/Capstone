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


  normalizeArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;

  console.error('Expected array but got:', response);
  return [];
},

  // Transform backend user data to frontend format
  transformUser(backendUser) {
    return {
      id: backendUser.user_id,
      firstName: backendUser.first_name,
      lastName: backendUser.last_name,
      name: `${backendUser.first_name} ${backendUser.last_name}`,
      email: backendUser.email,
      role: backendUser.role,
      status: backendUser.is_active ? 'Active' : 'Inactive',
      organizationUnitId: backendUser.organization_unit,
      organizationPosition: backendUser.organization_position,
      jobTitle: backendUser.job_title || '',
      department: backendUser.department || '',
      password: backendUser.password, // Only used during creation
    };
  },

  // Transform frontend user data to backend format
  transformUserForBackend(frontendUser) {
    return {
      user_id: frontendUser.id || frontendUser.userId,
      first_name: frontendUser.firstName,
      last_name: frontendUser.lastName,
      email: frontendUser.email,
      role: frontendUser.role,
      is_active: frontendUser.status === 'Active',
      organization_unit: frontendUser.organizationUnitId || null,
      organization_position: frontendUser.organizationPosition || '',
      job_title: frontendUser.jobTitle || '',
      department: frontendUser.department || '',
      password: frontendUser.password,
    };
  },

  // Transform backend document to frontend format
  transformDocument(backendDoc) {
    return {
      id: backendDoc.id?.toString(),
      title: backendDoc.title,
      description: backendDoc.description || '',
      format: backendDoc.format || 'other',
      content: backendDoc.content || '',
      ocrContent: backendDoc.ocr_content || '',
      fileData: backendDoc.file_data || '',
      fileName: backendDoc.file_name || '',
      fileSize: backendDoc.file_size || '',
      mimeType: backendDoc.mime_type || '',
      folderId: backendDoc.folder?.toString() || null,
      customFieldValues: backendDoc.custom_field_values || {},
      personalInfo: backendDoc.personal_info || {},
      createdAt: backendDoc.created_at || new Date().toLocaleString(),
      createdBy: backendDoc.user,
      isDeleted: backendDoc.is_deleted || false,
      deletedAt: backendDoc.deleted_at || null,
    };
  },

  // Transform frontend document to backend format
  transformDocumentForBackend(frontendDoc) {
    return {
      id: frontendDoc.id,
      title: frontendDoc.title,
      description: frontendDoc.description || '',
      format: frontendDoc.format || 'other',
      content: frontendDoc.content || '',
      ocr_content: frontendDoc.ocrContent || '',
      file_data: frontendDoc.fileData || '',
      file_name: frontendDoc.fileName || '',
      file_size: frontendDoc.fileSize || '',
      mime_type: frontendDoc.mimeType || '',
      folder: frontendDoc.folderId || null,
      custom_field_values: frontendDoc.customFieldValues || {},
      personal_info: frontendDoc.personalInfo || {},
      user: frontendDoc.createdBy,
    };
  },

  // Initialize data from backend
  async initialize() {
    if (this.isInitialized) return;

    
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      
      await Promise.all([
        this.loadUsers(),
        this.loadOrganizationTree(),
        this.loadCustomization(),
        this.loadUserIdFormat(),
        this.loadAuditLogs(),
        this.loadOrgShares(),
        currentUser.user_id ? this.loadDocuments(currentUser.user_id) : Promise.resolve(),
        currentUser.user_id ? this.loadCustomFields() : Promise.resolve(),
        currentUser.user_id ? this.loadFolders() : Promise.resolve(),
        currentUser.user_id ? this.loadDirectShares() : Promise.resolve(),
        currentUser.user_id ? this.loadDeletedDocuments() : Promise.resolve(),
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
      const backendUsers = this.normalizeArray(await userService.getAll());
      this.cache.users = backendUsers.map(user => this.transformUser(user));
      this.notifyListeners();
      return this.cache.users;
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  },

  async addUser(user) {
    try {
      const backendUser = this.transformUserForBackend(user);
      const newUser = await userService.create(backendUser);
      const transformedUser = this.transformUser(newUser);
      this.cache.users.push(transformedUser);
      this.notifyListeners();
      return transformedUser;
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  },

  async updateUser(userId, updatedData) {
    try {
      const backendData = this.transformUserForBackend({ ...updatedData, id: userId });
      const updated = await userService.update(userId, backendData);
      const transformedUser = this.transformUser(updated);
      this.cache.users = this.cache.users.map(user =>
        user.id === userId ? transformedUser : user
      );
      this.notifyListeners();
      return transformedUser;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      await userService.delete(userId);
      this.cache.users = this.cache.users.filter(user => user.id !== userId);
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
    return this.cache.users.find(user => user.id === userId);
  },

  // Organization Tree
  async loadOrganizationTree() {
    try {
      const tree = this.normalizeArray(await organizationService.getAll());

      this.cache.organizationTree = tree;
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
      const fields = this.normalizeArray(await customFieldService.getAll());

      this.cache.customFields = fields.map(field => ({
        id: field.id?.toString(),
        name: field.name,
        type: field.field_type,
        showInDocuments: field.show_in_documents !== false,
        required: field.required || false,
        options: field.options || [],
      }));
      this.notifyListeners();
      return this.cache.customFields;
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      return [];
    }
  },

  async addCustomField(field) {
    try {
      const backendField = {
        name: field.name,
        field_type: field.type,
        show_in_documents: field.showInDocuments !== false,
        required: field.required || false,
        options: field.options || [],
      };
      const newField = await customFieldService.create(backendField);
      const transformedField = {
        id: newField.id?.toString(),
        name: newField.name,
        type: newField.field_type,
        showInDocuments: newField.show_in_documents !== false,
        required: newField.required || false,
        options: newField.options || [],
      };
      this.cache.customFields.push(transformedField);
      this.notifyListeners();
      return transformedField;
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
      const folders = this.normalizeArray(await folderService.getAll());
      this.cache.folders = folders.map(folder => ({
        id: folder.id?.toString(),
        name: folder.name,
        color: folder.color || 'blue',
        createdAt: folder.created_at || new Date().toLocaleString(),
        documentCount: 0,
      }));
      this.notifyListeners();
      return this.cache.folders;
    } catch (error) {
      console.error('Failed to load folders:', error);
      return [];
    }
  },

  async addFolder(folder) {
    try {
      const backendFolder = {
        name: folder.name,
        color: folder.color || 'blue',
      };
      const newFolder = await folderService.create(backendFolder);
      const transformedFolder = {
        id: newFolder.id?.toString(),
        name: newFolder.name,
        color: newFolder.color || 'blue',
        createdAt: newFolder.created_at || new Date().toLocaleString(),
        documentCount: 0,
      };
      this.cache.folders.push(transformedFolder);
      this.notifyListeners();
      return transformedFolder;
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
      const allDocs = this.normalizeArray(await documentService.getAll());

      const backendDocs = allDocs.filter(doc => doc.user === userId && !doc.is_deleted);
      this.cache.documents = backendDocs.map(doc => this.transformDocument(doc));
      this.notifyListeners();
      return this.cache.documents;
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  },

async addDocument(doc) {
  try {
    console.log('📦 Adding document:', doc.title);
    console.log('📋 createdBy value:', doc.createdBy, 'type:', typeof doc.createdBy);
    
    // Ensure user is a string, not an array
    let userId = doc.createdBy;
    if (Array.isArray(userId)) {
      console.warn('⚠️ User is an array, extracting first element');
      userId = userId[0];
    }
    
    userId = String(userId);
    
    console.log('✅ Final userId:', userId, 'type:', typeof userId);
    
    // ✅ DON'T send id - let backend generate it
    const backendDoc = {
      // id: doc.id,  ❌ REMOVE THIS LINE
      title: doc.title,
      description: doc.description || '',
      format: doc.format || 'other',
      content: doc.content || '',
      ocr_content: doc.ocrContent || '',
      file_name: doc.fileName || '',
      file_size: doc.fileSize || '',
      file_data: doc.fileData || '',
      mime_type: doc.mimeType || '',
      folder: doc.folderId || null,
      custom_field_values: doc.customFieldValues || {},
      personal_info: doc.personalInfo || {},
      user: userId
    };
    
    console.log('🚀 Sending to backend:', {
      title: backendDoc.title,
      user: backendDoc.user,
      folder: backendDoc.folder,
      hasFileData: !!backendDoc.file_data
    });

    const newDoc = await documentService.create(backendDoc);
    console.log('✅ Backend response:', newDoc);
    
    const transformedDoc = this.transformDocument(newDoc);
    this.cache.documents.push(transformedDoc);
    this.notifyListeners();
    
    return transformedDoc;
  } catch (error) {
    console.error('❌ Failed to add document:', error);
    if (error.response) {
      console.error('Server error response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    throw error;
  }
},
async updateDocument(docId, updates) {
    try {
      const backendUpdates = this.transformDocumentForBackend({ ...updates, id: docId });
      const updated = await documentService.update(docId, backendUpdates);
      const transformedDoc = this.transformDocument(updated);
      this.cache.documents = this.cache.documents.map(doc =>
        doc.id === docId ? transformedDoc : doc
      );
      this.notifyListeners();
      return transformedDoc;
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
    const currentUser = JSON.parse(localStorage.getItem('user_data'));
    if (currentUser?.user_id) {
      await this.loadDocuments(currentUser.user_id);
    }
  } catch (error) {
    console.error('Failed to restore document:', error);
    // Provide more helpful error message
    if (error.response?.status === 404) {
      throw new Error('Document not found. It may have already been restored or permanently deleted.');
    }
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
      const currentUser = JSON.parse(localStorage.getItem('user_data'));
      if (currentUser?.user_id) {
        this.cache.deletedDocuments = this.cache.deletedDocuments.filter(
          d => d.createdBy !== currentUser.user_id
        );
      } else {
        this.cache.deletedDocuments = [];
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to empty recycle bin:', error);
      throw error;
    }
  },

  async loadDeletedDocuments() {
    try {
      const deletedDocs = this.normalizeArray(await documentService.getDeleted());

      this.cache.deletedDocuments = deletedDocs.map(doc => this.transformDocument(doc));
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
    return this.cache.documents.filter(doc => doc.createdBy === userId);
  },

  getDeletedDocuments() {
    return this.cache.deletedDocuments;
  },

  // Direct Shares
  async loadDirectShares() {
    try {
      const shares = this.normalizeArray(await directShareService.getAll());

      this.cache.directShares = shares.map(share => ({
        id: share.id?.toString(),
        documentId: share.document?.toString(),
        document: share.document_data ? this.transformDocument(share.document_data) : null,
        sharedWith: Array.isArray(share.shared_with) ? share.shared_with : [],
        sharedBy: share.shared_by,
        permission: share.permission || 'view',
        message: share.message || '',
        sharedAt: share.shared_at || new Date().toLocaleString(),
      }));
      this.notifyListeners();
      return this.cache.directShares;
    } catch (error) {
      console.error('Failed to load direct shares:', error);
      return [];
    }
  },

  async addDirectShare(share) {
    try {
      const backendShare = {
        id: share.id,
        document: parseInt(share.documentId),
        shared_by: share.sharedBy,
        shared_with_ids: share.sharedWith,
        permission: share.permission,
        message: share.message || '',
      };
      await directShareService.create(backendShare);
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
      const shares = this.normalizeArray(await organizationShareService.getAll());

      this.cache.orgShares = shares.map(share => ({
        id: share.id?.toString(),
        documentId: share.document?.toString(),
        document: share.document_data ? this.transformDocument(share.document_data) : null,
        recipients: Array.isArray(share.recipients) ? share.recipients : [],
        distributionMode: share.distribution_mode || 'all-sub-units',
        selectedUnits: share.selected_units || null,
        message: share.message || '',
        sentBy: share.sent_by,
        sentFrom: share.sent_from,
        sentAt: share.sent_at || new Date().toLocaleString(),
      }));
      this.notifyListeners();
      return this.cache.orgShares;
    } catch (error) {
      console.error('Failed to load org shares:', error);
      return [];
    }
  },

  async addOrgShare(share) {
    try {
      const backendShare = {
        id: share.id,
        document: parseInt(share.documentId),
        sent_by: share.sentBy,
        sent_from: share.sentFrom,
        distribution_mode: share.distributionMode,
        selected_units: share.selectedUnits,
        recipient_ids: share.recipients,
        message: share.message || '',
      };
      await organizationShareService.create(backendShare);
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
      const logs = this.normalizeArray(await auditLogService.getAll());

      this.cache.auditLogs = logs.map(log => ({
        time: log.timestamp || log.created_at || new Date().toLocaleString(),
        user: log.user || 'Unknown',
        action: log.action || '',
        resource: log.resource || '',
        status: log.status || 'Success',
      }));
      this.notifyListeners();
      return this.cache.auditLogs;
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  },

  addAuditLog(log) {
    // Logs are created on the backend automatically via signals
    // Just reload to get the latest
    this.loadAuditLogs();
  },

  getAllAuditLogs() {
    return this.cache.auditLogs;
  },

  // Customization
  async loadCustomization() {
    try {
      const customization = await customizationService.getCurrent();
      this.cache.customization = {
        systemName: customization.system_name || 'Record Keeping Management System',
        systemLogo: customization.system_logo || null,
        loginBackground: customization.login_background || null,
        primaryColor: customization.primary_color || '#4F46E5',
        sidebarGradientStart: customization.sidebar_gradient_start || '#4F46E5',
        sidebarGradientEnd: customization.sidebar_gradient_end || '#7C3AED',
      };
      this.notifyListeners();
      return this.cache.customization;
    } catch (error) {
      console.error('Failed to load customization:', error);
      return null;
    }
  },

  async setCustomization(settings) {
    try {
      const backendSettings = {
        system_name: settings.systemName,
        system_logo: settings.systemLogo,
        login_background: settings.loginBackground,
        primary_color: settings.primaryColor,
        sidebar_gradient_start: settings.sidebarGradientStart,
        sidebar_gradient_end: settings.sidebarGradientEnd,
      };
      const updated = await customizationService.update(backendSettings);
      this.cache.customization = {
        systemName: updated.system_name,
        systemLogo: updated.system_logo,
        loginBackground: updated.login_background,
        primaryColor: updated.primary_color,
        sidebarGradientStart: updated.sidebar_gradient_start,
        sidebarGradientEnd: updated.sidebar_gradient_end,
      };
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
      const format = await userIdFormatService.getCurrent();
      this.cache.userIdFormat = format;
      this.notifyListeners();
      return this.cache.userIdFormat;
    } catch (error) {
      console.error('Failed to load user ID format:', error);
      return null;
    }
  },

  async setUserIdFormat(settings) {
    try {
      const updated = await userIdFormatService.update(settings);
      this.cache.userIdFormat = updated;
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
    if (!format || !format.format) return true;
    
    if (format.format.customFormat) {
      const pattern = userType === 'admin' 
        ? format.customPattern?.admin 
        : format.customPattern?.user;
      
      if (!pattern) return true;
      
      // Convert pattern to regex (X = digit)
      const regexPattern = '^' + pattern.replace(/X/g, '\\d') + '$';
      const regex = new RegExp(regexPattern);
      return regex.test(userId);
    } else {
      // Template builder format
      const separator = userType === 'admin' 
        ? format.format.adminSeparator 
        : format.format.userSeparator;
      
      const prefix = format.format.prefix;
      const segments = format.format.segmentCount;
      const lengths = format.format.segmentLength || [];
      
      // Build regex pattern
      let pattern = '^' + prefix;
      for (let i = 0; i < segments; i++) {
        const length = lengths[i] || 2;
        pattern += (separator || '') + '\\d{' + length + '}';
      }
      pattern += '$';
      
      const regex = new RegExp(pattern);
      return regex.test(userId);
    }
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