import SharedSidebar from '../../components/SharedSidebar';

export default function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems, 
  activeSection, 
  setActiveSection, 
  currentUser,
  dataStore  
}) {
  // Filter out the 'folders' menu item as we don't need to display it separately
  const filteredItems = menuItems.filter(item => !(item.id === 'folders'));
  
  return (
    <SharedSidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      menuItems={filteredItems}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      currentUser={currentUser}
      expandedStateKey="user.sidebar.expandedGroups"
    />
  );
}