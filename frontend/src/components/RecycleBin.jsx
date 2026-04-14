import UserRecycleBin from '../user/Components/RecycleBin';

// Shared entry point to recycle-bin module to support future reuse.
export default function RecycleBin(props) {
  return <UserRecycleBin {...props} />;
}
