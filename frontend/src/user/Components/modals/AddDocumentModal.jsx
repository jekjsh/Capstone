import { X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

export default function AddDocumentModal({ 
  show, 
  onClose, 
  newDocument, 
  setNewDocument, 
  customFields, 
  errors, 
  onAddDocument 
}) {
  const [selectedFields, setSelectedFields] = useState([]);

  if (!show) return null;

  const toggleFieldSelection = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
    
  
    if (selectedFields.includes(fieldId)) {
      const field = customFields.find(f => f.id === fieldId);
      if (field) {
        const newValues = { ...newDocument.customFieldValues };
        delete newValues[field.name];
        setNewDocument({ ...newDocument, customFieldValues: newValues });
      }
    }
  };

  const handleFieldValueChange = (fieldName, value) => {
    setNewDocument({
      ...newDocument,
      customFieldValues: {
        ...newDocument.customFieldValues,
        [fieldName]: value
      }
    });
  };

  const renderFieldInput = (field) => {
    const value = newDocument.customFieldValues[field.name] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="3"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options && field.options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleFieldValueChange(field.name, e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options && field.options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  required={field.required}
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const selectedFieldsData = customFields.filter(f => selectedFields.includes(f.id));
const availableFields = customFields.filter(field => field.showInDocuments !== false);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Document Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label>
              <input
                type="text"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g., Employee Contract"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Brief description of the document"
              />
            </div>
          </div>

          {/* Custom Fields Section */}
        {availableFields.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Custom Fields (Optional)
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Select the fields you want to add to this document:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableFields.map(field => (
                    <label
                      key={field.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFields.includes(field.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleFieldSelection(field.id)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{field.name}</span>
                          {field.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Required</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{field.type}</span>
                      </div>
                      {selectedFields.includes(field.id) ? (
                        <Minus className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Selected Fields Input */}
              {selectedFieldsData.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Fill in the selected fields ({selectedFieldsData.length}):
                  </p>
                  <div className="space-y-4">
                    {selectedFieldsData.map(field => (
                      <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.name}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFieldInput(field)}
                        {field.options && field.options.length > 0 && (field.type === 'select' || field.type === 'radio') && (
                          <p className="text-xs text-gray-500 mt-1">
                            Options: {field.options.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {availableFields.length === 0 && (
  <div className="border-t pt-6">
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-blue-800">
        <strong>💡 Tip:</strong> No custom fields available. Create custom fields in the "Custom Fields" section and mark them as "Show in Documents" to add additional metadata to your documents.
      </p>
    </div>
  </div>
)}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAddDocument}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Next: Personal Information
          </button>
        </div>
      </div>
    </div>
  );
}