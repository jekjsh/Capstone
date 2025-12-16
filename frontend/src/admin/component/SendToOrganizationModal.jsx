import { X, Building2, Users, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function SendToOrganizationModal({
  show,
  onClose,
  document,
  organizationTree,
  userList,
  currentUser,
  onSendToOrganization
}) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [distributionMode, setDistributionMode] = useState('all-sub-units');
  const [message, setMessage] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!show || !document) return null;

  const userOrgUnit = currentUser.organizationUnitId;

  const findUserOrgUnitWithPath = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return { unit: node, path: [...path, node] };
      }
      if (node.children) {
        const found = findUserOrgUnitWithPath(node.children, targetId, [...path, node]);
        if (found) return found;
      }
    }
    return null;
  };

  const userOrgUnitResult = findUserOrgUnitWithPath(organizationTree, userOrgUnit);
  const userOrgUnitData = userOrgUnitResult?.unit;
  const userOrgPath = userOrgUnitResult?.path || [];

  const getAllUnitsInTree = (nodes) => {
    let units = [];
    for (const node of nodes) {
      units.push(node);
      if (node.children) {
        units = [...units, ...getAllUnitsInTree(node.children)];
      }
    }
    return units;
  };

  const allAccessibleUnits = getAllUnitsInTree(organizationTree);

  const getUsersInUnit = (unitId, includeSubUnits = true, excludeUnitIds = []) => {
    if (excludeUnitIds.includes(unitId)) {
      return [];
    }
    
    const users = userList.filter(user => user.organizationUnitId === unitId);
    
    if (includeSubUnits) {
      const unit = allAccessibleUnits.find(u => u.id === unitId);
      if (unit && unit.children) {
        const getChildUsers = (nodes) => {
          let childUsers = [];
          for (const node of nodes) {
            if (!excludeUnitIds.includes(node.id)) {
              childUsers = [...childUsers, ...userList.filter(user => user.organizationUnitId === node.id)];
            }
            if (node.children && node.children.length > 0) {
              childUsers = [...childUsers, ...getChildUsers(node.children)];
            }
          }
          return childUsers;
        };
        const childUsers = getChildUsers(unit.children);
        return [...users, ...childUsers];
      }
    }
    
    return users;
  };

  const getDirectChildren = (unitId) => {
    const unit = allAccessibleUnits.find(u => u.id === unitId);
    return unit && unit.children ? unit.children : [];
  };

  const getSubUnits = (node) => {
    if (!node) return [];
    const units = [];
    if (node.children) {
      node.children.forEach(child => {
        units.push(child);
        units.push(...getSubUnits(child));
      });
    }
    return units;
  };

  const subUnits = userOrgUnitData ? getSubUnits(userOrgUnitData) : [];

  const getRecipients = () => {
    if (!userOrgUnitData) return [];

    let recipients = [];

    if (distributionMode === 'all-sub-units') {
      recipients = getUsersInUnit(userOrgUnit, true);
    } else if (distributionMode === 'direct-children') {
      const directChildren = getDirectChildren(userOrgUnit);
      directChildren.forEach(child => {
        recipients = [...recipients, ...getUsersInUnit(child.id, false)];
      });
    } else if (distributionMode === 'specific-units') {
      selectedUnits.forEach(unitId => {
       
        const usersInUnit = getUsersInUnit(unitId, true, []);
        recipients = [...recipients, ...usersInUnit];
      });
      
    
      recipients = recipients.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
    }

    
    return recipients.filter(user => user.user_id !== currentUser.user_id);
  };

  const recipients = getRecipients();

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const toggleUnitSelection = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const renderOrgTree = (nodes, level = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id];
      const isSelected = selectedUnits.includes(node.id);
      const isCurrentUnit = node.id === userOrgUnit;
      const isInPath = userOrgPath.some(pathNode => pathNode.id === node.id);
      const usersCount = getUsersInUnit(node.id, true).length;

      return (
        <div key={node.id}>
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
              isCurrentUnit 
                ? 'bg-yellow-50 border-yellow-400' 
                : isSelected 
                  ? 'bg-indigo-50 border-indigo-300' 
                  : isInPath
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            style={{ marginLeft: `${level * 24}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleUnitSelection(node.id)}
              disabled={isCurrentUnit}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
            />

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCurrentUnit ? 'bg-yellow-200' : 
              isInPath ? 'bg-blue-200' : 
              'bg-gray-200'
            }`}>
              <Building2 className={`w-4 h-4 ${
                isCurrentUnit ? 'text-yellow-700' :
                isInPath ? 'text-blue-700' :
                'text-gray-700'
              }`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 text-sm">{node.name}</h4>
                {isCurrentUnit && (
                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full font-medium">
                    Your Unit
                  </span>
                )}
                {isInPath && !isCurrentUnit && (
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-medium">
                    Parent Unit
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{node.type} • {usersCount} user(s)</p>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-2">
              {renderOrgTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSend = () => {
    if (recipients.length === 0) {
      alert('No recipients selected');
      return;
    }

    const recipientIds = recipients.map(user => user.id);

    onSendToOrganization({
      documentId: document.id,
      recipients: recipientIds,
      distributionMode,
      selectedUnits: distributionMode === 'specific-units' ? selectedUnits : null,
      message,
      sentBy: currentUser.user_id,
      sentFrom: currentUser.organizationUnitId,
      sentAt: new Date().toLocaleString()
    });

    setSelectedUnits([]);
    setDistributionMode('all-sub-units');
    setMessage('');
    setExpandedNodes({});
    onClose();
  };

  if (!userOrgUnitData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Not Assigned to Organization</h3>
            <p className="text-gray-600 mb-4">
              You must be assigned to an organizational unit to use this feature.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Send to Organization</h2>
            <p className="text-sm text-gray-500">{document.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Your Organization Unit:</strong> {userOrgUnitData.name} ({userOrgUnitData.type})
            </p>
            {currentUser.organizationPosition && (
              <p className="text-xs text-yellow-600 mt-1">
                Position: {currentUser.organizationPosition}
              </p>
            )}
            {userOrgPath.length > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Path: {userOrgPath.map(u => u.name).join(' → ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Distribution Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setDistributionMode('all-sub-units')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  distributionMode === 'all-sub-units'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${distributionMode === 'all-sub-units' ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${distributionMode === 'all-sub-units' ? 'text-blue-600' : 'text-gray-700'}`}>
                  All Sub-Units
                </p>
                <p className="text-xs text-gray-500 mt-1">Send downward only</p>
              </button>

              <button
                onClick={() => setDistributionMode('direct-children')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  distributionMode === 'direct-children'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className={`w-6 h-6 mx-auto mb-2 ${distributionMode === 'direct-children' ? 'text-green-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${distributionMode === 'direct-children' ? 'text-green-600' : 'text-gray-700'}`}>
                  Direct Children
                </p>
                <p className="text-xs text-gray-500 mt-1">Immediate sub-units only</p>
              </button>

              <button
                onClick={() => setDistributionMode('specific-units')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  distributionMode === 'specific-units'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Check className={`w-6 h-6 mx-auto mb-2 ${distributionMode === 'specific-units' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${distributionMode === 'specific-units' ? 'text-purple-600' : 'text-gray-700'}`}>
                  Specific Units
                </p>
                <p className="text-xs text-gray-500 mt-1">Any level (up/down/sideways)</p>
              </button>
            </div>
          </div>

          {distributionMode === 'specific-units' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Units ({selectedUnits.length} selected)
              </label>
              
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Legend:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                    <span>Your Current Unit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-200 rounded"></div>
                    <span>Parent Units (Higher Level)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span>Other Units</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto bg-gray-50">
                {organizationTree.length > 0 ? (
                  <div className="space-y-2">
                    {renderOrgTree(organizationTree)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No organizational units available</p>
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-xs text-gray-500">
                ℹ️ Select any organizational units to send the document to. Only you (the sender) will be automatically excluded from recipients.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message for recipients..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-800">
                Recipients: {recipients.length} user(s)
              </p>
            </div>
            {recipients.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {recipients.slice(0, 10).map(user => (
                    <div key={user.id} className="text-xs bg-white px-2 py-1 rounded border border-green-200">
                      {user.name}
                    </div>
                  ))}
                </div>
                {recipients.length > 10 && (
                  <p className="text-xs text-green-700 mt-2">
                    and {recipients.length - 10} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={recipients.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Send to {recipients.length} User{recipients.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}