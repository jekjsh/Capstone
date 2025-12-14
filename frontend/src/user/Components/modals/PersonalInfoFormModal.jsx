import { X } from 'lucide-react';

export default function PersonalInfoFormModal({ show, onClose, personalInfo, setPersonalInfo, errors, onSave, onBack }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input 
                  type="text" 
                  value={personalInfo.fullName} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={personalInfo.dateOfBirth} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select 
                  value={personalInfo.gender} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                <input 
                  type="text" 
                  value={personalInfo.occupation} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, occupation: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Software Engineer" 
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input 
                  type="email" 
                  value={personalInfo.email} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="john.doe@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={personalInfo.phoneNumber} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="+1 (555) 123-4567" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input 
                  type="text" 
                  value={personalInfo.address} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="123 Main Street" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input 
                  type="text" 
                  value={personalInfo.city} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="New York" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input 
                  type="text" 
                  value={personalInfo.state} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="NY" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input 
                  type="text" 
                  value={personalInfo.zipCode} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, zipCode: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="10001" 
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input 
                  type="text" 
                  value={personalInfo.emergencyContact} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, emergencyContact: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Jane Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input 
                  type="tel" 
                  value={personalInfo.emergencyPhone} 
                  onChange={(e) => setPersonalInfo({ ...personalInfo, emergencyPhone: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="+1 (555) 987-6543" 
                />
              </div>
            </div>
          </div>
          {errors.personalInfo && <p className="text-sm text-red-500">{errors.personalInfo}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button onClick={onSave} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Next: Save Document
          </button>
        </div>
      </div>
    </div>
  );
}