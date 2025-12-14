import { X, Hash, Eye, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UserIdFormatModal({ 
  show, 
  onClose, 
  dataStore,
  onSave 
}) {
  const [format, setFormat] = useState({
    prefix: 'TUPM',
    adminSeparator: '_',
    userSeparator: '-',
    segmentCount: 2,
    segmentLength: [2, 4],
    autoIncrement: true,
    customFormat: false
  });
  
  const [customPattern, setCustomPattern] = useState({
    admin: 'TUPM_XX_XXXX',
    user: 'TUPM-XX-XXXX'
  });
  
  const [previewIds, setPreviewIds] = useState({
    admin: 'TUPM_01_0001',
    user: 'TUPM-01-0001'
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && dataStore) {
      const saved = dataStore.getUserIdFormat ? dataStore.getUserIdFormat() : null;
      if (saved) {
        setFormat(saved.format);
        setCustomPattern(saved.customPattern);
        updatePreview(saved.format, saved.customPattern);
      }
    }
  }, [show, dataStore]);

  const updatePreview = (fmt, pattern) => {
    if (fmt.customFormat) {
      setPreviewIds({
        admin: pattern.admin,
        user: pattern.user
      });
    } else {

      const adminId = generateSampleId('admin', fmt);
      const userId = generateSampleId('user', fmt);
      setPreviewIds({ admin: adminId, user: userId });
    }
  };

  const generateSampleId = (type, fmt) => {
    const separator = type === 'admin' ? fmt.adminSeparator : fmt.userSeparator;
    let id = fmt.prefix;
    
    for (let i = 0; i < fmt.segmentCount; i++) {
      id += separator + 'X'.repeat(fmt.segmentLength[i] || 2);
    }
    
    return id;
  };

  const handleFormatChange = (key, value) => {
    const newFormat = { ...format, [key]: value };
    setFormat(newFormat);
    updatePreview(newFormat, customPattern);
  };

  const handlePatternChange = (type, value) => {
    const newPattern = { ...customPattern, [type]: value };
    setCustomPattern(newPattern);
    updatePreview(format, newPattern);
  };

  const validateFormat = () => {
    const newErrors = {};
    
    if (!format.prefix.trim()) {
      newErrors.prefix = 'Prefix is required';
    }
    
    if (format.customFormat) {
      if (!customPattern.admin.trim()) {
        newErrors.adminPattern = 'Admin pattern is required';
      }
      if (!customPattern.user.trim()) {
        newErrors.userPattern = 'User pattern is required';
      }
      
      if (customPattern.admin === customPattern.user) {
        newErrors.patterns = 'Admin and User patterns must be different';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFormat()) return;
    
    const settings = {
      format,
      customPattern,
      previewIds
    };
    
    if (dataStore && dataStore.setUserIdFormat) {
      dataStore.setUserIdFormat(settings);
    }
    
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset User ID format to default (TUPM)?')) {
      const defaultFormat = {
        prefix: 'TUPM',
        adminSeparator: '_',
        userSeparator: '-',
        segmentCount: 2,
        segmentLength: [2, 4],
        autoIncrement: true,
        customFormat: false
      };
      
      const defaultPattern = {
        admin: 'TUPM_XX_XXXX',
        user: 'TUPM-XX-XXXX'
      };
      
      setFormat(defaultFormat);
      setCustomPattern(defaultPattern);
      updatePreview(defaultFormat, defaultPattern);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User ID Format Configuration</h2>
            <p className="text-sm text-gray-500">Customize how User IDs are generated in your organization</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFormatChange('customFormat', false)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  !format.customFormat
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Hash className={`w-6 h-6 mx-auto mb-2 ${!format.customFormat ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${!format.customFormat ? 'text-indigo-600' : 'text-gray-700'}`}>
                  Template Builder
                </p>
                <p className="text-xs text-gray-500 mt-1">Build format using components</p>
              </button>

              <button
                onClick={() => handleFormatChange('customFormat', true)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  format.customFormat
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Eye className={`w-6 h-6 mx-auto mb-2 ${format.customFormat ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${format.customFormat ? 'text-purple-600' : 'text-gray-700'}`}>
                  Custom Pattern
                </p>
                <p className="text-xs text-gray-500 mt-1">Define your own pattern</p>
              </button>
            </div>
          </div>

          {/* Template Builder Mode */}
          {!format.customFormat && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-800">Template Builder</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Prefix *
                </label>
                <input
                  type="text"
                  value={format.prefix}
                  onChange={(e) => handleFormatChange('prefix', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.prefix ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., TUPM, ABC, XYZ123"
                  maxLength={10}
                />
                {errors.prefix && <p className="mt-1 text-sm text-red-500">{errors.prefix}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Your organization's unique identifier (2-10 characters)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Separator
                  </label>
                  <select
                    value={format.adminSeparator}
                    onChange={(e) => handleFormatChange('adminSeparator', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="_">Underscore (_)</option>
                    <option value="-">Hyphen (-)</option>
                    <option value=".">Dot (.)</option>
                    <option value="">None</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Character between segments for Admin</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Separator
                  </label>
                  <select
                    value={format.userSeparator}
                    onChange={(e) => handleFormatChange('userSeparator', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Dot (.)</option>
                    <option value="">None</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Character between segments for User</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Segments
                </label>
                <select
                  value={format.segmentCount}
                  onChange={(e) => handleFormatChange('segmentCount', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 Segment</option>
                  <option value={2}>2 Segments</option>
                  <option value={3}>3 Segments</option>
                  <option value={4}>4 Segments</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Number of parts after prefix (e.g., 2 segments = XX-XXXX)
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Segment Lengths</p>
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(format.segmentCount)].map((_, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-600 mb-1">Segment {i + 1}</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={format.segmentLength[i] || 2}
                        onChange={(e) => {
                          const newLengths = [...format.segmentLength];
                          newLengths[i] = parseInt(e.target.value) || 2;
                          handleFormatChange('segmentLength', newLengths);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Pattern Mode */}
          {format.customFormat && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-800">Custom Pattern Definition</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin ID Pattern *
                </label>
                <input
                  type="text"
                  value={customPattern.admin}
                  onChange={(e) => handlePatternChange('admin', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    errors.adminPattern ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., ORG_XXXX or ABC-XX-XXXX"
                />
                {errors.adminPattern && <p className="mt-1 text-sm text-red-500">{errors.adminPattern}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use 'X' for digit placeholders. Example: ABC_XX_XXXX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID Pattern *
                </label>
                <input
                  type="text"
                  value={customPattern.user}
                  onChange={(e) => handlePatternChange('user', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    errors.userPattern ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., ORG-XXXX or ABC.XX.XXXX"
                />
                {errors.userPattern && <p className="mt-1 text-sm text-red-500">{errors.userPattern}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use 'X' for digit placeholders. Must differ from Admin pattern
                </p>
              </div>

              {errors.patterns && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errors.patterns}</p>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Pattern Examples:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
                  <li>• <code className="bg-blue-100 px-1 rounded">COMPANY_XXXX</code> → COMPANY_0001, COMPANY_0002</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">ORG-XX-XXXX</code> → ORG-01-0001, ORG-02-0042</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">ABC.DEPT.XXXX</code> → ABC.DEPT.0001</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">UNIV_YEAR_XXXX</code> → UNIV_2024_0001</li>
                </ul>
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-4">Live Preview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-600 mb-2">ADMIN ID FORMAT</p>
                <p className="font-mono text-xl font-bold text-purple-900">{previewIds.admin}</p>
                <p className="text-xs text-purple-600 mt-2">Sample IDs:</p>
                <div className="space-y-1 mt-1">
                  <p className="font-mono text-sm text-purple-800">{previewIds.admin.replace(/\d+/g, (match) => '0001')}</p>
                  <p className="font-mono text-sm text-purple-800">{previewIds.admin.replace(/\d+/g, (match, offset, str) => {
                    const parts = str.match(/\d+/g);
                    return parts && parts.length > 1 ? (offset > str.length/2 ? '0042' : '02') : '0042';
                  })}</p>
                </div>
              </div>

              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-600 mb-2">USER ID FORMAT</p>
                <p className="font-mono text-xl font-bold text-blue-900">{previewIds.user}</p>
                <p className="text-xs text-blue-600 mt-2">Sample IDs:</p>
                <div className="space-y-1 mt-1">
                  <p className="font-mono text-sm text-blue-800">{previewIds.user.replace(/\d+/g, '0001')}</p>
                  <p className="font-mono text-sm text-blue-800">{previewIds.user.replace(/\d+/g, (match, offset, str) => {
                    const parts = str.match(/\d+/g);
                    return parts && parts.length > 1 ? (offset > str.length/2 ? '0156' : '03') : '0156';
                  })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Common Presets */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const preset = {
                    prefix: 'TUPM',
                    adminSeparator: '_',
                    userSeparator: '-',
                    segmentCount: 2,
                    segmentLength: [2, 4],
                    customFormat: false
                  };
                  setFormat(preset);
                  updatePreview(preset, customPattern);
                }}
                className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 text-left transition-all"
              >
                <p className="font-semibold text-sm text-gray-800">Default (TUPM)</p>
                <p className="text-xs text-gray-500 mt-1">TUPM_XX_XXXX / TUPM-XX-XXXX</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'ORG',
                    adminSeparator: '_',
                    userSeparator: '-',
                    segmentCount: 1,
                    segmentLength: [4],
                    customFormat: false
                  };
                  setFormat(preset);
                  updatePreview(preset, customPattern);
                }}
                className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 text-left transition-all"
              >
                <p className="font-semibold text-sm text-gray-800">Simple</p>
                <p className="text-xs text-gray-500 mt-1">ORG_XXXX / ORG-XXXX</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'UNIV',
                    adminSeparator: '.',
                    userSeparator: '.',
                    segmentCount: 3,
                    segmentLength: [2, 2, 4],
                    customFormat: false
                  };
                  setFormat(preset);
                  updatePreview(preset, customPattern);
                }}
                className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 text-left transition-all"
              >
                <p className="font-semibold text-sm text-gray-800">University Style</p>
                <p className="text-xs text-gray-500 mt-1">UNIV.XX.XX.XXXX</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'CORP',
                    adminSeparator: '',
                    userSeparator: '',
                    segmentCount: 1,
                    segmentLength: [6],
                    customFormat: false
                  };
                  setFormat(preset);
                  updatePreview(preset, customPattern);
                }}
                className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 text-left transition-all"
              >
                <p className="font-semibold text-sm text-gray-800">Corporate</p>
                <p className="text-xs text-gray-500 mt-1">CORPXXXXXX</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
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
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}