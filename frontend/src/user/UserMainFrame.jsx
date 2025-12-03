import { useState } from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Bell, Folder, Share2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import Folders from './components/Folders';
import CustomFields from './components/CustomFields';
import CreateFolderModal from './components/modals/CreateFolderModal';
import MoveToFolderModal from './components/modals/MoveToFolderModal';
import DocumentViewerModal from './components/modals/DocumentViewerModal';
import UploadDocumentModal from './components/modals/UploadDocumentModal';
import OCRModal from './components/modals/OCRModal';
import AddDocumentModal from './components/modals/AddDocumentModal';
import PersonalInfoFormModal from './components/modals/PersonalInfoFormModal';
import SaveOptionsModal from './components/modals/SaveOptionsModal';
import AddFieldModal from './components/modals/AddFieldModal';
import ShareDocumentModal from './components/modals/ShareDocumentModal';
import SharedDocuments from './components/SharedDocuments';

export default function UserMainFrame({ currentUser = { name: 'User', role: 'User', id: 'user1' }, onLogout = () => {} }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [documentToMove, setDocumentToMove] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [customFields, setCustomFields] = useState([]);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedDocFiles, setUploadedDocFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [currentDocumentData, setCurrentDocumentData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterFormat, setFilterFormat] = useState('all');
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    customFieldValues: {}
  });
  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text'
  });
  const [errors, setErrors] = useState({});
  const [allUsers, setAllUsers] = useState([
    { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 'user3', name: 'Bob Wilson', email: 'bob@example.com', role: 'User' },
    { id: 'user4', name: 'Alice Brown', email: 'alice@example.com', role: 'User' },
    { id: 'user5', name: 'Charlie Davis', email: 'charlie@example.com', role: 'User' }
  ]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'My Documents', icon: FileText },
    { id: 'shared', label: 'Shared Documents', icon: Share2 },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'fields', label: 'Custom Fields', icon: Settings }
  ];

  const handleAddField = () => {
    if (!newField.fieldName.trim()) {
      setErrors({ fieldName: 'Field name is required' });
      return;
    }
    if (customFields.some(field => field.name === newField.fieldName)) {
      setErrors({ fieldName: 'Field name already exists' });
      return;
    }
    const field = {
      id: Date.now().toString(),
      name: newField.fieldName,
      type: newField.fieldType
    };
    setCustomFields([...customFields, field]);
    setShowAddFieldModal(false);
    setNewField({ fieldName: '', fieldType: 'text' });
    setErrors({});
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field? This will remove the field from all documents.')) {
      setCustomFields(customFields.filter(field => field.id !== fieldId));
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setErrors({ folderName: 'Folder name is required' });
      return;
    }
    if (folders.some(folder => folder.name === newFolderName)) {
      setErrors({ folderName: 'Folder name already exists' });
      return;
    }
    const folder = {
      id: Date.now().toString(),
      name: newFolderName,
      color: newFolderColor,
      createdAt: new Date().toLocaleString(),
      documentCount: 0
    };
    setFolders([...folders, folder]);
    setShowCreateFolderModal(false);
    setNewFolderName('');
    setNewFolderColor('blue');
    setErrors({});
  };

  const handleDeleteFolder = (folderId) => {
    const documentsInFolder = userDocuments.filter(doc => doc.folderId === folderId);
    
    if (documentsInFolder.length > 0) {
      if (window.confirm(`This folder contains ${documentsInFolder.length} document(s). Delete folder and move documents to root?`)) {
        setUserDocuments(userDocuments.map(doc => 
          doc.folderId === folderId ? { ...doc, folderId: null } : doc
        ));
        setFolders(folders.filter(f => f.id !== folderId));
        if (currentFolder === folderId) {
          setCurrentFolder(null);
        }
      }
    } else {
      if (window.confirm('Are you sure you want to delete this folder?')) {
        setFolders(folders.filter(f => f.id !== folderId));
        if (currentFolder === folderId) {
          setCurrentFolder(null);
        }
      }
    }
  };

  const handleMoveToFolder = (folderId) => {
    if (documentToMove) {
      setUserDocuments(userDocuments.map(doc => 
        doc.id === documentToMove ? { ...doc, folderId: folderId } : doc
      ));
      setShowMoveToFolderModal(false);
      setDocumentToMove(null);
    }
  };

  const openMoveToFolderModal = (docId) => {
    setDocumentToMove(docId);
    setShowMoveToFolderModal(true);
  };

  const handleAddDocument = () => {
    if (!newDocument.title.trim()) {
      setErrors({ title: 'Document title is required' });
      return;
    }
    setCurrentDocumentData({
      title: newDocument.title,
      description: newDocument.description,
      customFieldValues: { ...newDocument.customFieldValues }
    });
    setShowAddDocumentModal(false);
    setShowPersonalInfoForm(true);
  };

  const handleSavePersonalInfo = () => {
    if (!personalInfo.fullName.trim() || !personalInfo.email.trim()) {
      setErrors({ personalInfo: 'Full Name and Email are required' });
      return;
    }
    setShowPersonalInfoForm(false);
    setShowSaveOptionsModal(true);
    setErrors({});
  };

  const generateDocumentContent = (title, personalInfo, customFields) => {
    return `
OFFICIAL DOCUMENT

${title}

This document contains the official records and information as submitted and verified by the Record Keeping Management System.

PERSONAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full Name: ${personalInfo.fullName || 'N/A'}
Date of Birth: ${personalInfo.dateOfBirth || 'N/A'}
Gender: ${personalInfo.gender || 'N/A'}
Occupation: ${personalInfo.occupation || 'N/A'}

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: ${personalInfo.email || 'N/A'}
Phone: ${personalInfo.phoneNumber || 'N/A'}
Address: ${personalInfo.address || 'N/A'}
City: ${personalInfo.city || 'N/A'}
State: ${personalInfo.state || 'N/A'}
ZIP Code: ${personalInfo.zipCode || 'N/A'}

${personalInfo.emergencyContact ? `EMERGENCY CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contact Name: ${personalInfo.emergencyContact}
Contact Phone: ${personalInfo.emergencyPhone || 'N/A'}

` : ''}${Object.keys(customFields).length > 0 ? `ADDITIONAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(customFields).map(([key, value]) => `${key}: ${value || 'N/A'}`).join('\n')}

