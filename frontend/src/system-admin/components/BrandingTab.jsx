import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function BrandingTab({ formData, onUpdate, isSaving }) {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
    setError('');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ sys_logo: file });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Name *
        </label>
        <input
          type="text"
          name="sys_name"
          value={formData?.sys_name || ''}
          onChange={handleChange}
          placeholder="e.g., Record Keeping Management System"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">This name will appear on the login page and system headers</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Abbreviation *
        </label>
        <input
          type="text"
          name="sys_abbr"
          value={formData?.sys_abbr || ''}
          onChange={handleChange}
          placeholder="e.g., RKMS"
          maxLength="10"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">This abbreviation will appear in the browser tab (e.g., RKMS RKMS)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Logo
        </label>
        <div className="relative">
          {formData?.sys_logo ? (
            <div className="relative w-32 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <img 
                src={formData.sys_logo instanceof File ? URL.createObjectURL(formData.sys_logo) : formData.sys_logo} 
                alt="Logo preview" 
                className="max-w-full max-h-full" 
              />
              <button
                type="button"
                onClick={() => onUpdate({ sys_logo: null })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-32 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs text-gray-600">PNG, JPG, or SVG</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">Max 2MB. Recommended size: 200x200px</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
