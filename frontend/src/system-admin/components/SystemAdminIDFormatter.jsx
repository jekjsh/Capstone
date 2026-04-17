import { X, Hash, Eye, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { idFormatAPI } from '../../services/api';

export default function SystemAdminIDFormatter({ 
  show, 
  onClose, 
  dataStore,
  onSave,
  lockUntilConfigured = false
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
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [formatId, setFormatId] = useState(null);
  const [savedFormats, setSavedFormats] = useState([]);

  // Load format from backend API
  useEffect(() => {
    const loadFormat = async () => {
      if (show) {
        try {
          const formats = await idFormatAPI.getAll();
          const data = Array.isArray(formats) ? formats : (formats.results || []);
          
          if (data && data.length > 0) {
            // Store all saved formats for display
            setSavedFormats(data);
            
            const activeFormat = data.find(f => f.is_active) || data[0];
            
            if (activeFormat) {
              setFormatId(activeFormat.format_id);
              
              // Convert backend format to UI format
              const segmentLength = [
                activeFormat.segment1_len,
                activeFormat.segment2_len,
                activeFormat.segment3_len
              ].filter(s => s);
              
              const uiFormat = {
                prefix: activeFormat.prefix,
                adminSeparator: activeFormat.admin_separator,
                userSeparator: activeFormat.user_separator,
                segmentCount: segmentLength.length,
                segmentLength: segmentLength,
                autoIncrement: true,
                customFormat: false
              };
              
              setFormat(uiFormat);
              updatePreview(uiFormat, customPattern);
            }
          }
        } catch (error) {
          console.error('Failed to load ID format:', error);
          // Fallback to dataStore
          if (dataStore) {
            const saved = dataStore.getUserIdFormat ? dataStore.getUserIdFormat() : null;
            if (saved) {
              setFormat(saved.format);
              setCustomPattern(saved.customPattern);
              updatePreview(saved.format, saved.customPattern);
            }
          }
        }
      }
    };

    loadFormat();
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
    let id = fmt.prefix || '';
    
    for (let i = 0; i < fmt.segmentCount; i++) {
      id += separator + 'X'.repeat(fmt.segmentLength[i] || 2);
    }
    
    return id;
  };

  const handleFormatChange = (key, value) => {
    const newFormat = { ...format, [key]: value };

    if (key === 'segmentCount') {
      const count = Number(value) || 1;
      const normalizedLengths = Array.from({ length: count }, (_, idx) => {
        const existing = Number(format.segmentLength[idx]);
        if (!Number.isInteger(existing) || existing < 1) return 2;
        return Math.min(existing, 6);
      });
      newFormat.segmentLength = normalizedLengths;
    }

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

  // Set a format as active (make is_active true for this one, false for others)
  const handleSetActiveFormat = async (fmt) => {
    setIsSaving(true);
    setSavedMessage('');
    
    try {
      // Deactivate all other formats
      for (const otherFmt of savedFormats) {
        if (otherFmt.format_id !== fmt.format_id && otherFmt.is_active) {
          await idFormatAPI.update(otherFmt.format_id, {
            ...otherFmt,
            is_active: false
          });
        }
      }
      
      // Activate this format
      const updated = await idFormatAPI.update(fmt.format_id, {
        ...fmt,
        is_active: true
      });
      
      // Update state
      const updatedFormats = savedFormats.map(f => ({
        ...f,
        is_active: f.format_id === fmt.format_id
      }));
      setSavedFormats(updatedFormats);
      
      // Load this format into editor
      const segmentLength = [
        fmt.segment1_len,
        fmt.segment2_len,
        fmt.segment3_len
      ].filter(s => s);
      
      const uiFormat = {
        prefix: fmt.prefix,
        adminSeparator: fmt.admin_separator,
        userSeparator: fmt.user_separator,
        segmentCount: segmentLength.length,
        segmentLength: segmentLength,
        autoIncrement: true,
        customFormat: false
      };
      
      setFormat(uiFormat);
      setFormatId(fmt.format_id);
      updatePreview(uiFormat, customPattern);
      
      // Show alert
      alert('ID Format has been changed successfully!');
      
      // Also save to dataStore for fallback
      const settings = {
        format: uiFormat,
        customPattern,
        previewIds
      };
      
      if (dataStore && dataStore.setUserIdFormat) {
        dataStore.setUserIdFormat(settings);
      }
      
      onSave(settings);
    } catch (error) {
      console.error('Failed to set active format:', error);
      setErrors({ submit: error.message || 'Failed to change ID format' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!validateFormat()) return;
    
    setIsSaving(true);
    setSavedMessage('');
    
    try {
      const activeSegmentLengths = (format.segmentLength || [])
        .slice(0, Number(format.segmentCount) || 1)
        .map((len) => {
          const parsed = Number(len);
          if (!Number.isInteger(parsed) || parsed < 1) return 2;
          return Math.min(parsed, 6);
        });

      // Convert UI format to backend format (org is now nullable)
      const backendFormat = {
        prefix: format.prefix,
        admin_separator: format.adminSeparator,
        user_separator: format.userSeparator,
        segment1_len: activeSegmentLengths[0] || null,
        segment2_len: activeSegmentLengths[1] || null,
        segment3_len: activeSegmentLengths[2] || null,
        is_active: true
        // org is now optional/nullable
      };

      if (formatId) {
        // Update existing format
        await idFormatAPI.update(formatId, backendFormat);
      } else {
        // Create new format
        const created = await idFormatAPI.create(backendFormat);
        setFormatId(created.format_id);
      }

      // Show alert
      alert('ID Format has been changed successfully!');
      
      // Also save to dataStore for fallback
      const settings = {
        format,
        customPattern,
        previewIds
      };
      
      if (dataStore && dataStore.setUserIdFormat) {
        dataStore.setUserIdFormat(settings);
      }
      
      onSave(settings);
      
      // Reload formats list
      const formats = await idFormatAPI.getAll();
      setSavedFormats(Array.isArray(formats) ? formats : (formats.results || []));
      
      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save ID format:', error);
      setErrors({ submit: error.message || 'Failed to save ID format' });
    } finally {
      setIsSaving(false);
    }
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close on backdrop click only when formatter is not locked by missing required config.
        if (!lockUntilConfigured && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User ID Format Configuration</h2>
            <p className="text-sm text-gray-500">Customize how User IDs are generated in your organization</p>
          </div>
          {!lockUntilConfigured && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Saved ID Formats Section */}
          {savedFormats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Saved ID Formats</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedFormats.map((fmt) => {
                  // Generate preview for this format
                  const segmentLength = [fmt.segment1_len, fmt.segment2_len, fmt.segment3_len].filter(s => s);
                  let adminPreview = fmt.prefix;
                  let userPreview = fmt.prefix;
                  
                  segmentLength.forEach((length) => {
                    adminPreview += fmt.admin_separator + 'X'.repeat(length);
                    userPreview += fmt.user_separator + 'X'.repeat(length);
                  });
                  
                  return (
                    <button
                      key={fmt.format_id}
                      onClick={() => handleSetActiveFormat(fmt)}
                      disabled={isSaving}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        fmt.is_active
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                          : 'border-gray-200 hover:border-indigo-300'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">{fmt.prefix}</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Admin: <span className="font-mono font-semibold text-indigo-600">{adminPreview}</span></p>
                          <p className="text-xs text-gray-600">User: <span className="font-mono font-semibold text-blue-600">{userPreview}</span></p>
                        </div>
                        {fmt.is_active && (
                          <div className="pt-2">
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                              ✓ Active
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Template Builder Section - for editing */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-800">Edit Current Format</h3>
              
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
                  Optional organization identifier (up to 10 characters)
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
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Number of parts after prefix (e.g., 2 segments = XX-XXXX) - Maximum 3 segments supported
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
                        max="6"
                        value={format.segmentLength[i] || 2}
                        onChange={(e) => {
                          let value = parseInt(e.target.value) || 2;
                          // Enforce max of 6
                          if (value > 6) {
                            value = 6;
                          }
                          // Enforce min of 1
                          if (value < 1) {
                            value = 1;
                          }
                          const newLengths = [...format.segmentLength];
                          newLengths[i] = value;
                          handleFormatChange('segmentLength', newLengths);
                        }}
                        className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ${
                          (format.segmentLength[i] || 2) > 6 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-indigo-500'
                        }`}
                      />
                      {(format.segmentLength[i] || 2) > 6 && (
                        <p className="text-xs text-red-600 mt-1">Max 6 characters</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Each segment can be 1-6 characters maximum</p>
              </div>
            </div>

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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t space-y-3">
          {errors.submit && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Reset to Default
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

