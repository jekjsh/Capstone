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

  const rowTwoFields = [
    { label: 'Date of Birth', value: formatDate(user.userBirthdate) },
    { label: 'Email Address', value: user.email || '-' },
    { label: 'Contact Number', value: user.userContact || '-' },
  ];

  const rowThreeFields = [
    { label: 'Position', value: user.userPos || user.organizationPosition || '-' },
    { label: 'Organization Unit', value: organizationName },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={user.id || '-'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rowOneFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rowTwoFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rowThreeFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
