import { useState, useEffect } from 'react';
import { Mail, Lock, User, Briefcase, Building2, AlertCircle, ChevronLeft } from 'lucide-react';
import { authAPI, organizationAPI } from './services/api';
import './LoginForm.css';

export default function RegistrationForm({ themeData, onBackToLogin, onRegistrationSuccess }) {
  const suffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Esq.', 'PhD'];
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email_add: '',
    user_pos: '',
    org: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await organizationAPI.getAll();
        setOrganizations(orgs);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };
    fetchOrganizations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Validate required fields
      if (!formData.first_name.trim()) {
        throw new Error('First Name is required');
      }
      if (!formData.last_name.trim()) {
        throw new Error('Last Name is required');
      }
      if (!formData.email_add.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.user_pos.trim()) {
        throw new Error('Position is required');
      }
      if (!formData.org) {
        throw new Error('Organization is required');
      }

      // Submit registration request
      const response = await fetch('http://localhost:8000/auth/register-request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          suffix: formData.suffix,
          email_add: formData.email_add,
          user_pos: formData.user_pos,
          org: parseInt(formData.org)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.detail || 'Registration request submitted successfully! Please coordinate with the IS Manager for activation.');
        setShowSuccess(true);
        
        // Call the callback after 3 seconds
        setTimeout(() => {
          if (onRegistrationSuccess) {
            onRegistrationSuccess();
          }
        }, 3000);
      } else {
        throw new Error(data.detail || 'Failed to submit registration request');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Error Alert Popup */}
      {showError && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowError(false)}
          />
          <div className="bg-red-500 rounded-lg shadow-2xl w-full max-w-md p-6 relative z-10 alert-popup-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Error
              </h3>
              <button
                onClick={() => setShowError(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-white mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowError(false)}
              className="w-full bg-white text-red-500 py-2 rounded font-medium hover:bg-gray-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Alert Popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSuccess(false)}
          />
          <div className="bg-green-500 rounded-lg shadow-2xl w-full max-w-md p-6 relative z-10 alert-popup-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Success!</h3>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-white mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-white text-green-600 py-2 rounded font-medium hover:bg-gray-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Registration Form Box */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative z-10 login-glass-effect max-h-[90vh] overflow-y-auto">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Login
          </button>
          {themeData.sys_logo && (
            <img 
              src={themeData.sys_logo} 
              alt="System Logo" 
              className="h-12 object-contain"
            />
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Registration Request</h1>
          <p className="text-sm text-gray-500">Fill in your details to request an account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* First Row: First Name, Middle Name, Last Name, Suffix */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                placeholder="Michael"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Suffix
              </label>
              <select
                name="suffix"
                value={formData.suffix}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              >
                {suffixOptions.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option || 'None'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Email *
            </label>
            <div className="relative rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email_add"
                value={formData.email_add}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                className="w-full pl-10 pr-4 py-2 bg-transparent rounded-md focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          {/* Position Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Position/Title *
            </label>
            <div className="relative rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="user_pos"
                value={formData.user_pos}
                onChange={handleInputChange}
                placeholder="e.g., Manager, Coordinator"
                className="w-full pl-10 pr-4 py-2 bg-transparent rounded-md focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          {/* Organization Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Organization *
            </label>
            <div className="relative rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                name="org"
                value={formData.org}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-transparent rounded-md focus:outline-none text-sm appearance-none"
                required
              >
                <option value="">-- Select Organization --</option>
                {organizations.map(org => (
                  <option key={org.org_id} value={org.org_id}>
                    {org.org_name} ({org.org_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 mt-8 rounded-md font-medium hover:opacity-90 transition-all disabled:opacity-70 bg-indigo-600"
          >
            {isLoading ? 'Submitting...' : 'Submit Registration Request'}
          </button>
        </form>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          After submission, please coordinate with the IS Manager for account activation.
        </p>
      </div>
    </>
  );
}
