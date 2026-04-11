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
        <div className="flex items-center justify-center h-10">
          {sidebarOpen && (
            <p className="text-xs opacity-75 truncate">{getRoleDisplayName(currentUser?.role) || 'Employee'}</p>
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
                  activeSection === item.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : 'border-l-4 border-transparent'
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