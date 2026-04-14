import { Folder, Trash2, Share2, Edit } from 'lucide-react';
import ContextMenu from './ContextMenu';

export default function FolderCard({
  folder,
  viewMode = 'list',
  docCount = 0,
  isShared = false,
  sharedLabel = 'Shared',
  onFolderClick,
  onDeleteClick,
  onShareClick,
  onRenameClick,
  showDeleteButton = true,
}) {
  const iconColorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    pink: 'text-pink-600 bg-pink-100',
  };

  return (
    <div
      className="bg-white border-2 border-gray-200 rounded-lg p-3 transition-all hover:shadow-md group flex items-center justify-between gap-3"
    >
      <button
        onClick={() => onFolderClick?.(folder.folder_id)}
        className="flex items-center gap-3 text-left flex-1 min-w-0 select-none"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            iconColorClasses[folder.folder_color] || iconColorClasses.blue
          }`}
        >
          <Folder className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-gray-800 line-clamp-1 select-none">{folder.folder_name}</h3>
            {isShared && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                {sharedLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">
            {docCount} item{docCount !== 1 ? 's' : ''}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {showDeleteButton && (
          <>
            {onShareClick && (
              <button
                onClick={() => onShareClick(folder)}
                className="px-2.5 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            )}
            <ContextMenu
              item={folder}
              itemType="folder"
              hideShareOption={true}
              onShare={() => onShareClick?.(folder)}
              onRename={() => onRenameClick?.(folder.folder_id)}
              onDelete={() => onDeleteClick?.(folder.folder_id)}
            />
          </>
        )}
      </div>
    </div>
  );
}
