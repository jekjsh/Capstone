const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Store the access token
let accessToken = null;
let refreshToken = null;
let inactivityTimer = null;

// Inactivity logout after 30 minutes
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Activity listeners - only real user intent actions
const activityEvents = ['click', 'keydown', 'mousedown', 'scroll', 'touchstart'];

// Stop the inactivity timer
const stopInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

// Reset inactivity timer on user activity
const resetInactivityTimer = () => {
  stopInactivityTimer();
  window.dispatchEvent(new CustomEvent('inactivity:hide-warning'));
  
  if (getRefreshToken()) {
    inactivityTimer = setTimeout(() => {
      console.log('User inactive for 30 minutes, logging out...');
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }, INACTIVITY_TIMEOUT);
  }
};

// Start listening for user activity
export const setupActivityListeners = () => {
  activityEvents.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  // Start initial inactivity timer
  resetInactivityTimer();
};

// Stop listening for user activity
export const removeActivityListeners = () => {
  activityEvents.forEach(event => {
    document.removeEventListener(event, resetInactivityTimer, true);
  });
  stopInactivityTimer();
};

export const setAuthTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    localStorage.setItem('access_token', access);
  }
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  // Start activity listeners when tokens are set
  setupActivityListeners();
};

export const getAccessToken = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

export const getRefreshToken = () => {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refresh_token');
  }
  return refreshToken;
};

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  removeActivityListeners();
};

// Refresh the access token using the refresh token
export const refreshAccessToken = async () => {
  try {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: currentRefreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    if (data.access) {
      accessToken = data.access;
      localStorage.setItem('access_token', data.access);
      resetInactivityTimer();
      return data.access;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const token = getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token might be expired, try to refresh it
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the request with the new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, clear tokens and dispatch auth expired event
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      const authError = new Error('Session expired');
      authError.status = 401;
      throw authError;
    }
  }
  
  return response;
};

// Organization Unit API
export const organizationAPI = {
  // Get all organization units (returns tree structure) - PUBLIC
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/organizations/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization units');
    }
    return await response.json();
  },
  
  // Get all organizations (actual organizations, not units) - PUBLIC
  getAllOrganizations: async () => {
    const response = await fetch(`${API_BASE_URL}/api/organizations/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }
    const data = await response.json();
    // Handle both array and paginated responses
    return Array.isArray(data) ? data : (data.results || data.data || []);
  },
  
  // Get single organization unit - PUBLIC
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/organizations/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization unit');
    }
    return await response.json();
  },
  
  // Create new organization unit - PROTECTED
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create organization unit');
    }
    return await response.json();
  },
  
  // Update organization unit - PROTECTED
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update organization unit');
    }
    return await response.json();
  },
  
  // Delete organization unit - PROTECTED
  delete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete organization unit');
    }
    return await response.json();
  },
};

// User Management API
export const userAPI = {
  // Get all users
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  },
  
  // Get single user
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  },
  
  // Create new user
  create: async (data) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/users/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create user';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },
  
  // Update user
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user');
    }
    return await response.json();
  },
  
  // Delete user
  delete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to delete user';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || JSON.stringify(errorJson);
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }
    // Parse response even for 200
    try {
      return await response.json();
    } catch (e) {
      // If no JSON body, return success indicator
      return { success: true };
    }
  },
  
  // Change password with current password verification
  changePassword: async (userId, passwordData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${userId}/change_password/`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to change password';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || JSON.stringify(errorJson);
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }
    return await response.json();
  },
};

// Audit Log API
export const auditLogAPI = {
  // Get all audit logs
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/audit-logs/`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return await response.json();
  },
  
  // Create new audit log
  create: async (data) => {
    // Map frontend field names to backend field names
    const mappedData = {
      audit_action: data.action,
      audit_desc: data.resource,
      audit_status: data.status
      // user_index is set automatically by the backend from the authenticated user
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/api/audit-logs/`, {
      method: 'POST',
      body: JSON.stringify(mappedData),
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('Audit log error response:', error);
      throw new Error('Failed to create audit log');
    }
    return await response.json();
  },
};

