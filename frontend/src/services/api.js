const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Store the access token
let accessToken = null;
let refreshToken = null;
let refreshTokenTimer = null;
let inactivityTimer = null;
let warningCountdownTimer = null;
let warningShownTime = null;

// Refresh token every 7 minutes (before 10-minute access token expiration)
const REFRESH_TOKEN_INTERVAL = 7 * 60 * 1000; // 7 minutes in milliseconds

// Inactivity logout after 9 minutes (1 minute before token expiration at 10 minutes)
const INACTIVITY_TIMEOUT = 9 * 60 * 1000; // 9 minutes in milliseconds

// Show warning at 8 minutes (before logout at 9 minutes)
const WARNING_TIME = 8 * 60 * 1000; // 8 minutes in milliseconds

// Activity listeners
const activityEvents = ['click', 'keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart'];

// Stop the countdown warning timer
const stopWarningCountdown = () => {
  if (warningCountdownTimer) {
    clearInterval(warningCountdownTimer);
    warningCountdownTimer = null;
  }
  warningShownTime = null;
};

// Start warning countdown (updates UI every second)
const startWarningCountdown = () => {
  stopWarningCountdown();
  warningShownTime = Date.now();
  warningCountdownTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - warningShownTime) / 1000);
    const secondsRemaining = Math.max(0, 60 - elapsed);
    window.dispatchEvent(new CustomEvent('inactivity:countdown', { detail: { seconds: secondsRemaining } }));
    
    if (secondsRemaining === 0) {
      stopWarningCountdown();
    }
  }, 1000);
};

// Reset inactivity timer on user activity
const resetInactivityTimer = () => {
  stopInactivityTimer();
  stopWarningCountdown();
  window.dispatchEvent(new CustomEvent('inactivity:hide-warning'));
  
  if (getRefreshToken()) {
    inactivityTimer = setTimeout(() => {
      // Show warning at 9 minutes
      window.dispatchEvent(new CustomEvent('inactivity:show-warning'));
      startWarningCountdown();
      
      // Actually logout at 10 minutes
      const logoutTimeout = setTimeout(() => {
        console.log('User inactive for 10 minutes, logging out...');
        stopWarningCountdown();
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }, INACTIVITY_TIMEOUT - WARNING_TIME);
      
      // Store the logout timeout so we can clear it if user interacts
      inactivityTimer = logoutTimeout;
    }, WARNING_TIME);
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
  stopWarningCountdown();
};

// Stop the inactivity timer
const stopInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
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
  // Start refresh token timer and activity listeners when tokens are set
  startRefreshTokenTimer();
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
  stopRefreshTokenTimer();
  removeActivityListeners();
};

// Refresh the access token using the refresh token
export const refreshAccessToken = async () => {
  try {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: currentRefreshToken,
      }),
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
      // Restart the refresh timer and reset inactivity timer
      startRefreshTokenTimer();
      resetInactivityTimer();
      return data.access;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
};

// Start the token refresh timer
export const startRefreshTokenTimer = () => {
  stopRefreshTokenTimer(); // Clear any existing timer
  if (getRefreshToken()) {
    refreshTokenTimer = setInterval(() => {
      refreshAccessToken();
    }, REFRESH_TOKEN_INTERVAL);
  }
};

// Stop the token refresh timer
export const stopRefreshTokenTimer = () => {
  if (refreshTokenTimer) {
    clearInterval(refreshTokenTimer);
    refreshTokenTimer = null;
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
  // Get all organization units (returns tree structure)
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization units');
    }
    return await response.json();
  },
  
  // Get all organizations (actual organizations, not units)
  getAllOrganizations: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }
    const data = await response.json();
    // Handle both array and paginated responses
    return Array.isArray(data) ? data : (data.results || data.data || []);
  },
  
  // Get single organization unit
  getById: async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization unit');
    }
    return await response.json();
  },
  
  // Create new organization unit
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
  
  // Update organization unit
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
  
  // Delete organization unit
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/audit-logs/`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return await response.json();
  },
  
  // Create new audit log
  create: async (data) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/audit-logs/`, {
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

// Notifications API
export const notificationAPI = {
  // Get all notifications for the current user
  getAll: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return await response.json();
  },

  // Generate/sync notifications
  generateNotifications: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/generate_notifications/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to generate notifications');
    }
    return await response.json();
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/unread_count/`);
    if (!response.ok) {
      throw new Error('Failed to get unread count');
    }
    return await response.json();
  },

  // Mark a notification as read
  markRead: async (notificationId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/${notificationId}/mark_read/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    return await response.json();
  },

  // Mark all notifications as read
  markAllRead: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/mark_all_read/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    return await response.json();
  },

  // Delete a notification
  delete: async (notificationId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/notifications/${notificationId}/`, {
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
