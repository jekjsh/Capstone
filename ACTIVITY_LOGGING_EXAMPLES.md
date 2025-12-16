# Activity Logging Integration Examples

## Example 1: Log When User Views a Document

```javascript
import { logViewAction } from '../../activityLogger';

export default function DocumentViewer({ document }) {
  useEffect(() => {
    // Log that the user viewed this document
    logViewAction(document.name);
  }, [document.id]);

  return (
    <div>
      <h2>{document.name}</h2>
      {/* document content */}
    </div>
  );
}
```

## Example 2: Log When User Creates a Document

```javascript
import { logCreateAction } from '../../activityLogger';

const handleCreateDocument = async (docName) => {
  try {
    // Create the document
    const response = await api.post('/documents/', { name: docName });
    
    // Log the activity
    await logCreateAction(docName);
    
    // Show success
    console.log('Document created:', response.data);
  } catch (error) {
    console.error('Error creating document:', error);
  }
};
```

## Example 3: Log When User Edits a Document

```javascript
import { logEditAction } from '../../activityLogger';

const handleSaveDocument = async (documentId, content) => {
  try {
    // Save the document
    const response = await api.put(`/documents/${documentId}/`, { content });
    
    // Log the activity
    await logEditAction(response.data.name);
    
    // Show success message
    showToast('Document saved successfully');
  } catch (error) {
    console.error('Error saving document:', error);
  }
};
```

## Example 4: Log When User Downloads a Document

```javascript
import { logDownloadAction } from '../../activityLogger';

const handleDownloadDocument = async (documentId, docName) => {
  try {
    // Fetch and download the file
    const response = await api.get(`/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', docName);
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
    
    // Log the activity
    await logDownloadAction(docName);
  } catch (error) {
    console.error('Error downloading document:', error);
  }
};
```

## Example 5: Log When User Deletes a Document

```javascript
import { logDeleteAction } from '../../activityLogger';

const handleDeleteDocument = async (documentId, docName) => {
  if (!window.confirm(`Are you sure you want to delete ${docName}?`)) {
    return;
  }
  
  try {
    // Delete the document
    await api.delete(`/documents/${documentId}/`);
    
    // Log the activity
    await logDeleteAction(docName);
    
    // Refresh list
    fetchDocuments();
    
    showToast(`${docName} deleted successfully`);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};
```

## Example 6: Log When User Shares a Document

```javascript
import { logShareAction } from '../../activityLogger';

const handleShareDocument = async (documentId, docName, shareWith) => {
  try {
    // Share the document
    await api.post(`/documents/${documentId}/share/`, {
      shared_with: shareWith
    });
    
    // Log the activity
    await logShareAction(`${docName} (with ${shareWith})`);
    
    showToast('Document shared successfully');
  } catch (error) {
    console.error('Error sharing document:', error);
  }
};
```

## Example 7: Log Multiple Actions in a Workflow

```javascript
import { logActivity } from '../../activityLogger';

const handleComplexWorkflow = async (documentId, docName) => {
  try {
    // Step 1: Upload new version
    await api.post(`/documents/${documentId}/upload-version/`, formData);
    await logActivity('upload', `${docName} - version updated`);
    
    // Step 2: Edit metadata
    await api.put(`/documents/${documentId}/`, { category: 'Important' });
    await logActivity('edit', `${docName} - metadata updated`);
    
    // Step 3: Share with team
    await api.post(`/documents/${documentId}/share/`, { shared_with: 'Team' });
    await logActivity('share', `${docName} - shared with Team`);
    
    showToast('Workflow completed');
  } catch (error) {
    console.error('Workflow error:', error);
  }
};
```

## Example 8: Using with Button Click Handlers

```javascript
import { logDownloadAction, logDeleteAction } from '../../activityLogger';

export default function DocumentActions({ document }) {
  const handleDownload = async () => {
    try {
      // Download logic
      const blob = await fetchDocument(document.id);
      downloadFile(blob, document.name);
      
      // Log after successful download
      await logDownloadAction(document.name);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this document?')) return;
    
    try {
      await api.delete(`/documents/${document.id}/`);
      await logDeleteAction(document.name);
      // Refresh list or navigate away
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} className="btn btn-primary">
        Download
      </button>
      <button onClick={handleDelete} className="btn btn-danger">
        Delete
      </button>
    </div>
  );
}
```

## Notes

- All logging is **asynchronous** but won't break the app if it fails (try/catch is internal)
- Log messages appear in **browser console** with `[ActivityLogger]` prefix for debugging
- Failed logs are logged to console but won't interrupt user workflow
- Activity logs are stored in database within **milliseconds** of being created
- Admin can view all activities in **Recent Activity** table on dashboard
- Activities are **read-only** in Django admin (can't be edited or deleted after creation for audit trail integrity)

## Common Patterns

### Pattern 1: Log on Mount (View Action)
```javascript
useEffect(() => {
  logViewAction('PageName');
}, []);
```

### Pattern 2: Log on Button Click
```javascript
const handleAction = async () => {
  await doSomething();
  await logActivity('action_type', 'target');
};
```

### Pattern 3: Log with Error Handling
```javascript
try {
  await doSomething();
  await logActivity('action', 'target');
} catch (error) {
  console.error(error);
  // Activity logging failure won't break the flow
}
```

### Pattern 4: Log in Success Callback
```javascript
api.post('/endpoint/')
  .then(response => {
    logActivity('action', 'target');
    return response;
  })
  .catch(error => {
    console.error(error);
  });
```
