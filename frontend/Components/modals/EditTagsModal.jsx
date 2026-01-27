import { X, Tag, AlertCircle, FileText, FileSpreadsheet, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditTagsModal({ 
  show, 
  onClose, 
  document,
  dataStore,
  onSave
}) {
  const [documentTags, setDocumentTags] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load document's current tags when modal opens
  useEffect(() => {
    if (show && document) {
      setDocumentTags(document.tags || []);
    }
  }, [show, document]);

  if (!show || !document) return null;

  // Get available tags from dataStore
  const availableTags = dataStore ? dataStore.getAllTags() : [];
  
  // Filter out tags that are already added
  const unselectedTags = availableTags.filter(tag => !documentTags.includes(tag));
  
  // Filter suggestions based on input
  const filteredSuggestions = inputValue 
    ? unselectedTags.filter(tag => tag.toLowerCase().includes(inputValue.toLowerCase()))
    : [];

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !documentTags.includes(trimmedTag)) {
      setDocumentTags([...documentTags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && documentTags.length > 0) {
      setDocumentTags(documentTags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setDocumentTags(documentTags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!dataStore) {
      alert('Error: dataStore is not available');
      return;
    }
    
    // Update the document with new tags
    dataStore.updateDocument(document.id, { tags: documentTags });
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(document.id, documentTags);
    }
    
    alert(`Tags updated successfully for "${document.title}"!`);
    onClose();
  };

  const handleClose = () => {
    setDocumentTags([]);
    setInputValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Tags</h2>
            <p className="text-sm text-gray-600 mt-1">Manage tags for: <strong>{document.title}</strong></p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 ${
                document.format === 'pdf' ? 'bg-red-100' :
                document.format === 'excel' ? 'bg-green-100' :
                document.format === 'docx' ? 'bg-blue-100' :
                document.format === 'ocr' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                {document.format === 'excel' ? (
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                ) : (
                  <FileText className={`w-6 h-6 ${
                    document.format === 'pdf' ? 'text-red-600' :
                    document.format === 'docx' ? 'text-blue-600' :
                    document.format === 'ocr' ? 'text-green-600' :
                    'text-gray-600'
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{document.title}</h3>
                {document.description && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{document.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>Created: {document.createdAt}</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    document.format === 'pdf' ? 'bg-red-100 text-red-700' :
                    document.format === 'excel' ? 'bg-green-100 text-green-700' :
                    document.format === 'docx' ? 'bg-blue-100 text-blue-700' :
                    document.format === 'ocr' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {document.format?.toUpperCase() || 'DOC'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Tags Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Tags ({documentTags.length})
            </label>
            <div className="border-2 border-indigo-200 rounded-lg p-3 bg-indigo-50 min-h-[80px]">
              {documentTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {documentTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-full text-sm font-medium shadow-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-indigo-600 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No tags selected. Click tags below or type to add new ones.
                </div>
              )}
            </div>
          </div>

          {/* Add New Tag Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Tag
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(inputValue.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type a tag and press Enter..."
                />
                <button
                  onClick={() => inputValue.trim() && handleAddTag(inputValue)}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              
              {/* Auto-complete Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2 transition-colors"
                    >
                      <Tag className="w-3 h-3 text-indigo-500" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Press Enter, comma, or click Add button to create a new tag
            </p>
          </div>

          {/* Available Tags - Click to Add */}
          {unselectedTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Tags - Click to Add ({unselectedTags.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {unselectedTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddTag(tag)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                💡 Click any tag above to quickly add it to this document
              </p>
            </div>
          )}

          {/* No Available Tags Message */}
          {availableTags.length === 0 && (
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">No existing tags in the system</p>
                  <p className="text-xs text-yellow-700 mt-1">Type in the field above to create your first tags!</p>
                </div>
              </div>
            </div>
          )}

          {/* All Tags Selected Message */}
          {availableTags.length > 0 && unselectedTags.length === 0 && (
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <div className="flex items-start gap-2">
                <Tag className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">All available tags have been added!</p>
                  <p className="text-xs text-green-700 mt-1">You can create new tags by typing in the field above.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Save Tags ({documentTags.length})
          </button>
        </div>
      </div>
    </div>
  );
}