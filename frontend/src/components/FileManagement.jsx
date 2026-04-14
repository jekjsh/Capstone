import DocumentsManager from '../user/Components/DocumentsManager';

// Shared entry point for file-management UI used by both user and admin modules.
export default function FileManagement(props) {
  return <DocumentsManager {...props} />;
}
