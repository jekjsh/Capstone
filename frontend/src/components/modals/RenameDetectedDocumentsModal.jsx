import { X, FileText } from 'lucide-react';

const splitNameAndExtension = (fullName) => {
  const lastDot = String(fullName || '').lastIndexOf('.');
  if (lastDot <= 0) {
    return { base: String(fullName || ''), extension: '' };
  }
  return {
    base: String(fullName || '').slice(0, lastDot),
    extension: String(fullName || '').slice(lastDot),
  };
};

export default function RenameDetectedDocumentsModal({
  show,
  onClose,
  detectedItems = [],
  onChangeName,
  onConfirm,
  isSubmitting = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Review Detected Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          We detected document details. You can rename each file before upload.
        </p>

        <div className="space-y-4">
          {detectedItems.map((item, index) => {
            const fileNameToEdit = item.finalName || item.fileName;
            const split = splitNameAndExtension(fileNameToEdit);
            return (
              <div key={`${item.fileName}-${index}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-800">{item.fileName}</p>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={split.base}
                    onChange={(e) => onChangeName(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Document name"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">{split.extension || '(no extension)'}</span>
                </div>

                <div className="mb-3">
                  {item.predictedCategoryName ? (
                    <p className="text-xs text-emerald-700 font-medium">
                      This will be automatically categorized as {item.predictedCategoryName}.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">
                      No matching category was detected from this file yet.
                    </p>
                  )}
                </div>

                {item.isOcrFile && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Extracted OCR Text</p>
                    <textarea
                      value={item.extractedText || ''}
                      readOnly
                      className="w-full min-h-28 p-2 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700"
                    />
                    {!item.extractedText && (
                      <p className="text-xs text-amber-700 mt-1">
                        OCR completed but no readable text was found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
            disabled={isSubmitting || detectedItems.length === 0}
          >
            {isSubmitting ? 'Uploading...' : 'Confirm and Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
