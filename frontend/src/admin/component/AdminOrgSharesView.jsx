
import { Building2, Users, FileText, Clock, User, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function AdminOrgSharesView({ dataStore, organizationTree }) {
  const [searchQuery, setSearchQuery] = useState('');
  const allOrgShares = dataStore.getAllOrgShares();

  const getOrgUnitName = (unitId) => {
    const findUnit = (nodes) => {
      for (const node of nodes) {
        if (node.id === unitId) return node.name;
        if (node.children) {
          const found = findUnit(node.children);
          if (found) return found;
        }
      }
      return 'Unknown Unit';
    };
    return organizationTree.length > 0 ? findUnit(organizationTree) : 'Unknown Unit';
  };

  const getDistributionModeLabel = (mode) => {
    const modes = {
      'all-sub-units': 'All Sub-Units',
      'direct-children': 'Direct Children Only',
      'specific-units': 'Specific Units'
    };
    return modes[mode] || mode;
  };

  const filteredShares = allOrgShares.filter(share => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return share.document?.title.toLowerCase().includes(query) ||
           share.sentBy.toLowerCase().includes(query) ||
           getOrgUnitName(share.sentFrom).toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organization-Wide Document Distributions</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor all documents shared through organizational hierarchy</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
          <span className="font-semibold">{filteredShares.length}</span> distribution{filteredShares.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by document title, sender, or organization unit..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear Search
          </button>
        )}
      </div>
      
      {filteredShares.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {allOrgShares.length === 0 ? 'No organization-wide shares yet' : 'No shares match your search'}
          </p>
          <p className="text-gray-400 text-sm">
            {allOrgShares.length === 0 
              ? 'When users send documents through the organizational hierarchy, they will appear here'
              : 'Try adjusting your search criteria'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredShares.map(share => (
            <div key={share.id} className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{share.document?.title || 'Untitled Document'}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Organization
                    </span>
                  </div>
                  {share.document?.description && (
                    <p className="text-sm text-gray-600 mb-3">{share.document.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <User className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-medium">Sent By</p>
                      <p className="text-sm font-semibold text-gray-800">{share.sentBy}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium">From Organization Unit</p>
                      <p className="text-sm font-semibold text-gray-800">{getOrgUnitName(share.sentFrom)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                    <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 font-medium">Distribution Mode</p>
                      <p className="text-sm font-semibold text-gray-800">{getDistributionModeLabel(share.distributionMode)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <Users className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-green-600 font-medium">Total Recipients</p>
                      <p className="text-sm font-semibold text-gray-800">{share.recipients.length} user{share.recipients.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Clock className="w-3 h-3" />
                <span>Sent at: {share.sentAt}</span>
              </div>

              {share.message && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Message:</p>
                  <p className="text-sm text-gray-700 italic">"{share.message}"</p>
                </div>
              )}

              {share.selectedUnits && share.selectedUnits.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Specific Units Selected ({share.selectedUnits.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {share.selectedUnits.slice(0, 5).map(unitId => (
                      <span key={unitId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {getOrgUnitName(unitId)}
                      </span>
                    ))}
                    {share.selectedUnits.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{share.selectedUnits.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

       <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Admin View:</strong> This page displays all documents that have been distributed through the organizational hierarchy. 
          You can track who sent what, to which organizational units, and how many users received each distribution.
          </p>
        </div>
      </div>
    </div>
  );
}