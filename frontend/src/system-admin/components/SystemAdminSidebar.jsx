import { Menu, X, LayoutDashboard, Users, FileText, ClipboardList } from 'lucide-react';
import { useState } from 'react';

export default function SystemAdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeSection, 
  setActiveSection, 
  currentUser
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'all-documents', label: 'All Documents', icon: FileText },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList }
  ];

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between border-b border-blue-500 border-opacity-30">
        {sidebarOpen && <span className="font-bold text-lg">System Admin</span>}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-1 hover:bg-blue-500 hover:bg-opacity-30 rounded transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

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

      <div className="p-4 border-t border-blue-500 border-opacity-30">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600"
          >
            {currentUser.name.charAt(0)}
          </div>
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-xs opacity-75">System Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
