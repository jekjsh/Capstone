import { X, Upload, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TagInput } from '../../Components/TagComponents';

export default function UploadDocumentModal({ 
  show, 
  onClose, 
  uploadedDocFiles, 
  uploadPreviews, 
  currentPreviewIndex, 
  setCurrentPreviewIndex,
  onFileUpload, 
  onRemoveFile, 
  onUpload,
  dataStore
}) {
  const [documentTags, setDocumentTags] = useState([]);
  
  // ✅ Reset tags when modal is opened/closed
  useEffect(() => {
    if (!show) {
      setDocumentTags([]);
    }
  }, [show]);
  
  if (!show) return null;

  const getFileIcon = (fileType) => {
    if (fileType === 'excel') {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const getFileTypeLabel = (preview) => {
    if (preview.type === 'excel') return 'Excel';
    if (preview.type === 'pdf') return 'PDF';
    if (preview.type === 'image') return 'Image';
    if (preview.type === 'text') return 'Text';
    return 'File';
  };

  const handleUploadWithTags = () => {
    onUpload(documentTags);  // Pass tags to the upload handler
    setDocumentTags([]);  // Reset tags after upload
  };

  const handleClose = () => {
    setDocumentTags([]);  // Reset tags on close
    onClose();
  };

  // Get available tags from dataStore
  const availableTags = dataStore ? dataStore.getAllTags() : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Documents</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2 font-medium">Upload document files</p>
            <p className="text-sm text-gray-500 mb-2">
              Supported formats: PDF, DOCX, Excel (XLS/XLSX), Images, Text files
            </p>
            <p className="text-xs text-gray-400 mb-4">You can select multiple files at once</p>
            
            <input
              type="file"
              onChange={onFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
              multiple
              className="hidden"
              id="doc-file-upload"
            />
            <label
              htmlFor="doc-file-upload"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
            >
              Choose Files
            </label>
            
            {/* File type indicators */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">PDF</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">DOCX</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Excel</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Images</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Text</span>
            </div>
          </div>

          {/* Selected Files List */}
          {uploadedDocFiles.length > 0 && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Selected Files ({uploadedDocFiles.length})
                </h3>
              </div>
              <div className="p-4 max-h-40 overflow-y-auto bg-gray-50">
                <div className="space-y-2">
                  {uploadedDocFiles.map((file, index) => {
                    const isExcel = file.name.match(/\.(xlsx?|xls)$/i);
                    const isPdf = file.name.match(/\.pdf$/i);
                    const isImage = file.type.startsWith('image/');
                    const isDoc = file.name.match(/\.docx?$/i);
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          currentPreviewIndex === index 
                            ? 'bg-blue-50 border-blue-300 shadow-md' 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setCurrentPreviewIndex(index)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {isExcel ? (
                            <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                              <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            </div>
                          ) : isPdf ? (
                            <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                          ) : isDoc ? (
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                          ) : isImage ? (
                            <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                              {isExcel && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Excel</span>}
                              {isPdf && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">PDF</span>}
                              {isDoc && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Word</span>}
                              {isImage && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Image</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(index);
                          }}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ✅ TAG INPUT SECTION - ADD TAGS TO ALL UPLOADED DOCUMENTS */}
          {uploadedDocFiles.length > 0 && (
            <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                Add Tags to All Documents
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                These tags will be applied to all {uploadedDocFiles.length} document{uploadedDocFiles.length > 1 ? 's' : ''} you're uploading.
              </p>
              <TagInput 
                tags={documentTags} 
                setTags={setDocumentTags} 
                availableTags={availableTags}
                errors={{}}
              />
            </div>
          )}

          {/* Preview Section */}
          {uploadPreviews.length > 0 && uploadPreviews[currentPreviewIndex] && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {getFileIcon(uploadPreviews[currentPreviewIndex].type)}
                  <span>Preview: {uploadPreviews[currentPreviewIndex].fileName}</span>
                </h3>
                {uploadedDocFiles.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                      disabled={currentPreviewIndex === 0}
                      className="p-1 rounded hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-white font-medium">
                      {currentPreviewIndex + 1} / {uploadedDocFiles.length}
                    </span>
                    <button
                      onClick={() => setCurrentPreviewIndex(Math.min(uploadedDocFiles.length - 1, currentPreviewIndex + 1))}
                      disabled={currentPreviewIndex === uploadedDocFiles.length - 1}
                      className="p-1 rounded hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                {/* Image Preview */}
                {uploadPreviews[currentPreviewIndex].type === 'image' && (
                  <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4">
                    <img 
                      src={uploadPreviews[currentPreviewIndex].url} 
                      alt="Preview" 
                      className="max-w-full max-h-96 object-contain rounded shadow-lg"
                    />
                  </div>
                )}
                
                {/* PDF Preview */}
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
                
                {/* Text Preview */}
                {uploadPreviews[currentPreviewIndex].type === 'text' && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {uploadPreviews[currentPreviewIndex].content && uploadPreviews[currentPreviewIndex].content.substring(0, 2000)}
                      {uploadPreviews[currentPreviewIndex].content && uploadPreviews[currentPreviewIndex].content.length > 2000 && '\n\n... (Content truncated for preview)'}
                    </pre>
                  </div>
                )}
                
                {/* Excel Preview */}
                {uploadPreviews[currentPreviewIndex].type === 'excel' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 text-center border-2 border-green-200">
                    <FileSpreadsheet className="w-24 h-24 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-800 font-bold text-lg mb-2">{uploadPreviews[currentPreviewIndex].fileName}</p>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p><strong>Size:</strong> {uploadPreviews[currentPreviewIndex].fileSize}</p>
                      <p><strong>Type:</strong> Microsoft Excel Spreadsheet</p>
                      {uploadPreviews[currentPreviewIndex].sheets && (
                        <p><strong>Sheets:</strong> {uploadPreviews[currentPreviewIndex].sheets} sheet(s)</p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200 max-w-md mx-auto">
                      <p className="text-xs text-green-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Excel files will be saved and can be downloaded. Preview is not available, but the original file will be preserved.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Other Files Preview */}
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

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadWithTags}
            disabled={uploadedDocFiles.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <Upload className="w-4 h-4" />
            Upload {uploadedDocFiles.length > 0 && `(${uploadedDocFiles.length})`} Document{uploadedDocFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}