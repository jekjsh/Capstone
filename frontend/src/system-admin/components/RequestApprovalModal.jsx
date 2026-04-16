import { useState, useEffect } from 'react';
import { X, AlertCircle, Lock, Unlock } from 'lucide-react';
import { validateUserId, getFormatHint } from '../../utils/idFormatValidator';
import { userCreationRequestAPI, idFormatAPI, userAPI } from '../../services/api';

export default function RequestApprovalModal({ 
  isOpen, 
  onClose, 
  request, 
  action, // 'claim', 'approve', 'reject'
  onApprove,
  onReject,
  onClaim,
  currentUser = null,
  isLoading: externalIsLoading = false
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignedUserIdError, setAssignedUserIdError] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [selectedRoleError, setSelectedRoleError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claimInfo, setClaimInfo] = useState({
    claimed_by: request?.claimed_by || null,
    claimed_by_name: request?.claimed_by_name || null,
    claimed_at: request?.claimed_at || null,
  });
  const [claimedError, setClaimedError] = useState('');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [idFormat, setIdFormat] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [userIdAvailable, setUserIdAvailable] = useState(null); // null = not checked, true = available, false = not available
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [userIdFormatValid, setUserIdFormatValid] = useState(null); // null = not checked, true = valid, false = invalid

  const currentUserId = currentUser?.user_id || currentUser?.id || null;
  const currentUserIndex = currentUser?.user_index || currentUser?.full_data?.user_index || null;
  const normalizeId = (value) => (value === null || value === undefined ? '' : String(value).trim().toLowerCase());
  const isClaimed = !!claimInfo.claimed_by;
  const isClaimedByCurrentUser = isClaimed && [currentUserId, currentUserIndex].some(
    (id) => normalizeId(id) === normalizeId(claimInfo.claimed_by)
  );
  const isClaimedByOtherUser = isClaimed && !isClaimedByCurrentUser;

  useEffect(() => {
    setClaimInfo({
      claimed_by: request?.claimed_by || null,
      claimed_by_name: request?.claimed_by_name || null,
      claimed_at: request?.claimed_at || null,
    });
    setClaimedError('');
    setClaimSuccessMessage('');
  }, [request]);

  // Load ID format and generate temporary password on mount
  useEffect(() => {
    const loadFormat = async () => {
      try {
        const formats = await idFormatAPI.getAll();
        const data = Array.isArray(formats) ? formats : (formats.results || []);
        
        if (data && data.length > 0) {
          const activeFormat = data.find(f => f.is_active) || data[0];
          setIdFormat(activeFormat);
        }
      } catch (error) {
        console.error('Failed to load ID format:', error);
      }
    };

    loadFormat();
  }, []);

  // Generate temporary password from surname
  useEffect(() => {
    if (request?.last_name) {
      const surname = request.last_name.replace(/\s+/g, '').toUpperCase();
      setTempPassword(`${surname}123!`);
    }
  }, [request]);

  // Handle User ID change - validate format first, then check availability
  const handleUserIdChange = (value) => {
    setAssignedUserId(value);
    setAssignedUserIdError('');
    setUserIdAvailable(null);

    if (!value.trim()) {
      setUserIdFormatValid(null);
      return;
    }

    // Validate format first using the utility function
    if (idFormat) {
      const result = validateUserId(value, idFormat, selectedRole === 'admin' ? 'Admin' : 'User');
      setUserIdFormatValid(result.isValid);
      if (!result.isValid) {
        setAssignedUserIdError(result.error);
        return;
      }
    }

    // Format is valid, now check availability
    setCheckingAvailability(true);
    const timer = setTimeout(async () => {
      try {
        const response = await userAPI.getAll();
        const users = Array.isArray(response) ? response : (response.results || []);
        const userExists = users.some(u => u.user_id === value.toUpperCase());
        setUserIdAvailable(!userExists);
        if (userExists) {
          setAssignedUserIdError('This User ID already exists');
        }
      } catch (error) {
        console.error('Error checking User ID availability:', error);
        setUserIdAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  };

  // Check User ID availability with debounce
  useEffect(() => {
    if (!assignedUserId.trim()) {
      setUserIdAvailable(null);
      setUserIdFormatValid(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Format validation happens in handleUserIdChange, so only check availability here
      if (userIdFormatValid !== true) {
        return; // Skip availability check if format is invalid
      }

      setCheckingAvailability(true);
      try {
        const response = await userAPI.getAll();
        const users = Array.isArray(response) ? response : (response.results || []);
        const userExists = users.some(u => u.user_id === assignedUserId.toUpperCase());
        setUserIdAvailable(!userExists);
      } catch (error) {
        console.error('Error checking User ID availability:', error);
        setUserIdAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [assignedUserId]);

  if (!isOpen || !request) return null;

  const handleClaim = async () => {
    setIsLoading(true);
    setClaimedError('');
    setClaimSuccessMessage('');
    try {
      // Use the current user's user_id to claim the request
      if (!currentUserId) {
        setClaimedError('Unable to identify current user');
        return;
      }
      
      const result = await userCreationRequestAPI.claim(request.request_id, currentUserId);
      const claimedRequest = result?.request || {};
      setClaimInfo({
        claimed_by: claimedRequest.claimed_by || currentUserId,
        claimed_by_name: claimedRequest.claimed_by_name || currentUser?.name || currentUserId,
        claimed_at: claimedRequest.claimed_at || new Date().toISOString(),
      });
      setClaimSuccessMessage('Request claimed successfully. You can now approve or reject it.');
      if (onClaim) {
        await onClaim(request.request_id);
      }
    } catch (error) {
      setClaimedError(error.message || 'Failed to claim request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!isClaimedByCurrentUser) {
      setAssignedUserIdError('You must claim this request first.');
      return;
    }

    if (!assignedUserId.trim()) {
      setAssignedUserIdError('Please enter a User ID');
      return;
    }

    if (!selectedRole) {
      setSelectedRoleError('Please select a role');
      return;
    }

    // Validate User ID format using validator utility
    if (idFormat && userIdFormatValid !== true) {
      const result = validateUserId(assignedUserId, idFormat, selectedRole === 'admin' ? 'Admin' : 'User');
      if (!result.isValid) {
        setAssignedUserIdError(result.error);
        return;
      }
    }

    // Check if User ID is available
    if (userIdAvailable === false) {
      setAssignedUserIdError('This User ID already exists. Please choose a different one.');
      return;
    }

    if (userIdAvailable === null) {
      setAssignedUserIdError('Please wait for availability check to complete.');
      return;
    }
    
    setIsLoading(true);
    try {
      await userCreationRequestAPI.approve(request.request_id, assignedUserId, selectedRole, currentUserId);
      if (onApprove) {
        await onApprove(request.request_id);
      }
      onClose();
    } catch (error) {
      setAssignedUserIdError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleReject = async () => {
    if (!isClaimedByCurrentUser) {
      setRejectionReasonError('You must claim this request first.');
      return;
    }

    if (!rejectionReason.trim()) {
      setRejectionReasonError('Please provide a reason for rejection');
      return;
    }
    
    setIsLoading(true);
    try {
      await userCreationRequestAPI.deny(request.request_id, rejectionReason, currentUserId);
      if (onReject) {
        await onReject(request.request_id, rejectionReason);
      }
      onClose();
    } catch (error) {
      setRejectionReasonError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (action) {
      case 'approve':
        return 'Approve Request';
      case 'reject':
        return 'Reject Request';
      case 'claim':
        return 'Claim Request';
      default:
        return 'Request Details';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'approve':
        return 'bg-green-50 border-green-200';
      case 'reject':
        return 'bg-red-50 border-red-200';
      case 'claim':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 max-h-[95vh] overflow-y-auto border ${getActionColor()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{getActionTitle()}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Claim Status */}
        <div className={`rounded-lg p-4 mb-6 border ${
          isClaimedByCurrentUser
            ? 'bg-green-50 border-green-200'
            : isClaimedByOtherUser
              ? 'bg-amber-50 border-amber-200'
              : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {isClaimedByCurrentUser ? (
              <Unlock className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-yellow-600" />
            )}
            <h3 className={`font-semibold ${isClaimedByCurrentUser ? 'text-green-900' : 'text-yellow-900'}`}>
              {isClaimedByCurrentUser
                ? 'Claimed By You'
                : isClaimedByOtherUser
                  ? 'Claimed By Another Reviewer'
                  : 'Not Claimed Yet'}
            </h3>
          </div>
          {isClaimed ? (
            <p className={`text-sm ${isClaimedByCurrentUser ? 'text-green-800' : 'text-amber-800'}`}>
              This request is being reviewed by <strong>{claimInfo.claimed_by_name || claimInfo.claimed_by}</strong>
              {claimInfo.claimed_at ? ` since ${new Date(claimInfo.claimed_at).toLocaleString()}` : ''}.
            </p>
          ) : (
            <p className="text-sm text-yellow-800">
              Claim this request first. Approve and reject actions are only enabled for the admin who claimed it.
            </p>
          )}
          {claimSuccessMessage && (
            <p className="text-sm text-green-700 mt-2">{claimSuccessMessage}</p>
          )}
          {claimedError && (
            <p className="text-sm text-red-600 mt-2">{claimedError}</p>
          )}
        </div>

        {/* Request Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Request ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{request.request_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Type</p>
                  <p className="text-sm font-medium text-gray-900">User Creation</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date Submitted</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full border ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requester Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-900">{request.created_by}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-900">{request.email_add}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 font-medium">First Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.first_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Middle Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.middle_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Last Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Suffix</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.suffix || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.email_add}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Position</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.user_pos}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 font-medium">Organization</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{request.org_name} ({request.org_code})</p>
            </div>
          </div>
        </div>

        {/* User ID Assignment (only for approve action) */}
        {action === 'approve' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-gray-900">Assign User ID</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={assignedUserId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  placeholder={idFormat ? getFormatHint(idFormat, selectedRole === 'admin' ? 'Admin' : 'User') : 'Enter the new User ID for this user'}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    assignedUserIdError
                      ? 'border-red-500 focus:ring-red-500'
                      : userIdFormatValid === true && userIdAvailable === true ? 'border-green-500 focus:ring-green-500'
                      : userIdFormatValid === true && userIdAvailable === false ? 'border-red-500 focus:ring-red-500'
                      : userIdFormatValid === false ? 'border-red-500 focus:ring-red-500'
                      : checkingAvailability ? 'border-blue-400 focus:ring-blue-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {assignedUserIdError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{assignedUserIdError}</p>
              )}
              {!assignedUserIdError && assignedUserId && userIdFormatValid === true && checkingAvailability && (
                <p className="mt-2 text-sm text-blue-600">Checking availability...</p>
              )}
              {!assignedUserIdError && assignedUserId && userIdFormatValid === true && userIdAvailable === true && (
                <p className="mt-2 text-sm text-green-600 font-medium">User ID is available</p>
              )}
              <p className="mt-2 text-xs text-gray-700">
                <strong>Format:</strong> {idFormat ? getFormatHint(idFormat, selectedRole === 'admin' ? 'Admin' : 'User') : 'Not configured'}
              </p>
              <p className="mt-1 text-xs text-gray-700">
                <strong>Temporary Password:</strong> {tempPassword} (capitalized surname with spaces removed + 123!)
              </p>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Privilege *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedRoleError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  selectedRoleError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
              >
                <option value="user">Standard Access</option>
                <option value="admin">Management Access</option>
              </select>
              {selectedRoleError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{selectedRoleError}</p>
              )}
              <p className="mt-2 text-xs text-gray-700">
                <strong>Selected Privilege:</strong> {selectedRole === 'admin' ? 'Management Access' : 'Standard Access'}
              </p>
            </div>
          </div>
        )}

        {/* Rejection Reason Section (only for reject action) */}
        {action === 'reject' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-red-900">Rejection Reason</h3>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setRejectionReasonError('');
              }}
              placeholder="Enter the reason for rejecting this request..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                rejectionReasonError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-red-300 focus:ring-red-500'
              }`}
              rows={4}
              disabled={isLoading}
            />
            {rejectionReasonError && (
              <p className="mt-2 text-sm text-red-600 font-medium">{rejectionReasonError}</p>
            )}
            <p className="mt-2 text-xs text-red-700">The requester will receive a notification about the rejection with this reason.</p>
          </div>
        )}

        {/* Approval Confirmation Section (only for approve action) */}
        {action === 'approve' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Approve This Request?</h3>
                <p className="text-sm text-blue-800">
                  A new user account will be created for {request.first_name} {request.last_name} with the email {request.email_add}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || externalIsLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {action === 'claim' && !isClaimed && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isLoading || externalIsLoading}
              className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? 'Claiming...' : 'Claim Request'}
            </button>
          )}

          {action === 'claim' && isClaimedByCurrentUser && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Claimed
            </button>
          )}

          {action === 'reject' && (
            <button
              type="button"
              onClick={handleReject}
              disabled={isLoading || externalIsLoading || !isClaimedByCurrentUser || !rejectionReason.trim()}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading || externalIsLoading ? 'Rejecting...' : 'Reject Request'}
            </button>
          )}

          {action === 'approve' && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isLoading || externalIsLoading || !isClaimedByCurrentUser || userIdAvailable !== true || checkingAvailability || !assignedUserId.trim() || !selectedRole}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading || externalIsLoading ? 'Approving...' : 'Approve Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
