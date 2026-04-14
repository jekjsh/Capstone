import { useState, useEffect } from 'react';
import { UserPlus, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { userCreationRequestAPI } from '../../services/api';

export default function SystemAdminRequests({ onOpenRequestModal, targetRequestId = null }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!targetRequestId || requests.length === 0) {
      return;
    }

    const matchedRequest = requests.find((request) => request.request_id === targetRequestId);
    if (!matchedRequest) {
      return;
    }

    setExpandedRequestId(targetRequestId);
    const rowElement = document.getElementById(`request-row-${targetRequestId}`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [targetRequestId, requests]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await userCreationRequestAPI.getAll();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'User Creation':
        return 'bg-blue-50 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  const toggleExpand = (requestId) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  const handleApprove = (request) => {
    onOpenRequestModal(request, 'approve');
  };

  const handleReject = (request) => {
    onOpenRequestModal(request, 'reject');
  };

  const handlePreview = (request) => {
    onOpenRequestModal(request, 'preview');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Requests
          </h1>
          <p className="text-gray-600 mt-1">Manage pending requests from users</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading requests...</p>
        </div>
      )}

      {/* Requests List */}
      {!isLoading && requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No requests at this time</p>
        </div>
      ) : (
        !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {requests.map((request) => (
            <div
              key={request.request_id}
              id={`request-row-${request.request_id}`}
              className="bg-blue-50 border-l-4 border-blue-500 transition-colors duration-200"
            >
              {/* Request Header */}
              <div className="px-4 py-3 hover:bg-opacity-75 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 leading-tight">
                        User Creation Request
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                        'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">
                          Request ID: <span className="font-semibold text-gray-900">{request.request_id}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 truncate">
                          Requester: <span className="font-semibold text-gray-900">{request.created_by}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">
                          Date: <span className="font-semibold text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 truncate">
                          Email: <span className="font-semibold text-gray-900">{request.email_add}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(request.request_id)}
                    className="ml-4 p-1.5 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                  >
                    {expandedRequestId === request.request_id ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRequestId === request.request_id && (
                <div className="border-t border-gray-200 p-4 bg-white bg-opacity-50">
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Requester Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Requester Information</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{request.created_by}</p>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Request Details</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">First Name</p>
                          <p className="text-sm font-medium text-gray-900">{request.first_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Middle Name</p>
                          <p className="text-sm font-medium text-gray-900">{request.middle_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Name</p>
                          <p className="text-sm font-medium text-gray-900">{request.last_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Suffix</p>
                          <p className="text-sm font-medium text-gray-900">{request.suffix || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{request.email_add}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Position</p>
                          <p className="text-sm font-medium text-gray-900">{request.user_pos}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Organization</p>
                          <p className="text-sm font-medium text-gray-900">{request.org_name} ({request.org_code})</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Status</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Current Status</p>
                          <p className={`text-sm font-semibold py-1 px-2 rounded w-fit ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status.toUpperCase()}
                          </p>
                        </div>
                        {request.assigned_user_id && (
                          <div>
                            <p className="text-xs text-gray-500">Assigned User ID</p>
                            <p className="text-sm font-medium text-gray-900">{request.assigned_user_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handlePreview(request)}
                        className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        )
      )}

      {/* Empty State Message */}
      {!isLoading && requests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium">Showing {requests.length} request(s)</p>
        </div>
      )}
    </div>
  );
}
