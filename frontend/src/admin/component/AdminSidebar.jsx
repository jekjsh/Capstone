import SharedSidebar from '../../components/SharedSidebar';

export default function AdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  menuItems, 
  activeSection, 
  setActiveSection, 
  currentUser
}) {
  // Convert menuItems from children format to isGroup format for SharedSidebar
  const convertedItems = menuItems.map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        isGroup: true
      };
    }
    return item;
  });

  return (
    <SharedSidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      menuItems={convertedItems}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      currentUser={currentUser}
      defaultExpandedGroups={{ 'overview-mgmt': true, 'file-mgmt': true, 'access-mgmt': true }}
      expandedStateKey="admin.sidebar.expandedGroups"
    />
  );
}