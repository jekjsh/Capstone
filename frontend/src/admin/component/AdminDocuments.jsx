import { FileText, Search } from 'lucide-react';

export default function AdminDocuments({ documentList }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
        <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
          + Upload Document
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {documentList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm">Click "Upload Document" to add your first document</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentList.map((doc, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <FileText className="w-10 h-10 text-indigo-500" />
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{doc.type}</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 truncate">{doc.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{doc.size} â€¢ {doc.date}</p>
              <div className="flex gap-2">
                <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">View</button>
                <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">Download</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}