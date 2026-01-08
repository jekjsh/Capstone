import { useState ,useEffect} from 'react';
import { Tag,LayoutDashboard, FileText, Settings, LogOut, Menu, X, Bell, Folder, Share2, Trash2 } from 'lucide-react';
import Header from './Components/Header';
import Dashboard from './Components/Dashboard';
import Documents from './Components/Documents';
import Folders from './Components/Folders';
import Sidebar from './Components/Sidebar';
import CreateFolderModal from './components/modals/CreateFolderModal';
import MoveToFolderModal from './components/modals/MoveToFolderModal';
import DocumentViewerModal from './components/modals/DocumentViewerModal';
import UploadDocumentModal from './components/modals/UploadDocumentModal';
import OCRModal from './components/modals/OCRModal';
import ShareDocumentModal from './Components/modals/ShareDocumentModal';
import SendToOrganizationModal from "../admin/component/SendToOrganizationModal";
import SharedDocuments from './Components/SharedDocuments';
import RecycleBin from './Components/RecycleBin';
import { TagManagement } from './Components/TagComponents';
import UserChangePasswordModal from './Components/modals/UserChangePasswordModal';
export default function UserMainFrame({ 
  currentUser = { name: 'User', role: 'User', id: 'user1' }, 
  onLogout = () => {}, 
  organizationTree,
  dataStore 
}) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [, forceUpdate] = useState(0);
   useEffect(() => {
    if (dataStore) {
      const unsubscribe = dataStore.subscribe(() => {
        forceUpdate(prev => prev + 1);
      });
      return unsubscribe;
    }
  }, [dataStore]);
  // const [userDocuments, setUserDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [documentToMove, setDocumentToMove] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedDocFiles, setUploadedDocFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterFormat, setFilterFormat] = useState('all');
   const orgTree = dataStore ? dataStore.getOrganizationTree() : (organizationTree || []);
  const [errors, setErrors] = useState({});
  const allUsers = dataStore ? dataStore.getAllUsers() : [];
  const sharedDocuments = dataStore ? dataStore.getAllDirectShares() : [];
  const organizationShares = dataStore ? dataStore.getAllOrgShares() : [];
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState(null);
  const [showSendToOrgModal, setShowSendToOrgModal] = useState(false);
  const [selectedDocForOrgShare, setSelectedDocForOrgShare] = useState(null);
  const userDocuments = dataStore ? dataStore.getDocumentsByUser(currentUser.id) : [];
 const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'My Documents', icon: FileText },
  { id: 'shared', label: 'Shared Documents', icon: Share2 },
  { id: 'folders', label: 'Folders', icon: Folder },  
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 }
];
  const addAuditLog = (action, resource, status = 'Success') => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const logEntry = {
      time: timestamp,
      user: `${currentUser.name} (${currentUser.id})`,
      action: action,
      resource: resource,
      status: status
    };
     if (dataStore) {
      dataStore.addAuditLog(logEntry);
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
        documentsInFolder.forEach(doc => {
          if (dataStore) {
            dataStore.updateDocument(doc.id, { folderId: null });
          }
        });
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
    if (documentToMove && dataStore) {
      dataStore.updateDocument(documentToMove, { folderId: folderId });
      setShowMoveToFolderModal(false);
      setDocumentToMove(null);
    }
  };

  const openMoveToFolderModal = (docId) => {
    setDocumentToMove(docId);
    setShowMoveToFolderModal(true);
  };



  
  const handleDeleteDocument = (docId) => {
  const docToDelete = userDocuments.find(doc => doc.id === docId);
  if (window.confirm('Move this document to Recycle Bin?')) {
    if (dataStore) {
      dataStore.moveToRecycleBin(docToDelete);
      addAuditLog(
        'Document Moved to Recycle Bin',
        `${docToDelete.title} - ID: ${docId}`,
        'Success'
      );
    }
  }
};
const handleRestoreDocument = (docId) => {
  if (dataStore) {
    const doc = dataStore.getDeletedDocuments().find(d => d.id === docId);
    dataStore.restoreFromRecycleBin(docId);
    addAuditLog('Document Restored', `${doc.title} - ID: ${docId}`, 'Success');
    alert('Document restored successfully!');
  }
};

