import { Menu } from 'lucide-react';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems, 
  activeSection, 
  setActiveSection, 
  currentUser,
  dataStore  
}) {
  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-0'} text-white transition-all duration-300 flex flex-col overflow-hidden`}
      style={{
        backgroundColor: 'var(--sidebar-color, #2563EB)',
      }}
    >
      {/* Profile Section at Top */}
      <div className="p-4 border-b border-white border-opacity-20">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ color: 'var(--sidebar-color, #2563EB)' }}
          >
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'User'}</p>
              <p className="text-xs opacity-75 truncate">{getRoleDisplayName(currentUser?.role) || 'Employee'}</p>
            </div>
          )}
        </div>
      </div>



      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems
          .filter(item => !(item.id === 'folders')) // Hide the separate "Folders" menu item
          .map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveSection(item.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                  activeSection === item.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : ''
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
      </nav>
    </div>
  );
}