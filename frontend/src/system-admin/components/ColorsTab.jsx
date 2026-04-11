import { useState } from 'react';
import { Check } from 'lucide-react';

const SIDEBAR_COLORS = [
  { name: 'blue', label: 'Blue', hex: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'indigo', label: 'Indigo', hex: '#4F46E5', bg: 'bg-indigo-500' },
  { name: 'purple', label: 'Purple', hex: '#A855F7', bg: 'bg-purple-500' },
  { name: 'pink', label: 'Pink', hex: '#EC4899', bg: 'bg-pink-500' },
  { name: 'red', label: 'Red', hex: '#EF4444', bg: 'bg-red-500' },
  { name: 'orange', label: 'Orange', hex: '#F97316', bg: 'bg-orange-500' },
  { name: 'yellow', label: 'Yellow', hex: '#EAB308', bg: 'bg-yellow-500' },
  { name: 'green', label: 'Green', hex: '#22C55E', bg: 'bg-green-500' },
  { name: 'teal', label: 'Teal', hex: '#14B8A6', bg: 'bg-teal-500' },
  { name: 'cyan', label: 'Cyan', hex: '#06B6D4', bg: 'bg-cyan-500' },
];

export default function ColorsTab({ formData, onUpdate, isSaving }) {
  const [error, setError] = useState('');

  const handleColorSelect = (colorName) => {
    onUpdate({ sidebar_color: colorName });
    setError('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sidebar & Navigation Color</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select a color theme for the sidebars and navigation elements throughout the system.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {SIDEBAR_COLORS.map(color => (
          <button
            key={color.name}
            type="button"
            onClick={() => handleColorSelect(color.name)}
            className={`relative p-4 rounded-lg border-2 transition-all ${
              (formData?.sidebar_color || 'blue') === color.name 
                ? 'border-gray-800 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-16 h-16 ${color.bg} rounded-lg mb-2`} />
            <p className="text-sm font-medium text-gray-900">{color.label}</p>
            <p className="text-xs text-gray-600">{color.hex}</p>
            {(formData?.sidebar_color || 'blue') === color.name && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-900 mb-2">Preview</h4>
        <div className="flex gap-2">
          <div className={`w-32 h-24 ${SIDEBAR_COLORS.find(c => c.name === (formData?.sidebar_color || 'blue'))?.bg} rounded-lg`} />
          <div className="flex-1">
            <p className="text-xs text-indigo-800">
              This color will be applied to:
            </p>
            <ul className="text-xs text-indigo-700 mt-2 space-y-1 list-disc list-inside">
              <li>Sidebar navigation</li>
              <li>Top navigation bar</li>
              <li>Active buttons and links</li>
              <li>Form elements (focus states)</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
