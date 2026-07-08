# RKMS Figma Design Specification

## Table of Contents
1. [System Overview](#system-overview)
2. [Design System](#design-system)
3. [User Roles & Flows](#user-roles--flows)
4. [Key Screens](#key-screens)
5. [Component Library](#component-library)
6. [Interactive States](#interactive-states)

---

## System Overview

### Application Type
Records and Knowledge Management System (RKMS) - Multi-role document management platform

### Key Features
- **User Authentication**: Login with 2FA support
- **Document Management**: Upload, organize, share documents
- **Organizational Structure**: Hierarchical org units with permission management
- **Admin Features**: User management, approval workflows, audit logs
- **System Admin Features**: System-wide customization, branding, ID formatting
- **Access Control**: Role-based permissions (User, Admin, System Admin)

### Target Users
- **End Users**: Document upload, management, sharing
- **Admins**: User management, document approval, organization oversight
- **System Admins**: System configuration, branding, user creation requests

---

## Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: #007ACC (Actions, links, primary buttons)
- **Secondary Blue**: #0E90D4 (Hover states, active states)
- **Accent Blue**: #1BA1E2 (Highlights, badges)

#### Semantic Colors
- **Success Green**: #107C10
- **Warning Orange**: #FFB900
- **Error Red**: #E81123
- **Info Blue**: #0078D4

#### Neutral Colors
- **Dark Gray**: #333333
- **Medium Gray**: #757575
- **Light Gray**: #F3F3F3
- **White**: #FFFFFF
- **Black**: #000000

#### Customizable Theme
- Allow system admins to customize:
  - Primary brand color
  - Accent colors
  - Logo and branding assets

### Typography

#### Font Family
- **Primary**: Segoe UI, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif
- **Monospace**: "Courier New", monospace (for IDs, technical info)

#### Font Sizes & Styles
- **H1 (Page Title)**: 32px, Bold (600)
- **H2 (Section Title)**: 24px, Bold (600)
- **H3 (Subsection)**: 20px, Semi-bold (500)
- **Body Large**: 16px, Regular (400)
- **Body**: 14px, Regular (400)
- **Small/Caption**: 12px, Regular (400)
- **Label**: 13px, Medium (500)

### Spacing System

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Border & Radius
- **Border Radius**: 4px (inputs), 6px (cards), 8px (modals)
- **Border Width**: 1px (default), 2px (focus state)
- **Border Color**: #E0E0E0

### Shadows
- **Elevation 1**: 0px 2px 8px rgba(0,0,0,0.08)
- **Elevation 2**: 0px 4px 16px rgba(0,0,0,0.12)
- **Elevation 3**: 0px 8px 24px rgba(0,0,0,0.15)

---

## User Roles & Flows

### User Flow Diagram

```
ENTRY POINT (All Users)
    ↓
Login/Register
    ↓
    ├─→ System Asks for Password Change? → Update Password → Continue
    ├─→ 2FA Required? → Enter 2FA Code → Continue
    └─→ Continue
    ↓
ROLE-BASED ROUTING
    ├─→ END USER → User Dashboard → Document Management
    ├─→ ADMIN → Admin Dashboard → User/Document/Approval Management
    └─→ SYSTEM ADMIN → System Dashboard → System Config & Customization
```

### Role-Based Access Matrix

| Feature | User | Admin | System Admin |
|---------|------|-------|-------------|
| View Documents | ✓ | ✓ | ✓ |
| Upload Documents | ✓ | ✓ | ✓ |
| Create Folders | ✓ | ✓ | ✓ |
| Share Documents | ✓ | ✓ | ✓ |
| Approve Documents | ✗ | ✓ | ✓ |
| Manage Users | ✗ | ✓ | ✓ |
| View Audit Logs | ✗ | ✓ | ✓ |
| System Customization | ✗ | ✗ | ✓ |
| ID Format Configuration | ✗ | ✗ | ✓ |
| Manage Org Units | ✗ | ✓ | ✓ |

---

## Key Screens

### 1. Authentication Screens

#### 1.1 Login Screen
**Path**: `/`
**Purpose**: Initial user authentication

**Layout**:
- Centered card (400px width)
- System branding area (logo + system name)
- Email input field
- Password input field (with show/hide toggle)
- Remember me checkbox
- Login button (full width)
- Register link

**States**:
- Default
- Loading (button spinner)
- Error (red border on input, error message below)
- Success (redirect)

**Elements**:
- Logo image container
- System title (large)
- Form inputs with labels
- Error message box
- Submit button
- "Forgot password?" link
- "Don't have an account?" → Register link

---

#### 1.2 Registration Screen
**Path**: `/register`
**Purpose**: New user registration

**Layout**:
- Similar to login but with additional fields
- Multi-step (if needed)

**Form Fields**:
- First Name
- Last Name
- Email
- Contact Number
- Date of Birth
- Organization (dropdown)
- Position/Role
- Department
- Password
- Confirm Password
- Terms acceptance checkbox

**Validation States**:
- Required field indicators
- Real-time validation feedback
- Error states

---

#### 1.3 Two-Factor Authentication Screen
**Path**: `/verify-2fa`
**Purpose**: 2FA code entry

**Layout**:
- 6-digit code input (individual digit boxes)
- Resend code button (disabled for 30s)
- Back to login link

**States**:
- Entering code
- Code sent (show timer)
- Error (invalid code)
- Verified (redirect)

---

#### 1.4 Password Change Screen
**Path**: `/change-password` (forced on first login)
**Purpose**: Required password update

**Layout**:
- Card with warning icon
- Title: "You must change your password"
- Current password field
- New password field (with strength indicator)
- Confirm password field
- Submit button
- Password requirements checklist

**Password Strength Indicator**:
- Red (weak)
- Orange (fair)
- Green (strong)

---

### 2. User Dashboard & Document Management

#### 2.1 User Main Frame Layout
**Components**:
- Header (sticky top)
  - Logo/branding
  - Search bar
  - Notifications bell
  - User menu
  - Logout button
- Sidebar (collapsible)
  - My Documents
  - Shared with Me
  - Trash/Recycle Bin
  - Help/Documentation
- Main Content Area
  - Active section content

---

#### 2.2 Documents View
**Path**: `/user/documents`
**Purpose**: View and manage personal documents

**Layout**:
- Breadcrumb navigation
- Toolbar (Create Folder, Upload File, View Options)
- Document grid/list toggle
- Filter and sort options
- Document cards showing:
  - Thumbnail/icon
  - File name
  - Upload date
  - File size
  - Shared status indicator
  - Context menu (3 dots)

**Context Menu Options**:
- Download
- Share
- Move to folder
- Delete/Move to Trash
- Rename
- Properties

**Upload Modal States**:
- Drag & drop zone
- File browser
- Progress indicator
- Success confirmation

---

#### 2.3 Folder Management
**Features**:
- Create folder modal
- Nested folder view
- Folder breadcrumbs
- Rename folder modal
- Delete folder modal

**Create Folder Modal**:
- Input field for folder name
- Category dropdown
- Cancel/Create buttons

---

#### 2.4 Shared Documents
**Path**: `/user/shared-documents`
**Purpose**: View documents shared with user

**Layout**:
- Documents shared BY user
- Documents shared WITH user
- Tabs to switch between both views

**Each Shared Document Shows**:
- Document name
- Shared by/with user name
- Shared date
- Expiration date (if applicable)
- Revoke/accept button

---

#### 2.5 Recycle Bin
**Path**: `/user/trash`
**Purpose**: Recover or permanently delete items

**Layout**:
- List of deleted documents
- Empty state illustration
- Delete date, file size
- Actions: Restore, Permanently Delete

---

#### 2.6 Edit Profile Modal
**Purpose**: User profile management

**Form Fields**:
- First Name
- Last Name
- Contact Number
- Email (read-only)
- Organization (read-only)
- Position
- Avatar upload
- Save/Cancel buttons

---

### 3. Admin Dashboard

#### 3.1 Admin Main Frame Layout
**Components**:
- Header (matching user layout)
- Sidebar with admin-specific options:
  - Dashboard
  - User Management
  - Document Management
  - Approval Requests
  - Organization Structure
  - Organizational Shares
  - Audit Logs
  - Reports
  - Customization

---

#### 3.2 Admin Dashboard
**Path**: `/admin/dashboard`
**Purpose**: Overview of system activity

**Widgets**:
- Total users count
- Total documents count
- Pending approvals count
- Recent activities (table)
- Audit log chart (activity over time)
- Top shared documents
- System health status

**Layout**: Grid of cards/widgets

---

#### 3.3 User Management
**Path**: `/admin/users`
**Purpose**: Manage system users

**Layout**:
- Search/filter bar
- User table with columns:
  - Name
  - Email
  - Organization
  - Role
  - Status (Active/Inactive)
  - Actions

**Actions Column**:
- Edit user
- View user documents
- Disable/Enable user
- Reset password
- Delete user
- Send notification

**User Edit Modal**:
- Name fields
- Email
- Organization
- Role dropdown
- Status toggle
- Save/Cancel

**Add User Modal/Request**:
- First Name
- Last Name
- Email
- Organization
- Role
- Department
- Date of Birth
- Contact Number

---

#### 3.4 Approval Requests
**Path**: `/admin/approvals`
**Purpose**: Manage document/action approvals

**Layout**:
- Filter: Pending, Approved, Rejected
- Request list with columns:
  - Document name
  - Requested by
  - Request date
  - Status (badge)
  - Actions (Approve, Reject, View)

**Request Detail View**:
- Document preview
- Requester info
- Approval comments
- Approval/Rejection buttons
- Comment box for feedback

---

#### 3.5 Organization Structure
**Path**: `/admin/org-structure`
**Purpose**: Manage organizational hierarchy

**Layout**:
- Tree view or hierarchical display
- Org unit cards showing:
  - Unit name
  - Manager name
  - Member count
  - Edit/Delete buttons

**Add/Edit Org Unit Modal**:
- Unit name
- Description
- Parent unit (dropdown)
- Manager (user dropdown)
- Status
- Save/Cancel

---

#### 3.6 Organizational Shares
**Path**: `/admin/org-shares`
**Purpose**: Manage organization-wide document sharing

**Layout**:
- Share records with:
  - Document name
  - Shared with (org unit)
  - Shared by (user)
  - Shared date
  - Status
  - Actions (View, Revoke)

---

#### 3.7 Audit Logs
**Path**: `/admin/audit-logs`
**Purpose**: Track system activities

**Layout**:
- Filter by:
  - Date range (calendar picker)
  - User
  - Action type
  - Resource type
- Log table with columns:
  - Timestamp
  - User
  - Action
  - Resource
  - Details
  - Status

**Log Entry Detail**:
- Full action description
- Before/after values
- IP address
- User agent

---

#### 3.8 Customization
**Path**: `/admin/customization`
**Purpose**: Customize organization appearance

**Tabs**:
- **Branding**
  - Logo upload
  - Organization name
  - System abbreviation
  - Organization description
- **Colors**
  - Primary color picker
  - Secondary color picker
  - Accent color picker
  - Preview pane
- **Interface**
  - Theme selection
  - Font size adjustment
  - Sidebar width toggle

---

### 4. System Admin Dashboard

#### 4.1 System Admin Main Frame
**Components**: Similar structure to admin but with system-wide options
- Sidebar options:
  - Dashboard
  - User Management
  - User Creation Requests
  - Organizational Structure
  - System Customization
  - ID Format Configuration
  - Audit Logs
  - Notifications

---

#### 4.2 System Admin Dashboard
**Path**: `/system-admin/dashboard`
**Purpose**: System-wide overview

**Widgets**:
- Total active users
- Total organizations
- System uptime
- Total storage used
- Recent system activities
- User creation requests pending
- System health metrics

---

#### 4.3 User Creation Requests
**Path**: `/system-admin/requests`
**Purpose**: Approve/reject user creation requests

**Layout**:
- Filter: Pending, Approved, Rejected
- Request list with:
  - Requester name
  - Requested user details
  - Organization
  - Request date
  - Status
  - Actions

**Request Detail Modal**:
- Requested user information
- Requesting admin info
- Approve/Reject buttons
- Feedback text area

**Approval Action**:
- Create user
- Send welcome email
- Set initial password

---

#### 4.4 System Customization
**Path**: `/system-admin/customization`
**Purpose**: System-wide branding and settings

**Tabs**:
- **Branding**
  - System logo upload
  - System name
  - System abbreviation
  - Default organization name
  - Website URL
  - Support email
- **Colors**
  - Primary brand color
  - Secondary color
  - Accent color
  - Dark mode toggle
  - Preview pane
- **Interface**
  - Default theme
  - Font selection
  - Sidebar behavior
- **Preview**
  - Live preview of current customization

---

#### 4.5 ID Format Configuration
**Path**: `/system-admin/id-formatter`
**Purpose**: Configure ID generation patterns

**Layout**:
- ID Format rules list:
  - Pattern name
  - Prefix
  - Format
  - Current count
  - Edit/Delete buttons

**Add/Edit ID Format Modal**:
- Pattern name
- Prefix
- Format template (e.g., {ORG}-{YEAR}-{SEQ})
- Reset count button
- Save/Cancel

---

#### 4.6 System Admin Notifications
**Path**: `/system-admin/notifications`
**Purpose**: View and manage system notifications

**Layout**:
- Notification center
- Filter: All, Unread, System, User activity
- Notification list with:
  - Notification type (icon)
  - Message
  - Timestamp
  - Status (read/unread)
  - Actions

---

## Component Library

### Buttons

#### Primary Button
- Background: Primary Blue (#007ACC)
- Text: White
- Padding: 10px 16px
- Border Radius: 4px
- Font Weight: 600

**States**:
- Default
- Hover (darker shade)
- Active (pressed)
- Disabled (grayed out)
- Loading (with spinner)

#### Secondary Button
- Background: Light Gray (#F3F3F3)
- Text: Dark Gray (#333333)
- Border: 1px solid Medium Gray

#### Danger Button
- Background: Error Red (#E81123)
- Text: White

#### Icon Button
- Size: 40x40px
- Icon centered
- Hover: Slight background shade

---

### Input Fields

#### Text Input
- Height: 40px
- Padding: 8px 12px
- Border: 1px solid #E0E0E0
- Font Size: 14px
- Border Radius: 4px

**States**:
- Default (gray border)
- Focus (blue border, 2px)
- Filled (with value)
- Error (red border, error message below)
- Disabled (grayed background)
- Loading (spinner inside)

#### Text Area
- Height: 100px (resizable)
- Similar styling to text input
- Resize handle at bottom right

#### Select Dropdown
- Similar height to text input
- Dropdown icon on right
- Expanded state shows options in list
- Search in dropdown (if many options)

#### Checkbox
- Size: 18x18px
- Checked state: Blue background with white checkmark
- Indeterminate state: Blue background with white dash

#### Radio Button
- Size: 18x18px (outer circle)
- Selected state: Blue outer + blue inner dot
- Groups of related options

#### Toggle Switch
- Width: 44px, Height: 24px
- Off: Gray background with white circle on left
- On: Blue background with white circle on right

#### Date Picker
- Text input with calendar icon
- Click opens calendar modal
- Select date, returns formatted date string

---

### Cards

#### Document Card
- Width: 160px (grid view)
- Shadow: Elevation 1
- Border Radius: 6px
- Content:
  - Document icon/thumbnail (120px)
  - File name (truncated)
  - File size (small text)
  - Date (small text)
  - Hover: Context menu appears

#### Info Card
- Padding: 16px
- Border: 1px solid #E0E0E0
- Background: White
- Border Radius: 6px
- Shadow: Elevation 1
- Title: 16px, bold
- Content: 14px, regular

---

### Modals

#### Modal Structure
- Overlay: Transparent black (50% opacity)
- Card: White background
- Border Radius: 8px
- Shadow: Elevation 3
- Max Width: 600px
- Padding: 24px

**Header**:
- Title: 24px, bold
- Close button (X) on top right

**Body**:
- Form fields with labels
- Descriptions/help text

**Footer**:
- Cancel button (secondary style)
- Action button (primary style)

---

### Tables

#### Table Structure
- Header row: Dark gray background
- Alternating row backgrounds (white, light gray)
- Padding: 12px per cell
- Border: 1px solid #E0E0E0

**Columns**:
- Sortable (arrow icon in header)
- Resizable (drag column divider)
- Checkbox column (select multiple rows)

**Actions Column**:
- Icon buttons for common actions
- Context menu for more options

---

### Navigation

#### Sidebar
- Width: 250px (collapsible to 60px)
- Background: Slightly darker than main
- Items: Icon + label
- Active state: Highlighted background
- Hover: Subtle background change

**Sidebar Items**:
- Main icon (24x24)
- Label (14px)
- Optional badge (for notifications)

#### Header
- Height: 60px
- Background: White
- Shadow: Elevation 1
- Layout: Flex with space-between
- Left: Logo + navigation breadcrumb
- Center: Search bar
- Right: Notifications + user menu

---

### Badges & Tags

#### Status Badge
- Padding: 4px 8px
- Font Size: 12px
- Border Radius: 4px
- Colors:
  - Success: Green background, dark text
  - Pending: Orange background, dark text
  - Error: Red background, white text
  - Info: Blue background, white text

#### Custom Tag
- Similar to badge
- Removable with X icon
- Multiple tags in container

---

### Empty States

**Structure**:
- Illustration/Icon (large, 80x80px)
- Heading: "No [items] found"
- Description text
- Call-to-action button (if applicable)

**Examples**:
- No documents
- No shared items
- No notifications
- No search results

---

### Messages & Alerts

#### Toast Notifications
- Position: Bottom right
- Auto-dismiss: 4 seconds
- Types:
  - Success (green)
  - Error (red)
  - Warning (orange)
  - Info (blue)
- Animation: Slide in from right, fade out

#### Alert Box
- Padding: 16px
- Border: Left accent line (3px)
- Border Radius: 4px
- Icon + message + close button
- Types: Success, Error, Warning, Info

---

### Loading States

#### Spinner
- Animated rotation
- Color: Primary blue
- Sizes: Small (24px), Medium (40px), Large (60px)

#### Skeleton Screen
- Placeholder rectangles
- Shimmer animation
- Match layout of actual content

#### Progress Bar
- Height: 4px
- Full width
- Color: Primary blue
- Animated from 0% to 100%

---

## Interactive States

### Button States
```
Default → Hover (brightness +10%) 
        → Active (brightness -5%)
        → Focus (outline: 2px blue)
        → Disabled (opacity: 50%)
        → Loading (spinner inside)
```

### Input Focus States
```
Default (gray border) → Focus (blue border, 2px)
                     → Typing (blue border maintained)
                     → Blur (back to gray)
                     → Error (red border)
                     → Error + Focus (red border, thicker)
```

### Dropdown Expansion
```
Closed (chevron down)
  ↓
Opening (animation)
  ↓
Expanded (chevron up, show all options)
  ↓
Select option
  ↓
Closing
  ↓
Closed (selected value shown)
```

### Modal Lifecycle
```
Closed → Fade in overlay + scale up modal
      → Modal visible (z-index highest)
      → User interacts
      → Submit/Cancel clicked
      → Fade out + close
      → Closed
```

### Page Transitions
```
Link clicked → Loading skeleton
           → Content loads
           → Fade in content
           → Page visible
```

---

## Design Specifications Summary

### Responsive Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text
- Focus indicators: Always visible
- ARIA labels: For interactive elements

### Animation Timings
- Quick interactions: 200ms
- Modal open/close: 300ms
- Page transitions: 400ms
- Hover effects: 150ms

### Customization Integration
- All brand colors should be configurable
- Theme switching should be immediate
- Logo should scale responsively
- System name should update in title and header

---

## Files to Create in Figma

1. **Cover Page** - System overview, branding
2. **Design System** - Colors, typography, spacing
3. **Components** - Button, input, card, modal, table
4. **Authentication Flow** - Login, Register, 2FA, Password Change
5. **User Dashboard** - Documents, folders, sharing, trash
6. **Admin Dashboard** - User management, approvals, organization
7. **System Admin Dashboard** - System config, customization
8. **Interactive Prototypes** - Key user journeys with transitions

---

## Implementation Notes

### For Developers
- Use CSS variables for theme colors
- Create reusable component library
- Implement responsive design
- Ensure accessibility standards
- Use consistent spacing throughout

### For Designers
- Maintain visual consistency across screens
- Follow established component library
- Test interactive flows
- Consider dark mode support
- Plan for future features and extensions

---

## Next Steps

1. **Review Design Specification** - Ensure all screens are covered
2. **Create Figma Components** - Build reusable components in Figma
3. **Create Page Frames** - Add all screens with actual content
4. **Build Prototypes** - Connect screens with interactions
5. **Add Handoff Documentation** - For developers
6. **Gather Feedback** - From stakeholders

---

*Last Updated: June 24, 2026*
*System: RKMS (Records and Knowledge Management System)*
