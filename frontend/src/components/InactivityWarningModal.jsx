import { AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InactivityWarningModal({ show, secondsRemaining, onStayLoggedIn, onLogout }) {
  const [displayTime, setDisplayTime] = useState(secondsRemaining || 60);

  useEffect(() => {
    setDisplayTime(secondsRemaining || 60);
  }, [secondsRemaining]);

  if (!show) return null;

  // Prevent clicks inside the modal from triggering activity listeners
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleModalClick}>
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center gap-4 mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
          <h2 className="text-2xl font-bold text-gray-900">Session Inactive</h2>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600 mb-2">You will be logged out in:</p>
              <p className="text-3xl font-bold text-orange-600">{displayTime}s</p>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Your session has been inactive. Click "Stay Logged In" to continue or you will be automatically logged out.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
