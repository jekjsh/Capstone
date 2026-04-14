import { useState, useEffect } from 'react';
import { Upload, X, Palette, Settings2 } from 'lucide-react';
import { systemThemeAPI } from '../../services/api';
import { useSystemTheme } from '../../contexts/SystemThemeContext';

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
  { name: 'slate', label: 'Slate', hex: '#64748B', bg: 'bg-slate-500' },
  { name: 'zinc', label: 'Zinc', hex: '#71717A', bg: 'bg-zinc-500' },
  { name: 'neutral', label: 'Neutral', hex: '#737373', bg: 'bg-neutral-500' },
  { name: 'stone', label: 'Stone', hex: '#78716C', bg: 'bg-stone-500' },
];

// Helper to normalize color values - convert old preset names to hex
const normalizeColorValue = (colorValue) => {
  if (!colorValue) return '#4F46E5';
  
  // If it's already a hex value, return it
  if (colorValue.startsWith('#')) {
    return colorValue;
  }
  
  // If it's a preset name, convert to hex
  const preset = SIDEBAR_COLORS.find(c => c.name === colorValue);
  return preset ? preset.hex : '#4F46E5';
};

export default function SystemCustomization({ onClose }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    sys_name: '',
    sys_abbr: '',
    sys_logo: null,
    sys_backg: null,
    sidebar_color: 'blue',
  });
  const { refreshTheme } = useSystemTheme();

  useEffect(() => {
    fetchTheme();
  }, []);

  useEffect(() => {
    if (theme) {
      setFormData({
        sys_name: theme.sys_name || '',
        sys_abbr: theme.sys_abbr || '',
        sys_logo: theme.sys_logo || null,
        sys_backg: theme.sys_backg || null,
        sidebar_color: normalizeColorValue(theme.sidebar_color),
      });
    }
  }, [theme]);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const activeTheme = await systemThemeAPI.getActive();
      setTheme(activeTheme);
    } catch (err) {
      console.error('Failed to fetch theme:', err);
      setError('Failed to load system customization settings');
      setTheme({
        sys_id: null,
        sys_name: 'Record Keeping Management System',
        sys_abbr: 'RKMS',
        sys_logo: null,
        sys_backg: null,
        sidebar_color: '#3B82F6',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleHexColorChange = (hexValue) => {
    // Validate hex format
    const isValidHex = /^#[0-9A-F]{6}$/i.test(hexValue);
    if (isValidHex) {
      // Always store hex value directly
      handleFormChange({ sidebar_color: hexValue.toUpperCase() });
    }
  };

  const getCurrentHexColor = () => {
    // Sidebar color is always a hex value
    const color = formData.sidebar_color;
    if (!color) return '#3B82F6';
    
    // If it's a hex value, return it
    if (color.startsWith('#')) {
      return color;
    }
    
    // Fallback: if it's an old preset name, convert it
    const presetColor = SIDEBAR_COLORS.find(c => c.name === color);
    return presetColor ? presetColor.hex : '#3B82F6';
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFormChange({ sys_logo: file });
    }
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Background image must not exceed 10MB');
        return;
      }
      handleFormChange({ sys_backg: file });
      setError('');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      // Validate hex color format
      const colorValue = formData.sidebar_color || 'blue';
      const isValidHex = /^#[0-9A-F]{6}$/i.test(colorValue);
      
      if (!isValidHex) {
        setError('Invalid hex color format. Please enter a valid hex code (e.g., #FF5733) or select from palette.');
        setIsSaving(false);
        return;
      }
      
      const themeData = {
        sys_name: formData.sys_name || 'Record Keeping Management System',
        sys_abbr: formData.sys_abbr || 'RKMS',
        sidebar_color: colorValue,
        is_theme_active: true,
      };
      
      if (formData.sys_logo) {
        themeData.sys_logo = formData.sys_logo;
      }
      if (formData.sys_backg) {
        themeData.sys_backg = formData.sys_backg;
      }
      
      let updatedTheme;
      if (!theme?.sys_id) {
        updatedTheme = await systemThemeAPI.create(themeData);
      } else {
        updatedTheme = await systemThemeAPI.update(theme.sys_id, themeData);
      }
      
      setTheme(updatedTheme);
      await refreshTheme();
      setSuccessMessage('Settings saved successfully!');
      
      // Refresh page after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading system customization...</p>
          </div>
        </div>
      </div>
    );
  }

  const getLogoPreviewUrl = () => {
    if (formData.sys_logo instanceof File) {
      return URL.createObjectURL(formData.sys_logo);
    }
    return formData.sys_logo;
  };

  const getBackgroundPreviewUrl = () => {
    if (formData.sys_backg instanceof File) {
      return URL.createObjectURL(formData.sys_backg);
    }
    return formData.sys_backg;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={(e) => {
        // Close only if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="text-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6" />
            <h2 className="text-xl font-semibold">System Customization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 text-sm">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Branding */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Name *
                  </label>
                  <input
                    type="text"
                    value={formData.sys_name}
                    onChange={(e) => handleFormChange({ sys_name: e.target.value })}
                    placeholder="e.g., Record Keeping Management System"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Abbreviation *
                  </label>
                  <input
                    type="text"
                    value={formData.sys_abbr}
                    onChange={(e) => handleFormChange({ sys_abbr: e.target.value })}
                    placeholder="e.g., RKMS"
                    maxLength="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Logo
                  </label>
                  <div className="relative">
                    {getLogoPreviewUrl() ? (
                      <div className="relative w-24 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <img src={getLogoPreviewUrl()} alt="Logo preview" className="max-w-full max-h-full" />
                        <button
                          type="button"
                          onClick={() => handleFormChange({ sys_logo: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 text-center">PNG, JPG, SVG</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interface */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Background Image
                </label>
                <div className="relative">
                  {getBackgroundPreviewUrl() ? (
                    <div className="relative w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                      <img 
                        src={getBackgroundPreviewUrl()} 
                        alt="Background preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleFormChange({ sys_backg: null })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
                      <Upload className="w-4 h-4 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600">PNG, JPG (Max 10MB)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleBackgroundChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Sidebar Color
              </h3>
              <div className="space-y-4">
                {/* Color Palette */}
                <div className="grid grid-cols-7 gap-2">
                  {SIDEBAR_COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleFormChange({ sidebar_color: color.hex })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        formData.sidebar_color === color.hex
                          ? 'border-gray-800 shadow-lg ring-2 ring-indigo-400' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={color.label}
                    >
                      <div className={`w-6 h-6 ${color.bg} rounded`} />
                    </button>
                  ))}
                </div>
                
                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Color Picker:</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={getCurrentHexColor()}
                      onChange={(e) => handleFormChange({ sidebar_color: e.target.value })}
                      className="w-20 h-10 rounded-lg cursor-pointer border border-gray-300"
                    />
                    <span className="text-sm font-mono text-gray-600">{getCurrentHexColor()}</span>
                  </div>
                </div>
                
                {/* Hex Color Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Hex Color Code:</label>
                  <input
                    type="text"
                    placeholder="#FF5733"
                    value={getCurrentHexColor()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing without validation, will validate on save
                      handleFormChange({ sidebar_color: value });
                    }}
                    maxLength="7"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter any valid hex code (e.g., #FF5733) or use the color picker above</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Previews */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-fit sticky top-6 space-y-4">
            {/* Login Page Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Login Preview</h3>
              <div 
                className="rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center h-48"
                style={{
                  backgroundImage: getBackgroundPreviewUrl() ? `url(${getBackgroundPreviewUrl()})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Login Form Box */}
                <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs m-2">
                  <div className="text-center mb-4">
                    {getLogoPreviewUrl() && (
                      <img 
                        src={getLogoPreviewUrl()} 
                        alt="Logo" 
                        className="h-10 mx-auto mb-2 object-contain"
                      />
                    )}
                    <p className="text-xs font-bold text-gray-900">{formData.sys_name || 'System'}</p>
                    <p className="text-xs text-gray-500">{formData.sys_abbr || 'RKMS'}</p>
                  </div>
                  <div className="space-y-2">
                    <input type="text" placeholder="User ID" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" readOnly />
                    <input type="password" placeholder="Password" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" readOnly />
                    <button className="w-full bg-indigo-600 text-white py-1 rounded text-xs font-medium">Sign In</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard/Sidebar Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Dashboard Preview</h3>
              <div className="rounded-lg overflow-hidden border border-gray-300 bg-white flex h-48">
                {/* Sidebar Preview */}
                <div 
                  className="w-32 text-white p-3 flex flex-col text-xs"
                  style={{
                    backgroundColor: getCurrentHexColor(),
                  }}
                >
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white border-opacity-20">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 font-bold" 
                      style={{
                        color: getCurrentHexColor(),
                        fontSize: '10px'
                      }}
                    >
                      {formData.sys_abbr?.charAt(0) || 'R'}
                    </div>
                  </div>
                  <nav className="space-y-1 flex-1">
                    <div className="px-2 py-1 rounded bg-white bg-opacity-10 font-medium">Dashboard</div>
                    <div className="px-2 py-1 opacity-70 hover:bg-white hover:bg-opacity-10 cursor-pointer rounded">Organization</div>
                    <div className="px-2 py-1 opacity-70 hover:bg-white hover:bg-opacity-10 cursor-pointer rounded">Documents</div>
                    <div className="px-2 py-1 opacity-70 hover:bg-white hover:bg-opacity-10 cursor-pointer rounded">Audit</div>
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-3 flex flex-col bg-gray-50">
                  {/* Header */}
                  <div className="bg-white rounded p-2 mb-2 flex items-center gap-2 border border-gray-200">
                    {getLogoPreviewUrl() && (
                      <img 
                        src={getLogoPreviewUrl()} 
                        alt="Logo" 
                        className="h-6 object-contain"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{formData.sys_name || 'System'}</p>
                      <p className="text-xs text-gray-500">{formData.sys_abbr || 'RKMS'}</p>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white rounded border border-gray-200 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hex Code Display */}
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="text-blue-700 font-mono">{getCurrentHexColor()}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
