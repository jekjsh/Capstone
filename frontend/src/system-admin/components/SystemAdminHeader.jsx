import SharedHeader from '../../components/SharedHeader';
import SystemAdminNotifications from './SystemAdminNotifications';

export default function SystemAdminHeader({ 
  currentUser, 
  onLogout, 
  onChangePassword,
  onEditProfile,
  sidebarOpen,
  setSidebarOpen,
  onRequestsUpdate
}) {
  return (
    <SharedHeader
      currentUser={currentUser}
      onLogout={onLogout}
      onChangePassword={onChangePassword}
      onEditProfile={onEditProfile}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onRequestsUpdate={onRequestsUpdate}
      Notifications={SystemAdminNotifications}
    />
  );
}
