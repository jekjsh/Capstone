import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { categoryAPI, authAPI } from '../../services/api';
import AdminPagination from './AdminPagination';

export default function Category({ userOrg = null }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentOrgId, setCurrentOrgId] = useState(userOrg);
  const [formData, setFormData] = useState({
    category_name: '',
    category_desc: '',
    is_active: true,
    org: userOrg
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get current user's organization on mount
  useEffect(() => {
    const fetchUserOrg = async () => {
      try {
        if (!userOrg) {
          const userData = await authAPI.getCurrentProfile();
          if (userData.org) {
            setCurrentOrgId(userData.org);
            setFormData(prev => ({ ...prev, org: userData.org }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch user org:', err);
      }
    };
    fetchUserOrg();
  }, [userOrg]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [currentOrgId]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryAPI.getAll();
      // Backend already filters by organization, just use the data as-is
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category.category_id);
      setFormData({
        category_name: category.category_name,
        category_desc: category.category_desc || '',
        is_active: category.is_active,
        org: category.org || currentOrgId
      });
    } else {
      setEditingId(null);
      setFormData({
        category_name: '',
        category_desc: '',
        is_active: true,
        org: currentOrgId
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      category_name: '',
      category_desc: '',
      is_active: true,
      org: currentOrgId
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.category_name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (editingId) {
        // Update existing category
        await categoryAPI.update(editingId, formData);
        setSuccessMessage('Category updated successfully!');
      } else {
        // Create new category
        await categoryAPI.create(formData);
        setSuccessMessage('Category created successfully!');
      }
      
      // Refresh the list
      await fetchCategories();
      handleCloseModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.delete(categoryId);
        setSuccessMessage('Category deleted successfully!');
        await fetchCategories();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories created yet. Click "Add Category" to create one.
          </div>
        ) : (
          // Table layout for admin view
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                    <tr key={category.category_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{category.category_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-3 flex gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.category_id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {categories.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={Math.ceil(categories.length / rowsPerPage)}
          startIndex={(currentPage - 1) * rowsPerPage}
          endIndex={currentPage * rowsPerPage}
          rowsPerPage={rowsPerPage}
          totalRecords={categories.length}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          onFirstPage={() => setCurrentPage(1)}
          onLastPage={() => setCurrentPage(Math.ceil(categories.length / rowsPerPage))}
          onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => Math.min(Math.ceil(categories.length / rowsPerPage), prev + 1))}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.category_desc}
                  onChange={(e) => setFormData({ ...formData, category_desc: e.target.value })}
                  placeholder="Enter category description (optional)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active
                </label>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Tip:</strong> Create categories to organize and tag your documents and folders. 
            For example, create "Travel Order" to categorize related documents. You can add, edit, or delete categories anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
