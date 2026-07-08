# Figma Setup Guide - Step by Step

## Part 1: Getting Started

### Step 1: Create a New Figma File

1. Go to [figma.com](https://figma.com)
2. Sign up (free account) or log in
3. Click **"New file"** button
4. Name it: **"RKMS - Records & Knowledge Management System"**
5. Click **Create**

---

## Part 2: Set Up Design Tokens (Colors & Typography)

### Step 2: Create Color Palette

**In Figma:**

1. **Open Assets Panel** (right sidebar, click "Assets" tab)
2. **Create Color Library**:
   - Click the **+** icon next to "Colors"
   - Or go to **Assets > Colors > +**

3. **Add Primary Colors**:
   - Create a rectangle (Drag tool)
   - Set fill color to **#007ACC** (Primary Blue)
   - In Assets panel, right-click the color and **"Create color style"**
   - Name it: **Primary Blue / 007ACC**
   - Repeat for other colors:
     - Secondary Blue: **#0E90D4**
     - Accent Blue: **#1BA1E2**
     - Success Green: **#107C10**
     - Warning Orange: **#FFB900**
     - Error Red: **#E81123**
     - Info Blue: **#0078D4**
     - Dark Gray: **#333333**
     - Medium Gray: **#757575**
     - Light Gray: **#F3F3F3**
     - White: **#FFFFFF**
     - Black: **#000000**

**Quick Alternative: Import from Design Tokens**
- Use Figma plugin: **"Design Tokens"** to bulk import colors

---

### Step 3: Create Typography Styles

1. **Create Text Styles**:
   - Click **Text tool** (keyboard: T)
   - Type some placeholder text
   - Select the text and in right panel under **Typography**:
     - Set **Font**: Segoe UI
     - Set **Size**: 32px
     - Set **Weight**: 600 (Bold)

2. **Save as Style**:
   - Click **+** next to "Typography" in Assets panel
   - Name it: **H1 / 32px Bold**
   - Repeat for all sizes:
     - H2: 24px, Semi-bold (600)
     - H3: 20px, Semi-bold (500)
     - Body Large: 16px, Regular (400)
     - Body: 14px, Regular (400)
     - Small/Caption: 12px, Regular (400)
     - Label: 13px, Medium (500)

---

## Part 3: Build Component Library

### Step 4: Create Reusable Button Components

1. **Draw Primary Button**:
   - Select **Rectangle tool**
   - Draw a rectangle: 120px width x 40px height
   - Set **fill** to Primary Blue (#007ACC)
   - Set **border radius** to 4px
   - Add **text** on top: "Button"
   - Make text white, 14px, Medium weight

2. **Select everything and group** (Ctrl+G or Cmd+G)
3. **Right-click > Create component** (or press Ctrl+Alt+K)
4. **Rename in right panel**: `Button / Primary`

5. **Create Variants** (States):
   - Right-click component > **"Edit main component"**
   - Duplicate it 3 times
   - Rename each:
     - `Button / Primary / Default` (already done)
     - `Button / Primary / Hover` (darken color)
     - `Button / Primary / Disabled` (gray out)
   - Select all → **Right-click > Create component set**

---

### Step 5: Create Input Component

1. **Draw Text Input**:
   - Rectangle: 200px x 40px
   - Fill: White
   - Stroke: 1px, #E0E0E0
   - Border Radius: 4px

2. **Add Text inside**: 
   - Text: "Enter text..." (placeholder gray)
   - Padding: 8px 12px

3. **Group & make component**: `Input / Text`

---

### Step 6: Create Card Component

1. **Draw Card**:
   - Rectangle: 200px x 200px
   - Fill: White
   - Stroke: 1px, #E0E0E0
   - Border Radius: 6px
   - Shadow: 0px 2px 8px rgba(0,0,0,0.08)

2. **Add content area** (empty for now)
3. **Make component**: `Card / Default`

---

### Step 7: Create Modal Component

1. **Draw Modal**:
   - Background overlay: Black rectangle, full screen, opacity 50%
   - Modal card: White rectangle (600px x 400px)
   - Border Radius: 8px
   - Shadow: 0px 8px 24px rgba(0,0,0,0.15)

2. **Add sections**:
   - **Header** (60px): Title + Close button (X)
   - **Body** (280px): Form fields area
   - **Footer** (60px): Cancel & Action buttons

3. **Make component**: `Modal / Default`

---

### Step 8: Create Table Component

1. **Draw Table Header Row**:
   - Rectangle background: Dark gray (#333333)
   - Text: Column names in white
   - Height: 40px

2. **Draw Table Row**:
   - Rectangle background: White
   - Text: Sample data
   - Height: 40px
   - Stroke: 1px bottom border

3. **Duplicate rows and alternate backgrounds** (white, light gray)
4. **Group and make component**: `Table / Default`

---

## Part 4: Build Screens

### Step 9: Create Login Screen

1. **Create new frame**: Press **F** (Frame tool)
2. **Set size**: 1440 x 900 (desktop)
3. **Name it**: `Screens / Login`

4. **Add content**:
   - **Background**: Light gray (#F3F3F3)
   - **Center a card** (400px width):
     - Logo area (placeholder)
     - System title
     - Email input
     - Password input
     - Checkbox: "Remember me"
     - Primary button: "Login"
     - "Forgot password?" link
     - "Don't have an account? Register" link

5. **Use your components**:
   - Drag input component from Assets
   - Drag button component from Assets
   - Right-click each → **"Create instance"** (reuses component)

---

### Step 10: Create Document Management Screen

1. **Create new frame**: `Screens / User Dashboard / Documents`
2. **Add sections**:
   - **Header** (60px):
     - Logo + "RKMS"
     - Search bar
     - Notifications bell
     - User menu
   - **Sidebar** (250px):
     - My Documents (selected/highlighted)
     - Shared with Me
     - Trash
     - Help
   - **Main content**:
     - Breadcrumb
     - Toolbar: "Create Folder", "Upload File", View options
     - Filter & Sort buttons
     - **Grid of document cards** (160px each):
       - Document icon
       - Name
       - Date
       - Size

---

### Step 11: Create Admin Dashboard

1. **Create new frame**: `Screens / Admin / Dashboard`
2. **Same header + sidebar**
3. **Add dashboard widgets**:
   - Total users (card with large number)
   - Total documents (card with large number)
   - Pending approvals (card with large number)
   - Recent activities (table card)
   - Activity chart placeholder

---

### Step 12: Create Additional Screens

Repeat for each major screen:
- `Screens / Auth / Register`
- `Screens / Auth / 2FA`
- `Screens / User / Shared Documents`
- `Screens / User / Trash`
- `Screens / Admin / User Management`
- `Screens / Admin / Approval Requests`
- `Screens / Admin / Organization`
- `Screens / Admin / Customization`
- `Screens / SystemAdmin / Dashboard`
- `Screens / SystemAdmin / Customization`

---

## Part 5: Create Prototypes (Interactions)

### Step 13: Connect Screens with Interactions

1. **Open Prototype tab** (right sidebar)
2. **Add interaction to login button**:
   - Select the button on Login screen
   - Click **+** in Prototype tab
   - **Interaction**: "On click"
   - **Navigate to**: `Screens / User / Documents`
   - **Animation**: "Smart animate" or "Fade"
   - **Duration**: 300ms

3. **Add back navigation**:
   - Add a back button/link
   - Click → Navigate back

4. **Connect other screens**:
   - Register link → Register screen
   - "Forgot password?" → Password reset screen
   - Sidebar items → Different screens
   - Buttons → Modal screens

---

### Step 14: Set Up Component Interactions

1. **Button hover states**:
   - Click button instance
   - Interaction: "On hover"
   - Action: "Change component"
   - Select the hover variant

2. **Modal open/close**:
   - Create Folder button → Opens Create Folder Modal
   - Close button in modal → Back to previous screen

---

## Part 6: Organize Your Figma File

### Step 15: Structure Your File

**Pages in left sidebar**:
1. **Cover** - Title page
2. **Design System** - Colors, typography, spacing
3. **Components** - All reusable components
4. **Screens - Auth** - Login, Register, 2FA
5. **Screens - User** - Documents, Sharing, Trash
6. **Screens - Admin** - Dashboard, Users, Approvals
7. **Screens - SystemAdmin** - Dashboard, Config
8. **Prototypes** - Key user flows

---

### Step 16: Add Annotations

1. **For developers**:
   - Select a component
   - Right sidebar → **Inspect**
   - Shows size, colors, spacing
   - Copy CSS

2. **Add comment on element** (Shift+C):
   - Leave notes for developers
   - Example: "This button should be disabled after submission"

---

## Part 7: Sharing & Collaboration

### Step 17: Share Your Design

1. **Share Link**:
   - Top right → **Share** button
   - Toggle "Anyone with link can view"
   - Copy link

2. **Invite Team**:
   - Add email addresses
   - Choose permission: View or Edit

3. **Share for Development**:
   - **Inspect** tab shows all specs
   - Developers can see exact dimensions and colors
   - Export assets: Right-click element → Export

---

## Quick Tips

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Frame | F |
| Rectangle | R |
| Text | T |
| Component | Ctrl+Alt+K (Cmd+⌥+K Mac) |
| Instance | Ctrl+D (Cmd+D Mac) |
| Group | Ctrl+G (Cmd+G Mac) |
| Copy | Ctrl+C (Cmd+C Mac) |
| Paste | Ctrl+V (Cmd+V Mac) |

### Helpful Plugins
1. **Design Tokens** - Manage design tokens
2. **Lorem Ipsum** - Generate placeholder text
3. **Unsplash** - Add placeholder images
4. **Wireframe Kit** - Quick wireframes
5. **UI Kits** - Pre-built components

### Best Practices
- ✅ Name everything clearly (Components, Frames, Groups)
- ✅ Use components for reusable elements
- ✅ Create variants for different states
- ✅ Use grids and guides for alignment
- ✅ Lock elements you don't want to move
- ✅ Use frames to organize screens
- ✅ Test your prototypes (click play button)
- ✅ Export assets for developers

---

## Your Step-by-Step Action Plan

### Session 1: Setup (30 minutes)
1. Create Figma file
2. Add all colors
3. Add all typography
4. ✅ Done!

### Session 2: Components (45 minutes)
1. Create Button component (+ variants)
2. Create Input component
3. Create Card component
4. Create Modal component
5. Create Table component
6. ✅ Done!

### Session 3: Auth Screens (30 minutes)
1. Create Login screen
2. Create Register screen
3. Create 2FA screen
4. ✅ Done!

### Session 4: User Screens (45 minutes)
1. Create Documents screen
2. Create Shared Documents screen
3. Create Trash screen
4. ✅ Done!

### Session 5: Admin Screens (45 minutes)
1. Create Admin Dashboard
2. Create User Management
3. Create Approvals
4. Create Organization Structure
5. ✅ Done!

### Session 6: SystemAdmin + Polish (30 minutes)
1. Create System Admin screens
2. Add interactions/prototypes
3. Add annotations
4. ✅ Complete!

---

## Getting Help

- **Figma Help**: https://help.figma.com/
- **YouTube Tutorials**: Search "Figma for beginners"
- **Community**: https://www.figma.com/community
- **Plugins**: Find more at figma.com/plugins

---

*Good luck! Your RKMS design will look professional once built in Figma!*
