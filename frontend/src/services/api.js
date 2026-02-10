const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Store the access token
let accessToken = null;
let refreshToken = null;

export const setAuthTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    localStorage.setItem('access_token', access);
  }
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
};

export const getAccessToken = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
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
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    clearAuthTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    const authError = new Error('Session expired');
    authError.status = 401;
    throw authError;
  }
  
  return response;
};

// Organization Unit API
export const organizationAPI = {
  // Get all organization units (returns tree structure)
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-units/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization units');
    }
    return await response.json();
  },
  
  // Get single organization unit
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-units/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization unit');
    }
    return await response.json();
  },
  
  // Create new organization unit
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-units/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create organization unit');
    }
    return await response.json();
  },
  
  // Update organization unit
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-units/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update organization unit');
    }
    return await response.json();
  },
  
  // Delete organization unit
  delete: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/organization-units/${id}/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  },
  
  // Get single user
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  },
  
  // Create new user
  create: async (data) => {
    console.log('userAPI.create called with:', data);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
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
      console.log('User created successfully:', result);
      return result;
    } catch (error) {
      console.error('userAPI.create error:', error);
      throw error;
    }
  },
  
  // Update user
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/${id}/`, {
      method: 'PUT',
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/${id}/`, {
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
  changePassword: async (username, passwordData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/users/${username}/change_password/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/audit-logs/`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return await response.json();
  },
  
  // Create new audit log
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/audit-logs/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create audit log');
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/verify-password/`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      throw new Error('Failed to verify password');
    }
    return await response.json();
  },
};

// Document API
export const documentAPI = {
  // Get all documents
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    return await response.json();
  },
  
  // Get single document
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return await response.json();
  },
  
  // Create new document
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/`, {
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
  
  // Update document
  update: async (id, data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/${id}/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },
  
  // Restore document
  restore: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/documents/${id}/restore/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/folders/`);
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    return await response.json();
  },

  // Create a new folder
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/folders/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/folders/${folderId}/`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/folders/${folderId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete folder');
    }
    return response.ok ? { success: true } : await response.json();
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
