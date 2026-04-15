import { X, Upload, ScanText } from 'lucide-react';

export default function OCRModal({ 
  show, 
  onClose, 
  uploadedFile, 
  ocrText, 
  setOcrText, 
  ocrMode = 'fast',
  setOcrMode,
  isProcessingOCR, 
  onFileUpload, 
  onProcessOCR, 
  onUseOCRText 
}) {
  if (!show) return null;

  const isValidOcrFile = (file) => {
    if (!file) return false;

    const fileType = String(file.type || '').toLowerCase();
    const fileName = String(file.name || '').toLowerCase();

    const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|tiff?)$/.test(fileName);
    const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');

    return isImage || isPdf;
  };

  const handleProcessClick = () => {
    if (!isValidOcrFile(uploadedFile)) {
      alert('OCR only accepts PDF and image files.');
      return;
    }

    onProcessOCR();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Extract Text with OCR</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-900">
            Note: Pytesseract doesn&apos;t guarantee 100% accuracy and may not give clear results, and may not work correctly on dark or blurry documents.
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OCR Mode</label>
            <select
              value={ocrMode}
              onChange={(e) => setOcrMode && setOcrMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isProcessingOCR}
            >
              <option value="fast">Fast (Tesseract, recommended default)</option>
              <option value="high_precision">High Precision (Tesseract, slower)</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Upload an image or PDF document for OCR processing</p>
            <input
              type="file"
              onChange={onFileUpload}
              accept="image/*,.pdf"
              className="hidden"
              id="ocr-file-upload"
            />
            <label
              htmlFor="ocr-file-upload"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Choose File
            </label>
            {uploadedFile && (
              <p className="mt-3 text-sm text-indigo-600 font-medium">
                Selected: {uploadedFile.name}
              </p>
            )}
          </div>

          {uploadedFile && (
            <button
              onClick={handleProcessClick}
              disabled={isProcessingOCR}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessingOCR ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing OCR...
                </>
              ) : (
                <>
                  <ScanText className="w-5 h-5" />
                  Process with OCR
                </>
              )}
            </button>
          )}

          {ocrText && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ScanText className="w-5 h-5 text-indigo-600" />
                Extracted Text (OCR Result)
              </h3>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="10"
                placeholder="OCR extracted text will appear here..."
              />
              <p className="text-xs text-gray-500 mt-2">You can edit the extracted text before creating the document</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUseOCRText}
            disabled={!ocrText}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Extract as text file
          </button>
        </div>
      </div>
    </div>
  );
}
