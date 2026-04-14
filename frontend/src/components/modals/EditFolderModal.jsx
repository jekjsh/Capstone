import { X } from 'lucide-react';

const colorSwatchClasses = {
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  purple: 'bg-purple-200',
  red: 'bg-red-200',
  yellow: 'bg-yellow-200',
  pink: 'bg-pink-200',
};

export default function EditFolderModal({ 
  show, 
  onClose, 
  folderName, 
  setFolderName, 
  folderColor, 
  setFolderColor, 
  errors, 
  onSaveFolder,
  isLoading = false
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name *</label>
            <input 
              type="text" 
              value={folderName} 
              onChange={(e) => setFolderName(e.target.value)} 
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.folderName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} 
              placeholder="e.g., Personal Documents, Work Files" 
            />
            {errors.folderName && <p className="mt-1 text-sm text-red-500">{errors.folderName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Color</label>
            <div className="grid grid-cols-6 gap-2">
              {['blue', 'green', 'purple', 'red', 'yellow', 'pink'].map((color) => (
                <button
                  key={color}
                  onClick={() => setFolderColor(color)}
                  className={`w-full h-12 rounded-lg border-2 transition-all ${
                    folderColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  } ${colorSwatchClasses[color]} hover:scale-105`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={onSaveFolder} 
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

