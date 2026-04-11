import { Bell, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { useSystemTheme } from '../../contexts/SystemThemeContext';
import { getRoleDisplayName } from '../../utils/roleMapper';
import Notifications from '../../user/Components/Notifications';

export default function AdminHeader({ 
  menuItems, 
  activeSection, 
  currentUser, 
  onLogout,
  sidebarOpen,
  setSidebarOpen
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme } = useSystemTheme();

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {theme?.sys_name || 'Administration'}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Notifications currentUser={currentUser} />
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors"
            title={currentUser.name}
          >
            <User className="w-5 h-5 text-indigo-600" />
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(currentUser.role)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}