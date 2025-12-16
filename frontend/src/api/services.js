import apiClient from './client';

// Authentication Services
export const authService = {
  login: async (userId, password) => {
    const response = await apiClient.post('/auth/login/', {
      user_id: userId,
      password: password,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout/');
    return response.data;
  },
};

// User Services
export const userService = {
  getAll: async () => {
    const response = await apiClient.get('/users/');
    return response.data;
  },

  getById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/`);
    return response.data;
  },

  create: async (userData) => {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}/`, userData);
    return response.data;
  },

  delete: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}/`);
    return response.data;
  },

  changePassword: async (userId, adminPassword, newPassword) => {
    const response = await apiClient.post(`/users/${userId}/change_password/`, {
      new_password: newPassword,
      admin_password: adminPassword,
    });
    return response.data;
  },
};

// Organization Unit Services
export const organizationService = {
  getAll: async () => {
    const response = await apiClient.get('/organization-units/');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/organization-units/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/organization-units/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/organization-units/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/organization-units/${id}/`);
    return response.data;
  },
};

// Custom Field Services
export const customFieldService = {
  getAll: async () => {
    const response = await apiClient.get('/custom-fields/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/custom-fields/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/custom-fields/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/custom-fields/${id}/`);
    return response.data;
  },
};

// Folder Services
export const folderService = {
  getAll: async () => {
    const response = await apiClient.get('/folders/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/folders/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/folders/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/folders/${id}/`);
    return response.data;
  },
};

// Document Services
export const documentService = {
  getAll: async (folderId = null) => {
    const params = folderId ? { folder: folderId } : {};
    const response = await apiClient.get('/documents/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/documents/${id}/`);
    return response.data;
  },

  create: async (data) => {
    return api.post('/documents/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/documents/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/documents/${id}/`);
    return response.data;
  },

  moveToRecycleBin: async (id) => {
    const response = await apiClient.post(`/documents/${id}/move_to_recycle_bin/`);
    return response.data;
  },

  restore: async (id) => {
    const response = await apiClient.post(`/documents/${id}/restore/`);
    return response.data;
  },

  getDeleted: async () => {
    const response = await apiClient.get('/documents/deleted/');
    return response.data;
  },

  emptyRecycleBin: async () => {
    const response = await apiClient.post('/documents/empty_recycle_bin/');
    return response.data;
  },
};

// Direct Share Services
export const directShareService = {
  getAll: async () => {
    const response = await apiClient.get('/direct-shares/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/direct-shares/', {
      id: data.id,
      document: data.documentId,
      shared_by: data.sharedBy,
      shared_with_ids: data.sharedWith,
      permission: data.permission,
      message: data.message,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/direct-shares/${id}/`);
    return response.data;
  },
};

// Organization Share Services
export const organizationShareService = {
  getAll: async () => {
    const response = await apiClient.get('/organization-shares/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/organization-shares/', {
      id: data.id,
      document: data.documentId,
      sent_by: data.sentBy,
      sent_from: data.sentFrom,
      distribution_mode: data.distributionMode,
      selected_units: data.selectedUnits,
      recipient_ids: data.recipients,
      message: data.message,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/organization-shares/${id}/`);
    return response.data;
  },
};

// Audit Log Services
export const auditLogService = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get('/audit-logs/', { params: filters });
    return response.data;
  },
};

// System Customization Services
export const customizationService = {
  getCurrent: async () => {
    const response = await apiClient.get('/system-customization/current/');
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.post('/system-customization/current/', data);
    return response.data;
  },
};

// User ID Format Services
export const userIdFormatService = {
  getCurrent: async () => {
    const response = await apiClient.get('/user-id-format/current/');
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.post('/user-id-format/current/', data);
    return response.data;
  },
};