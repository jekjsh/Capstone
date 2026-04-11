import { Settings, LogOut, Lock, User, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useSystemTheme } from '../../contexts/SystemThemeContext';
import { getRoleDisplayName } from '../../utils/roleMapper';
import Notifications from './Notifications';

export default function Header({ activeSection, menuItems, currentUser, showSettingsMenu, setShowSettingsMenu, onLogout, onChangePassword, sidebarOpen, setSidebarOpen }) {
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
        <div className="flex items-center gap-3">
          {theme?.sys_logo && (
            <img 
              src={theme.sys_logo} 
              alt="System Logo"
              className="h-10 object-contain"
            />
          )}
          <h1 className="text-xl font-bold text-gray-700">
            {theme?.sys_name || 'Dashboard'}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Notifications currentUser={currentUser} />

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title={currentUser.name}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left max-w-[100px] truncate">
              <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${showProfileMenu ? 'transform rotate-180' : ''}`} />
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    onChangePassword();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
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