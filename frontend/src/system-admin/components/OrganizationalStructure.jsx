import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Building2, Loader, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const ORGANIZATION_TYPE_OPTIONS = [
  'Board',
  'Administrator',
  'Office',
  'Department',
  'Division'
];

const ORGANIZATION_TYPE_COLORS = {
  board: { bg: 'bg-[#FEF08A]', border: 'border-[#FDE047]', icon: 'bg-[#FDE68A]', text: 'text-[#854D0E]' },
  administrator: { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', icon: 'bg-[#A7F3D0]', text: 'text-[#065F46]' },
  office: { bg: 'bg-[#E0F2FE]', border: 'border-[#7DD3FC]', icon: 'bg-[#BAE6FD]', text: 'text-[#075985]' },
  department: { bg: 'bg-[#FFE4E6]', border: 'border-[#FDA4AF]', icon: 'bg-[#FECDD3]', text: 'text-[#9F1239]' },
  division: { bg: 'bg-[#EDE9FE]', border: 'border-[#C4B5FD]', icon: 'bg-[#DDD6FE]', text: 'text-[#5B21B6]' }
};

const DEFAULT_ORG_TYPE_COLOR = { bg: 'bg-gray-50', border: 'border-gray-300', icon: 'bg-gray-200', text: 'text-gray-700' };

export default function OrganizationalStructure() {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [organizationTree, setOrganizationTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [parentOrgId, setParentOrgId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  const getOrgTypeColor = (orgType) => {
    const normalized = (orgType || '').trim().toLowerCase();

    if (normalized === 'board') return ORGANIZATION_TYPE_COLORS.board;
    if (normalized === 'administrator') return ORGANIZATION_TYPE_COLORS.administrator;
    if (normalized.includes('office') || normalized.includes('deput')) return ORGANIZATION_TYPE_COLORS.office;
    if (normalized === 'department') return ORGANIZATION_TYPE_COLORS.department;
    if (normalized === 'division') return ORGANIZATION_TYPE_COLORS.division;

    return DEFAULT_ORG_TYPE_COLOR;
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // =====================
  // JSX / SKELETON
  // =====================

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Organizational Structure</h2>
            <p className="text-sm text-gray-600 mt-1">Define and manage your organization's hierarchy</p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Root Organization
          </button>
        </div>

        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading organizational structure...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error loading organizations</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && organizationTree.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No organizational structure defined</p>
            <button
              onClick={() => openAddModal()}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Root Organization
            </button>
          </div>
        )}

        {!isLoading && !error && organizationTree.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {organizationTree.map(node => renderOrgNode(node))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedOrg ? 'Edit Organization' : 'Create Organization'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Organization name"
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="e.g., PRES"
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">Select Type</option>
                  {ORGANIZATION_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.type && <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrganization}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (selectedOrg ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // =====================
  // FUNCTIONS & HANDLERS
  // =====================

  async function fetchOrganizations() {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/organizations/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const organizations = await response.json();
      const tree = buildOrganizationTree(organizations);
      setOrganizationTree(tree);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function buildOrganizationTree(organizations) {
    const orgMap = {};
    const rootOrgs = [];

    organizations.forEach(org => {
      orgMap[org.org_id] = {
        id: org.org_id,
        name: org.org_name,
        code: org.org_code,
        type: org.org_type,
        description: org.org_desc || '',
        parentOrgId: org.parent_org,
        children: []
      };
    });

    organizations.forEach(org => {
      if (org.parent_org === null) {
        rootOrgs.push(orgMap[org.org_id]);
      } else {
        const parent = orgMap[org.parent_org];
        if (parent) parent.children.push(orgMap[org.org_id]);
      }
    });

    return rootOrgs;
  }

  async function handleAddOrganization(orgData, parentId = null) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/organizations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          org_name: orgData.name,
          org_code: orgData.code,
          org_type: orgData.type,
          org_desc: orgData.description || '',
          parent_org: parentId
        })
      });

      if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      await fetchOrganizations();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleEditOrganization(orgData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/organizations/${orgData.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          org_name: orgData.name,
          org_code: orgData.code,
          org_type: orgData.type,
          org_desc: orgData.description || '',
          parent_org: orgData.parentOrgId || null
        })
      });

      if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      await fetchOrganizations();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleDeleteOrganization(orgId) {
    if (!window.confirm('Delete this organization?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/organizations/${orgId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      await fetchOrganizations();
    } catch (err) {
      setError(err.message);
    }
  }

  function validateForm() {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name required';
    if (!formData.code.trim()) errors.code = 'Code required';
    if (!formData.type) errors.type = 'Type required';
    return errors;
  }

  async function handleSaveOrganization() {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = selectedOrg
        ? await handleEditOrganization({
            id: selectedOrg.id,
            name: formData.name,
            code: formData.code,
            type: formData.type,
            description: formData.description,
            parentOrgId: selectedOrg.parentOrgId
          })
        : await handleAddOrganization(formData, parentOrgId);

      if (success) closeModal();
    } finally {
      setIsSubmitting(false);
    }
  }

  function openAddModal() {
    setSelectedOrg(null);
    setParentOrgId(null);
    setFormData({ name: '', code: '', type: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  }

  function openAddChildModal(parentId) {
    setSelectedOrg(null);
    setParentOrgId(parentId);
    setFormData({ name: '', code: '', type: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(org) {
    setSelectedOrg(org);
    setParentOrgId(null);
    setFormData({
      name: org.name,
      code: org.code,
      type: org.type,
      description: org.description || ''
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedOrg(null);
    setParentOrgId(null);
    setFormData({ name: '', code: '', type: '', description: '' });
    setFormErrors({});
  }

  function toggleNode(nodeId) {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }

  function renderOrgNode(node, level = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const color = getOrgTypeColor(node.type);
    const hasDescription = !!node.description?.trim();

    return (
      <div key={node.id} className="mb-2">
        <div
          className={`group relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${color.bg} ${color.border} hover:shadow-md`}
          style={{ marginLeft: `${level * 32}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleNode(node.id)} className="p-1 hover:bg-white rounded transition-colors">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
            </button>
          ) : <div className="w-6" />}

          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.icon}`}>
            <Building2 className={`w-5 h-5 ${color.text}`} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{node.name}</h3>
            <p className="text-xs text-gray-500">{node.type} • {node.code}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => openAddChildModal(node.id)} className="p-2 hover:bg-white rounded-full transition-colors" title="Add child">
              <Plus className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => openEditModal(node)} className="p-2 hover:bg-white rounded-full transition-colors" title="Edit">
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => handleDeleteOrganization(node.id)} className="p-2 hover:bg-white rounded-full transition-colors" title="Delete">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>

          {hasDescription && (
            <div className="pointer-events-none absolute left-4 top-full z-30 mt-2 max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {node.description}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderOrgNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }
}
