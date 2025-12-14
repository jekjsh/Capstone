import { Bell, Settings, LogOut, Palette, Hash } from 'lucide-react';

export default function AdminHeader({ 
  menuItems, 
  activeSection, 
  currentUser, 
  showSettingsMenu, 
  setShowSettingsMenu, 
  onCustomize,
  onConfigureUserId,
  onLogout 
}) {
  return (
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">
        {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
      </h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          {showSettingsMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSettingsMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                {/* Customize System Button */}
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    onCustomize();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Customize System</span>
                </button>
                
                {/* User ID Format Button */}
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    onConfigureUserId();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span>User ID Format</span>
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
        </div>
      </div>
    </div>
  );
}