` : ''}
DOCUMENT CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This document has been generated and stored in the Record Keeping Management System.

I hereby certify that the information provided in this document is true and accurate to the best of my knowledge.

Signature: _________________________

Date: _____________________________


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Record Keeping Management System
Generated: ${new Date().toLocaleString()}
Document ID: ${Date.now()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  };

  const handleFinalSave = (format) => {
    const doc = {
      id: Date.now().toString(),
      title: currentDocumentData.title,
      description: currentDocumentData.description,
      customFieldValues: { ...currentDocumentData.customFieldValues },
      personalInfo: { ...personalInfo },
      format: format,
      folderId: currentFolder,
      content: generateDocumentContent(currentDocumentData.title, personalInfo, currentDocumentData.customFieldValues),
      createdAt: new Date().toLocaleString(),
      createdBy: currentUser.name
    };
    setUserDocuments([...userDocuments, doc]);
    setShowSaveOptionsModal(false);
    setNewDocument({ title: '', description: '', customFieldValues: {} });
    setPersonalInfo({
      fullName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      occupation: '',
      emergencyContact: '',
      emergencyPhone: ''
    });
    setCurrentDocumentData(null);
    setErrors({});
    alert(`Document saved as ${format.toUpperCase()}!`);
  };

  const handleDeleteDocument = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setUserDocuments(userDocuments.filter(doc => doc.id !== docId));
    }
  };

  const handleOpenDocument = (doc) => {
    setViewingDocument(doc);
    setShowDocumentViewer(true);
  };

  const handleDownloadDocument = (doc) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName || doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.content || doc.ocrContent) {
      const content = doc.content || doc.ocrContent;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintDocument = (doc) => {
    if (doc.fileData && doc.format === 'pdf') {
      const printWindow = window.open(doc.fileData);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else if (doc.content || doc.ocrContent) {
      const content = doc.content || doc.ocrContent;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${doc.title}</title>
              <style>
                body { font-family: Georgia, serif; padding: 40px; line-height: 1.6; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <pre>${content}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else if (doc.fileData) {
      const printWindow = window.open(doc.fileData);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setOcrText('');
    }
  };

  const handleProcessOCR = () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }
    setIsProcessingOCR(true);
    setTimeout(() => {
      setOcrText(`[OCR Extracted Text from ${uploadedFile.name}]\n\nThis is a simulated OCR result. In a real implementation, this would contain the actual text extracted from the uploaded image or PDF document using OCR technology.\n\nSample extracted content:\n- Name: John Doe\n- Address: 123 Main Street\n- Date: November 11, 2025\n- Document Type: Official Record`);
      setIsProcessingOCR(false);
    }, 2000);
  };

  const handleUseOCRText = () => {
    if (!ocrText) {
      alert('Please process OCR first');
      return;
    }
    const doc = {
      id: Date.now().toString(),
      title: `OCR Document - ${uploadedFile.name}`,
      description: 'Document created from OCR extraction',
      customFieldValues: {},
      personalInfo: {},
      format: 'ocr',
      folderId: currentFolder,
      ocrContent: ocrText,
      createdAt: new Date().toLocaleString(),
      createdBy: currentUser.name
    };
    setUserDocuments([...userDocuments, doc]);
    setShowOCRModal(false);
    setUploadedFile(null);
    setOcrText('');
    alert('Document created from OCR text!');
  };

  const handleDocumentFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedDocFiles(files);
      setCurrentPreviewIndex(0);
      
      const previews = [];
      let processedCount = 0;
      
      files.forEach((file, index) => {
        const fileType = file.type;
        const reader = new FileReader();
        
        if (fileType.startsWith('image/')) {
          reader.onload = (e) => {
            previews[index] = {
              type: 'image',
              url: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsDataURL(file);
        } else if (fileType === 'application/pdf') {
          reader.onload = (e) => {
            previews[index] = {
              type: 'pdf',
              url: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsDataURL(file);
        } else if (fileType.includes('text/') || file.name.endsWith('.txt')) {
          reader.onload = (e) => {
            previews[index] = {
              type: 'text',
              content: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
            processedCount++;
            if (processedCount === files.length) {
              setUploadPreviews([...previews]);
            }
          };
          reader.readAsText(file);
        } else {
          previews[index] = {
            type: 'other',
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(2) + ' KB',
            fileType: fileType || 'Unknown'
          };
          processedCount++;
          if (processedCount === files.length) {
            setUploadPreviews([...previews]);
          }
        }
      });
    }
  };

  const removeFileFromUpload = (index) => {
    const newFiles = uploadedDocFiles.filter((_, i) => i !== index);
    const newPreviews = uploadPreviews.filter((_, i) => i !== index);
    setUploadedDocFiles(newFiles);
    setUploadPreviews(newPreviews);
    
    if (currentPreviewIndex >= newFiles.length && newFiles.length > 0) {
      setCurrentPreviewIndex(newFiles.length - 1);
    } else if (newFiles.length === 0) {
      setCurrentPreviewIndex(0);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadedDocFiles || uploadedDocFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    
    const newDocuments = [];
    let processedCount = 0;
    
    uploadedDocFiles.forEach((file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let format = 'other';
      if (fileExtension === 'pdf') format = 'pdf';
      else if (fileExtension === 'docx' || fileExtension === 'doc') format = 'docx';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const doc = {
          id: Date.now().toString() + '-' + processedCount,
          title: file.name,
          description: 'Uploaded document',
          customFieldValues: {},
          personalInfo: {},
          format: format,
          folderId: currentFolder,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          fileData: e.target.result,
          mimeType: file.type,
          createdAt: new Date().toLocaleString(),
          createdBy: currentUser.name
        };
        
        newDocuments.push(doc);
        processedCount++;
        
        if (processedCount === uploadedDocFiles.length) {
          setUserDocuments([...userDocuments, ...newDocuments]);
          setShowUploadDocumentModal(false);
          setUploadedDocFiles([]);
          setUploadPreviews([]);
          setCurrentPreviewIndex(0);
          alert(`${newDocuments.length} document${newDocuments.length > 1 ? 's' : ''} uploaded successfully!`);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const getFilteredAndSortedDocuments = () => {
    let filtered = [...userDocuments];

    if (currentFolder) {
      filtered = filtered.filter(doc => doc.folderId === currentFolder);
    } else if (activeSection === 'documents') {
      filtered = filtered.filter(doc => !doc.folderId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.personalInfo?.fullName?.toLowerCase().includes(query) ||
        doc.personalInfo?.email?.toLowerCase().includes(query)
      );
    }

    if (filterFormat !== 'all') {
      filtered = filtered.filter(doc => doc.format === filterFormat);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredDocuments = getFilteredAndSortedDocuments();

  const getFolderDocumentCount = (folderId) => {
    return userDocuments.filter(doc => doc.folderId === folderId).length;
  };

  const handleShareDocument = (shareData) => {
    const newShare = {
      id: Date.now().toString(),
      documentId: shareData.documentId,
      document: userDocuments.find(doc => doc.id === shareData.documentId),
      sharedWith: shareData.sharedWith,
      sharedBy: shareData.sharedBy,
      permission: shareData.permission,
      message: shareData.message,
      sharedAt: shareData.sharedAt
    };

    setSharedDocuments([...sharedDocuments, newShare]);
    alert(`Document shared with ${shareData.sharedWith.length} user(s)!`);
  };

  const openShareModal = (doc) => {
    setDocumentToShare(doc);
    setShowShareModal(true);
  };

  const handleRemoveShare = (shareId) => {
    if (window.confirm('Are you sure you want to remove this share?')) {
      setSharedDocuments(sharedDocuments.filter(share => share.id !== shareId));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <CreateFolderModal
        show={showCreateFolderModal}
        onClose={() => { 
          setShowCreateFolderModal(false); 
          setNewFolderName(''); 
          setNewFolderColor('blue');
          setErrors({}); 
        }}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        newFolderColor={newFolderColor}
        setNewFolderColor={setNewFolderColor}
        errors={errors}
        onCreateFolder={handleCreateFolder}
      />

      <MoveToFolderModal
        show={showMoveToFolderModal}
        onClose={() => { 
          setShowMoveToFolderModal(false); 
          setDocumentToMove(null); 
        }}
        folders={folders}
        onMoveToFolder={handleMoveToFolder}
        getFolderDocumentCount={getFolderDocumentCount}
      />

      <DocumentViewerModal
        show={showDocumentViewer}
        document={viewingDocument}
        onClose={() => { setShowDocumentViewer(false); setViewingDocument(null); }}
        onPrint={handlePrintDocument}
        onDownload={handleDownloadDocument}
      />

      <UploadDocumentModal
        show={showUploadDocumentModal}
        onClose={() => { 
          setShowUploadDocumentModal(false); 
          setUploadedDocFiles([]); 
          setUploadPreviews([]); 
          setCurrentPreviewIndex(0); 
        }}
        uploadedDocFiles={uploadedDocFiles}
        uploadPreviews={uploadPreviews}
        currentPreviewIndex={currentPreviewIndex}
        setCurrentPreviewIndex={setCurrentPreviewIndex}
        onFileUpload={handleDocumentFileUpload}
        onRemoveFile={removeFileFromUpload}
        onUpload={handleUploadDocument}
      />

      <OCRModal
        show={showOCRModal}
        onClose={() => { setShowOCRModal(false); setUploadedFile(null); setOcrText(''); }}
        uploadedFile={uploadedFile}
        ocrText={ocrText}
        setOcrText={setOcrText}
        isProcessingOCR={isProcessingOCR}
        onFileUpload={handleFileUpload}
        onProcessOCR={handleProcessOCR}
        onUseOCRText={handleUseOCRText}
      />

      <PersonalInfoFormModal
        show={showPersonalInfoForm}
        onClose={() => { 
          setShowPersonalInfoForm(false); 
          setPersonalInfo({
            fullName: '', dateOfBirth: '', gender: '', email: '', phoneNumber: '',
            address: '', city: '', state: '', zipCode: '', occupation: '',
            emergencyContact: '', emergencyPhone: ''
          }); 
        }}
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        errors={errors}
        onSave={handleSavePersonalInfo}
        onBack={() => { setShowPersonalInfoForm(false); setShowAddDocumentModal(true); }}
      />

      <SaveOptionsModal
        show={showSaveOptionsModal}
        onClose={() => { setShowSaveOptionsModal(false); setShowPersonalInfoForm(true); }}
        onSave={handleFinalSave}
      />

      <AddFieldModal
        show={showAddFieldModal}
        onClose={() => { 
          setShowAddFieldModal(false); 
          setErrors({}); 
          setNewField({ fieldName: '', fieldType: 'text' }); 
        }}
        newField={newField}
        setNewField={setNewField}
        errors={errors}
        onAddField={handleAddField}
      />

      <AddDocumentModal
        show={showAddDocumentModal}
        onClose={() => { 
          setShowAddDocumentModal(false); 
          setErrors({}); 
          setNewDocument({ title: '', description: '', customFieldValues: {} }); 
        }}
        newDocument={newDocument}
        setNewDocument={setNewDocument}
        customFields={customFields}
        errors={errors}
        onAddDocument={handleAddDocument}
      />

      <ShareDocumentModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setDocumentToShare(null);
        }}
        document={documentToShare}
        allUsers={allUsers}
        currentUser={currentUser}
        onShareDocument={handleShareDocument}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeSection={activeSection}
          menuItems={menuItems}
          currentUser={currentUser}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              userDocuments={userDocuments}
              folders={folders}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'documents' && (
            <Documents
              currentFolder={currentFolder}
              setCurrentFolder={setCurrentFolder}
              folders={folders}
              userDocuments={userDocuments}
              filteredDocuments={filteredDocuments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterFormat={filterFormat}
              setFilterFormat={setFilterFormat}
              sortBy={sortBy}
              setSortBy={setSortBy}
              setShowUploadDocumentModal={setShowUploadDocumentModal}
              setShowOCRModal={setShowOCRModal}
              setShowAddDocumentModal={setShowAddDocumentModal}
              onOpenDocument={handleOpenDocument}
              onDeleteDocument={handleDeleteDocument}
              onDownloadDocument={handleDownloadDocument}
              onPrintDocument={handlePrintDocument}
              onMoveToFolder={openMoveToFolderModal}
              onShareDocument={openShareModal}
            />
          )}
          {activeSection === 'shared' && (
            <SharedDocuments
              sharedDocuments={sharedDocuments}
              currentUser={currentUser}
              onOpenDocument={handleOpenDocument}
              onRemoveShare={handleRemoveShare}
              allUsers={allUsers}
            />
          )}
          {activeSection === 'folders' && (
            <Folders
              folders={folders}
              getFolderDocumentCount={getFolderDocumentCount}
              setShowCreateFolderModal={setShowCreateFolderModal}
              onDeleteFolder={handleDeleteFolder}
              setCurrentFolder={setCurrentFolder}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'fields' && (
            <CustomFields
              customFields={customFields}
              setShowAddFieldModal={setShowAddFieldModal}
              onDeleteField={handleDeleteField}
            />
          )}
        </div>
      </div>
    </div>
  );
}