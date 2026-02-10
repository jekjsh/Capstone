import { X, FileText, ScanText, Download } from 'lucide-react';

export default function DocumentViewerModal({ show, document, onClose, onPrint, onDownload }) {
  if (!show || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
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
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
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

        <div className="flex-1 overflow-auto" style={{ backgroundColor: '#525659' }}>
          <div className="max-w-full h-full p-8">
            {document.fileData && document.format === 'pdf' ? (
              <div className="w-full h-full">
                <embed
                  src={document.fileData}
                  type="application/pdf"
                  className="w-full h-full bg-white shadow-2xl"
                  style={{ minHeight: '800px' }}
                />
              </div>
            ) : document.fileData && (document.mimeType?.startsWith('image/')) ? (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={document.fileData} 
                  alt={document.title}
                  className="max-w-full max-h-full object-contain bg-white shadow-2xl"
                />
              </div>
            ) : document.format === 'docx' && !document.content ? (
              <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg mx-auto max-w-2xl my-auto">
                <FileText className="w-24 h-24 text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Word Document</h3>
                <p className="text-gray-600 mb-6 text-center">
                  This is a Microsoft Word document (.docx). Full formatting and content preview requires opening in Word or compatible software.
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 w-full max-w-md mb-6">
                  <p className="text-center text-gray-700 font-semibold mb-4">{document.title}</p>
                  {document.description && (
                    <p className="text-sm text-gray-600 text-center mb-4">{document.description}</p>
                  )}
                  <p className="text-xs text-gray-500 text-center">Created: {document.createdAt}</p>
                </div>
                {document.fileData && (
                  <button 
                    onClick={() => onDownload(document)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Download Document
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-2xl p-16 min-h-[11in]" style={{ 
                  width: '8.5in',
                  margin: '0 auto',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}>
                  {document.content ? (
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                      {document.content}
                    </pre>
                  ) : document.ocrContent ? (
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

                      {document.personalInfo && Object.keys(document.personalInfo).some(key => document.personalInfo[key]) && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-400">Personal Information</h2>
                          <div className="space-y-3">
                            {document.personalInfo.fullName && (
                              <div className="flex">
                                <span className="font-semibold text-gray-700 w-48">Full Name:</span>
                                <span className="text-gray-900">{document.personalInfo.fullName}</span>
                              </div>
                            )}
                            {document.personalInfo.email && (
                              <div className="flex">
                                <span className="font-semibold text-gray-700 w-48">Email:</span>
                                <span className="text-gray-900">{document.personalInfo.email}</span>
                              </div>
                            )}
                            {document.personalInfo.phoneNumber && (
                              <div className="flex">
                                <span className="font-semibold text-gray-700 w-48">Phone:</span>
                                <span className="text-gray-900">{document.personalInfo.phoneNumber}</span>
                              </div>
                            )}
                            {document.personalInfo.dateOfBirth && (
                              <div className="flex">
                                <span className="font-semibold text-gray-700 w-48">Date of Birth:</span>
                                <span className="text-gray-900">{document.personalInfo.dateOfBirth}</span>
                              </div>
                            )}
                            {document.personalInfo.address && (
                              <div className="flex">
                                <span className="font-semibold text-gray-700 w-48">Address:</span>
                                <span className="text-gray-900">{document.personalInfo.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {document.customFieldValues && Object.keys(document.customFieldValues).length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-400">Tags</h2>
                          <div className="space-y-3">
                            {Object.entries(document.customFieldValues).map(([tagName, tagValue]) => (
                              <div key={tagName} className="flex">
                                <span className="font-semibold text-gray-700 w-48">{tagName}:</span>
                                <span className="text-gray-900">{tagValue || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Page 1 of 1
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onPrint(document)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button 
              onClick={() => onDownload(document)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}