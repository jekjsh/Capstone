import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function Unauthorized({ currentUser }) {
  const navigate = useNavigate();

  const getDashboardUrl = () => {
    if (!currentUser) return '/dashboard';
    
    const roleType = currentUser.role_type || currentUser.role;
    
    switch (roleType) {
      case 'admin':
        return '/admin/dashboard';
      case 'system_admin':
        return '/system-admin/dashboard';
      case 'user':
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <button
          onClick={() => navigate(getDashboardUrl())}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
