import { FileText, Search, Download, Filter, ArrowUpDown, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { documentAPI, folderShareAPI, organizationAPI, categoryAPI } from '../../services/api';
import Pagination from '../../components/Pagination';

function MultiSelectChecklist({ label, options = [], selectedValues = [], onToggle }) {
  const selectedCount = selectedValues.length;
  const summaryText = selectedCount === 0 ? label : `${selectedCount} selected`;

  return (
    <details className="relative w-full">
      <summary className="list-none w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer select-none text-base text-gray-900 flex items-center justify-between">
        <span className="truncate">{summaryText}</span>
        <span className="text-xs text-gray-500">▼</span>
      </summary>
      <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg p-2 space-y-1">
        {options.length === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-1">No options available</p>
        ) : (
          options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="w-4 h-4"
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
    </details>
  );
}

export default function GenerateReportsView({
  documents = [],
  dataStore,
  userList = [],
  loggedInUser = null,
  onViewDocument,
  onDownloadDocument
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allDocuments, setAllDocuments] = useState([]);
  const [folderShares, setFolderShares] = useState([]);
  const [organizationUnits, setOrganizationUnits] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reportMode, setReportMode] = useState('document-uploads');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedUploaders, setSelectedUploaders] = useState([]);
  const [selectedSharedFolders, setSelectedSharedFolders] = useState([]);
  const [selectedUploadStatus, setSelectedUploadStatus] = useState('all');
  const [sortBy, setSortBy] = useState('uploaded-desc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportPreset, setExportPreset] = useState('today');

  useEffect(() => {
    fetchReportData();
  }, []);

  const flattenOrganizations = (nodes = []) => {
    const flattened = [];

    const walk = (items) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        flattened.push(item);
        walk(item.children || item.sub_offices || []);
      });
    };

    walk(nodes);
    return flattened;
  };

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [documentsData, sharesData, organizationsData, categoriesData] = await Promise.all([
        documentAPI.getAll(),
        folderShareAPI.getAll(),
        organizationAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      const normalizedDocuments = Array.isArray(documentsData)
        ? documentsData
        : (Array.isArray(documentsData?.results) ? documentsData.results : []);
      const normalizedShares = Array.isArray(sharesData)
        ? sharesData
        : (Array.isArray(sharesData?.results) ? sharesData.results : []);
      const normalizedOrganizations = Array.isArray(organizationsData)
        ? organizationsData
        : (Array.isArray(organizationsData?.results) ? organizationsData.results : []);
      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData
        : (Array.isArray(categoriesData?.results) ? categoriesData.results : []);

      setAllDocuments(normalizedDocuments);
      setFolderShares(normalizedShares);
      setOrganizationUnits(flattenOrganizations(normalizedOrganizations));
      setAllCategories(normalizedCategories);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Failed to load report data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(documents) && documents.length > 0 && allDocuments.length === 0) {
      setAllDocuments(documents);
    }
  }, [documents, allDocuments.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportMode]);

  const toggleSelection = (value, setSelectedValues) => {
    setSelectedValues((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  };

  const organizationLookup = useMemo(() => {
    const map = new Map();
    organizationUnits.forEach((org) => {
      const orgId = org.org_id || org.id;
      if (!orgId) return;
      map.set(String(orgId), {
        name: org.org_name || org.name || '',
        code: org.org_code || org.code || '',
      });
    });
    return map;
  }, [organizationUnits]);

  const getUserOrgId = (user) => {
    return user?.org || user?.organizationUnitId || user?.organization_unit_id || user?.org_id || null;
  };

  const getUserOrgName = (user) => {
    const orgId = getUserOrgId(user);
    const fromLookup = orgId ? organizationLookup.get(String(orgId)) : null;
    return fromLookup?.name || user?.organizationUnitName || user?.org_name || user?.organization_name || 'Unassigned';
  };

  const getUserOrgCode = (user) => {
    const orgId = getUserOrgId(user);
    const fromLookup = orgId ? organizationLookup.get(String(orgId)) : null;
    return fromLookup?.code || user?.org_code || user?.organization_code || '';
  };

  const getUserFullName = (userData) => {
    if (!userData) return 'Unknown';
    if (typeof userData === 'string') return userData;

    const firstName = userData.first_name || userData.firstName || '';
    const middleRaw = userData.middle_name || userData.middleName || '';
    const lastName = userData.last_name || userData.lastName || '';
    const suffix = userData.suffix || '';
    const middleName = middleRaw ? `${middleRaw.charAt(0)}.` : '';

    const fullName = `${firstName} ${middleName} ${lastName}${suffix ? `, ${suffix}` : ''}`.trim();
    return fullName || userData.user_id || userData.userId || userData.id || 'Unknown';
  };

  const getDepartmentName = (doc) => {
    const orgId = doc.owning_org || doc.user_index?.org || null;
    const fromLookup = orgId ? organizationLookup.get(String(orgId)) : null;
    return doc.owning_org_name || fromLookup?.name || doc.user_index?.org_name || 'Unassigned';
  };

  const getDepartmentCode = (doc) => {
    const orgId = doc.owning_org || doc.user_index?.org || null;
    const fromLookup = orgId ? organizationLookup.get(String(orgId)) : null;
    return fromLookup?.code || doc.user_index?.org_code || '';
  };

  const getCategoryLabel = (doc) => {
    const categories = Array.isArray(doc.categories) ? doc.categories : [];
    if (categories.length === 0) return '';
    return categories.map((cat) => cat.category_name).join('; ');
  };

  const categories = useMemo(() => {
    const categorySet = new Set();
    // Add all categories from the organization
    allCategories.forEach((cat) => {
      const categoryName = cat.category_name || cat.name;
      if (categoryName) categorySet.add(categoryName);
    });
    // Also add categories from documents that might not be in the org list
    allDocuments.forEach((doc) => {
      if (Array.isArray(doc.categories)) {
        doc.categories.forEach((cat) => {
          const categoryName = cat.category_name || cat.name;
          if (categoryName) categorySet.add(categoryName);
        });
      }
    });
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [allCategories, allDocuments]);

  const categoryOptions = useMemo(() => ([
    { value: 'Uncategorized', label: 'Uncategorized' },
    ...categories.map((category) => ({ value: category, label: category })),
  ]), [categories]);

  const departments = useMemo(() => (
    Array.from(
      new Set([
        ...organizationUnits.map((org) => org.org_name || org.name).filter(Boolean),
        ...allDocuments.map((doc) => getDepartmentName(doc)).filter(Boolean),
        ...(Array.isArray(userList) ? userList.map((user) => getUserOrgName(user)).filter(Boolean) : []),
      ])
    ).sort((a, b) => a.localeCompare(b))
  ), [organizationUnits, allDocuments, userList]);

  const departmentOptions = useMemo(() => (
    departments.map((department) => ({ value: department, label: department }))
  ), [departments]);

  const uploaders = useMemo(() => (
    Array.from(
      new Set([
        ...allDocuments.map((doc) => getUserFullName(doc.user_index)).filter(Boolean),
        ...(Array.isArray(userList) ? userList.map((user) => getUserFullName(user)).filter(Boolean) : []),
      ])
    ).sort((a, b) => a.localeCompare(b))
  ), [allDocuments, userList]);

  const uploaderOptions = useMemo(() => (
    uploaders.map((uploader) => ({ value: uploader, label: uploader }))
  ), [uploaders]);

  const sharedFolderOptions = useMemo(() => {
    const folderMap = new Map();
    folderShares.forEach((share) => {
      const folderId = typeof share.folder === 'object' ? share.folder?.folder_id : share.folder;
      if (!folderId) return;
      const folderName = share.folder_name || share.folder_data?.folder_name || `Folder ${folderId}`;
      folderMap.set(String(folderId), folderName);
    });
    return Array.from(folderMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [folderShares]);

  const filteredDocuments = useMemo(() => (
    allDocuments.filter((doc) => {
      const loweredSearch = searchQuery.toLowerCase();
      const ownerName = getUserFullName(doc.user_index).toLowerCase();
      const ownerId = (doc.user_index?.user_id || '').toLowerCase();
      const categoryText = getCategoryLabel(doc).toLowerCase();
      const departmentName = getDepartmentName(doc);
      const departmentCode = getDepartmentCode(doc).toLowerCase();

      const matchesSearch =
        (doc.doc_name && doc.doc_name.toLowerCase().includes(loweredSearch)) ||
        (doc.doc_desc && doc.doc_desc.toLowerCase().includes(loweredSearch)) ||
        ownerName.includes(loweredSearch) ||
        ownerId.includes(loweredSearch) ||
        categoryText.includes(loweredSearch) ||
        departmentName.toLowerCase().includes(loweredSearch) ||
        departmentCode.includes(loweredSearch);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((selectedCategory) => (
          selectedCategory === 'Uncategorized'
            ? !Array.isArray(doc.categories) || doc.categories.length === 0
            : Array.isArray(doc.categories) && doc.categories.some((cat) => cat.category_name === selectedCategory)
        ));

      const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(departmentName);
      const matchesUploader = selectedUploaders.length === 0 || selectedUploaders.includes(getUserFullName(doc.user_index));

      return matchesSearch && matchesCategory && matchesDepartment && matchesUploader;
    })
  ), [allDocuments, searchQuery, selectedCategories, selectedDepartments, selectedUploaders]);

  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'uploaded-asc':
          return new Date(a.doc_uploaded || 0).getTime() - new Date(b.doc_uploaded || 0).getTime();
        case 'uploaded-desc':
          return new Date(b.doc_uploaded || 0).getTime() - new Date(a.doc_uploaded || 0).getTime();
        case 'updated-asc':
          return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
        case 'updated-desc':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'name-asc':
          return (a.doc_name || '').localeCompare(b.doc_name || '');
        case 'name-desc':
          return (b.doc_name || '').localeCompare(a.doc_name || '');
        case 'owner-asc':
          return getUserFullName(a.user_index).localeCompare(getUserFullName(b.user_index));
        case 'owner-desc':
          return getUserFullName(b.user_index).localeCompare(getUserFullName(a.user_index));
        case 'category-asc':
          return getCategoryLabel(a).localeCompare(getCategoryLabel(b));
        case 'category-desc':
          return getCategoryLabel(b).localeCompare(getCategoryLabel(a));
        case 'department-asc':
          return getDepartmentName(a).localeCompare(getDepartmentName(b));
        case 'department-desc':
          return getDepartmentName(b).localeCompare(getDepartmentName(a));
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredDocuments, sortBy]);

  const complianceRows = useMemo(() => {
    const rows = [];

    folderShares.forEach((share) => {
      const folderId = typeof share.folder === 'object' ? share.folder?.folder_id : share.folder;
      if (!folderId) return;
      if (selectedSharedFolders.length > 0 && !selectedSharedFolders.includes(String(folderId))) return;

      const folderName = share.folder_name || share.folder_data?.folder_name || `Folder ${folderId}`;
      const targetOrgId = share.shared_with_org;
      const targetOrgName = share.shared_with_org_name || 'Unknown Organization';
      const targetOrgCode = targetOrgId ? (organizationLookup.get(String(targetOrgId))?.code || '') : '';
      const sharedByName = share.shared_by_org_name || 'Unknown Organization';

      const targetUsers = (Array.isArray(userList) ? userList : []).filter(
        (user) => String(getUserOrgId(user)) === String(targetOrgId)
      );

      targetUsers.forEach((user) => {
        const userId = user.user_id || user.id;
        const userUploads = allDocuments.filter((doc) => {
          const docFolderId = doc.folder;
          const uploaderId = doc.user_index?.user_id || doc.uploaded_by_user?.user_id;
          return String(docFolderId) === String(folderId) && String(uploaderId) === String(userId);
        });

        if (userUploads.length === 0) {
          rows.push({
            fullName: getUserFullName(user),
            userId: userId || '-',
            department: getUserOrgName(user) || targetOrgName,
            departmentCode: getUserOrgCode(user),
            documentName: '',
            categories: '',
            folder: folderName,
            uploaded: '',
            updated: '',
            uploadStatus: 'Missing',
            targetOrganization: targetOrgName,
            targetOrgCode,
            sharedByOrganization: sharedByName,
            uploadedAt: null,
            updatedAt: null,
          });
          return;
        }

        userUploads.forEach((doc) => {
          rows.push({
            fullName: getUserFullName(user),
            userId: userId || '-',
            department: getUserOrgName(user) || targetOrgName,
            departmentCode: getUserOrgCode(user),
            documentName: doc.doc_name || '',
            categories: getCategoryLabel(doc),
            folder: folderName,
            uploaded: formatDate(doc.doc_uploaded),
            updated: formatDate(doc.updated_at),
            uploadStatus: 'Uploaded',
            targetOrganization: targetOrgName,
            targetOrgCode,
            sharedByOrganization: sharedByName,
            uploadedAt: doc.doc_uploaded || null,
            updatedAt: doc.updated_at || null,
          });
        });
      });
    });

    return rows;
  }, [allDocuments, folderShares, selectedSharedFolders, userList, organizationLookup]);

  const filteredComplianceRows = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase();

    return complianceRows.filter((row) => {
      const categoryValue = row.categories || '';

      const matchesSearch =
        row.fullName.toLowerCase().includes(loweredSearch) ||
        String(row.userId || '').toLowerCase().includes(loweredSearch) ||
        row.department.toLowerCase().includes(loweredSearch) ||
        String(row.departmentCode || '').toLowerCase().includes(loweredSearch) ||
        row.folder.toLowerCase().includes(loweredSearch) ||
        String(row.documentName || '').toLowerCase().includes(loweredSearch) ||
        categoryValue.toLowerCase().includes(loweredSearch) ||
        String(row.targetOrganization || '').toLowerCase().includes(loweredSearch) ||
        String(row.targetOrgCode || '').toLowerCase().includes(loweredSearch);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((selectedCategory) => (
          selectedCategory === 'Uncategorized'
            ? !categoryValue
            : categoryValue.split(';').map((v) => v.trim()).includes(selectedCategory)
        ));

      const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(row.department);
      const matchesUploader = selectedUploaders.length === 0 || selectedUploaders.includes(row.fullName);
      const matchesStatus = selectedUploadStatus === 'all' || row.uploadStatus.toLowerCase() === selectedUploadStatus;

      return matchesSearch && matchesCategory && matchesDepartment && matchesUploader && matchesStatus;
    });
  }, [complianceRows, searchQuery, selectedCategories, selectedDepartments, selectedUploaders, selectedUploadStatus]);

  const sortedComplianceRows = useMemo(() => {
    const sorted = [...filteredComplianceRows];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'uploaded-asc':
          return new Date(a.uploaded || 0).getTime() - new Date(b.uploaded || 0).getTime();
        case 'uploaded-desc':
          return new Date(b.uploaded || 0).getTime() - new Date(a.uploaded || 0).getTime();
        case 'updated-asc':
          return new Date(a.updated || 0).getTime() - new Date(b.updated || 0).getTime();
        case 'updated-desc':
          return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
        case 'name-asc':
          return (a.documentName || '').localeCompare(b.documentName || '');
        case 'name-desc':
          return (b.documentName || '').localeCompare(a.documentName || '');
        case 'owner-asc':
          return a.fullName.localeCompare(b.fullName);
        case 'owner-desc':
          return b.fullName.localeCompare(a.fullName);
        case 'category-asc':
          return (a.categories || '').localeCompare(b.categories || '');
        case 'category-desc':
          return (b.categories || '').localeCompare(a.categories || '');
        case 'department-asc':
          return (a.department || '').localeCompare(b.department || '');
        case 'department-desc':
          return (b.department || '').localeCompare(a.department || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredComplianceRows, sortBy]);

  const activeRows = reportMode === 'shared-compliance' ? sortedComplianceRows : sortedDocuments;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const downloadCsvRows = (headers, rows, filePrefix) => {
    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `${filePrefix}-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getExportDateRange = () => {
    let start;
    let end;

    if (exportPreset === 'custom') {
      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return null;
      }

      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        alert('Start date cannot be after end date');
        return null;
      }

      return { start, end };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (exportPreset) {
      case 'today':
        start = new Date(today);
        break;
      case '7days':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case '30days':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(today);
        break;
    }

    return { start, end };
  };

  const isInExportDateRange = (value, range) => {
    if (!range || !value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed >= range.start && parsed <= range.end;
  };

  const exportToCSV = () => {
    if (activeRows.length === 0) {
      alert('No report rows available to export');
      return;
    }

    const range = getExportDateRange();
    if (!range) return;

    if (reportMode === 'shared-compliance') {
      const dateFilteredRows = sortedComplianceRows.filter((row) => {
        if (row.uploadStatus === 'Missing') return true;
        return isInExportDateRange(row.uploadedAt, range);
      });

      if (dateFilteredRows.length === 0) {
        alert('No report rows to export for the selected date range');
        return;
      }

      const headers = [
        'Full Name',
        'User ID',
        'Department',
        'Document Name',
        'Categories',
        'Folder',
        'Upload Status',
        'Uploaded',
        'Updated',
        'Shared By Organization',
        'Target Organization',
      ];

      const rows = dateFilteredRows.map((row) => [
        row.fullName,
        row.userId,
        row.department,
        row.documentName,
        row.categories,
        row.folder,
        row.uploadStatus,
        row.uploaded,
        row.updated,
        row.sharedByOrganization,
        row.targetOrganization,
      ]);

      downloadCsvRows(headers, rows, 'shared-folder-compliance-report');
      setShowExportModal(false);
      return;
    }

    const dateFilteredDocuments = sortedDocuments.filter((doc) => isInExportDateRange(doc.doc_uploaded, range));

    if (dateFilteredDocuments.length === 0) {
      alert('No report rows to export for the selected date range');
      return;
    }

const headers = ['Owner', 'Department', 'Document Name', 'Description', 'Categories', 'Folder', 'Uploaded', 'Updated'];
      const rows = dateFilteredDocuments.map((doc) => [
        getUserFullName(doc.user_index),
      getDepartmentName(doc),
      doc.doc_name,
      doc.doc_desc || '-',
      getCategoryLabel(doc),
      doc.folder_name || '-',
      formatDate(doc.doc_uploaded),
      formatDate(doc.updated_at),
    ]);

    downloadCsvRows(headers, rows, 'documents-report');
    setShowExportModal(false);
  };

  const pagedRows = activeRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generate Reports</h2>
          <p className="text-sm text-gray-600 mt-1">Generate CSV reports from uploaded files and shared-folder compliance tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={activeRows.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export visible report rows to CSV"
          >
            <Download className="w-4 h-4" />
            Export Report CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-3">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={reportMode}
              onChange={(e) => setReportMode(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Select report mode"
            >
              <option value="document-uploads">Document Uploads</option>
              <option value="shared-compliance">Shared Folder Compliance</option>
            </select>
          </div>

          <div className="relative lg:col-span-9">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search full name, organization name/code, folder, document, category..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative lg:col-span-4">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <MultiSelectChecklist
              label="All Categories"
              options={categoryOptions}
              selectedValues={selectedCategories}
              onToggle={(value) => {
                toggleSelection(value, setSelectedCategories);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="relative lg:col-span-4">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <MultiSelectChecklist
              label="All Uploaders"
              options={uploaderOptions}
              selectedValues={selectedUploaders}
              onToggle={(value) => {
                toggleSelection(value, setSelectedUploaders);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="relative lg:col-span-4">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Sort report rows"
            >
              <option value="uploaded-desc">Newest Upload</option>
              <option value="uploaded-asc">Oldest Upload</option>
              <option value="updated-desc">Latest Update</option>
              <option value="updated-asc">Earliest Update</option>
              <option value="name-asc">Document Name (A-Z)</option>
              <option value="name-desc">Document Name (Z-A)</option>
              <option value="owner-asc">Uploader (A-Z)</option>
              <option value="owner-desc">Uploader (Z-A)</option>
              <option value="department-asc">Department (A-Z)</option>
              <option value="department-desc">Department (Z-A)</option>
              <option value="category-asc">Category (A-Z)</option>
              <option value="category-desc">Category (Z-A)</option>
            </select>
          </div>
        </div>

        {reportMode === 'shared-compliance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-6">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <MultiSelectChecklist
                label="All Shared Folders"
                options={sharedFolderOptions}
                selectedValues={selectedSharedFolders}
                onToggle={(value) => {
                  toggleSelection(value, setSelectedSharedFolders);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="relative lg:col-span-6">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedUploadStatus}
                onChange={(e) => {
                  setSelectedUploadStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Filter by upload status"
              >
                <option value="all">All Upload Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          </div>
        )}

        {(searchQuery || selectedCategories.length > 0 || selectedDepartments.length > 0 || selectedUploaders.length > 0 || selectedSharedFolders.length > 0 || selectedUploadStatus !== 'all') && (
          <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                  setSelectedDepartments([]);
                  setSelectedUploaders([]);
                  setSelectedSharedFolders([]);
                  setSelectedUploadStatus('all');
                  setCurrentPage(1);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading report data...</div>
        ) : activeRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium">No report rows found</p>
            <p className="text-sm">Try adjusting filters or switch report mode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportMode === 'shared-compliance' ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Full Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Document Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Categories</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Folder</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Upload Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagedRows.map((row, idx) => (
                    <tr key={`${row.userId}-${row.folder}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">{row.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium text-center">{row.documentName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-center">{row.categories || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.folder || '-'}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.uploadStatus === 'Uploaded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {row.uploadStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.uploaded || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.updated || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Document Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Categories</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Folder</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagedRows.map((doc) => (
                    <tr key={doc.doc_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">{getUserFullName(doc.user_index)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{getDepartmentName(doc)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium text-center">{doc.doc_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate text-center">{doc.doc_desc || '-'}</td>
                      <td className="px-6 py-4 text-sm text-center">{getCategoryLabel(doc) || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{doc.folder_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{formatDate(doc.doc_uploaded) || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{formatDate(doc.updated_at) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {activeRows.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={(currentPage - 1) * rowsPerPage}
          endIndex={currentPage * rowsPerPage}
          rowsPerPage={rowsPerPage}
          totalRecords={activeRows.length}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          onFirstPage={() => setCurrentPage(1)}
          onLastPage={() => setCurrentPage(totalPages)}
          onPreviousPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Export Report CSV</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">Select the date range for report rows you wish to export.</p>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="today"
                    checked={exportPreset === 'today'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Today</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="7days"
                    checked={exportPreset === '7days'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="30days"
                    checked={exportPreset === '30days'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="thisMonth"
                    checked={exportPreset === 'thisMonth'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">This Month</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="exportPreset"
                    value="custom"
                    checked={exportPreset === 'custom'}
                    onChange={(e) => setExportPreset(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Custom Range</span>
                </label>
              </div>

              {exportPreset === 'custom' && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-l-4 border-blue-500 p-4 rounded" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-start gap-2">
          <span className="font-bold text-lg" style={{ color: '#2563EB' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            <strong style={{ color: '#1E3A8A' }}>Shared Folder Compliance:</strong> This mode creates report rows per shared folder and recipient user.
            If a user did not upload in a required shared folder, the CSV keeps the row with blank document fields and status set to Missing.
          </p>
        </div>
      </div>
    </div>
  );
}
