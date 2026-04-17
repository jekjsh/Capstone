import { ChevronDown, Palette, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSystemTheme } from '../contexts/SystemThemeContext';

export default function SharedSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems = [], 
  activeSection, 
  setActiveSection, 
  currentUser,
  defaultExpandedGroups = {},
  expandedStateKey = '',
  onCustomize,
  onConfigureUserId
}) {
  const [expandedGroups, setExpandedGroups] = useState(defaultExpandedGroups);
  const { theme } = useSystemTheme();
  const defaultExpandedGroupsKey = JSON.stringify(defaultExpandedGroups || {});

  const applyExpandedGroups = (nextValue) => {
    setExpandedGroups((prev) => {
      const prevKey = JSON.stringify(prev || {});
      const nextKey = JSON.stringify(nextValue || {});
      if (prevKey === nextKey) return prev;
      return nextValue;
    });
  };

  useEffect(() => {
    if (!expandedStateKey) {
      applyExpandedGroups(defaultExpandedGroups);
      return;
    }

    try {
      const savedValue = window.localStorage.getItem(expandedStateKey);
      if (!savedValue) {
        applyExpandedGroups(defaultExpandedGroups);
        return;
      }

      const parsed = JSON.parse(savedValue);
      if (parsed && typeof parsed === 'object') {
        applyExpandedGroups({ ...defaultExpandedGroups, ...parsed });
      } else {
        applyExpandedGroups(defaultExpandedGroups);
      }
    } catch {
      applyExpandedGroups(defaultExpandedGroups);
    }
  }, [expandedStateKey, defaultExpandedGroupsKey]);

  useEffect(() => {
    if (!expandedStateKey) return;
    window.localStorage.setItem(expandedStateKey, JSON.stringify(expandedGroups));
  }, [expandedGroups, expandedStateKey]);

  useEffect(() => {
    const activeGroup = menuItems.find(
      (item) => item.isGroup && item.children?.some((child) => child.id === activeSection)
    );

    if (!activeGroup) return;

    setExpandedGroups((prev) => {
      if (prev[activeGroup.id]) {
        return prev;
      }
      return {
        ...prev,
        [activeGroup.id]: true,
      };
    });
  }, [activeSection, menuItems]);

  const getSidebarColor = () => {
    const color = theme?.sidebar_color;
    if (!color) return '#4F46E5'; // default fallback
    
    if (color.startsWith('#')) {
      return color;
    }
    
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
      }}
    >
      {/* Profile Section at Top */}
      <div className="p-6 border-b border-white border-opacity-20 bg-white bg-opacity-10">
        {sidebarOpen && (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Logo */}
            {theme?.sys_logo && (
              <div className="bg-white rounded-lg p-3">
                <img 
                  src={theme.sys_logo} 
                  alt="System Logo"
                  className="h-32 object-contain"
                />
              </div>
            )}
            {/* Full Name */}
            <div>
              <p className="text-sm font-semibold truncate">
                {currentUser?.name || 'User'}
              </p>
              {/* Position */}
              {currentUser?.full_data?.user_pos && (
                <p className="text-xs opacity-75 truncate">
                  {currentUser.full_data.user_pos}
                </p>
              )}
            </div>
          </div>
        )}
        {!sidebarOpen && theme?.sys_logo && (
          <div className="flex justify-center bg-white bg-opacity-10 rounded-lg p-2">
            <img 
              src={theme.sys_logo} 
              alt="System Logo"
              className="h-10 object-contain"
            />
          </div>
        )}
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
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors ${
                activeSection === item.id ? 'bg-white bg-opacity-20 border-l-4 border-white' : 'border-l-4 border-transparent'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </span>
              {item.badgeCount !== undefined && sidebarOpen && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings Section at Bottom - only for System Admin */}
      {currentUser?.full_data?.role_type === 'system_admin' && sidebarOpen && (
        <div className="mt-auto border-t border-white border-opacity-20 pb-4">
          {onCustomize && (
            <button
              onClick={onCustomize}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors border-l-4 border-transparent"
            >
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span>Customize Theme</span>
            </button>
          )}
          {onConfigureUserId && (
            <button
              onClick={onConfigureUserId}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:bg-opacity-20 transition-colors border-l-4 border-transparent"
            >
              <Hash className="w-5 h-5 flex-shrink-0" />
              <span>User ID Format</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