export const sessionAPI = {
  // Get active sessions count
  getActiveSessions: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/active-sessions/`);
    if (!response.ok) {
      throw new Error('Failed to fetch active sessions');
    }
    return await response.json();
  },

  // Verify current user's password
  verifyPassword: async (password) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/verify-password/`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    // Handle both 200 and 400 responses - parse JSON regardless
    const data = await response.json();
    
    // Log the response for debugging
    console.log('Password verification response:', data);
    
    // If response has a 'valid' field, trust that (handles both 200 and 400 responses)
    if (data.hasOwnProperty('valid')) {
      return data;
    }
    
    // Fallback error handling
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Failed to verify password');
    }
    
    return data;
  },
};

// Document API
export const documentAPI = {
  // Get all documents
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    return await response.json();
  },
  
  // Get single document
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return await response.json();
  },
  
  // Create new document (with file upload)
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('Document creation error:', error);
      throw new Error(error.detail || JSON.stringify(error) || 'Failed to create document');
    }
    return await response.json();
  },
  
  // Upload files (multipart form data)
  uploadFiles: async (files, docName, docDesc, folderId, onProgress) => {
    const formData = new FormData();
    
    // Add the first file as doc_file (one document = one file)
    if (files && files.length > 0) {
      formData.append('doc_file', files[0]);
    }
    
    formData.append('doc_name', docName || (files && files[0] ? files[0].name : 'Untitled'));
    if (docDesc) {
      formData.append('doc_desc', docDesc);
    }
    if (folderId) {
      formData.append('folder', folderId);
    }
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/documents/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMsg = 'Failed to upload file';
      try {
        const error = await response.json();
        errorMsg = error.detail || error.doc_file?.[0] || errorMsg;
      } catch (e) {
        // Response was not JSON
        errorMsg = `Upload failed (${response.status}: ${response.statusText})`;
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  },
  
  // Update document
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update document');
    }
    return await response.json();
  },
  
  // Delete document (soft delete)
  delete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },
  
  // Restore document
  restore: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${id}/restore/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to restore document');
    }
    return await response.json();
  },

  // Get documents shared with me
  getSharedWithMe: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/shared_with_me/`);
    if (!response.ok) {
      throw new Error('Failed to fetch shared documents');
    }
    return await response.json();
  },

  // Get documents shared by me
  getSharedByMe: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/shared_by_me/`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents shared by me');
    }
    return await response.json();
  },

  // Get deleted documents
  getDeleted: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/deleted/`);
    if (!response.ok) {
      throw new Error('Failed to fetch deleted documents');
    }
    return await response.json();
  },

  // Permanently delete a document
  permanentDelete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/${id}/permanent_delete/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to permanently delete document');
    }
  },

  // Empty trash
  emptyTrash: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/empty_trash/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to empty trash');
    }
    return await response.json();
  },

  // Add category to document
  addCategory: async (docId, categoryId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${docId}/add_category/`, {
      method: 'POST',
      body: JSON.stringify({ category_id: categoryId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Failed to add category');
    }
    return await response.json();
  },

  // Remove category from document
  removeCategory: async (docId, docCategoryId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${docId}/remove_category/`, {
      method: 'POST',
      body: JSON.stringify({ doc_category_id: docCategoryId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Failed to remove category');
    }
    return await response.json();
  },
};

// Organization Shares API
export const organizationShareAPI = {
  // Get all organization shares
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-shares/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization shares');
    }
    return await response.json();
  },

  // Create a new organization share
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-shares/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create organization share');
    }
    return await response.json();
  },
};

// Document Share API
export const documentShareAPI = {
  // Get all document shares
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/document-shares/`);
    if (!response.ok) {
      throw new Error('Failed to fetch document shares');
    }
    return await response.json();
  },

  // Create a new document share
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/document-shares/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to share document');
    }
    return await response.json();
  },

  // Delete a document share
  delete: async (shareId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/document-shares/${shareId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete document share');
    }
  },
};

