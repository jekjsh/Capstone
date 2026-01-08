import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems, 
  activeSection, 
  setActiveSection, 
  currentUser,
  dataStore  
}) {
  const [customization, setCustomization] = useState({
    sidebarGradientStart: '#2563EB',  
    sidebarGradientEnd: '#06B6D4'    
  });

  useEffect(() => {
    if (dataStore) {
      const loadCustomization = () => {
        const custom = dataStore.getCustomization();
        if (custom) {
          
          setCustomization({
            sidebarGradientStart: custom.sidebarGradientStart || '#2563EB',
            sidebarGradientEnd: custom.sidebarGradientEnd || '#06B6D4'
          });
        }
      };

   
      loadCustomization();

      
      const unsubscribe = dataStore.subscribe(() => {
        loadCustomization();
      });

      return unsubscribe;
    }
  }, [dataStore]);

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 flex flex-col`}
      style={{
        background: `linear-gradient(to bottom, ${customization.sidebarGradientStart}, ${customization.sidebarGradientEnd})`
      }}
    >
      <div className="p-4 flex items-center justify-between border-b border-white border-opacity-20">
        {sidebarOpen && <span className="font-bold text-lg">RKMS User</span>}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
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

      <div className="p-4 border-t border-white border-opacity-20">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold"
            style={{ color: customization.sidebarGradientStart }}
          >
            {currentUser.name.charAt(0)}
          </div>
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-xs opacity-75">{currentUser.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}