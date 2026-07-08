# Option 3: Quick Manual Figma Setup - Live Walkthrough

## Overview
I'll guide you **step-by-step** while you build your Figma file in real-time. 
**Time: ~2 hours to complete**

---

## PHASE 1: File & Colors (10 minutes)

### Step 1: Create Figma File
**What you do:**
1. Go to **figma.com**
2. Click **"New file"** button
3. Name it: **RKMS Design System**
4. Click **Create**

**Let me know when:** ✋ Type "DONE - File created"

---

### Step 2: Add Your Colors

**In Figma, do this:**

1. **Open Assets panel** (right sidebar → see "Assets" tab)
2. **Click the colors icon** (looks like a palette)
3. **Create color items** - add each color below:

| Name | Hex Color | Use |
|------|-----------|-----|
| Primary Blue | #007ACC | Main buttons, links |
| Secondary Blue | #0E90D4 | Hover states |
| Accent Blue | #1BA1E2 | Highlights |
| Success Green | #107C10 | Success states |
| Warning Orange | #FFB900 | Warnings |
| Error Red | #E81123 | Errors, delete |
| Info Blue | #0078D4 | Information |
| Dark Gray | #333333 | Dark text |
| Medium Gray | #757575 | Secondary text |
| Light Gray | #F3F3F3 | Backgrounds |
| White | #FFFFFF | Main background |
| Border Gray | #E0E0E0 | Borders |

