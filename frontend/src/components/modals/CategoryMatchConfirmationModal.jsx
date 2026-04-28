import { X, FileSearch } from 'lucide-react';

export default function CategoryMatchConfirmationModal({
  show,
  items = [],
  onClose,
  onConfirm,
  isBusy = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Confirm Detected Category Match</h2>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item, index) => (
            <div key={`${item.fileName}-${index}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-start gap-2">
                <FileSearch className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-gray-800">
                  <p className="font-semibold">{item.fileName}</p>
                  {item.predictedCategoryName ? (
                    <>
                      <p>
                        We detected a match from the {item.predictedCategoryName} category.
                        Do you want to apply this category?
                      </p>
                      {item.matchedFolderName ? (
                        <p className="mt-1 text-xs text-emerald-700">
                          Matching folder found: {item.matchedFolderName}. After rename, this file will upload directly to that folder.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700">
                          No matching folder name found for this category. It will upload to your current folder.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        We could not confidently map this file to a category.
                        It will continue with fallback naming and no automatic category assignment.
                      </p>
                      {item.matchedFolderName && (
                        <p className="mt-1 text-xs text-emerald-700">
                          Folder name match found: {item.matchedFolderName}. After rename, this file will upload directly to that folder.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            No, Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isBusy || items.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Yes, Continue to Rename
          </button>
        </div>
      </div>
    </div>
  );
}
