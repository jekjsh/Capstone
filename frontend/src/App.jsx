import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginInterface from './LoginInterface';
import { startRefreshTokenTimer, authAPI, clearAuthTokens, getAccessToken } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import InactivityWarningModal from './components/InactivityWarningModal';

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
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    // Initialize token refresh timer on app start if user is already logged in
    const hasToken = getAccessToken();
    if (hasToken) {
      startRefreshTokenTimer();
      // Fetch current user profile
      fetchCurrentUser();
    } else {
      setIsLoadingUser(false);
      setIsInitializing(false);
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

    // Listen for inactivity warning events
    const handleShowWarning = () => {
      setShowInactivityWarning(true);
      setSecondsRemaining(60);
    };

    const handleHideWarning = () => {
      setShowInactivityWarning(false);
    };

    const handleCountdown = (event) => {
      setSecondsRemaining(event.detail.seconds);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('inactivity:show-warning', handleShowWarning);
    window.addEventListener('inactivity:hide-warning', handleHideWarning);
    window.addEventListener('inactivity:countdown', handleCountdown);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('inactivity:show-warning', handleShowWarning);
      window.removeEventListener('inactivity:hide-warning', handleHideWarning);
      window.removeEventListener('inactivity:countdown', handleCountdown);
    };
  }, []);

  // Set isInitializing to false when user loading is complete
  useEffect(() => {
    if (!isLoadingUser) {
      setIsInitializing(false);
    }
  }, [isLoadingUser]);

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

  const handleStayLoggedIn = () => {
    setShowInactivityWarning(false);
    setSecondsRemaining(60);
    // Reset the inactivity timer by simulating user activity
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
  };

  if (isLoadingUser || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <InactivityWarningModal 
        show={showInactivityWarning}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginInterface />} />
        <Route path="/unauthorized" element={<Unauthorized currentUser={currentUser} />} />
        <Route 
          path="/dashboard/*" 
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
  );
}