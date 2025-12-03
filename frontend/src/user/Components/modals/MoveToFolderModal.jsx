// components/modals/MoveToFolderModal.jsx
import { X, Folder, FolderOpen } from 'lucide-react';

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
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-lg hover:border-indigo-500 transition-all bg-${folder.color}-50 border-${folder.color}-200`}
            >
              <FolderOpen className={`w-8 h-8 text-${folder.color}-600`} />
              <div className="text-left">
                <p className="font-semibold text-gray-800">{folder.name}</p>
                <p className="text-sm text-gray-500">{getFolderDocumentCount(folder.id)} documents</p>
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