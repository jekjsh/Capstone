// components/Dashboard.jsx
import { FileText, Folder, LayoutDashboard } from 'lucide-react';

export default function Dashboard({ currentUser, userDocuments, folders, setActiveSection }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Welcome, {currentUser.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">My Documents</p>
              <p className="text-3xl font-bold text-gray-800">{userDocuments.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Folders</p>
              <p className="text-3xl font-bold text-gray-800">{folders.length}</p>
            </div>
            <Folder className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Account Status</p>
              <p className="text-xl font-bold text-green-600">Active</p>
            </div>
            <LayoutDashboard className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Documents</h3>
        {userDocuments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No documents yet. Create your first document!</p>
        ) : (
          <div className="space-y-3">
            {userDocuments.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="text-gray-800 font-medium">{doc.title}</p>
                  <p className="text-sm text-gray-500">{doc.createdAt}</p>
                </div>
                <button onClick={() => setActiveSection('documents')} className="text-indigo-600 hover:text-indigo-900 text-sm">View</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}