// components/CustomFields.jsx
import { Plus } from 'lucide-react';

export default function CustomFields({ customFields, setShowAddFieldModal, onDeleteField }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Custom Fields</h2>
        <button onClick={() => setShowAddFieldModal(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Field
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customFields.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No custom fields created yet. Click "Add Field" to create one.
                  </td>
                </tr>
              ) : (
                customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{field.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{field.type}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => onDeleteField(field.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Custom fields allow you to add specific information to your documents. Create fields like "Project Name", "Department", "Budget", etc., and use them when creating documents.
        </p>
      </div>
    </div>
  );
}