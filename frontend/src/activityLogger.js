import api from './api';

/**
 * Helper module to log user activities to the backend
 */

export const logActivity = async (action, targetDoc = null) => {
  try {
    const response = await api.post('/auth/log-activity/', {
      action: action,
      target_doc: targetDoc
    });
    console.log(`[ActivityLogger] Logged activity: ${action}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[ActivityLogger] Error logging activity "${action}":`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    // Don't throw - activity logging shouldn't break the main flow
  }
};

export const logDocumentAction = async (action, docName) => {
  return logActivity(action, docName);
};

export const logViewAction = async (docName) => {
  return logActivity('view', docName);
};

export const logEditAction = async (docName) => {
  return logActivity('edit', docName);
};

export const logCreateAction = async (docName) => {
  return logActivity('create', docName);
};

export const logDeleteAction = async (docName) => {
  return logActivity('delete', docName);
};

export const logDownloadAction = async (docName) => {
  return logActivity('download', docName);
};

export const logShareAction = async (docName) => {
  return logActivity('share', docName);
};

export const logUploadAction = async (docName) => {
  return logActivity('upload', docName);
};
