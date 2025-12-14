import { X, Upload, FileText } from 'lucide-react';

export default function UploadDocumentModal({ 
  show, 
  onClose, 
  uploadedDocFiles, 
  uploadPreviews, 
  currentPreviewIndex, 
  setCurrentPreviewIndex,
  onFileUpload, 
  onRemoveFile, 
  onUpload 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Upload document files (PDF, DOCX, Images, Text, etc.)</p>
            <p className="text-sm text-gray-500 mb-4">You can select multiple files at once</p>
            <input
              type="file"
              onChange={onFileUpload}
              accept=".pdf,.doc,.docx,.txt,image/*"
              multiple
              className="hidden"
              id="doc-file-upload"
            />
            <label
              htmlFor="doc-file-upload"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Choose Files
            </label>
          </div>

          {uploadedDocFiles.length > 0 && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Selected Files ({uploadedDocFiles.length})
                </h3>
              </div>
              <div className="p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {uploadedDocFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        currentPreviewIndex === index 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentPreviewIndex(index)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className={`w-5 h-5 ${currentPreviewIndex === index ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFile(index);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {uploadPreviews.length > 0 && uploadPreviews[currentPreviewIndex] && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Preview: {uploadPreviews[currentPreviewIndex].fileName}
                </h3>
                {uploadedDocFiles.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                      disabled={currentPreviewIndex === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPreviewIndex + 1} / {uploadedDocFiles.length}
                    </span>
                    <button
                      onClick={() => setCurrentPreviewIndex(Math.min(uploadedDocFiles.length - 1, currentPreviewIndex + 1))}
                      disabled={currentPreviewIndex === uploadedDocFiles.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                {uploadPreviews[currentPreviewIndex].type === 'image' && (
                  <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4">
                    <img 
                      src={uploadPreviews[currentPreviewIndex].url} 
                      alt="Preview" 
                      className="max-w-full max-h-96 object-contain rounded shadow-lg"
                    />
                  </div>
                )}
                
                {uploadPreviews[currentPreviewIndex].type === 'pdf' && (
                  <div className="w-full" style={{ height: '500px' }}>
                    <embed
                      src={uploadPreviews[currentPreviewIndex].url}
                      type="application/pdf"
                      className="w-full h-full rounded shadow-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      PDF preview may not be supported in all browsers. The document will be saved correctly.
                    </p>
                  </div>
                )}
                
                {uploadPreviews[currentPreviewIndex].type === 'text' && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {uploadPreviews[currentPreviewIndex].content.substring(0, 2000)}
                      {uploadPreviews[currentPreviewIndex].content.length > 2000 && '\n\n... (Content truncated for preview)'}
                    </pre>
                  </div>
                )}
                
                {uploadPreviews[currentPreviewIndex].type === 'other' && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-800 font-medium mb-2">{uploadPreviews[currentPreviewIndex].fileName}</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Size: {uploadPreviews[currentPreviewIndex].fileSize}</p>
                      <p>Type: {uploadPreviews[currentPreviewIndex].fileType}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Preview not available for this file type, but it will be saved correctly.
                    </p>
                  </div>
                )}
              </div>
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
            onClick={onUpload}
            disabled={uploadedDocFiles.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {uploadedDocFiles.length > 0 && `(${uploadedDocFiles.length})`} Document{uploadedDocFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}