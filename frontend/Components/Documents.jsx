import { Plus, Upload, ScanText, FileText, Trash2, Folder, Share2, Building2, Tag, FileSpreadsheet, LayoutGrid, List, Grid, Eye, Download, Calendar } from 'lucide-react';
import { useState } from 'react';
import { TagFilter, TagDisplay, getAllTagsFromDocuments } from './TagComponents';
import EditTagsModal from '../components/modals/EditTagsModal';

export default function Documents({
  currentFolder,
  setCurrentFolder,
  folders,
  userDocuments,
  filteredDocuments,
  searchQuery,
  setSearchQuery,
  filterFormat,
  setFilterFormat,
  sortBy,
  setSortBy,
  setShowUploadDocumentModal,
  setShowOCRModal,
  setShowAddDocumentModal,
  onOpenDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPrintDocument,
  onMoveToFolder,
  onShareDocument,
  onSendToOrganization,
  dataStore
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'grid', 'card', 'list', 'details'
  const [showEditTagsModal, setShowEditTagsModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  // Get all unique tags from user documents
  const allTags = getAllTagsFromDocuments(userDocuments);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Handle opening edit tags modal
  const handleEditTags = (doc) => {
    setEditingDocument(doc);
    setShowEditTagsModal(true);
  };

  // Handle saving tags
  const handleSaveTags = (docId, tags) => {
    console.log(`Tags updated for document ${docId}:`, tags);
  };

  // Filter documents by selected tags
  const documentsFilteredByTags = selectedTags.length > 0
    ? filteredDocuments.filter(doc => 
        doc.tags && selectedTags.every(tag => doc.tags.includes(tag))
      )
    : filteredDocuments;

  const finalFilteredDocuments = documentsFilteredByTags;

  const getDocumentIcon = (doc) => {
    if (doc.format === 'excel') {
      return (
        <div className="w-16 h-20 bg-green-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300">
          <FileSpreadsheet className="w-8 h-8 text-green-600 mb-1" />
          <span className="text-xs font-bold text-green-600">EXCEL</span>
        </div>
      );
    }
    
    if (doc.format === 'pdf') {
      return (
        <div className="w-16 h-20 bg-red-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-red-200 transition-colors cursor-pointer border-2 border-red-300">
          <FileText className="w-8 h-8 text-red-600 mb-1" />
          <span className="text-xs font-bold text-red-600">PDF</span>
        </div>
      );
    }
    
    if (doc.format === 'ocr') {
      return (
        <div className="w-16 h-20 bg-green-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-green-200 transition-colors cursor-pointer border-2 border-green-300">
          <ScanText className="w-8 h-8 text-green-600 mb-1" />
          <span className="text-xs font-bold text-green-600">OCR</span>
        </div>
      );
    }
    
    if (doc.format === 'docx') {
      return (
        <div className="w-16 h-20 bg-blue-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-blue-200 transition-colors cursor-pointer border-2 border-blue-300">
          <FileText className="w-8 h-8 text-blue-600 mb-1" />
          <span className="text-xs font-bold text-blue-600">DOCX</span>
        </div>
      );
    }
    
    return (
      <div className="w-16 h-20 bg-gray-100 rounded-lg flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors cursor-pointer border-2 border-gray-300">
        <FileText className="w-8 h-8 text-gray-600 mb-1" />
        <span className="text-xs font-bold text-gray-600">DOC</span>
      </div>
    );
  };

  const getLargeDocumentIcon = (doc) => {
    if (doc.format === 'excel') {
      return (
        <div className="w-24 h-28 bg-green-50 rounded-xl flex flex-col items-center justify-center group-hover:bg-green-100 transition-all cursor-pointer border-4 border-green-200 shadow-md">
          <FileSpreadsheet className="w-12 h-12 text-green-600 mb-2" />
          <span className="text-sm font-bold text-green-700">EXCEL</span>
        </div>
      );
    }
    
    if (doc.format === 'pdf') {
      return (
        <div className="w-24 h-28 bg-red-50 rounded-xl flex flex-col items-center justify-center group-hover:bg-red-100 transition-all cursor-pointer border-4 border-red-200 shadow-md">
          <FileText className="w-12 h-12 text-red-600 mb-2" />
          <span className="text-sm font-bold text-red-700">PDF</span>
        </div>
      );
    }
    
    if (doc.format === 'ocr') {
      return (
        <div className="w-24 h-28 bg-green-50 rounded-xl flex flex-col items-center justify-center group-hover:bg-green-100 transition-all cursor-pointer border-4 border-green-200 shadow-md">
          <ScanText className="w-12 h-12 text-green-600 mb-2" />
          <span className="text-sm font-bold text-green-700">OCR</span>
        </div>
      );
    }
    
    if (doc.format === 'docx') {
      return (
        <div className="w-24 h-28 bg-blue-50 rounded-xl flex flex-col items-center justify-center group-hover:bg-blue-100 transition-all cursor-pointer border-4 border-blue-200 shadow-md">
          <FileText className="w-12 h-12 text-blue-600 mb-2" />
          <span className="text-sm font-bold text-blue-700">DOCX</span>
        </div>
      );
    }
    
    return (
      <div className="w-24 h-28 bg-gray-50 rounded-xl flex flex-col items-center justify-center group-hover:bg-gray-100 transition-all cursor-pointer border-4 border-gray-200 shadow-md">
        <FileText className="w-12 h-12 text-gray-600 mb-2" />
        <span className="text-sm font-bold text-gray-700">DOC</span>
      </div>
    );
  };

  const getFormatBadge = (format) => {
    const colors = {
      pdf: 'bg-red-100 text-red-700',
      excel: 'bg-green-100 text-green-700',
      ocr: 'bg-green-100 text-green-700',
      docx: 'bg-blue-100 text-blue-700'
    };
    return colors[format] || 'bg-gray-100 text-gray-700';
  };

  // GRID VIEW - Large Icons like Windows Explorer
  const GridView = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {finalFilteredDocuments.map((doc) => (
          <div key={doc.id} className="group relative">
            {/* Document Icon */}
            <div 
              onClick={() => onOpenDocument(doc)}
              className="flex flex-col items-center cursor-pointer"
            >
              {getLargeDocumentIcon(doc)}
              
              {/* Document Title */}
              <div className="mt-2 w-full text-center">
                <p className="text-sm font-medium text-gray-800 break-words line-clamp-2 px-1">
                  {doc.title}
                </p>
              </div>

              {/* Tags Indicator */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span className="text-xs text-indigo-600">{doc.tags.length}</span>
                </div>
              )}
            </div>

            {/* Hover Actions Menu */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex flex-wrap gap-1 z-10 max-w-[140px]">
              <button 
                onClick={(e) => { e.stopPropagation(); onSendToOrganization(doc); }}
                className="p-1.5 hover:bg-blue-50 rounded transition-colors" 
                title="Send to Organization"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onShareDocument(doc); }}
                className="p-1.5 hover:bg-purple-50 rounded transition-colors" 
                title="Share"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveToFolder(doc.id); }}
                className="p-1.5 hover:bg-yellow-50 rounded transition-colors" 
                title="Move to Folder"
              >
                <Folder className="w-3.5 h-3.5 text-yellow-600" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDownloadDocument(doc); }}
                className="p-1.5 hover:bg-green-50 rounded transition-colors" 
                title="Download"
              >
                <Download className="w-3.5 h-3.5 text-green-600" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                className="p-1.5 hover:bg-red-50 rounded transition-colors" 
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // CARD VIEW (Default View with full details)
  const CardView = () => (
    <div className="grid grid-cols-1 gap-4">
      {finalFilteredDocuments.map((doc) => (
        <div key={doc.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4 flex-1">
              <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0 group">
                {getDocumentIcon(doc)}
              </button>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{doc.title}</h3>
                {doc.description && <p className="text-gray-600 mb-3">{doc.description}</p>}
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mb-3">
                    <TagDisplay tags={doc.tags} maxDisplay={5} />
                  </div>
                )}
                
                <p className="text-sm text-gray-500">Created: {doc.createdAt}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEditTags(doc)} className="text-indigo-600 hover:text-indigo-900 p-2" title="Edit tags">
                <Tag className="w-5 h-5" />
              </button>
              <button onClick={() => onSendToOrganization(doc)} className="text-blue-600 hover:text-blue-900 p-2" title="Send to organization">
                <Building2 className="w-5 h-5" />
              </button>
              <button onClick={() => onShareDocument(doc)} className="text-purple-600 hover:text-purple-900 p-2" title="Share document">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => onMoveToFolder(doc.id)} className="text-blue-600 hover:text-blue-900 p-2" title="Move to folder">
                <Folder className="w-5 h-5" />
              </button>
              <button onClick={() => onDownloadDocument(doc)} className="text-green-600 hover:text-green-900 p-2" title="Download document">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => onDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900 p-2" title="Delete document">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {doc.personalInfo && Object.keys(doc.personalInfo).some(key => doc.personalInfo[key]) && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-700 mb-3">Personal Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doc.personalInfo.fullName && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Full Name</p>
                    <p className="text-gray-800">{doc.personalInfo.fullName}</p>
                  </div>
                )}
                {doc.personalInfo.email && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Email</p>
                    <p className="text-gray-800">{doc.personalInfo.email}</p>
                  </div>
                )}
                {doc.personalInfo.phone && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Phone</p>
                    <p className="text-gray-800">{doc.personalInfo.phone}</p>
                  </div>
                )}
                {doc.personalInfo.address && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Address</p>
                    <p className="text-gray-800">{doc.personalInfo.address}</p>
                  </div>
                )}
                {doc.personalInfo.dateOfBirth && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Date of Birth</p>
                    <p className="text-gray-800">{doc.personalInfo.dateOfBirth}</p>
                  </div>
                )}
                {doc.personalInfo.idNumber && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">ID Number</p>
                    <p className="text-gray-800">{doc.personalInfo.idNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {doc.customFieldValues && Object.keys(doc.customFieldValues).length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-700 mb-3">Additional Information:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(doc.customFieldValues).map(([key, value]) => (
                  <span key={key} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    <strong className="text-gray-900">{key}:</strong> {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // LIST VIEW - Compact horizontal layout
  const ListView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="divide-y divide-gray-200">
        {finalFilteredDocuments.map((doc) => (
          <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              {/* Document Icon */}
              <button onClick={() => onOpenDocument(doc)} className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  doc.format === 'pdf' ? 'bg-red-100' :
                  doc.format === 'excel' ? 'bg-green-100' :
                  doc.format === 'ocr' ? 'bg-green-100' :
                  doc.format === 'docx' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {doc.format === 'excel' ? (
                    <FileSpreadsheet className={`w-6 h-6 ${
                      doc.format === 'pdf' ? 'text-red-600' :
                      doc.format === 'excel' ? 'text-green-600' :
                      doc.format === 'ocr' ? 'text-green-600' :
                      doc.format === 'docx' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                  ) : doc.format === 'ocr' ? (
                    <ScanText className="w-6 h-6 text-green-600" />
                  ) : (
                    <FileText className={`w-6 h-6 ${
                      doc.format === 'pdf' ? 'text-red-600' :
                      doc.format === 'docx' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                  )}
                </div>
              </button>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{doc.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getFormatBadge(doc.format)}`}>
                    {doc.format?.toUpperCase() || 'DOC'}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 truncate mb-1">{doc.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {doc.createdAt}
                  </span>
                  {doc.tags && doc.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {doc.tags.length} tag{doc.tags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onSendToOrganization(doc)} 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                  title="Send to Organization"
                >
                  <Building2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onShareDocument(doc)} 
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors" 
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onMoveToFolder(doc.id)} 
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" 
                  title="Move to Folder"
                >
                  <Folder className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onOpenDocument(doc)} 
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDownloadDocument(doc)} 
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors" 
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteDocument(doc.id)} 
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // DETAILS VIEW - Full table with all information
  const DetailsView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finalFilteredDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onOpenDocument(doc)}>
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${
                        doc.format === 'pdf' ? 'bg-red-100' :
                        doc.format === 'excel' ? 'bg-green-100' :
                        doc.format === 'ocr' ? 'bg-green-100' :
                        doc.format === 'docx' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {doc.format === 'excel' ? (
                          <FileSpreadsheet className={`w-5 h-5 ${
                            doc.format === 'pdf' ? 'text-red-600' :
                            doc.format === 'excel' ? 'text-green-600' :
                            doc.format === 'ocr' ? 'text-green-600' :
                            doc.format === 'docx' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        ) : doc.format === 'ocr' ? (
                          <ScanText className="w-5 h-5 text-green-600" />
                        ) : (
                          <FileText className={`w-5 h-5 ${
                            doc.format === 'pdf' ? 'text-red-600' :
                            doc.format === 'docx' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        )}
                      </div>
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getFormatBadge(doc.format)}`}>
                    {doc.format?.toUpperCase() || 'DOC'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.createdAt}
                </td>
                <td className="px-6 py-4">
                  {doc.tags && doc.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{doc.tags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => onSendToOrganization(doc)} 
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
                      title="Send to Organization"
                    >
                      <Building2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onShareDocument(doc)} 
                      className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors" 
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onMoveToFolder(doc.id)} 
                      className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors" 
                      title="Move to Folder"
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onOpenDocument(doc)} 
                      className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors" 
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDownloadDocument(doc)} 
                      className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" 
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteDocument(doc.id)} 
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'My Documents'}
          </h2>
          {currentFolder && (
            <button onClick={() => setCurrentFolder(null)} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1">
              ← Back to all documents
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowUploadDocumentModal(true)} className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
          <button onClick={() => setShowOCRModal(true)} className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md">
            <ScanText className="w-5 h-5" />
            Use OCR
          </button>
        </div>
      </div>

      {/* Filters and View Mode Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Documents</label>
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title, description, name..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Format</label>
            <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Formats</option>
              <option value="pdf">PDF Only</option>
              <option value="docx">DOCX Only</option>
              <option value="excel">Excel Only</option>
              <option value="ocr">OCR Only</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>

          {/* View Mode Selector - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="grid">🔲 Large Icons</option>
              <option value="card">📋 Card View</option>
              <option value="list">📄 List View</option>
              <option value="details">📊 Details View</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {finalFilteredDocuments.length} of {userDocuments.length} document{userDocuments.length !== 1 ? 's' : ''}
            {selectedTags.length > 0 && ` (filtered by ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''})`}
          </span>
          {(searchQuery || filterFormat !== 'all' || sortBy !== 'date-desc' || selectedTags.length > 0) && (
            <button onClick={() => { setSearchQuery(''); setFilterFormat('all'); setSortBy('date-desc'); setSelectedTags([]); }} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <TagFilter allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearTags={handleClearTags} />
      )}

      {/* Document Views */}
      {userDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents created yet</p>
          <p className="text-gray-400 text-sm mb-4">Upload a document or use OCR to get started</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowUploadDocumentModal(true)} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
            <button onClick={() => setShowOCRModal(true)} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2">
              <ScanText className="w-4 h-4" />
              Use OCR
            </button>
          </div>
        </div>
      ) : finalFilteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents match your filters</p>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filter criteria</p>
          <button onClick={() => { setSearchQuery(''); setFilterFormat('all'); setSortBy('date-desc'); setSelectedTags([]); }} className="text-indigo-600 hover:text-indigo-800 font-medium">
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && <GridView />}
          {viewMode === 'card' && <CardView />}
          {viewMode === 'list' && <ListView />}
          {viewMode === 'details' && <DetailsView />}
        </>
      )}

      {/* Edit Tags Modal */}
      <EditTagsModal
        show={showEditTagsModal}
        onClose={() => {
          setShowEditTagsModal(false);
          setEditingDocument(null);
        }}
        document={editingDocument}
        dataStore={dataStore}
        onSave={handleSaveTags}
      />
    </div>
  );
}