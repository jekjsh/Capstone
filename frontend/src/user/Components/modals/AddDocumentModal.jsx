// components/modals/AddDocumentModal.jsx
import { X } from 'lucide-react';

export default function AddDocumentModal({ show, onClose, newDocument, setNewDocument, customFields, errors, onAddDocument }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label>
            <input 
              type="text" 
              value={newDocument.title} 
              onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })} 
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} 
              placeholder="Enter document title" 
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea 
              value={newDocument.description} 
              onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              rows="3" 
              placeholder="Enter document description (optional)" 
            />
          </div>
          {customFields.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Custom Fields</h3>
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.name}</label>
                    {field.type === 'textarea' ? (
                      <textarea 
                        value={newDocument.customFieldValues[field.name] || ''} 
                        onChange={(e) => setNewDocument({ ...newDocument, customFieldValues: { ...newDocument.customFieldValues, [field.name]: e.target.value } })} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        rows="2" 
                      />
                    ) : (
                      <input 
                        type={field.type} 
                        value={newDocument.customFieldValues[field.name] || ''} 
                        onChange={(e) => setNewDocument({ ...newDocument, customFieldValues: { ...newDocument.customFieldValues, [field.name]: e.target.value } })} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onAddDocument} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            Create Document
          </button>
        </div>
      </div>
    </div>
  );
}