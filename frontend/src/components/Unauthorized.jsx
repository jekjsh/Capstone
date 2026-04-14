import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, LogOut } from 'lucide-react';
import { authAPI, clearAuthTokens } from '../services/api';
import { toast } from 'react-toastify';

export default function Unauthorized({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const getDashboardUrl = () => {
    if (!currentUser) return '/user/documents';
    
    const roleType = currentUser.role_type || currentUser.role;
    
    switch (roleType) {
      case 'admin':
        return '/admin/dashboard';
      case 'system_admin':
        return '/system-admin/dashboard';
      case 'user':
      default:
        return '/user/documents';
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear tokens
    clearAuthTokens();
    
    // Show toast
    toast.info('You have been logged out');
    
    // Redirect to login
    setTimeout(() => {
      navigate('/login', { replace: true });
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please login with the correct account.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <button
            onClick={() => navigate(getDashboardUrl())}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
