import { X, Tag, Plus, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TagInput({ tags, setTags, availableTags, errors }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
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
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = availableTags
    ? availableTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) && 
        !tags.includes(tag)
      )
    : [];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags (Optional)
      </label>
      <div className={`border rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 ${
        errors?.tags ? 'border-red-500' : 'border-gray-300'
      }`}>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
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
            className="w-full px-2 py-1 border-0 focus:outline-none text-sm"
            placeholder="Type a tag and press Enter or comma..."
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredSuggestions.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                >
                  <Tag className="w-3 h-3 text-gray-400" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Press Enter or comma to add tags. Click × to remove.
      </p>
      {errors?.tags && <p className="mt-1 text-sm text-red-500">{errors.tags}</p>}
    </div>
  );
}


export function TagFilter({ allTags, selectedTags, onTagToggle, onClearTags }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!allTags || allTags.length === 0) return null;

  const displayTags = isExpanded ? allTags : allTags.slice(0, 8);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
              {selectedTags.length} selected
            </span>
          )}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          );
        })}
      </div>

      {allTags.length > 8 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isExpanded ? 'Show Less' : `Show ${allTags.length - 8} More Tags`}
        </button>
      )}
    </div>
  );
}

// 3. TagDisplay Component - For showing tags on document cards
export function TagDisplay({ tags, maxDisplay = 3 }) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium"
        >
          <Tag className="w-2.5 h-2.5" />
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}


export function TagManagement({ dataStore }) {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editValue, setEditValue] = useState('');

  // ✅ FIXED: Get count of documents using a specific tag
  const getTagCount = (tag) => {
    const allDocs = dataStore.getAllDocuments();
    return allDocs.filter(doc => doc.tags && doc.tags.includes(tag)).length;
  };

  // ✅ FIXED: Load tags function - Use dataStore.getAllTags() which includes system tags
  const loadTags = () => {
    const allTags = dataStore.getAllTags();
    setTags(allTags);
  };

  // ✅ FIXED: Use useEffect instead of useState - This was the bug!
  useEffect(() => {
    loadTags();
    
    // ✅ Subscribe to dataStore changes to reload tags when documents change
    const unsubscribe = dataStore.subscribe(() => {
      loadTags();
    });
    
    return unsubscribe;
  }, [dataStore]);

  const handleAddTag = () => {
    const trimmedTag = newTagName.trim().toLowerCase();
    if (trimmedTag) {
      // ✅ Use dataStore.addTag() which adds to systemTags
      const added = dataStore.addTag(trimmedTag);
      if (added) {
        setNewTagName('');
        loadTags(); // Reload tags to show the new one
        alert(`Tag "${trimmedTag}" created! You can now use it when creating or uploading documents.`);
      } else {
        alert('This tag already exists!');
      }
    }
  };

  const handleDeleteTag = (tag) => {
    if (window.confirm(`Delete tag "${tag}"? This will remove it from all documents and the system.`)) {
      // ✅ Use dataStore.removeTag() which removes from systemTags and all documents
      const removed = dataStore.removeTag(tag);
      if (removed) {
        loadTags();
        alert(`Tag "${tag}" deleted successfully!`);
      }
    }
  };

  const handleRenameTag = (oldTag) => {
    const newTag = editValue.trim().toLowerCase();
    if (newTag && newTag !== oldTag) {
      // ✅ Use dataStore.renameTag() which renames in systemTags and all documents
      const renamed = dataStore.renameTag(oldTag, newTag);
      if (renamed) {
        loadTags();
        setEditingTag(null);
        setEditValue('');
        alert(`Tag renamed from "${oldTag}" to "${newTag}"!`);
      } else {
        alert('A tag with this name already exists or the operation failed!');
      }
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tag Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage tags used across all documents</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
          <span className="font-semibold">{tags.length}</span> total tags
        </div>
      </div>

      {/* Add New Tag */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Add New Tag</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Enter tag name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTagName.trim()}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>
      </div>

      {/* Search Tags */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    {tags.length === 0 
                      ? 'No tags created yet. Add tags to your documents to get started.'
                      : 'No tags match your search.'}
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingTag === tag ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleRenameTag(tag);
                            if (e.key === 'Escape') {
                              setEditingTag(null);
                              setEditValue('');
                            }
                          }}
                          className="px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium text-gray-900">{tag}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getTagCount(tag)} document{getTagCount(tag) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {editingTag === tag ? (
                          <>
                            <button
                              onClick={() => handleRenameTag(tag)}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingTag(null);
                                setEditValue('');
                              }}
                              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingTag(tag);
                                setEditValue(tag);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-l-4 border-blue-500 p-4 rounded bg-blue-50">
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg text-blue-600">💡</span>
          <p className="text-sm font-medium text-blue-900">
            <strong>Tip:</strong> Tags help organize and categorize documents. You can filter documents by tags, 
            and each tag shows how many documents use it. Renaming or deleting a tag will update all associated documents.
          </p>
        </div>
      </div>
    </div>
  );
}


export function getAllTagsFromDocuments(documents) {
  const tagSet = new Set();
  documents.forEach(doc => {
    if (doc.tags && Array.isArray(doc.tags)) {
      doc.tags.forEach(tag => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}