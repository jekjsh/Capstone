import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSystemTheme } from '../../contexts/SystemThemeContext';
import { getRoleDisplayName } from '../../utils/roleMapper';

export default function AdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems, 
  activeSection, 
  setActiveSection, 
  currentUser
}) {
  const [expandedDropdowns, setExpandedDropdowns] = useState({ 'organization': true, 'documents-mgmt': true });
  const { theme } = useSystemTheme();

  const getSidebarColor = () => {
    // Sidebar color is always a hex value now
    const color = theme?.sidebar_color;
    if (!color) return '#4F46E5'; // default fallback
    
    // Use the color directly if it's a hex, otherwise it's still a preset name - convert it
    if (color.startsWith('#')) {
      return color;
    }
    
    // Fallback for old preset names
    const colorMap = {
      blue: '#3B82F6',
      indigo: '#4F46E5',
      purple: '#A855F7',
      pink: '#EC4899',
      red: '#EF4444',
      orange: '#F97316',
      yellow: '#EAB308',
      green: '#22C55E',
      teal: '#14B8A6',
      cyan: '#06B6D4',
      slate: '#64748B',
      zinc: '#71717A',
      neutral: '#737373',
      stone: '#78716C',
    };
    
    return colorMap[color] || '#4F46E5';
  };

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-0'} text-white transition-all duration-300 flex flex-col overflow-hidden`}
      style={{
        backgroundColor: getSidebarColor(),
        backgroundImage: 'none',
      }}
    >
      {/* Profile Section at Top */}
      <div className="p-4 border-b border-white border-opacity-20">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ color: getSidebarColor() }}
          >
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs opacity-75 truncate">{getRoleDisplayName(currentUser?.role) || 'Organization Head'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = expandedDropdowns[item.id] || false;
          const isParentActive = activeSection === item.id || (hasChildren && item.children.some(child => activeSection === child.id));

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    setExpandedDropdowns(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                  isParentActive ? 'bg-white bg-opacity-20 border-l-4 border-white' : ''
                }`}
              >
                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          isOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Nested menu items */}
              {hasChildren && isOpen && (
                <div className="bg-white bg-opacity-10">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.id}
                        onClick={() => setActiveSection(child.id)}
                        className={`w-full flex items-center gap-3 pl-12 pr-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                          activeSection === child.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : ''
                        }`}
                      >
                        {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                        {sidebarOpen && <span>{child.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}