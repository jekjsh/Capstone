import { X, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { folderAPI } from '../../services/api';

export default function AddFolderCategoryModal({
  show,
  onClose,
  folder,
  categories = [],
  onCategoryUpdated,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show || !folder) return;
    setMessage('');
    setError('');
  }, [show, folder]);

  if (!show || !folder) return null;

  const activeCategoryId = folder.folder_category || null;

  const handleSetCategory = async (categoryId) => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await folderAPI.setCategory(folder.folder_id, categoryId);
      setMessage('Folder category updated successfully');
      onCategoryUpdated?.();
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      console.error('Failed to set folder category:', err);
      setError(err.message || 'Failed to set folder category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCategory = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await folderAPI.removeCategory(folder.folder_id);
      setMessage('Folder category removed successfully');
      onCategoryUpdated?.();
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      console.error('Failed to remove folder category:', err);
      setError(err.message || 'Failed to remove folder category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-96 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Set Folder Category</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">Folder: {folder.folder_name}</p>
            <p className="mt-1">Only one category can be assigned to a folder.</p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No categories available</p>
              <p className="text-xs mt-2">Create a category in the Categories section first</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Available Categories:</p>
              {categories.map((category) => {
                const isSelected = String(activeCategoryId || '') === String(category.category_id);
                return (
                  <div key={category.category_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.category_name}</p>
                      {category.category_desc && (
                        <p className="text-xs text-gray-500">{category.category_desc}</p>
                      )}
                    </div>
                    {isSelected ? (
                      <button
                        onClick={handleRemoveCategory}
                        disabled={isLoading}
                        className="ml-2 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 text-sm font-medium transition"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetCategory(category.category_id)}
                        disabled={isLoading}
                        className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 text-sm font-medium transition"
                      >
                        Set
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeCategoryId && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700">Current Category:</p>
              <span className="inline-flex items-center mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {folder.folder_category_name || 'Assigned'}
              </span>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end">
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
