import { Plus, Check, X } from 'lucide-react';

export default function Tags({ customFields, setShowAddFieldModal, onDeleteField, onToggleFieldActive }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tags</h2>
        <button onClick={() => setShowAddFieldModal(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Show in Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customFields.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No tags created yet. Click "Add Tag" to create one.
                  </td>
                </tr>
              ) : (
                customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{field.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{field.type}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onToggleFieldActive(field.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          field.showInDocuments 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={field.showInDocuments ? 'Click to hide from documents' : 'Click to show in documents'}
                      >
                        {field.showInDocuments ? (
                          <>
                            <Check className="w-3 h-3" />
                            Visible
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Hidden
                          </>
                        )}
                      </button>
                    </td>
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
      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Tip:</strong> Tags allow you to organize and categorize your documents. 
            Toggle the "Show in Documents" status to control which tags appear when creating documents. 
            Only tags marked as "Visible" will be available in the document creation form.
          </p>
        </div>
      </div>
    </div>
  );
}