**How to add a color:**
- In Assets panel, click **+** next to "Colors"
- Type hex value (e.g., #007ACC)
- Type name (e.g., "Primary Blue")
- Click Save

**Let me know when:** ✋ Type "DONE - All 12 colors added"

---

## PHASE 2: Build Components (45 minutes)

### Step 3: Create Primary Button Component

**In Figma:**

1. **Draw a rectangle** (press **R**)
   - Width: 120px
   - Height: 40px
   - Fill color: Primary Blue (#007ACC)
   - Border radius: 4px

2. **Add text** (press **T**)
   - Type: "Login"
   - Color: White
   - Font size: 14px
   - Font weight: Medium/Semi-bold
   - Center text in rectangle

3. **Select both** (Ctrl+A to select all)
4. **Group them** (Ctrl+G)
5. **Make it a component** (Ctrl+Alt+K)
   - Name it: `Button / Primary`

**Let me know when:** ✋ Type "DONE - Primary button created"

---

### Step 4: Create Secondary Button

**In Figma:**

1. **Duplicate primary button** (Ctrl+D)
2. **Edit the copy:**
   - Change fill to Light Gray (#F3F3F3)
   - Change text color to Dark Gray (#333333)
   - Add 1px border in Medium Gray (#757575)

3. **Select all** (Ctrl+A)
4. **Group** (Ctrl+G)
5. **Make component** (Ctrl+Alt+K)
   - Name it: `Button / Secondary`

**Let me know when:** ✋ Type "DONE - Secondary button created"

---

### Step 5: Create Danger Button

**In Figma:**

1. **Duplicate primary button** (Ctrl+D)
2. **Edit the copy:**
   - Change fill to Error Red (#E81123)
   - Keep text white
   - Delete text, type "Delete"

3. **Select all** (Ctrl+A)
4. **Group** (Ctrl+G)
5. **Make component** (Ctrl+Alt+K)
   - Name it: `Button / Danger`

**Let me know when:** ✋ Type "DONE - Danger button created"

---

### Step 6: Create Text Input Component

**In Figma:**

1. **Draw rectangle** (R)
   - Width: 200px
   - Height: 40px
   - Fill: White
   - Border: 1px, Border Gray (#E0E0E0)
   - Border radius: 4px
   - Padding: 8px left

2. **Add text** (T)
   - Type: "Enter text..."
   - Color: Medium Gray (#757575)
   - Font size: 14px

3. **Select both** (Ctrl+A)
4. **Group** (Ctrl+G)
5. **Make component** (Ctrl+Alt+K)
   - Name it: `Input / Text`

**Let me know when:** ✋ Type "DONE - Text input created"

---

### Step 7: Create Card Component

**In Figma:**

1. **Draw rectangle** (R)
   - Width: 300px
   - Height: 200px
   - Fill: White
   - Border: 1px, Border Gray (#E0E0E0)
   - Border radius: 6px

2. **Add shadow:**
   - Right panel → **Design** section
   - Click **+** next to Shadow
   - Set: 0px, 2px, 8px blur, 0 spread, Black 8% opacity

3. **Make component** (Ctrl+Alt+K)
   - Name it: `Card / Default`

**Let me know when:** ✋ Type "DONE - Card component created"

---

### Step 8: Create Modal Component

**In Figma:**

1. **Draw rectangle (overlay)** (R)
   - Width: 1440, Height: 900
   - Fill: Black, Opacity 50%
   - Name it: "Overlay"

2. **Draw rectangle (modal card)** (R)
   - Width: 600px
   - Height: 500px
   - Fill: White
   - Border radius: 8px
   - Center on screen
   - Add shadow (Elevation 3): 0px, 8px, 24px, Black 15%

3. **Add header section** (R)
   - Rect: 600px width x 60px height
   - Fill: Light Gray (#F3F3F3)
   - Border bottom: 1px Border Gray

4. **Add body section** (empty for now)

5. **Add footer section** (R)
   - Rect: 600px width x 60px height
   - Fill: Light Gray (#F3F3F3)
   - Border top: 1px Border Gray

6. **Select all** (Ctrl+A)
7. **Group** (Ctrl+G)
8. **Make component** (Ctrl+Alt+K)
   - Name it: `Modal / Default`

**Let me know when:** ✋ Type "DONE - Modal component created"

---

### Step 9: Create Table Component

**In Figma:**

1. **Draw table header row** (R)
   - Width: 800px, Height: 40px
   - Fill: Dark Gray (#333333)
   - Border radius: 4px 4px 0 0

2. **Add text** (T)
   - Type: "Name | Email | Role | Status"
   - Color: White
   - Padding: 12px

3. **Duplicate row 2 times for table data** (Ctrl+D)
   - Edit fills: White, then Light Gray (#F3F3F3)
   - Edit text with sample data
   - Add 1px bottom border

4. **Select all rows** (Ctrl+A)
5. **Group** (Ctrl+G)
6. **Make component** (Ctrl+Alt+K)
   - Name it: `Table / Default`

**Let me know when:** ✋ Type "DONE - Table component created"

---

## PHASE 3: Build Screens (60 minutes)

### Step 10: Create Login Screen

**In Figma:**

1. **Create frame** (Press **F**)
   - Size: 1440 x 900
   - Background: Light Gray (#F3F3F3)
   - Name: `Screen / Login`

2. **Add background**
   - Rectangle: 1440 x 900
   - Fill: Light Gray

3. **Add centered card** (in center of screen)
   - Rectangle: 400px x 500px
   - Fill: White
   - Border radius: 8px
   - Shadow: Elevation 2
   - Position: Center X, Center Y

4. **Add content to card**:
   - **Logo area** (rectangle 100x100 at top, gray placeholder)
   - **Title text**: "RKMS Login"
   - **Email label** + **Email input** (use your Input component)
   - **Password label** + **Password input** (use your Input component)
   - **Checkbox**: "Remember me"
   - **Primary button**: "Login" (use your Button component)
   - **Link text**: "Forgot password?"
   - **Link text**: "Don't have account? Register"

**Layout (from top to bottom inside card):**
```
Logo (100x100)
"RKMS Login" (title)
Email label
Email input
Password label
Password input
Remember me (checkbox)
Login button (full width)
Forgot password? (link)
Register link (link)
```

**Let me know when:** ✋ Type "DONE - Login screen created"

---

### Step 11: Create User Dashboard Screen

**In Figma:**

1. **Create frame** (F)
   - Size: 1440 x 900
   - Name: `Screen / User Dashboard`

2. **Add header** (top bar)
   - Rectangle: 1440 x 60
   - Fill: White
   - Border bottom: 1px Border Gray
   - Add text: "RKMS | My Documents"
   - Add search box, notification icon, user menu

3. **Add sidebar** (left)
   - Rectangle: 250 x 840
   - Fill: Light Gray
   - Add navigation items:
     - My Documents (highlighted/selected)
     - Shared with Me
     - Trash
     - Help

4. **Add main content** (center)
   - Add toolbar: "Create Folder | Upload File | View Options"
   - Add filters: "Sort by | Filter"
   - **Add document grid** (3 columns):
     - 3x2 grid of cards (160px each)
     - Each card has:
       - Icon/thumbnail placeholder
       - Document name
       - Date
       - File size

5. **All positioned correctly** (header top, sidebar left, content right)

**Let me know when:** ✋ Type "DONE - User Dashboard screen created"

---

### Step 12: Create Admin Dashboard Screen

**In Figma:**

1. **Duplicate User Dashboard** (Ctrl+D)
2. **Edit copy:**
   - Change name to: `Screen / Admin Dashboard`
   - Change sidebar text to include:
     - Dashboard (selected)
     - User Management
     - Approvals
     - Organization
     - Audit Logs

3. **Replace main content with dashboard widgets:**
   - 4 stat cards (Users, Documents, Approvals, Reports)
   - 1 recent activity table
   - 1 chart placeholder

4. **Position cards in 2x2 grid**

**Let me know when:** ✋ Type "DONE - Admin Dashboard created"

---

### Step 13: Create System Admin Dashboard

**In Figma:**

1. **Duplicate Admin Dashboard** (Ctrl+D)
2. **Edit copy:**
   - Change name to: `Screen / System Admin Dashboard`
   - Change sidebar items:
     - Dashboard (selected)
     - User Management
     - Requests
     - Customization
     - ID Formatter
     - Audit Logs

3. **Update stats on cards:**
   - Total Users
   - Total Organizations
   - System Health
   - Pending Requests

**Let me know when:** ✋ Type "DONE - System Admin Dashboard created"

---

### Step 14: Create a Few More Key Screens

**In Figma, create these frames:**

1. **Register Screen** (duplicate Login)
   - Add more fields: First Name, Last Name, Email, Password, Org, Position
   - Change button text to "Register"

2. **User Management Screen** (duplicate Admin Dashboard)
   - Replace content with user table
   - Columns: Name, Email, Org, Role, Status, Actions

3. **Approval Requests Screen** (duplicate Admin Dashboard)
   - Replace content with approval request cards/table
   - Show: Document, Requester, Date, Status

**Let me know when:** ✋ Type "DONE - Additional screens created"

---

## PHASE 4: Add Interactions (30 minutes)

### Step 15: Create Prototype Interactions

**In Figma:**

1. **Open Prototype tab** (right sidebar)

2. **Login button → Dashboard**:
   - Click Login screen
   - Click the "Login" button
   - Click **+** in Prototype tab
   - Set: Trigger = "On click"
   - Navigate to: "Screen / User Dashboard"
   - Animation: "Smart animate" or "Fade"
   - Duration: 300ms

3. **Register link → Register screen**:
   - Click the "Register" link on Login
   - Click **+** in Prototype
   - Set: Trigger = "On click"
   - Navigate to: "Screen / Register"

4. **Dashboard → User Management**:
   - On Admin Dashboard
   - Click "User Management" in sidebar
   - Click **+** in Prototype
   - Navigate to: "Screen / User Management"

5. **Dashboard → Approvals**:
   - On Admin Dashboard
   - Click "Approvals" in sidebar
   - Click **+** in Prototype
   - Navigate to: "Screen / Approval Requests"

6. **Repeat for other sidebar items**

**Let me know when:** ✋ Type "DONE - Interactions/prototypes added"

---

## PHASE 5: Test & Polish (20 minutes)

### Step 16: Test Your Prototype

**In Figma:**

1. **Click play button** (top right, looks like ▶)
2. **Test these flows:**
   - ✅ Login → Dashboard works?
   - ✅ Register link works?
   - ✅ Sidebar navigation works?
   - ✅ Animations smooth?

3. **Fix any issues:**
   - If button doesn't navigate, re-do the interaction
   - If animation is too slow, adjust duration

**Let me know when:** ✋ Type "DONE - Prototype tested"

---

### Step 17: Organize & Name Everything

**In Figma:**

1. **Rename all frames** clearly:
   - Screens / Auth / Login
   - Screens / Auth / Register
   - Screens / User / Dashboard
   - Screens / Admin / Dashboard
   - Screens / SystemAdmin / Dashboard

2. **Organize Components**:
   - Buttons / Primary, Secondary, Danger
   - Inputs / Text
   - Cards / Default
   - Modals / Default
   - Tables / Default

3. **Create page structure** (left sidebar):
   - Page 1: "Design System" (your colors & tokens)
   - Page 2: "Components" (your 8 components)
   - Page 3: "Screens" (all 6+ screens)
   - Page 4: "Prototypes" (same screens with interactions)

**Let me know when:** ✋ Type "DONE - Everything organized"

---

## PHASE 6: Share (5 minutes)

### Step 18: Share Your Design

**In Figma:**

1. **Click Share button** (top right)
2. **Toggle "Anyone with link can view"**
3. **Copy the link**
4. **Share with team** or keep for yourself

**You now have a complete, interactive Figma design!** 🎉

---

## Checklist - Mark Off As You Complete

- [ ] DONE - File created
- [ ] DONE - All 12 colors added
- [ ] DONE - Primary button created
- [ ] DONE - Secondary button created
- [ ] DONE - Danger button created
- [ ] DONE - Text input created
- [ ] DONE - Card component created
- [ ] DONE - Modal component created
- [ ] DONE - Table component created
- [ ] DONE - Login screen created
- [ ] DONE - User Dashboard created
- [ ] DONE - Admin Dashboard created
- [ ] DONE - System Admin Dashboard created
- [ ] DONE - Additional screens created (Register, User Mgmt, Approvals)
- [ ] DONE - Interactions/prototypes added
- [ ] DONE - Prototype tested
- [ ] DONE - Everything organized
- [ ] DONE - Design shared

---

## If You Get Stuck

**Common issues:**

| Problem | Solution |
|---------|----------|
| Can't find "Make component" | Right-click selected object → "Create component" |
| Button won't click in prototype | Make sure you're in Prototype tab, not Inspect |
| Colors look wrong | Double-check hex codes (copy from JSON file) |
| Can't add shadow | Select object → Right panel → Design → + Shadow |
| Navigation won't work | Make sure frame names match exactly |

---

## Next: Share Link With Me

Once you complete all steps, reply with:
- **"✅ DONE - Here's my Figma link: [your_link]"**

I can then:
- Review your design
- Suggest improvements
- Help polish components
- Add more interactions

---

**Let's Go! Start with Step 1 and tell me when you're done with each phase!** 🚀
