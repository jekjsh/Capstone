import { FileText } from 'lucide-react';

export default function SaveOptionsModal({ show, onClose, onSave }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Save Document</h2>
          <p className="text-gray-600">Choose your preferred file format</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => onSave('pdf')} 
            className="w-full flex items-center justify-between px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Save as PDF</p>
                <p className="text-sm text-gray-500">Portable Document Format</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600">→</span>
          </button>
          <button 
            onClick={() => onSave('docx')} 
            className="w-full flex items-center justify-between px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Save as DOCX</p>
                <p className="text-sm text-gray-500">Microsoft Word Document</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600">→</span>
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Back
        </button>
      </div>
    </div>
  );
}