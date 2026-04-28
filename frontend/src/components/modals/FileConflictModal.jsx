import { AlertTriangle, X } from 'lucide-react';

export default function FileConflictModal({
  show,
  fileName,
  onOverride,
  onRename,
  onCancel,
  suggestedName,
  isLoading = false
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              File Already Exists
            </h3>
            <p className="text-gray-600 mb-4">
              A file named <span className="font-mono font-semibold text-gray-900">"{fileName}"</span> already exists in this location.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              What would you like to do?
            </p>

            <div className="space-y-3">
              <button
                onClick={onOverride}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Replace File'}
              </button>
              <button
                onClick={onRename}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Keep Both (Rename)'}
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>

            {suggestedName && (
              <p className="text-xs text-gray-500 mt-4">
                The file will be renamed to: <span className="font-mono text-gray-700">{suggestedName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
