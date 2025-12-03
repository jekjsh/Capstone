// components/Folders.jsx
import { Folder, FolderPlus, FolderOpen, Trash2 } from 'lucide-react';

export default function Folders({ folders, getFolderDocumentCount, setShowCreateFolderModal, onDeleteFolder, setCurrentFolder, setActiveSection }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Folders</h2>
        <button 
          onClick={() => setShowCreateFolderModal(true)} 
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          Create Folder
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No folders created yet</p>
          <p className="text-gray-400 text-sm mb-4">Create folders to organize your documents</p>
          <button 
            onClick={() => setShowCreateFolderModal(true)} 
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Create Your First Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => {
            const docCount = getFolderDocumentCount(folder.id);
            const colorClasses = {
              blue: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
              green: 'bg-green-100 border-green-300 hover:bg-green-200',
              purple: 'bg-purple-100 border-purple-300 hover:bg-purple-200',
              red: 'bg-red-100 border-red-300 hover:bg-red-200',
              yellow: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
              pink: 'bg-pink-100 border-pink-300 hover:bg-pink-200'
            };
            
            return (
              <div 
                key={folder.id} 
                className={`${colorClasses[folder.color]} border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <button
                    onClick={() => {
                      setCurrentFolder(folder.id);
                      setActiveSection('documents');
                    }}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className={`w-12 h-12 text-${folder.color}-600`} />
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-800">{folder.name}</h3>
                        <p className="text-sm text-gray-600">{docCount} document{docCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => onDeleteFolder(folder.id)} 
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Created: {folder.createdAt}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Create folders to organize your documents by category, project, or any system that works for you. Click on a folder to view its documents.
        </p>
      </div>
    </div>
  );
}