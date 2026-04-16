import { X } from 'lucide-react';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

export default function UserProfileViewModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  const organizationName =
    user.organizationUnitName ||
    user.organizationName ||
    user.org_name ||
    user.orgName ||
    user.org_name_display ||
    '-';

  const rowOneFields = [
    { label: 'First Name', value: user.firstName || '-' },
    { label: 'Middle Name', value: user.middleName || '-' },
    { label: 'Last Name', value: user.lastName || '-' },
    { label: 'Suffix', value: user.suffix || '-' },
  ];

  const birthdateValue = formatDate(user.userBirthdate);
  const emailValue = user.email || '-';
  const contactValue = user.userContact || '-';

  const rowThreeFields = [
    { label: 'Position', value: user.userPos || user.organizationPosition || '-' },
    { label: 'Organization Unit', value: organizationName },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-8 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-medium text-gray-800">{user.id || user.user_id || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Organization</p>
              <p className="font-medium text-gray-800">{organizationName}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rowOneFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                />
              </div>
            ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="text"
                value={emailValue}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
              <input
                type="text"
                value={contactValue}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="text"
                value={birthdateValue}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rowThreeFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
