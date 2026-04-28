import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ArrowUp, 
  AlertCircle,
  Loader
} from 'lucide-react';
import { documentAPI } from '../../services/api';
import './ApprovalRequests.css';

const ApprovalRequests = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await documentAPI.getApprovals();
      console.log('✅ Fetched approvals:', data);
      setApprovals(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch approvals:', err);
      setError('Failed to load approval requests');
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApprovals = () => {
    if (filter === 'all') return approvals;
    return approvals.filter(a => a.status === filter);
  };

  const handleApprove = () => {
    setActionType('approve');
    setShowActionModal(true);
  };

  const handleDeny = () => {
    setActionType('deny');
    setShowActionModal(true);
  };

  const handlePassToHigher = () => {
    setActionType('approve_and_pass_to_higher');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedApproval || !actionType) return;

    setActionInProgress(true);
    try {
      let response;
      
      if (actionType === 'approve') {
        response = await documentAPI.approveApproval(selectedApproval.approval_id, reviewMessage);
      } else if (actionType === 'deny') {
        response = await documentAPI.denyApproval(selectedApproval.approval_id, reviewMessage);
      } else if (actionType === 'approve_and_pass_to_higher') {
        response = await documentAPI.passApprovalToHigher(selectedApproval.approval_id, reviewMessage);
      }

      // Update the approval in the list
      setApprovals(prev =>
        prev.map(a => a.approval_id === selectedApproval.approval_id ? response : a)
      );

      setSuccess(`Approval ${actionType.replace(/_/g, ' ')} successfully`);
      setShowActionModal(false);
      setReviewMessage('');
      setSelectedApproval(null);
      setActionType(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(`Failed to ${actionType}:`, err);
      setError(`Failed to ${actionType.replace(/_/g, ' ')}: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      denied: { bg: 'bg-red-100', text: 'text-red-800', label: 'Denied' },
      passed_to_higher: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Passed to Higher' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredApprovals = getFilteredApprovals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="approval-requests-container p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Document Approval Requests</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['pending', 'approved', 'denied', 'passed_to_higher', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {status === 'passed_to_higher' ? 'Passed Up' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No approval requests found</p>
          </div>
        ) : (
          filteredApprovals.map(approval => (
            <div
              key={approval.approval_id}
              className="approval-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedApproval(approval)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {approval.doc_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Requested by: {approval.requested_by_user?.first_name} {approval.requested_by_user?.last_name}
                  </p>
                  {approval.requesting_org_name && (
                    <p className="text-sm text-gray-600">
                      Organization: {approval.requesting_org_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(approval.status)}
                  <span className="text-xs text-gray-500">
                    {formatDate(approval.created_at)}
                  </span>
                </div>
              </div>

              {approval.approval_message && (
                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Message:</strong> {approval.approval_message}
                  </p>
                </div>
              )}

              {approval.review_message && (
                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Review Note:</strong> {approval.review_message}
                  </p>
                </div>
              )}

              {(approval.status === 'pending' || approval.status === 'passed_to_higher') && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApproval(approval);
                      handleApprove();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApproval(approval);
                      handleDeny();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny
                  </button>
                  {approval.status === 'pending' && approval.requested_org?.parent_org && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApproval(approval);
                        handlePassToHigher();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                      Approve & Pass to Higher
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {actionType === 'approve' && 'Approve Request'}
              {actionType === 'deny' && 'Deny Request'}
              {actionType === 'approve_and_pass_to_higher' && 'Approve & Pass to Higher Authority'}
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm">
                <strong>Document:</strong> {selectedApproval.doc_name}
              </p>
              <p className="text-sm">
                <strong>Requester:</strong> {selectedApproval.requested_by_user?.first_name} {selectedApproval.requested_by_user?.last_name}
              </p>
            </div>

            {/* View Document Notice */}
            <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📄 View Document:</strong> The document is available in the <strong>Files & Sharing</strong> tab where you can review it before approving.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review Message (Optional)</label>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                placeholder="Add a note explaining your decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setReviewMessage('');
                  setActionType(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionInProgress}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionType === 'deny'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionInProgress && <Loader className="w-4 h-4 animate-spin" />}
                {actionType === 'approve' && 'Approve'}
                {actionType === 'deny' && 'Deny'}
                {actionType === 'approve_and_pass_to_higher' && 'Approve & Pass to Higher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRequests;
