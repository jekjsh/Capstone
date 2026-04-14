import SharedHeader from '../../components/SharedHeader';

export default function AdminHeader({ 
  currentUser, 
  onLogout,
  onChangePassword,
  onEditProfile,
  sidebarOpen,
  setSidebarOpen
}) {
  return (
    <SharedHeader
      currentUser={currentUser}
      onLogout={onLogout}
      onChangePassword={onChangePassword}
      onEditProfile={onEditProfile}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  );
}