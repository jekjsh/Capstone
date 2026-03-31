import { X, Building2 } from 'lucide-react';

export default function OrgUnitModal({
  show,
  onClose,
  selectedOrgUnit,
  parentOrgUnit,
  organizationTree,
  orgUnitData,
  setOrgUnitData,
  errors,
  onSave
}) {
  if (!show) return null;

  const getParentName = (parentId) => {
    const findParent = (nodes) => {
      for (const node of nodes) {
        if (node.id === parentId) return node.name;
        if (node.children) {
          const found = findParent(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findParent(organizationTree);
  };

  const isEditing = selectedOrgUnit !== null;
  const parentName = parentOrgUnit ? getParentName(parentOrgUnit) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? 'Edit Organization Unit' : 'Create Organization Unit'}
              </h2>
              {parentName && (
                <p className="text-sm text-gray-500">Under: {parentName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                value={orgUnitData.name}
                onChange={(e) => setOrgUnitData({ ...orgUnitData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="e.g., Office of the President"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Type *
              </label>
              <select
                value={orgUnitData.type}
                onChange={(e) => setOrgUnitData({ ...orgUnitData, type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                }`}
              >
                <option value="">Select Type</option>
                <option value="Office">Office</option>
                <option value="Department">Department</option>
                <option value="College">College</option>
                <option value="Division">Division</option>
                <option value="Section">Section</option>
                <option value="Unit">Unit</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Head Position (Optional)
            </label>
            <input
              type="text"
              value={orgUnitData.headPosition}
              onChange={(e) => setOrgUnitData({ ...orgUnitData, headPosition: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., President, Dean, Department Head"
            />
            <p className="mt-1 text-xs text-gray-500">
              Title of the person who heads this unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Code (Optional)
            </label>
            <input
              type="text"
              value={orgUnitData.code}
              onChange={(e) => setOrgUnitData({ ...orgUnitData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., PRES, VPAA, COCS"
            />
            <p className="mt-1 text-xs text-gray-500">
              Short code or abbreviation for this unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={orgUnitData.description}
              onChange={(e) => setOrgUnitData({ ...orgUnitData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Brief description of this organizational unit"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            {isEditing ? 'Update Unit' : 'Create Unit'}
          </button>
        </div>
      </div>
    </div>
  );
}