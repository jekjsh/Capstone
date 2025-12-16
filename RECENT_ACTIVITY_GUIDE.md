# Recent Activity Implementation Guide

## What We Created

### Backend Components

#### 1. **ActivityLog Model** (`backend/authenticator/models.py`)
- Tracks all user activities (login, logout, document actions)
- Fields: user, action, target_doc, log_timestamp, ip_address
- Automatically logs with timestamps
- Indexed for fast queries

#### 2. **ActivityLogSerializer** (`backend/authenticator/serializers.py`)
- Serializes ActivityLog data with user details
- Returns: id, user_id, username, action, action_display, target_doc, log_timestamp, ip_address

#### 3. **API Endpoints** (`backend/authenticator/views.py`)
- `POST /auth/login-event/` - Logs user login (creates LoginLog + ActivityLog)
- `POST /auth/logout-event/` - Logs user logout (creates ActivityLog)
- `POST /auth/log-activity/` - Generic endpoint to log any activity (document actions)
- `GET /auth/recent-activity/` - Returns last 50 activities for admin dashboard

#### 4. **Django Admin Integration** (`backend/authenticator/admin.py`)
- ActivityLog registered in Django admin with:
  - List view showing user, action, target, timestamp, IP
  - Searchable by username, target_doc, action
  - Filterable by action type and date
  - Read-only fields (can't be edited after creation)

### Frontend Components

#### 1. **RecentActivity Component** (`frontend/src/admin/component/RecentActivity.jsx`)
- Beautiful table showing recent activities
- Auto-refreshes every 30 seconds
- Color-coded action badges:
  - Login/Logout: Green/Red
  - Create/Edit/Delete: Blue/Yellow/Red
  - View/Download/Share: Gray/Purple/Indigo
- Relative timestamps (e.g., "2m ago")
- Manual refresh button
- Loading states and error handling

#### 2. **Activity Logger Utility** (`frontend/src/activityLogger.js`)
- Helper functions to log activities from anywhere in the app:
  - `logActivity(action, targetDoc)` - Generic logger
  - `logDocumentAction(action, docName)`
  - `logViewAction(docName)`
  - `logEditAction(docName)`
  - `logCreateAction(docName)`
  - `logDeleteAction(docName)`
  - `logDownloadAction(docName)`
  - `logShareAction(docName)`
  - `logUploadAction(docName)`

#### 3. **Updated AdminDashboard** 
- Now includes RecentActivity table below stats cards
- Shows real-time activity from all users

## How to Use

### To Log Activities

In any React component, import and use the activity logger:

```javascript
import { logViewAction, logEditAction, logDownloadAction } from '../../activityLogger';

// When user views a document
await logViewAction('Project_Report.pdf');

// When user edits a document  
await logEditAction('Project_Report.pdf');

// When user downloads a document
await logDownloadAction('Project_Report.pdf');
```

### Automatic Logging

Login/logout events are automatically logged when users authenticate.

## Database Schema

```
ActivityLog Table
├── id (PK)
├── user_id (FK to CustomUser)
├── action (CharField: login, logout, create, view, edit, delete, download, share, upload)
├── target_doc (CharField - document name or ID, optional)
├── log_timestamp (DateTimeField - auto set on creation)
└── ip_address (GenericIPAddressField - optional)
```

## Admin Dashboard View

The admin dashboard now shows:
- **Stats Cards**: Total Users, Documents, Active Sessions, Audit Logs
- **Recent Activity Table**: All user actions with:
  - Username (who did it)
  - Action (what they did)
  - Target/Document (what it affected)
  - IP Address (where from)
  - Time (when it happened)

## Testing

1. **Login to admin dashboard** - You should see "Login" activity in Recent Activity
2. **Visit any page** - Add a logViewAction() call to test
3. **Edit a document** - Add a logEditAction() call
4. **Logout** - You should see "Logout" activity

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login-event/` | POST | Record login (auto called) |
| `/auth/logout-event/` | POST | Record logout (auto called) |
| `/auth/log-activity/` | POST | Log custom activity |
| `/auth/recent-activity/` | GET | Get last 50 activities |

All endpoints require authentication (Bearer token).

## Example POST Request

```bash
curl -X POST http://localhost:8000/auth/log-activity/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "target_doc": "New_Document.pdf"}'
```
