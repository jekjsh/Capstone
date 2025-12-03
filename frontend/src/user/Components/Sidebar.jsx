// components/Sidebar.jsx
import { Menu, X } from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen, menuItems, activeSection, setActiveSection, currentUser }) {
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-600 to-cyan-600 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-blue-500">
        {sidebarOpen && <span className="font-bold text-lg">RKMS User</span>}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-blue-500 rounded">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500 transition-colors ${activeSection === item.id ? 'bg-blue-500 border-l-4 border-white' : ''}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-blue-500">
        <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
          <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">
            {currentUser.name.charAt(0)}
          </div>
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-xs text-blue-200">{currentUser.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}