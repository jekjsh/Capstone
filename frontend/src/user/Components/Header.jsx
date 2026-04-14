import SharedHeader from '../../components/SharedHeader';
import Notifications from './Notifications';

export default function Header({ 
  currentUser, 
  onLogout, 
  onChangePassword, 
  sidebarOpen, 
  setSidebarOpen 
}) {
  return (
    <SharedHeader
      currentUser={currentUser}
      onLogout={onLogout}
      onChangePassword={onChangePassword}
      onEditProfile={() => {}}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      Notifications={Notifications}
    />
  );
}