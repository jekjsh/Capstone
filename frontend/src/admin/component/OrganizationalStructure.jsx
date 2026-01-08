import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Building2, Users, Folder } from 'lucide-react';
import { useState } from 'react';

export default function OrganizationalStructure({
  organizationTree,
  setOrganizationTree,
  userList,
  setShowOrgUnitModal,
  setSelectedOrgUnit,
  setParentOrgUnit,
  onDeleteOrgUnit
}) {
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const getUsersInUnit = (unitId) => {
    return userList.filter(user => user.organizationUnitId === unitId);
  };

  const renderOrgNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const usersCount = getUsersInUnit(node.id).length;

    return (
      <div key={node.id} className="mb-2">
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
            level === 0 ? 'bg-blue-50 border-blue-300' :
            level === 1 ? 'bg-green-50 border-green-300' :
            level === 2 ? 'bg-purple-50 border-purple-300' :
            'bg-gray-50 border-gray-300'
          }`}
          style={{ marginLeft: `${level * 32}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            level === 0 ? 'bg-blue-200' :
            level === 1 ? 'bg-green-200' :
            level === 2 ? 'bg-purple-200' :
            'bg-gray-200'
          }`}>
            <Building2 className={`w-5 h-5 ${
              level === 0 ? 'text-blue-700' :
              level === 1 ? 'text-green-700' :
              level === 2 ? 'text-purple-700' :
              'text-gray-700'
            }`} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{node.name}</h3>
            <p className="text-xs text-gray-500">{node.type} • {usersCount} user(s)</p>
            {node.headPosition && (
              <p className="text-xs text-gray-600 mt-1">Head: {node.headPosition}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setParentOrgUnit(node.id);
                setSelectedOrgUnit(null);
                setShowOrgUnitModal(true);
              }}
              className="p-2 hover:bg-white rounded-full transition-colors"
              title="Add child unit"
            >
              <Plus className="w-4 h-4 text-green-600" />
            </button>
            <button
              onClick={() => {
                setSelectedOrgUnit(node);
                setParentOrgUnit(null);
                setShowOrgUnitModal(true);
              }}
              className="p-2 hover:bg-white rounded-full transition-colors"
              title="Edit unit"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => onDeleteOrgUnit(node.id)}
              className="p-2 hover:bg-white rounded-full transition-colors"
              title="Delete unit"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderOrgNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organizational Structure</h2>
          <p className="text-sm text-gray-600 mt-1">Define and manage your organization's hierarchy</p>
        </div>
        <button
          onClick={() => {
            setSelectedOrgUnit(null);
            setParentOrgUnit(null);
            setShowOrgUnitModal(true);
          }}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Root Organization
        </button>
      </div>

      {organizationTree.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No organizational structure defined</p>
          <p className="text-gray-400 text-sm mb-4">
            Start by creating a root organization (e.g., Office of the President)
          </p>
          <button
            onClick={() => {
              setSelectedOrgUnit(null);
              setParentOrgUnit(null);
              setShowOrgUnitModal(true);
            }}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Root Organization
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {organizationTree.map(node => renderOrgNode(node))}
        </div>
      )}

     <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Tip:</strong> Create a hierarchical structure that matches your organization. 
            Start with top-level units (e.g., President's Office), then add sub-units (e.g., VP Offices, Colleges, Departments). 
            Users can then be assigned to specific positions within these units.
          </p>
        </div>
      </div>
    </div>
  );
}
