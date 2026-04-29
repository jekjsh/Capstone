import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginInterface from './LoginInterface';
import RequiredPasswordChange from './RequiredPasswordChange';
import { authAPI, clearAuthTokens, getAccessToken, systemThemeAPI } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import { SystemThemeProvider } from './contexts/SystemThemeContext';

// ADMIN MAIN FRAME
import AdminMainFrame from './admin/Mainframe';

// SYSTEM ADMIN MAIN FRAME
import SystemAdminMainFrame from './system-admin/Mainframe';

// USER MAIN FRAME
import UserMainFrame from './user/UserMainFrame';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initialTheme, setInitialTheme] = useState(null);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    // Load theme FIRST before anything else
    const loadThemeFirst = async () => {
      try {
        const theme = await systemThemeAPI.getActive();
        setInitialTheme(theme);
        
        // Update document title immediately
        if (theme?.sys_abbr) {
          document.title = `${theme.sys_abbr} RKMS`;
        }
        
        // Update favicon based on sys_logo
        if (theme?.sys_logo) {
          const logoUrl = theme.sys_logo.startsWith('http') 
            ? theme.sys_logo 
            : `http://localhost:8000${theme.sys_logo}`;
          const link = document.querySelector("link[rel='icon']");
          if (link) {
            link.href = logoUrl;
          }
        }
        
        // Apply theme colors to CSS variables immediately
        const themeColor = theme?.sidebar_color || '#3B82F6';
        document.documentElement.style.setProperty('--sidebar-color', themeColor);
      } catch (err) {
        console.error('Failed to preload theme:', err);
        // Set default theme on error
        const defaultTheme = {
          sys_name: 'Record Keeping Management System',
          sys_abbr: 'RKMS',
          sys_logo: null,
          sys_backg: null,
          sidebar_color: '#3B82F6',
        };
        setInitialTheme(defaultTheme);
        document.title = 'RKMS';
        document.documentElement.style.setProperty('--sidebar-color', '#3B82F6');
      } finally {
        setThemeLoaded(true);
      }
    };

    loadThemeFirst();

    // Initialize on app start if user is already logged in
    const hasToken = getAccessToken();
    if (hasToken) {
      // Fetch current user profile
      fetchCurrentUser();
    } else {
      setIsLoadingUser(false);
    }

    // Listen for auth expiration events
    const handleAuthExpired = async () => {
      try {
        // Try to log the logout action
        await authAPI.logout();
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
      clearAuthTokens();
      setCurrentUser(null);
      window.location.href = '/login';
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  // Set isInitializing to false when both theme and user loading are complete
  useEffect(() => {
    if (!isLoadingUser && themeLoaded) {
      setIsInitializing(false);
    }
  }, [isLoadingUser, themeLoaded]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await authAPI.getCurrentProfile();
      setCurrentUser({
        id: userData.user_id,
        username: userData.username,
        role_type: userData.role_type,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        ...userData
      });
    } catch (error) {
      console.error('Failed to fetch current user profile:', error);
      // Only logout if it's a 401 (unauthorized), not for other network errors
      if (error.status === 401) {
        clearAuthTokens();
        window.location.href = '/login';
      } else {
        // For other errors (network, server errors), just skip user fetch
        // User is still logged in with valid tokens
        console.warn('Could not fetch user profile, but tokens are still valid. Continuing...');
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to log the action
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear tokens and redirect
    clearAuthTokens();
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const handleStayLoggedIn = async () => {
    try {
      // Refresh the token
      await refreshAccessToken();
      // Modal will be hidden by the reset inactivity timer
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // If refresh fails, show error but keep modal visible
    }
  };

  if (isInitializing) {
    const loaderColor = initialTheme?.sidebar_color || '#4F46E5';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ backgroundColor: loaderColor + '20' }}
          >
            <div 
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ 
                borderColor: loaderColor + '30',
                borderTopColor: loaderColor
              }}
            />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SystemThemeProvider initialTheme={initialTheme}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginInterface />} />
        <Route path="/change-password-required" element={<RequiredPasswordChange />} />
        <Route path="/unauthorized" element={<Unauthorized currentUser={currentUser} />} />
        <Route 
          path="/user/*" 
          element={
            <ProtectedRoute 
              requiredRole="user" 
              currentUser={currentUser}
            >
              <UserMainFrame currentUser={currentUser} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute 
              requiredRole="admin" 
              currentUser={currentUser}
            >
              <AdminMainFrame currentUser={currentUser} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/system-admin/*" 
          element={
            <ProtectedRoute 
              requiredRole="system_admin" 
              currentUser={currentUser}
            >
              <SystemAdminMainFrame currentUser={currentUser} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Router>
    </SystemThemeProvider>
  );
}