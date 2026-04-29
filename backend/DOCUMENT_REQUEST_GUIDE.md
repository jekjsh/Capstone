# Document Request System Guide

## Overview

The document request system allows users and admins to formally request document access and share documents between organization levels. It supports three main request scenarios:

1. **Regular User Request** - Users request documents from their own organization
2. **Admin Organization Request** - Organization admins request documents from their own organization
3. **Child Org Letter Request** - Child organization admins request document letters from their parent organization

---

## Request Types and Endpoints

### 1. Regular Document Approval Request
**Endpoint:** `POST /api/documents/approval-requests/`

**Purpose:** Regular users request document access from their organization

**Request Body:**
```json
{
    "doc": 1,
    "approval_message": "I need access to this document for reporting"
}
```

**Response:** DocumentApprovalRequest object with status "pending"

**Workflow:**
- User submits the request
- Request is marked as "pending"
- Organization admins are notified
- Admins can approve, deny, or pass to parent organization

**Permissions:** Authenticated users within an organization

---

### 2. Admin Request from Organization
**Endpoint:** `POST /api/documents/approval-requests/admin_request_from_organization/`

**Purpose:** Organization admins formally request documents from their own organization on behalf of the organization

**Request Body:**
```json
{
    "doc_id": 1,
    "approval_message": "Requesting document for official records"
}
```

**Response:** DocumentApprovalRequest object with status "pending"

**Workflow:**
- Admin submits request on behalf of organization
- Request is marked as "pending"
- Other organization admins are notified (excluding requester)
- Other admins can approve or deny the request
- Document is not automatically shared

**Permissions:** Organization admin role required

**Notes:**
- Request stays within the organization
- Does not automatically pass to parent org
- Other admins must review and approve
- Useful for official document requests within organization

---

### 3. Document Letter Request from Parent
**Endpoint:** `POST /api/documents/approval-requests/request_letter_from_parent/`

**Purpose:** Child organization admins request document letters from their parent organization

**Request Body:**
```json
{
    "doc_id": 1,
    "approval_message": "Requesting certified copy for submission"
}
```

**Response:** DocumentApprovalRequest object with status "passed_to_higher"

**Workflow:**
- Child org admin submits request
- Request is automatically passed to parent organization (status = "passed_to_higher")
- Document is automatically shared with all parent org admins
- Parent org admins are notified
- Parent admins can approve or deny directly
- No intermediate pending step

**Permissions:** Child organization admin role required

**Special Features:**
- ✅ Automatically passes to parent organization
- ✅ Document automatically shared with parent admins
- ✅ Parent admins notified immediately
- ✅ Prevents duplicate requests to same parent org
- ✅ Skips pending status (goes straight to passed_to_higher)

**Requirements:**
- User must be organization admin
- Organization must have a parent (cannot be root organization)
- Document must not have a pending request to parent org already

**Error Cases:**
- 403: User is not an organization admin
- 404: Document not found
- 400: Organization is root (no parent)
- 400: Document already has pending request to parent

---

## Request Status Lifecycle

### Regular User Request
```
pending → (admin approves) → approved [shared with requester]
       ↓  (admin denies)   → denied
       ↓  (admin passes)   → passed_to_higher [goes to parent]
```

### Admin Organization Request
```
pending → (other admin approves) → approved [not auto-shared]
       ↓  (other admin denies)   → denied
```

### Child Org Letter Request (Special)
```
passed_to_higher [automatically, status created as passed_to_higher]
       ↓ (parent admin approves) → approved [shared with parent admins]
       ↓ (parent admin denies)   → denied
```

---

## Key Features

### Automatic Sharing
When a request is approved, the document is automatically shared with:
- The requester (for pending → approved)
- All parent org admins (for passed_to_higher → approved)

### Notifications
- Org admins notified when regular users submit requests
- Other admins notified when admin requests document
- Parent org admins notified when child org requests letter
- Requester notified when request is approved/denied

### Audit Logging
All document requests are logged with:
- User who submitted request
- Action type (Request, Approve, Deny, Pass to Higher)
- Document name
- Timestamp
- Success/failure status

