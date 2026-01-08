import { X, FileText, ScanText, Download, Printer, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function DocumentViewerModal({ show, document, onClose, onPrint, onDownload }) {
  if (!show || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {document.format === 'pdf' ? (
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              ) : document.format === 'ocr' ? (
                <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                  <ScanText className="w-6 h-6 text-green-600" />
                </div>
              ) : document.format === 'docx' ? (
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              ) : document.format === 'excel' ? (
                <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-800">{document.title}</h2>
                <p className="text-xs text-gray-500">{document.format?.toUpperCase()} Document</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: '#525659' }}>
          <div className="max-w-full h-full p-8">
            {/* PDF Preview */}
            {document.fileData && document.format === 'pdf' && (
              <div className="w-full h-full">
                <embed
                  src={document.fileData}
                  type="application/pdf"
                  className="w-full h-full bg-white shadow-2xl"
                  style={{ minHeight: '800px' }}
                />
              </div>
            )}

            {/* Image Preview */}
            {document.fileData && document.mimeType?.startsWith('image/') && (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={document.fileData} 
                  alt={document.title}
                  className="max-w-full max-h-full object-contain bg-white shadow-2xl rounded"
                />
              </div>
            )}

            {/* DOCX - Download Message */}
            {document.format === 'docx' && (
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Word Document</h3>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-1">Preview Not Available</p>
                      <p className="text-xs text-yellow-700">
                        Word documents with complex formatting, tables, and embedded content cannot be reliably previewed in the browser. 
                        Download the file to view the complete content with proper formatting.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>ðŸ“„ File Information:</strong>
                  </p>
                  <div className="space-y-2 text-sm text-blue-700 text-left">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span className="text-right">{document.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>Microsoft Word Document (.docx)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Size:</span>
                      <span>{document.fileSize || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{document.createdAt}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDownload(document)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6" />
                  Download File to View Content
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  ðŸ’¡ Download the file and open it with Microsoft Word or compatible software (Google Docs, LibreOffice) to view the full content.
                </p>
              </div>
            )}

            {/* Excel - Download Message */}
            {document.format === 'excel' && (
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileSpreadsheet className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Excel Spreadsheet</h3>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-1">Preview Not Available</p>
                      <p className="text-xs text-yellow-700">
                        Excel spreadsheets cannot be previewed in the browser due to complex formatting, formulas, charts, and data structures. 
                        Download the file to view and edit in Excel or compatible software.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-green-800 mb-3">
                    <strong>ðŸ“Š File Information:</strong>
                  </p>
                  <div className="space-y-2 text-sm text-green-700 text-left">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span className="text-right">{document.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>Microsoft Excel Spreadsheet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Size:</span>
                      <span>{document.fileSize || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{document.createdAt}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDownload(document)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6" />
                  Download File to View Content
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  ðŸ’¡ Download the file and open it with Microsoft Excel, Google Sheets, or compatible software to view the full spreadsheet.
                </p>
              </div>
            )}

            {/* Text/OCR Content */}
            {!document.fileData && (document.content || document.ocrContent) && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-2xl p-16 min-h-[11in]" style={{ 
                  width: '8.5in',
                  margin: '0 auto',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}>
                  {document.ocrContent ? (
                    <div>
                      <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
                        <p className="text-sm text-gray-600">OCR Extracted Document</p>
                      </div>
                      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                        {document.ocrContent}
                      </pre>
                      <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-xs text-gray-500">
                        <p>Extracted on {document.createdAt}</p>
                        <p>Record Keeping Management System</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
                        {document.description && (
                          <p className="text-gray-600 italic text-sm">{document.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Created: {document.createdAt}</p>
                      </div>

                      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                        {document.content}
                      </pre>

                      <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-xs text-gray-500">
                        <p>Document created on {document.createdAt}</p>
                        <p>Record Keeping Management System</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {document.format === 'pdf' && 'PDF Document'}
            {document.format === 'docx' && 'ðŸ“„ Word Document - Download to view'}
            {document.format === 'excel' && 'ðŸ“Š Excel Spreadsheet - Download to view'}
            {document.format === 'ocr' && 'OCR Extracted Document'}
            {!document.format && 'Document Preview'}
          </div>
          <div className="flex gap-3">
            {(document.format === 'docx' || document.format === 'excel') ? (
              // For DOCX and Excel - Only show Download and Close buttons
              <>
                <button
                  onClick={() => onDownload(document)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-semibold shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              // For other formats - Show Print, Download, and Close
              <>
                <button 
                  onClick={() => onPrint(document)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  onClick={() => onDownload(document)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}