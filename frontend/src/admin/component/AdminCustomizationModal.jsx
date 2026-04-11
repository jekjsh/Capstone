import SystemCustomization from '../../system-admin/components/SystemCustomization';

export default function AdminCustomizationModal({ 
  show, 
  onClose, 
  dataStore,
  onSave 
}) {
  if (!show) return null;

  const handleClose = () => {
    if (onSave) {
      onSave();
    }
    onClose();
  };

  return (
    <SystemCustomization onClose={handleClose} />
  );
}
