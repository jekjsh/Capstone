import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function InterfaceTab({ formData, onUpdate, isSaving }) {
  const [error, setError] = useState('');

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must not exceed 10MB');
        return;
      }
      onUpdate({ sys_backg: file });
      setError('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Login Background Image</h3>
        <p className="text-sm text-gray-600 mb-4">
          This image will be displayed as the background on the login page.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Image
        </label>
        <div className="relative">
          {formData?.sys_backg ? (
            <div className="relative w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
              <img 
                src={formData.sys_backg instanceof File ? URL.createObjectURL(formData.sys_backg) : formData.sys_backg} 
                alt="Background preview" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onUpdate({ sys_backg: null })}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload background image</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG (Max 10MB)</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleBackgroundChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">Recommended size: 1920x1080px or wider for best results</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
