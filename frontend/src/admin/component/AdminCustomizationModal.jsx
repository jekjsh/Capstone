import { X, Upload, Image, Type, Palette, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminCustomizationModal({ 
  show, 
  onClose, 
  dataStore,
  onSave 
}) {
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState({
    systemName: 'Record Keeping Management System',
    systemLogo: null,
    loginBackground: null,
    primaryColor: '#4F46E5', 
    sidebarGradientStart: '#4F46E5',
    sidebarGradientEnd: '#7C3AED'
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && dataStore) {
      const saved = dataStore.getCustomization ? dataStore.getCustomization() : null;
      if (saved) {
        setSettings(saved);
        setLogoPreview(saved.systemLogo);
        setBackgroundPreview(saved.loginBackground);
      }
    }
  }, [show, dataStore]);

  if (!show) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        setErrors({ logo: 'Logo file must be less than 2MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoData = event.target.result;
        setSettings({ ...settings, systemLogo: logoData });
        setLogoPreview(logoData);
        setErrors({ ...errors, logo: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        setErrors({ background: 'Background image must be less than 5MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const bgData = event.target.result;
        setSettings({ ...settings, loginBackground: bgData });
        setBackgroundPreview(bgData);
        setErrors({ ...errors, background: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const newErrors = {};
    
    if (!settings.systemName.trim()) {
      newErrors.systemName = 'System name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (dataStore && dataStore.setCustomization) {
      dataStore.setCustomization(settings);
    }
    
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all customization to default? This cannot be undone.')) {
      const defaultSettings = {
        systemName: 'Record Keeping Management System',
        systemLogo: null,
        loginBackground: null,
        primaryColor: '#4F46E5',
        sidebarGradientStart: '#4F46E5',
        sidebarGradientEnd: '#7C3AED'
      };
      setSettings(defaultSettings);
      setLogoPreview(null);
      setBackgroundPreview(null);
      
      if (dataStore && dataStore.setCustomization) {
        dataStore.setCustomization(defaultSettings);
      }
      
      onSave(defaultSettings);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Type },
    { id: 'interface', label: 'Interface', icon: Image },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">System Customization</h2>
            <p className="text-sm text-gray-500">Personalize your system branding and appearance</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name *
                </label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.systemName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., TUPM Document Management System"
                />
                {errors.systemName && <p className="mt-1 text-sm text-red-500">{errors.systemName}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear in the login page and throughout the system
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Logo
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">Upload System Logo</p>
                      <p className="text-xs text-gray-500 mb-4">PNG, JPG or SVG (max 2MB)</p>
                      <input
                        type="file"
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                    {errors.logo && <p className="mt-1 text-sm text-red-500">{errors.logo}</p>}
                  </div>
                  
                  {logoPreview && (
                    <div className="w-48">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                        <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-32 object-contain" />
                      </div>
                      <button
                        onClick={() => {
                          setSettings({ ...settings, systemLogo: null });
                          setLogoPreview(null);
                        }}
                        className="mt-2 w-full text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interface Tab */}
          {activeTab === 'interface' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Background Image
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">Upload Login Background</p>
                      <p className="text-xs text-gray-500 mb-4">PNG or JPG (max 5MB, recommended: 1920x1080)</p>
                      <input
                        type="file"
                        onChange={handleBackgroundUpload}
                        accept="image/png,image/jpeg"
                        className="hidden"
                        id="background-upload"
                      />
                      <label
                        htmlFor="background-upload"
                        className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                    {errors.background && <p className="mt-1 text-sm text-red-500">{errors.background}</p>}
                  </div>
                  
                  {backgroundPreview && (
                    <div className="w-64">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img src={backgroundPreview} alt="Background preview" className="w-full h-36 object-cover" />
                      </div>
                      <button
                        onClick={() => {
                          setSettings({ ...settings, loginBackground: null });
                          setBackgroundPreview(null);
                        }}
                        className="mt-2 w-full text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Background
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Tip: Use a subtle, low-contrast image for better readability of login form
                </p>
              </div>
            </div>
          )}

          {/* Colors Tab */}
  {activeTab === 'colors' && (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Primary Accent Color
      </label>
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
          className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={settings.primaryColor}
          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="#4F46E5"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        This color will be used for buttons, links, and highlights
      </p>
    </div>

    <div className="border-t pt-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Admin Sidebar Gradient
      </label>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-24">Start Color:</span>
          <input
            type="color"
            value={settings.sidebarGradientStart}
            onChange={(e) => setSettings({ ...settings, sidebarGradientStart: e.target.value })}
            className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={settings.sidebarGradientStart}
            onChange={(e) => setSettings({ ...settings, sidebarGradientStart: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-24">End Color:</span>
          <input
            type="color"
            value={settings.sidebarGradientEnd}
            onChange={(e) => setSettings({ ...settings, sidebarGradientEnd: e.target.value })}
            className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={settings.sidebarGradientEnd}
            onChange={(e) => setSettings({ ...settings, sidebarGradientEnd: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div 
        className="mt-3 h-20 rounded-lg flex items-center justify-center text-white font-semibold"
        style={{
          background: `linear-gradient(to bottom, ${settings.sidebarGradientStart}, ${settings.sidebarGradientEnd})`
        }}
      >
        Admin Sidebar Preview
      </div>
    </div>

    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-blue-800 mb-2">
        <strong>💡 Note:</strong> Both Admin and User sidebars will use these gradient colors.
      </p>
      <p className="text-xs text-blue-700">
        The same color scheme will be applied to provide a consistent experience across all user types.
      </p>
    </div>

    <div className="bg-gray-50 border border-gray-200 p-4 rounded">
      <p className="text-sm font-semibold text-gray-700 mb-3">Quick Presets:</p>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#4F46E5',
            sidebarGradientStart: '#4F46E5',
            sidebarGradientEnd: '#7C3AED'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-indigo-500 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #4F46E5, #7C3AED)' }}></div>
          🔵 Indigo/Purple
        </button>
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#2563EB',
            sidebarGradientStart: '#2563EB',
            sidebarGradientEnd: '#06B6D4'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-blue-500 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #2563EB, #06B6D4)' }}></div>
          💙 Blue/Cyan
        </button>
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#059669',
            sidebarGradientStart: '#059669',
            sidebarGradientEnd: '#10B981'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-green-500 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #059669, #10B981)' }}></div>
          💚 Green
        </button>
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#DC2626',
            sidebarGradientStart: '#DC2626',
            sidebarGradientEnd: '#F59E0B'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-red-500 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #DC2626, #F59E0B)' }}></div>
          🔴 Red/Orange
        </button>
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#7C3AED',
            sidebarGradientStart: '#7C3AED',
            sidebarGradientEnd: '#EC4899'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-purple-500 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #7C3AED, #EC4899)' }}></div>
          💜 Purple/Pink
        </button>
        <button
          onClick={() => setSettings({
            ...settings,
            primaryColor: '#1F2937',
            sidebarGradientStart: '#1F2937',
            sidebarGradientEnd: '#374151'
          })}
          className="px-3 py-2 bg-white rounded border-2 border-gray-300 hover:border-gray-700 text-sm transition-all"
        >
          <div className="w-full h-6 rounded mb-1" style={{ background: 'linear-gradient(to right, #1F2937, #374151)' }}></div>
          ⚫ Dark Gray
        </button>
      </div>
    </div>
  </div>
)}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Page Preview</h3>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative" style={{ height: '400px' }}>
                  {backgroundPreview && (
                    <img 
                      src={backgroundPreview} 
                      alt="Background" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-96">
                      <div className="text-center mb-6">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-16 mx-auto mb-4" />
                        ) : (
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
                            <span className="text-2xl text-white">🔒</span>
                          </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800">{settings.systemName}</h1>
                        <p className="text-gray-600 text-sm">Please sign in to your account</p>
                      </div>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="User ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          disabled
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          disabled
                        />
                        <button
                          className="w-full py-3 rounded-lg text-white font-medium"
                          style={{ backgroundColor: settings.primaryColor }}
                          disabled
                        >
                          Sign In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sidebar Preview</h3>
                <div 
                  className="w-64 h-40 rounded-lg p-4 text-white"
                  style={{
                    background: `linear-gradient(to bottom, ${settings.sidebarGradientStart}, ${settings.sidebarGradientEnd})`
                  }}
                >
                  <div className="font-bold text-lg mb-4">RKMS</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white bg-opacity-20 rounded">
                      <span>📊</span>
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-white hover:bg-opacity-10 rounded">
                      <span>👥</span>
                      <span>Users</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Reset to Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}