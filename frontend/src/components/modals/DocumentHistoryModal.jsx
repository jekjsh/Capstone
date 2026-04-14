import { X, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';

function formatTimestamp(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function DocumentHistoryModal({ show, onClose, data, isLoading }) {
  if (!show) return null;

  const [filter, setFilter] = useState('all');

  const document = data?.document;
  const events = Array.isArray(data?.events) ? data.events : [];

  const getEventCategory = (type) => {
    if (!type) return 'other';
    if (type.includes('shared')) return 'sharing';
    if (type.includes('archive')) return 'archive';
    if (type.includes('uploaded') || type.includes('created')) return 'ownership';
    if (type.includes('audit')) return 'audit';
    return 'other';
  };

  const getEventLabel = (type) => {
    const map = {
      document_uploaded: 'Document Uploaded',
      document_archived: 'Document Archived',
      document_shared_user: 'Shared To User',
      folder_shared_org: 'Folder Shared To Organization',
      folder_created: 'Folder Created',
      folder_archived: 'Folder Archived',
      folder_shared: 'Folder Shared',
      audit_log: 'Audit Entry',
    };
    return map[type] || String(type || 'event').replaceAll('_', ' ').replace(/\b\w/g, (s) => s.toUpperCase());
  };

  const getCategoryBadgeClass = (category) => {
    const classes = {
      ownership: 'bg-blue-100 text-blue-700 border-blue-300',
      sharing: 'bg-purple-100 text-purple-700 border-purple-300',
      archive: 'bg-amber-100 text-amber-700 border-amber-300',
      audit: 'bg-gray-100 text-gray-700 border-gray-300',
      other: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return classes[category] || classes.other;
  };

  const buildDetailLines = (event) => {
    const details = event?.details || {};
    const lines = [];

    if (details.doc_name) lines.push(`Document: ${details.doc_name}`);
    if (details.folder_name) lines.push(`Folder: ${details.folder_name}`);
    if (details.owning_org) lines.push(`Owning Org: ${details.owning_org}`);
    if (details.shared_to_user) lines.push(`Shared To User: ${details.shared_to_user}`);
    if (details.shared_with_org) lines.push(`Shared To Org: ${details.shared_with_org}`);
    if (details.action) lines.push(`Action: ${details.action}`);
    if (details.status) lines.push(`Status: ${details.status}`);
    if (details.description) lines.push(`Description: ${details.description}`);
    if (details.message) lines.push(`Message: ${details.message}`);

    if (lines.length === 0) {
      return ['No additional details'];
    }

    return lines;
  };

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((event) => getEventCategory(event.type) === filter);
  }, [events, filter]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ownership & History</h2>
            <p className="text-sm text-gray-500">{document?.doc_name || 'Document history'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">Loading history...</div>
          ) : (
            <>
              {document && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Owning Organization</p>
                    <p className="font-medium text-gray-800">{document.owning_org_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Uploaded By</p>
                    <p className="font-medium text-gray-800">{document.uploaded_by_user_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Folder</p>
                    <p className="font-medium text-gray-800">{document.folder_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Archived</p>
                    <p className="font-medium text-gray-800">{document.is_archived ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'ownership', 'sharing', 'archive', 'audit'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        filter === item
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-sm text-gray-500">No events found.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {['ownership', 'sharing', 'archive', 'audit'].map((category) => (
                        <span
                          key={`legend-${category}`}
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border ${getCategoryBadgeClass(category)}`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    {filteredEvents.map((event, idx) => (
                      (() => {
                        const category = getEventCategory(event.type);
                        return (
                      <div key={`${event.type}-${idx}`} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Clock3 className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-medium text-gray-800">{getEventLabel(event.type)}</p>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border ${getCategoryBadgeClass(category)}`}>
                              {category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Actor: {event.actor || '-'}</p>
                        <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded p-2 text-gray-700 space-y-1">
                          {buildDetailLines(event).map((line, lineIdx) => (
                            <p key={`${event.type}-line-${lineIdx}`}>{line}</p>
                          ))}
                        </div>
                      </div>
                        );
                      })()
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