// Folder Share API
export const folderShareAPI = {
  // Get all folder shares
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folder-shares/`);
    if (!response.ok) {
      throw new Error('Failed to fetch folder shares');
    }
    return await response.json();
  },

  // Create a new folder share
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folder-shares/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to share folder');
    }
    return await response.json();
  },

  // Delete a folder share
  delete: async (shareId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folder-shares/${shareId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete folder share');
    }
  },
};

// System Settings API
export const systemSettingsAPI = {
  // Get user ID format configuration
  getUserIdFormat: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/system-settings/user_id_format/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user ID format');
    }
    return await response.json();
  },

  // Save user ID format configuration
  saveUserIdFormat: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/system-settings/user_id_format/`, {
      method: 'POST',
      body: JSON.stringify({ setting_value: data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save user ID format');
    }
    return await response.json();
  },

  // Get all system settings
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/system-settings/`);
    if (!response.ok) {
      throw new Error('Failed to fetch system settings');
    }
    return await response.json();
  },

  // Get a specific system setting by key
  getByKey: async (settingKey) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/system-settings/?setting_key=${settingKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch system setting');
    }
    return await response.json();
  },
};

// Folder API
export const folderAPI = {
  // Get all folders for the current user
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/`);
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    return await response.json();
  },

  // Get root folders only (no parent)
  getRootFolders: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/root_folders/`);
    if (!response.ok) {
      throw new Error('Failed to fetch root folders');
    }
    return await response.json();
  },

  // Get documents in a specific folder
  getDocuments: async (folderId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/${folderId}/documents/`);
    if (!response.ok) {
      throw new Error('Failed to fetch folder documents');
    }
    return await response.json();
  },

  // Create a new folder
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create folder');
    }
    return await response.json();
  },

  // Update a folder
  update: async (folderId, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/${folderId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update folder');
    }
    return await response.json();
  },

  // Delete a folder
  delete: async (folderId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folders/${folderId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete folder');
    }
    return response.ok ? { success: true } : await response.json();
  },

  // Share a folder
  share: async (folderId, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folder-shares/`, {
      method: 'POST',
      body: JSON.stringify({ folder: folderId, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to share folder');
    }
    return await response.json();
  },

  // Get folder shares
  getShares: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/folder-shares/`);
    if (!response.ok) {
      throw new Error('Failed to fetch folder shares');
    }
    return await response.json();
  },
};

// Tags API
export const tagAPI = {
  // Get all tags for the current user
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/tags/`);
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    return await response.json();
  },

  // Create a new tag
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/tags/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create tag');
    }
    return await response.json();
  },

  // Update a tag
  update: async (tagId, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/tags/${tagId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update tag');
    }
    return await response.json();
  },

  // Delete a tag
  delete: async (tagId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/tags/${tagId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete tag');
    }
    return response.ok ? { success: true } : await response.json();
  },
};

// Categories API
export const categoryAPI = {
  // Get all categories for the current user
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Create a new category
  create: async (categoryData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create category');
    }
    return response.json();
  },

  // Update a category
  update: async (categoryId, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${categoryId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update category');
    }
    return response.json();
  },

  // Delete a category
  delete: async (categoryId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/categories/${categoryId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete category');
    }
    return response.ok ? { success: true } : await response.json();
  },
};

// Notifications API
export const notificationAPI = {
  // Get all notifications for the current user
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return await response.json();
  },

  // Generate/sync notifications
  generateNotifications: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/generate_notifications/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to generate notifications');
    }
    return await response.json();
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/unread_count/`);
    if (!response.ok) {
      throw new Error('Failed to get unread count');
    }
    return await response.json();
  },

  // Mark a notification as read
  markRead: async (notificationId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}/mark_as_read/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    return await response.json();
  },

  // Mark all notifications as read
  markAllRead: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/mark_all_as_read/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    return await response.json();
  },

  // Delete a notification
  delete: async (notificationId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete notification');
    }
    return response.ok ? { success: true } : await response.json();
  },
};

// Auth API - Current user profile
export const authAPI = {
  // Get current logged-in user's profile
  getCurrentProfile: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/profile/`);
    if (!response.ok) {
      throw new Error('Failed to fetch current user profile');
    }
    return await response.json();
  },
  
  // Logout
  logout: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    return await response.json();
  },
};

// ID Format API - User ID format configuration
export const idFormatAPI = {
  // Get all ID formats
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/`);
    if (!response.ok) {
      throw new Error('Failed to fetch ID formats');
    }
    return await response.json();
  },
  
  // Get ID format by organization
  getByOrganization: async (orgId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/?org=${orgId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch ID format for organization');
    }
    const data = await response.json();
    // Handle paginated or array response
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.length > 0 ? results[0] : null;
  },
  
  // Get single ID format
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch ID format');
    }
    return await response.json();
  },
  
  // Create new ID format
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create ID format');
    }
    return await response.json();
  },
  
  // Update ID format
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update ID format');
    }
    return await response.json();
  },
  
  // Delete ID format
  delete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/id-formats/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete ID format');
    }
    return response.ok;
  },
};

