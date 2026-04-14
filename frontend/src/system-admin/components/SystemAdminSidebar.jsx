import { LayoutDashboard, Users, ClipboardList, Building2, Palette, Hash, UserPlus } from 'lucide-react';
import SharedSidebar from '../../components/SharedSidebar';

export default function SystemAdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeSection, 
  setActiveSection, 
  currentUser,
  onCustomize,
  onConfigureUserId,
  pendingRequestsCount = 0
}) {
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
    { id: 'requests', label: 'Requests', icon: UserPlus, ...(pendingRequestsCount > 0 && { badgeCount: pendingRequestsCount }) },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList }
  ];

  return (
    <SharedSidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      menuItems={menuItems}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      currentUser={currentUser}
      defaultExpandedGroups={{ personnel: true }}
      expandedStateKey="systemAdmin.sidebar.expandedGroups"
      onCustomize={onCustomize}
      onConfigureUserId={onConfigureUserId}
    />
  );
}
