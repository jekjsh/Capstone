import { X, Folder, FolderOpen } from 'lucide-react';

const folderColorClasses = {
  blue: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
  },
  green: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
  },
  purple: {
    container: 'bg-purple-50 border-purple-200',
    icon: 'text-purple-600',
  },
  red: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
  },
  yellow: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
  },
  pink: {
    container: 'bg-pink-50 border-pink-200',
    icon: 'text-pink-600',
  },
};

export default function MoveToFolderModal({ show, onClose, folders, onMoveToFolder, getFolderDocumentCount }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Move to Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => onMoveToFolder(null)}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <Folder className="w-8 h-8 text-gray-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Root (No Folder)</p>
              <p className="text-sm text-gray-500">Move to documents root</p>
            </div>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.folder_id}
              onClick={() => onMoveToFolder(folder.folder_id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-lg hover:border-indigo-500 transition-all ${(folderColorClasses[folder.folder_color] || folderColorClasses.blue).container}`}
            >
              <FolderOpen className={`w-8 h-8 ${(folderColorClasses[folder.folder_color] || folderColorClasses.blue).icon}`} />
              <div className="text-left">
                <p className="font-semibold text-gray-800">{folder.folder_name}</p>
                <p className="text-sm text-gray-500">{getFolderDocumentCount(folder.folder_id)} documents</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