// System Theme API
export const systemThemeAPI = {
  // Get active system theme (public endpoint, no auth required)
  getActive: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/system-themes/active_theme/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        // Return default theme if no active theme found or endpoint not accessible
        return {
          sys_name: 'Record Keeping Management System',
          sys_abbr: 'RKMS',
          sys_logo: null,
          sys_backg: null,
          sidebar_color: 'blue',
        };
      }
      return await response.json();
    } catch (err) {
      console.warn('Failed to fetch active theme:', err);
      // Return default theme on error
      return {
        sys_name: 'Record Keeping Management System',
        sys_abbr: 'RKMS',
        sys_logo: null,
        sys_backg: null,
        sidebar_color: 'blue',
      };
    }
  },

  // Get all system themes (admin only - requires auth)
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/system-themes/`);
    if (!response.ok) {
      throw new Error('Failed to fetch system themes');
    }
    return await response.json();
  },

  // Update system theme (admin only - requires auth)
  update: async (id, data) => {
    const token = getAccessToken();
    const headers = {};
    let body = data;
    
    // Clean data: only send File objects for images, not string paths
    // Convert string file paths to null (don't send them) to keep existing files
    const cleanedData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip string values for image fields (they're existing file paths)
      if ((key === 'sys_logo' || key === 'sys_backg') && typeof value === 'string') {
        // Don't include existing file paths - backend will keep them
        return;
      }
      // Include File objects, non-null values
      if (value !== null && value !== undefined) {
        cleanedData[key] = value;
      }
    });
    
    // Check if we have files to upload
    const hasFiles = (cleanedData.sys_logo instanceof File) || (cleanedData.sys_backg instanceof File);
    
    if (hasFiles) {
      // Use FormData for multipart upload
      const formData = new FormData();
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] !== null && cleanedData[key] !== undefined) {
          formData.append(key, cleanedData[key]);
        }
      });
      body = formData;
      // Don't set Content-Type header for FormData - browser will set it with boundary
    } else {
      // Use JSON for text-only data
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(cleanedData);
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/system-themes/${id}/`, {
      method: 'PUT',
      headers,
      body,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Update theme error response:', error);
      throw new Error(error.detail || JSON.stringify(error) || 'Failed to update system theme');
    }
    return await response.json();
  },

  // Create new theme (admin only - requires auth)
  create: async (data) => {
    const token = getAccessToken();
    const headers = {};
    let body = data;
    
    // Check if we have files to upload
    const hasFiles = (data.sys_logo instanceof File) || (data.sys_backg instanceof File) || (data instanceof FormData);
    
    if (hasFiles) {
      // Use FormData for multipart upload
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      body = formData;
      // Don't set Content-Type header for FormData - browser will set it with boundary
    } else {
      // Use JSON for text-only data
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/system-themes/`, {
      method: 'POST',
      headers,
      body,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Create theme error response:', error);
      throw new Error(error.detail || JSON.stringify(error) || 'Failed to create system theme');
    }
    return await response.json();
  }
};

// User Creation Request API
export const userCreationRequestAPI = {
  // Get all user creation requests (public - no auth required)
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/user-creation-requests/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user creation requests');
    }
    const data = await response.json();
    // Handle paginated or array response
    return Array.isArray(data) ? data : (data.results || []);
  },

  // Get single user creation request (public - no auth required)
  getById: async (requestId) => {
    const response = await fetch(`${API_BASE_URL}/api/user-creation-requests/${requestId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user creation request');
    }
    return await response.json();
  },

  // Claim a user creation request (first-come-first-serve lock)
  claim: async (requestId, adminName) => {
    const response = await fetch(
      `${API_BASE_URL}/api/user-creation-requests/${requestId}/claim/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_name: adminName }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to claim request');
    }
    return await response.json();
  },

  // Approve a user creation request (public - no auth required)
  approve: async (requestId, assignedUserId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/user-creation-requests/${requestId}/approve/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_user_id: assignedUserId }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to approve request');
    }
    return await response.json();
  },

  // Deny a user creation request (public - no auth required)
  deny: async (requestId, denialReason) => {
    const response = await fetch(
      `${API_BASE_URL}/api/user-creation-requests/${requestId}/deny/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ denial_reason: denialReason }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to deny request');
    }
    return await response.json();
  },
};
