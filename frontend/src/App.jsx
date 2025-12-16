import { useState, useEffect } from 'react';
import LoginInterface from './LoginInterface';
import MainFrame from './admin/Mainframe';
import UserMainFrame from './user/UserMainFrame';
import { authService } from './api/services';
import dataStore from './api/dataStore';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setIsLoggedIn(true);

          // Initialize data store
          await dataStore.initialize();
          
          // Load user-specific data
          if (user.role === 'User') {
            await dataStore.loadDocuments(user.user_id);
            await dataStore.loadCustomFields();
            await dataStore.loadFolders();
            await dataStore.loadDirectShares();
            await dataStore.loadOrgShares();
            await dataStore.loadDeletedDocuments();
          } else {
            // Admin
            await dataStore.loadAuditLogs();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async (userData) => {
    try {
      // Store tokens and user data
      localStorage.setItem('access_token', userData.token);
      localStorage.setItem('refresh_token', userData.refresh);
      localStorage.setItem('user_data', JSON.stringify(userData.user));

      setCurrentUser(userData.user);
      setIsLoggedIn(true);

      // Initialize data store
      await dataStore.initialize();

      // Load user-specific data
      if (userData.user.role === 'User') {
        await dataStore.loadDocuments(userData.user.user_id);
        await dataStore.loadCustomFields();
        await dataStore.loadFolders();
        await dataStore.loadDirectShares();
        await dataStore.loadOrgShares();
        await dataStore.loadDeletedDocuments();
      } else {
        // Admin
        await dataStore.loadAuditLogs();
      }
    } catch (error) {
      console.error('Login initialization failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      // Reset state
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginInterface onLoginSuccess={handleLoginSuccess} dataStore={dataStore} />;
  }

  if (currentUser.role === 'Admin') {
    return (
      <MainFrame 
        currentUser={currentUser} 
        onLogout={handleLogout}
        dataStore={dataStore}
      />
    );
  } else {
    return (
      <UserMainFrame 
        currentUser={currentUser} 
        onLogout={handleLogout}
        organizationTree={dataStore.getOrganizationTree()}
        dataStore={dataStore}
      />
    );
  }
}