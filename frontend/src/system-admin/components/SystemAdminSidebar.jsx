import { LayoutDashboard, Users, FileText, ClipboardList, Building2, Palette, Hash } from 'lucide-react';
import { useState } from 'react';

export default function SystemAdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeSection, 
  setActiveSection, 
  currentUser,
  onCustomize,
  onConfigureUserId
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'all-documents', label: 'All Documents', icon: FileText },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList }
  ];

  const settingsItems = [
    { id: 'customize', label: 'Customize System', icon: Palette, onClick: onCustomize },
    { id: 'user-id-format', label: 'User ID Format', icon: Hash, onClick: onConfigureUserId }
  ];

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 flex flex-col overflow-hidden`}
    >
      {/* Profile Section at Top */}
      <div className="p-4 border-b border-blue-500 border-opacity-30">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 flex-shrink-0"
          >
            {currentUser?.name?.charAt(0) || 'S'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs opacity-75 truncate">{currentUser?.role || 'System Admin'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500 hover:bg-opacity-20 transition-colors ${
                activeSection === item.id ? 'bg-blue-500 bg-opacity-30 border-l-4 border-white' : ''
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Settings Section at Bottom */}
      <div className="border-t border-blue-500 border-opacity-30 py-2">
        {sidebarOpen && <p className="text-xs font-semibold px-4 py-2 opacity-60">SYSTEM SETTINGS</p>}
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500 hover:bg-opacity-20 transition-colors ${
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