const handlePermanentDelete = (docId) => {
  if (dataStore) {
    const doc = dataStore.getDeletedDocuments().find(d => d.id === docId);
    dataStore.permanentlyDelete(docId);
    addAuditLog('Document Permanently Deleted', `${doc.title} - ID: ${docId}`, 'Success');
    alert('Document permanently deleted!');
  }
};
const handleEmptyRecycleBin = () => {
  if (dataStore) {
    const count = dataStore.getDeletedDocuments().filter(d => d.createdBy === currentUser.id).length;
    dataStore.emptyRecycleBin(currentUser.id);
    addAuditLog('Recycle Bin Emptied', `${count} documents permanently deleted`, 'Success');
    alert('Recycle bin emptied!');
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
      createdBy: currentUser.id 
    };
    
    
    if (dataStore) {
      dataStore.addDocument(doc);

       addAuditLog(
        'OCR Document Created',
        `${doc.title} - Extracted from ${uploadedFile.name}`,
        'Success'
      );
    }
    
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
      const fileName = file.name.toLowerCase();
      
      // âœ… Check if it's an Excel file
      const isExcel = fileName.endsWith('.xlsx') || 
                      fileName.endsWith('.xls') || 
                      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      fileType === 'application/vnd.ms-excel';
      
      const reader = new FileReader();
      
      if (fileType.startsWith('image/')) {
        // Handle images
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
        // Handle PDFs
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
      } else if (isExcel) {
        // âœ… Handle Excel files
        reader.onload = async (e) => {
          try {
            // Import SheetJS library (if available)
            const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
            
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            previews[index] = {
              type: 'excel',
              url: e.target.result, // Store as base64 for upload
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB',
              sheets: workbook.SheetNames.length,
              sheetNames: workbook.SheetNames
            };
          } catch (error) {
            console.warn('Could not parse Excel file, storing as binary:', error);
            // If parsing fails, just store the file data
            previews[index] = {
              type: 'excel',
              url: e.target.result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB'
            };
          }
          
          processedCount++;
          if (processedCount === files.length) {
            setUploadPreviews([...previews]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType.includes('text/') || fileName.endsWith('.txt')) {
        // Handle text files
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
        // Handle other file types
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
const handleChangePassword = (currentPassword, newPassword) => {
  console.log('ðŸ”’ Attempting password change for:', currentUser.id);
  

  if (dataStore) {
    const verifiedUser = dataStore.verifyUser(currentUser.id, currentPassword);
    
    if (!verifiedUser) {
      alert('âŒ Current password is incorrect!');
      return;
    }
    
   
    dataStore.updateUser(currentUser.id, {
      password: newPassword
    });
    
  
    addAuditLog(
      'Password Changed',
      `User changed their own password`,
      'Success'
    );
    
  
    setShowChangePasswordModal(false);
    
    
    alert('âœ… Password changed successfully!\n\nYour password has been updated. Please use your new password when logging in next time.');
  } else {
    alert('âŒ Error: Unable to update password');
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
       else if (fileExtension === 'xlsx' || fileExtension === 'xls') format = 'excel';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const doc = {
          id: Date.now().toString() + '-' + processedCount,
          title: file.name,
         description: format === 'excel' ? 'Excel Spreadsheet Document' : 'Uploaded document',

          customFieldValues: {},
          personalInfo: {},
          format: format,
          folderId: currentFolder,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          fileData: e.target.result,
          mimeType: file.type,
          createdAt: new Date().toLocaleString(),
          createdBy: currentUser.id 
        };
        
        
        if (dataStore) {
          dataStore.addDocument(doc);

           addAuditLog(
            'Document Uploaded',
            `${doc.fileName} (${doc.fileSize}) - ${format.toUpperCase()}`,
            'Success'
          );
        }
        
        newDocuments.push(doc);
        processedCount++;
        
        if (processedCount === uploadedDocFiles.length) {

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
  console.log('ðŸ“¤ Sharing document:', shareData);

  const documentToShare = userDocuments.find(doc => doc.id === shareData.documentId);
  
  if (!documentToShare) {
    alert('âŒ Error: Document not found');
    return;
  }

  const newShare = {
    id: 'share-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    documentId: shareData.documentId,
    document: documentToShare,
    sharedWith: shareData.sharedWith, 
    sharedBy: shareData.sharedBy,
    permission: shareData.permission,
    message: shareData.message,
    sharedAt: shareData.sharedAt
  };
  console.log('âœ… Created share object:', newShare);
  if (dataStore) {
    dataStore.addDirectShare(newShare);
    
    const recipientNames = shareData.sharedWith
      .map(userId => {
        const user = allUsers.find(u => u.id === userId);
        return user ? user.name : userId;
      })
      .join(', ');

    addAuditLog(
      'Document Shared (Direct)',
      `"${documentToShare.title}" shared with ${recipientNames} (${shareData.permission} access)`,
      'Success'
    );

    console.log('âœ… Share saved to DataStore');
  } else {
    console.error('âŒ DataStore not available');
  }

  alert(`âœ… Document "${documentToShare.title}" successfully shared with ${shareData.sharedWith.length} user(s)!`);
  setShowShareModal(false);
  setDocumentToShare(null);
};


  const openShareModal = (doc) => {
  console.log('ðŸ“‚ Opening share modal for:', doc.title);
  setDocumentToShare(doc);
  setShowShareModal(true);
};  


  const handleRemoveShare = (shareId) => {
  if (!window.confirm('Are you sure you want to stop sharing this document?')) {
    return;
  }

  if (dataStore) {
    const share = dataStore.getAllDirectShares().find(s => s.id === shareId);
    
    dataStore.removeDirectShare(shareId);
    if (share) {
      addAuditLog(
        'Share Removed',
        `Stopped sharing "${share.document?.title || 'Unknown'}"`,
        'Success'
      );
    }

    alert('âœ… Share removed successfully!');
  }
};



  
 const handleSendToOrganization = (doc) => {
  console.log('ðŸ¢ Opening organization share modal for:', doc.title);
  setSelectedDocForOrgShare(doc);
  setShowSendToOrgModal(true);
};
const handleConfirmSendToOrganization = (shareData) => {
  console.log('ðŸ¢ Sending to organization:', shareData);

  const documentToShare = userDocuments.find(d => d.id === shareData.documentId);
  
  if (!documentToShare) {
    alert('âŒ Error: Document not found');
    return;
  }

  const newShare = {
    id: 'org-share-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    documentId: shareData.documentId,
    document: documentToShare,
    recipients: shareData.recipients,
    distributionMode: shareData.distributionMode,
    selectedUnits: shareData.selectedUnits,
    message: shareData.message,
    sentBy: shareData.sentBy,
    sentFrom: shareData.sentFrom,
    sentAt: shareData.sentAt
  };

  console.log('âœ… Created org share:', newShare);
  if (dataStore) {
    dataStore.addOrgShare(newShare);
    addAuditLog(
      'Organization Distribution',
      `Document: "${documentToShare.title}" sent to ${newShare.recipients.length} recipients via ${shareData.distributionMode}`,
      'Success'
    );

    console.log('âœ… Org share saved to DataStore');
  } else {
    console.error('âŒ DataStore not available');
  }
  alert(`âœ… Document "${documentToShare.title}" successfully sent to ${shareData.recipients.length} user(s) in your organization!`);

  setShowSendToOrgModal(false);
  setSelectedDocForOrgShare(null);
};
const handleSaveToMyDocuments = (document, source) => {
  if (!document) {
    alert('âŒ Invalid document');
    return;
  }
  const existingDoc = userDocuments.find(doc => 
    doc.originalDocumentId === document.id && doc.createdBy === currentUser.id
  );

  if (existingDoc) {
    const shouldProceed = window.confirm(
      `You've already saved this document as "${existingDoc.title}". Do you want to save another copy?`
    );
    if (!shouldProceed) return;
  }
  const savedDoc = {
    ...document,
    id: Date.now().toString() + '-saved-' + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toLocaleString(),
    createdBy: currentUser.id,
    savedFrom: source,
    originalDocumentId: document.id,
    originalCreatedBy: document.createdBy,
    originalCreatedAt: document.createdAt,
    folderId: null
  };

  console.log('ðŸ’¾ Saving shared document:', savedDoc);
  if (dataStore) {
    dataStore.addDocument(savedDoc);
    addAuditLog(
      'Document Saved from Shared',
      `"${savedDoc.title}" - Saved from ${source === 'org-share' ? 'Organization Share' : 'Direct Share'}`,
      'Success'
    );
    
    console.log('âœ… Document saved to My Documents');
    
    const goToMyDocs = window.confirm(
      `âœ… Document "${document.title}" has been saved to your "My Documents"!\n\nWould you like to go to My Documents now?`
    );
    
    if (goToMyDocs) {
      setActiveSection('documents');
      setCurrentFolder(null);
    }
  } else {
    console.error('âŒ DataStore not available');
    alert('âŒ Error: Could not save document');
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

     <UserChangePasswordModal
     show={showChangePasswordModal}
     onClose={() => setShowChangePasswordModal(false)}
     currentUser={currentUser}
     onChangePassword={handleChangePassword}
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

      <SendToOrganizationModal
        show={showSendToOrgModal}
        onClose={() => {
          setShowSendToOrgModal(false);
          setSelectedDocForOrgShare(null);
        }}
        document={selectedDocForOrgShare}
       organizationTree={orgTree}
        userList={allUsers}
        currentUser={currentUser}
        onSendToOrganization={handleConfirmSendToOrganization}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
        dataStore={dataStore}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeSection={activeSection}
          menuItems={menuItems}
          currentUser={currentUser}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          onLogout={onLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
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
              onOpenDocument={handleOpenDocument}
              onDeleteDocument={handleDeleteDocument}
              onDownloadDocument={handleDownloadDocument}
              onPrintDocument={handlePrintDocument}
              onMoveToFolder={openMoveToFolderModal}
              onShareDocument={openShareModal}
              onSendToOrganization={handleSendToOrganization}
            />
          )}
          {activeSection === 'shared' && (
            <SharedDocuments
              sharedDocuments={sharedDocuments}
              organizationShares={organizationShares}
              currentUser={currentUser}
              onOpenDocument={handleOpenDocument}
              onRemoveShare={handleRemoveShare}
              allUsers={allUsers}
               organizationTree={orgTree}
               onSaveToMyDocuments={handleSaveToMyDocuments}
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
          {activeSection === 'tags' && (
           <TagManagement dataStore={dataStore} />
          )}
          {activeSection === 'recycle-bin' && (
           <RecycleBin
            deletedDocuments={dataStore ? dataStore.getDeletedDocuments() : []}
            currentUser={currentUser}
           onRestore={handleRestoreDocument}
           onPermanentDelete={handlePermanentDelete}
           onEmptyBin={handleEmptyRecycleBin}
         />
          )}
        </div>
      </div>
    </div>
  );
}


