import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../services/api';

export default function ProtectedRoute({ 
  children, 
  requiredRole = null,
  currentUser = null 
}) {
  const token = getAccessToken();

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If a role is required, we must have currentUser data
  if (requiredRole && !currentUser) {
    // User is loading, show a loading state instead of allowing access
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole && currentUser) {
    const userRole = currentUser.role_type || currentUser.role;
    
    // Allow access if user has the required role
    if (typeof requiredRole === 'string') {
      if (userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return children;
}
