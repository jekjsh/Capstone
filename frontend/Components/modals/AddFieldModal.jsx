import { X, Eye, EyeOff } from 'lucide-react';

export default function AddFieldModal({ show, onClose, newField, setNewField, errors, onAddField }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Custom Field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
            <input 
              type="text" 
              value={newField.fieldName} 
              onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })} 
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.fieldName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} 
              placeholder="e.g., Project Name, Department" 
            />
            {errors.fieldName && <p className="mt-1 text-sm text-red-500">{errors.fieldName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
            <select 
              value={newField.fieldType} 
              onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="textarea">Long Text</option>
            </select>
          </div>
          
          {/* NEW: Show in Documents Toggle */}
          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={newField.showInDocuments !== false}
                  onChange={(e) => setNewField({ ...newField, showInDocuments: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Show in Document Creation</span>
                  {newField.showInDocuments !== false ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newField.showInDocuments !== false 
                    ? 'This field will be available when creating documents' 
                    : 'This field will be hidden from document creation'}
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onAddField} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}