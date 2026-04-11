import { X, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { documentAPI } from '../../../services/api';

export default function AddDocumentCategoriesModal({ 
  show, 
  onClose, 
  document, 
  categories = [],
  onCategoriesUpdated 
}) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [assignedCategories, setAssignedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load currently assigned categories when modal opens
  useEffect(() => {
    if (!show || !document) return;
    
    if (document.categories && Array.isArray(document.categories)) {
      const assigned = document.categories.map(cat => cat.category_id);
      setAssignedCategories(assigned);
      setSelectedCategories(assigned);
    } else {
      setAssignedCategories([]);
      setSelectedCategories([]);
    }
    setMessage('');
    setError('');
  }, [show, document]);

  if (!show || !document) return null;

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleAddCategory = async (categoryId) => {
    setIsLoading(true);
    setMessage('');
    setError('');
    
    try {
      await documentAPI.addCategory(document.doc_id, categoryId);
      setAssignedCategories(prev => [...prev, categoryId]);
      setMessage('Category added successfully');
      
      // Notify parent component
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to add category:', err);
      setError(err.message || 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCategory = async (docCategoryId) => {
    setIsLoading(true);
    setMessage('');
    setError('');
    
    try {
      await documentAPI.removeCategory(document.doc_id, docCategoryId);
      const categoryId = document.categories.find(c => c.doc_category_id === docCategoryId)?.category_id;
      setAssignedCategories(prev => prev.filter(id => id !== categoryId));
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      setMessage('Category removed successfully');
      
      // Notify parent component
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to remove category:', err);
      setError(err.message || 'Failed to remove category');
    } finally {
      setIsLoading(false);
    }
  };

  const activeCategoriesForDocument = document.categories || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Add Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
              {message}
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No categories available</p>
              <p className="text-xs mt-2">Create a category in the Categories section first</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Available Categories:</p>
              {categories.map(category => {
                const isAssigned = activeCategoriesForDocument.some(c => c.category_id === category.category_id);
                return (
                  <div key={category.category_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.category_name}</p>
                      {category.category_desc && (
                        <p className="text-xs text-gray-500">{category.category_desc}</p>
                      )}
                    </div>
                    {isAssigned ? (
                      <button
                        onClick={() => {
                          const docCategory = activeCategoriesForDocument.find(c => c.category_id === category.category_id);
                          if (docCategory) {
                            handleRemoveCategory(docCategory.doc_category_id);
                          }
                        }}
                        disabled={isLoading}
                        className="ml-2 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 text-sm font-medium transition"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddCategory(category.category_id)}
                        disabled={isLoading}
                        className="ml-2 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 text-sm font-medium transition"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeCategoriesForDocument.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Categories:</p>
              <div className="flex flex-wrap gap-2">
                {activeCategoriesForDocument.map(cat => (
                  <span key={cat.doc_category_id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {cat.category_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