### Permission Checks
- **Create Request:** User must belong to an organization
- **Admin Actions:** User must have "admin" role
- **Pass to Higher:** Can only pass own organization requests
- **Parent Request:** Organization must have parent org

---

## Usage Examples

### Example 1: Regular User Requests Document
```
User 1 (Regular) → Requests Document A from Org-A
  ↓
Org-A Admins receive notification
  ↓
Admin approves → Document A is shared with User 1
```

### Example 2: Admin Requests Document for Organization
```
Admin of Org-A → Requests Document B for Org-A
  ↓
Other Org-A Admins receive notification
  ↓
Admin approves → Status is approved but not auto-shared
```

### Example 3: Child Org Requests Letter from Parent
```
Admin of Org-A (Child) → Requests Document C letter from Org-B (Parent)
  ↓
Request created with status="passed_to_higher"
  ↓
Document automatically shared with all Org-B Admins
  ↓
Org-B Admins receive notification
  ↓
Org-B Admin approves/denies
```

### Example 4: Complex Hierarchy
```
User in Org-C (Child of B) → Requests Document from Org-C
  ↓
Org-C Admin receives notification
  ↓
Org-C Admin passes to Org-B (Parent)
  ↓
Request status="passed_to_higher"
  ↓
Org-B Admins receive notification
  ↓
Org-B Admin can approve/deny for Org-C
```

---

## API Response Fields

### DocumentApprovalRequest Serialization
```json
{
    "approval_id": 1,
    "doc": 5,
    "doc_name": "Employee Records",
    "requested_by_user": {
        "user_index": 2,
        "user_id": "EMP001",
        "first_name": "John",
        "last_name": "Doe"
    },
    "requested_org": {
        "org_id": 1,
        "org_name": "Finance Department",
        "org_code": "FIN"
    },
    "requesting_org": {
        "org_id": 1,
        "org_name": "Finance Department",
        "org_code": "FIN"
    },
    "approval_message": "Need for quarterly report",
    "status": "pending",
    "reviewed_by_user": null,
    "review_message": null,
    "created_at": "2026-04-28T10:30:00Z",
    "reviewed_at": null,
    "passed_to_org": null
}
```

---

## Common Scenarios

### Scenario 1: Cross-Organization Document Sharing
**Goal:** Get a document from parent organization

1. Child org admin calls `request_letter_from_parent`
2. Request automatically passes to parent
3. Parent admin approves
4. Document is shared

### Scenario 2: Internal Organization Decision
**Goal:** Get approval for document request within organization

1. Admin calls `admin_request_from_organization`
2. Request stays pending in organization
3. Other admins review and approve
4. Document may be shared based on admin's follow-up action

### Scenario 3: Escalating a Request
**Goal:** Pass user's request to parent organization

1. User submits regular request
2. Org admin reviews request
3. Admin calls `pass_to_higher` action
4. Request is passed to parent organization
5. Parent org admins review

---

## Security Considerations

1. **Organization Boundary:** Requests cannot cross organization boundaries without explicit hierarchy
2. **Admin Validation:** Admin actions require verified admin role
3. **Document Access:** Shared documents are tied to specific users/organizations
4. **Audit Trail:** All actions are logged for compliance
5. **Notification Security:** Only organization members receive notifications about their org's requests

---

## Troubleshooting

### Problem: "Cannot request from higher authority"
**Solution:** Ensure your organization has a parent organization configured

### Problem: "Pending approval request already exists"
**Solution:** Check if there's already a request for this document. Complete or deny the existing request first

### Problem: "Only organization admins can..."
**Solution:** Ensure your account has the admin role in the organization

### Problem: Document not shared after approval
**Solution:** Check the request status. Sharing happens automatically only for specific status transitions

---

## Future Enhancements

Potential improvements to consider:
- Batch document requests
- Request expiration/timeout
- Request priority levels
- Scheduled/recurring requests
- Document version history in requests
- Request delegation to other admins
- Request templates for common scenarios
