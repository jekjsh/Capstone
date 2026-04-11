import { LayoutDashboard, Users, ClipboardList, Building2, Palette, Hash, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function SystemAdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeSection, 
  setActiveSection, 
  currentUser,
  onCustomize,
  onConfigureUserId
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organization', label: 'Organization', icon: Building2 },
    {
      id: 'personnel',
      label: 'Personnel Management',
      icon: Users,
      isGroup: true,
      children: [
        { id: 'user-management', label: 'User Management' },
        { id: 'org-users', label: 'Users by Organization' }
      ]
    },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList }
  ];

  const settingsItems = [
    { id: 'customize', label: 'Customize System', icon: Palette, onClick: onCustomize },
    { id: 'user-id-format', label: 'User ID Format', icon: Hash, onClick: onConfigureUserId }
  ];

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-0'} text-white transition-all duration-300 flex flex-col overflow-hidden`}
      style={{
        backgroundColor: 'var(--sidebar-color, #3B82F6)',
      }}
    >
      {/* Profile Section at Top */}
      <div className="p-4 border-b border-white border-opacity-20">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ color: 'var(--sidebar-color, #3B82F6)' }}
          >
            {currentUser?.name?.charAt(0) || 'S'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs opacity-75 truncate">{getRoleDisplayName(currentUser?.role) || 'IS Manager'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedGroups[item.id];
          
          if (item.isGroup) {
            const isGroupActive = item.children?.some(child => activeSection === child.id);
            
            return (
              <div key={item.id}>
                {/* Group Parent Item */}
                <button
                  onClick={() => setExpandedGroups(prev => ({
                    ...prev,
                    [item.id]: !isExpanded
                  }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                    isGroupActive ? 'bg-white bg-opacity-20' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown 
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
                
                {/* Group Children */}
                {sidebarOpen && isExpanded && item.children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveSection(child.id)}
                    className={`w-full flex items-center gap-3 px-8 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                      activeSection === child.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : 'border-l-4 border-transparent'
                    }`}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            );
          }
          
          // Regular items
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

      {/* Settings Section at Bottom */}
      <div className="border-t border-white border-opacity-20 py-2">
        {sidebarOpen && <p className="text-xs font-semibold px-4 py-2 opacity-60">SYSTEM SETTINGS</p>}
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                item.isDanger ? 'text-red-200 hover:bg-red-500 hover:bg-opacity-20' : ''
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
