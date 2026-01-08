import { X, Hash, Eye, AlertCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UserIdFormatModal({ 
  show, 
  onClose, 
  dataStore,
  onSave 
}) {
  const [format, setFormat] = useState({
    prefix: 'TUPM',
    systemAdminSeparator: '*',
    adminSeparator: '_',
    userSeparator: '-',
    segmentCount: 2,
    segmentLength: [2, 4],
    autoIncrement: true,
    customFormat: false
  });
  
  const [customPattern, setCustomPattern] = useState({
    systemAdmin: 'TUPM*XX*XXXX',
    admin: 'TUPM_XX_XXXX',
    user: 'TUPM-XX-XXXX'
  });
  
  const [previewIds, setPreviewIds] = useState({
    systemAdmin: 'TUPM*01*0001',
    admin: 'TUPM_01_0001',
    user: 'TUPM-01-0001'
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && dataStore) {
      const saved = dataStore.getUserIdFormat ? dataStore.getUserIdFormat() : null;
      if (saved && saved.format) {
        // Ensure ALL separators exist in saved format with proper defaults
        const loadedFormat = {
          ...saved.format,
          systemAdminSeparator: saved.format.systemAdminSeparator || '*',
          adminSeparator: saved.format.adminSeparator || '_',
          userSeparator: saved.format.userSeparator || '-'
        };
        const loadedPattern = {
          systemAdmin: (saved.customPattern && saved.customPattern.systemAdmin) || 'TUPM*XX*XXXX',
          admin: (saved.customPattern && saved.customPattern.admin) || 'TUPM_XX_XXXX',
          user: (saved.customPattern && saved.customPattern.user) || 'TUPM-XX-XXXX'
        };
        
        console.log('📥 Loading saved format:', loadedFormat);
        console.log('📥 Separators - System Admin:', loadedFormat.systemAdminSeparator, 'Admin:', loadedFormat.adminSeparator, 'User:', loadedFormat.userSeparator);
        
        setFormat(loadedFormat);
        setCustomPattern(loadedPattern);
        updatePreview(loadedFormat, loadedPattern);
      } else {
        // Initialize with defaults if no saved data
        console.log('📥 No saved data, using defaults');
        updatePreview(format, customPattern);
      }
    }
  }, [show, dataStore]);

  const updatePreview = (fmt, pattern) => {
    if (fmt.customFormat) {
      setPreviewIds({
        systemAdmin: pattern.systemAdmin,
        admin: pattern.admin,
        user: pattern.user
      });
    } else {
      const systemAdminId = generateSampleId('system-admin', fmt);
      const adminId = generateSampleId('admin', fmt);
      const userId = generateSampleId('user', fmt);
      setPreviewIds({ systemAdmin: systemAdminId, admin: adminId, user: userId });
    }
  };

  const generateSampleId = (type, fmt) => {
    const separator = type === 'system-admin' ? (fmt.systemAdminSeparator || '*') : 
                      type === 'admin' ? (fmt.adminSeparator || '_') : 
                      (fmt.userSeparator || '-');
    let id = fmt.prefix || 'TUPM';
    
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
      if (!customPattern.systemAdmin.trim()) {
        newErrors.systemAdminPattern = 'System Admin pattern is required';
      }
      if (!customPattern.admin.trim()) {
        newErrors.adminPattern = 'Admin pattern is required';
      }
      if (!customPattern.user.trim()) {
        newErrors.userPattern = 'User pattern is required';
      }
      
      // Check for duplicate patterns
      const patterns = [customPattern.systemAdmin, customPattern.admin, customPattern.user];
      const uniquePatterns = new Set(patterns);
      if (uniquePatterns.size !== patterns.length) {
        newErrors.patterns = 'System Admin, Admin, and User patterns must all be different';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSave = () => {
  if (!validateFormat()) return;
  
  console.log('💾 Current format state:', format);
  console.log('💾 Separators - System Admin:', format.systemAdminSeparator, 'Admin:', format.adminSeparator, 'User:', format.userSeparator);
  
  // ✅ Generate fresh preview IDs based on current format
  let freshPreviewIds;
  if (format.customFormat) {
    freshPreviewIds = {
      systemAdmin: customPattern.systemAdmin,
      admin: customPattern.admin,
      user: customPattern.user
    };
    console.log('💾 Using custom patterns:', freshPreviewIds);
  } else {
    const sysAdminId = generateSampleId('system-admin', format);
    const adminId = generateSampleId('admin', format);
    const userId = generateSampleId('user', format);
    
    freshPreviewIds = {
      systemAdmin: sysAdminId,
      admin: adminId,
      user: userId
    };
    
    console.log('💾 Generated IDs:');
    console.log('   - System Admin:', sysAdminId);
    console.log('   - Admin:', adminId);
    console.log('   - User:', userId);
  }
  
  const settings = {
    format,
    customPattern,
    previewIds: freshPreviewIds
  };
  
  console.log('💾 Final settings to save:', settings);
  
  // ✅ Save to DataStore
  if (dataStore && dataStore.setUserIdFormat) {
    dataStore.setUserIdFormat(settings);
    console.log('💾 Format saved to DataStore');
  }
  
  // ✅ Also save to localStorage
  try {
    localStorage.setItem('rkms_userid_format', JSON.stringify(settings));
    console.log('💾 Format saved to localStorage');
  } catch (e) {
    console.error('❌ Failed to save to localStorage:', e);
  }
  
  onSave(settings);
  onClose();
  
  // ✅ Verify it was saved
  setTimeout(() => {
    const saved = dataStore.getUserIdFormat();
    console.log('✅ Verification - Format after save:', saved);
  }, 100);
};

  const handleReset = () => {
    if (window.confirm('Reset User ID format to default (TUPM)?')) {
      const defaultFormat = {
        prefix: 'TUPM',
        systemAdminSeparator: '*',
        adminSeparator: '_',
        userSeparator: '-',
        segmentCount: 2,
        segmentLength: [2, 4],
        autoIncrement: true,
        customFormat: false
      };
      
      const defaultPattern = {
        systemAdmin: 'TUPM*XX*XXXX',
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User ID Format Configuration</h2>
            <p className="text-sm text-gray-500">Customize how User IDs are generated for all user types</p>
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
                <p className="text-xs text-gray-500 mt-1">Enter exact ID patterns</p>
              </button>
            </div>
          </div>

          {/* Template Builder Mode */}
          {!format.customFormat && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Template Builder Mode</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Configure common settings that apply to all user types. Each type uses a different separator to distinguish roles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Prefix *
                </label>
                <input
                  type="text"
                  value={format.prefix}
                  onChange={(e) => handleFormatChange('prefix', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.prefix ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., TUPM, ORG, UNIV"
                />
                {errors.prefix && <p className="mt-1 text-sm text-red-500">{errors.prefix}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Starting letters/numbers for all User IDs
                </p>
              </div>

              {/* Separators - Three Columns for Three User Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Separators (Distinguish User Types) *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* System Admin Separator */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-semibold text-purple-800">System Admin</label>
                    </div>
                    <input
                      type="text"
                      value={format.systemAdminSeparator}
                      onChange={(e) => handleFormatChange('systemAdminSeparator', e.target.value.charAt(0))}
                      maxLength="1"
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono text-lg font-bold bg-white"
                      placeholder="*"
                    />
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      Default: <code className="bg-purple-100 px-1 rounded">*</code>
                    </p>
                  </div>

                  {/* Admin Separator */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-blue-800">Admin</label>
                    </div>
                    <input
                      type="text"
                      value={format.adminSeparator}
                      onChange={(e) => handleFormatChange('adminSeparator', e.target.value.charAt(0))}
                      maxLength="1"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg font-bold bg-white"
                      placeholder="_"
                    />
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      Default: <code className="bg-blue-100 px-1 rounded">_</code>
                    </p>
                  </div>

                  {/* User Separator */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-green-600" />
                      <label className="text-sm font-semibold text-green-800">User</label>
                    </div>
                    <input
                      type="text"
                      value={format.userSeparator}
                      onChange={(e) => handleFormatChange('userSeparator', e.target.value.charAt(0))}
                      maxLength="1"
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-mono text-lg font-bold bg-white"
                      placeholder="-"
                    />
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Default: <code className="bg-green-100 px-1 rounded">-</code>
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 italic">
                  💡 Different separators help identify user roles at a glance (e.g., * for System Admin, _ for Admin, - for User)
                </p>
              </div>

              {/* Segment Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Segments
                  </label>
                  <select
                    value={format.segmentCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      const newLength = Array(count).fill(2);
                      setFormat({ ...format, segmentCount: count, segmentLength: newLength });
                      updatePreview({ ...format, segmentCount: count, segmentLength: newLength }, customPattern);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 Segment</option>
                    <option value="2">2 Segments</option>
                    <option value="3">3 Segments</option>
                    <option value="4">4 Segments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segment Lengths
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: format.segmentCount }).map((_, i) => (
                      <input
                        key={i}
                        type="number"
                        min="1"
                        max="8"
                        value={format.segmentLength[i] || 2}
                        onChange={(e) => {
                          const newLengths = [...format.segmentLength];
                          newLengths[i] = parseInt(e.target.value) || 2;
                          handleFormatChange('segmentLength', newLengths);
                        }}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Digits per segment (1-8)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Pattern Mode */}
          {format.customFormat && (
            <div className="space-y-4">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Custom Pattern Mode</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Define exact patterns for each user type. Use 'X' as placeholders for digits. All three patterns must be different.
                    </p>
                  </div>
                </div>
              </div>

              {/* System Admin Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>System Admin ID Pattern *</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={customPattern.systemAdmin}
                  onChange={(e) => handlePatternChange('systemAdmin', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    errors.systemAdminPattern ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="e.g., TUPM*XX*XXXX or SA@XXXX"
                />
                {errors.systemAdminPattern && <p className="mt-1 text-sm text-red-500">{errors.systemAdminPattern}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use 'X' for digit placeholders. Example: TUPM*XX*XXXX or SA@DEPT@XXXX
                </p>
              </div>
              
              {/* Admin Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span>Admin ID Pattern *</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={customPattern.admin}
                  onChange={(e) => handlePatternChange('admin', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    errors.adminPattern ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., TUPM_XX_XXXX or ADM-XXXX"
                />
                {errors.adminPattern && <p className="mt-1 text-sm text-red-500">{errors.adminPattern}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use 'X' for digit placeholders. Example: TUPM_XX_XXXX or ADM.DEPT.XXXX
                </p>
              </div>

              {/* User Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-green-600" />
                    <span>User ID Pattern *</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={customPattern.user}
                  onChange={(e) => handlePatternChange('user', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    errors.userPattern ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="e.g., TUPM-XX-XXXX or USR.XXXX"
                />
                {errors.userPattern && <p className="mt-1 text-sm text-red-500">{errors.userPattern}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use 'X' for digit placeholders. Must differ from System Admin and Admin patterns
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
                  <li>• <code className="bg-blue-100 px-1 rounded">COMPANY*XXXX</code> → COMPANY*0001 (System Admin)</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">COMPANY_XXXX</code> → COMPANY_0001 (Admin)</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">COMPANY-XXXX</code> → COMPANY-0001 (User)</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">ORG@XX@XXXX</code> → ORG@01@0001 (Different separator style)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Live Preview - Three Columns */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-4">Live Preview</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* System Admin Preview */}
              <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-600">SYSTEM ADMIN</p>
                </div>
                <p className="font-mono text-lg font-bold text-purple-900 mb-2">{previewIds.systemAdmin}</p>
                <p className="text-xs text-purple-600 mb-1">Sample IDs:</p>
                <div className="space-y-1">
                  <p className="font-mono text-xs text-purple-800">{previewIds.systemAdmin.replace(/\d+/g, '0001')}</p>
                  <p className="font-mono text-xs text-purple-800">{previewIds.systemAdmin.replace(/\d+/g, (match, offset, str) => {
                    const parts = str.match(/\d+/g);
                    return parts && parts.length > 1 ? (offset > str.length/2 ? '0025' : '02') : '0025';
                  })}</p>
                </div>
              </div>

              {/* Admin Preview */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-600">ADMIN</p>
                </div>
                <p className="font-mono text-lg font-bold text-blue-900 mb-2">{previewIds.admin}</p>
                <p className="text-xs text-blue-600 mb-1">Sample IDs:</p>
                <div className="space-y-1">
                  <p className="font-mono text-xs text-blue-800">{previewIds.admin.replace(/\d+/g, '0001')}</p>
                  <p className="font-mono text-xs text-blue-800">{previewIds.admin.replace(/\d+/g, (match, offset, str) => {
                    const parts = str.match(/\d+/g);
                    return parts && parts.length > 1 ? (offset > str.length/2 ? '0042' : '02') : '0042';
                  })}</p>
                </div>
              </div>

              {/* User Preview */}
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-600">USER</p>
                </div>
                <p className="font-mono text-lg font-bold text-green-900 mb-2">{previewIds.user}</p>
                <p className="text-xs text-green-600 mb-1">Sample IDs:</p>
                <div className="space-y-1">
                  <p className="font-mono text-xs text-green-800">{previewIds.user.replace(/\d+/g, '0001')}</p>
                  <p className="font-mono text-xs text-green-800">{previewIds.user.replace(/\d+/g, (match, offset, str) => {
                    const parts = str.match(/\d+/g);
                    return parts && parts.length > 1 ? (offset > str.length/2 ? '0156' : '03') : '0156';
                  })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const preset = {
                    prefix: 'TUPM',
                    systemAdminSeparator: '*',
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
                <p className="text-xs text-gray-500 mt-1">TUPM*XX*XXXX / TUPM_XX_XXXX / TUPM-XX-XXXX</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'ORG',
                    systemAdminSeparator: '@',
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
                <p className="text-xs text-gray-500 mt-1">ORG@XXXX / ORG_XXXX / ORG-XXXX</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'UNIV',
                    systemAdminSeparator: '#',
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
                <p className="text-xs text-gray-500 mt-1">UNIV#XX#XX#XXXX (SA) / UNIV.XX.XX.XXXX (Admin/User)</p>
              </button>

              <button
                onClick={() => {
                  const preset = {
                    prefix: 'CORP',
                    systemAdminSeparator: '!',
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
                <p className="text-xs text-gray-500 mt-1">CORP!XXXXXX (SA) / CORPXXXXXX (Admin/User)</p>
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