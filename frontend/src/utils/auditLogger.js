import { auditLogAPI } from '../services/api';

/**
 * Log an audit event
 * @param {string} action - The action being performed (e.g., 'Create User', 'Delete Document')
 * @param {string} resource - Description of the resource or action details
 * @param {string} status - Either 'Success' or 'Failed'
 */
export const logAuditEvent = async (action, resource, status = 'Success') => {
  try {
    const response = await fetch('http://localhost:8000/api/audit-logs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        audit_action: action,
        audit_desc: resource,
        audit_status: status
      })
    });

    if (!response.ok) {
      console.error('Failed to log audit event:', response.status);
    } else {
      console.log('Audit event logged successfully');
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

/**
 * Common audit action types
 */
export const AuditActions = {
  CREATE_USER: 'Create User',
  UPDATE_USER: 'Update User',
  DELETE_USER: 'Delete User',
  ASSIGN_ORGANIZATION: 'Assign Organization',
  CREATE_DOCUMENT: 'Create Document',
  UPDATE_DOCUMENT: 'Update Document',
  DELETE_DOCUMENT: 'Delete Document',
  SHARE_DOCUMENT: 'Share Document',
  UPLOAD_DOCUMENT: 'Upload Document',
  CREATE_ORGANIZATION: 'Create Organization',
  UPDATE_ORGANIZATION: 'Update Organization',
  DELETE_ORGANIZATION: 'Delete Organization',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PASSWORD_CHANGE: 'Password Change',
  ROLE_CHANGE: 'Role Change'
};
