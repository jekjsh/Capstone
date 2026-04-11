import { Eye } from 'lucide-react';

export default function PreviewTab({ theme }) {
  const getColorName = (colorCode) => {
    const colorMap = {
      'blue': 'Blue',
      'indigo': 'Indigo',
      'purple': 'Purple',
      'pink': 'Pink',
      'red': 'Red',
      'orange': 'Orange',
      'yellow': 'Yellow',
      'green': 'Green',
      'teal': 'Teal',
      'cyan': 'Cyan',
    };
    return colorMap[colorCode] || 'Blue';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">System Preview</h3>
      </div>

      {/* Login Page Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Login Page</h4>
          <div 
            className="rounded-lg overflow-hidden shadow-xl max-w-md mx-auto"
            style={{
              backgroundImage: theme?.sys_backg ? `url(${theme.sys_backg})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '400px',
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative flex items-center justify-center h-full">
              <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                  {theme?.sys_logo ? (
                    <img src={theme.sys_logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded" />
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">Logo</span>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {theme?.sys_name || 'System Name'}
                  </h2>
                  <p className="text-sm text-gray-600">Record Keeping Management System</p>
                </div>
                <p className="text-xs text-gray-500 text-center mb-4">Please sign in to your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Branding Settings</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">System Name</dt>
              <dd className="text-gray-900 font-medium">{theme?.sys_name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Abbreviation</dt>
              <dd className="text-gray-900 font-medium">{theme?.sys_abbr || 'Not set'} RKMS</dd>
            </div>
            <div>
              <dt className="text-gray-600">Logo</dt>
              <dd className="text-gray-900 font-medium">{theme?.sys_logo ? 'Uploaded' : 'Not set'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Design Settings</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Background Image</dt>
              <dd className="text-gray-900 font-medium">{theme?.sys_backg ? 'Uploaded' : 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Sidebar Color</dt>
              <dd className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{
                    backgroundColor: {
                      'blue': '#3B82F6',
                      'indigo': '#4F46E5',
                      'purple': '#A855F7',
                      'pink': '#EC4899',
                      'red': '#EF4444',
                      'orange': '#F97316',
                      'yellow': '#EAB308',
                      'green': '#22C55E',
                      'teal': '#14B8A6',
                      'cyan': '#06B6D4',
                    }[theme?.sidebar_color] || '#3B82F6'
                  }}
                />
                <span className="font-medium">{getColorName(theme?.sidebar_color)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> These settings will be applied throughout the system. 
          Changes appear in real-time across all user interfaces.
        </p>
      </div>
    </div>
  );
}
