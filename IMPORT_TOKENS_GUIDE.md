# How to Import Design Tokens into Figma - Step by Step

## What You're About to Do

You'll import the **design-tokens.json** file into Figma, which automatically creates:
- ✅ All colors with proper naming
- ✅ Typography styles
- ✅ Component specs
- ✅ Spacing system

**Time needed: 10 minutes**

---

## Step 1: Open Figma

1. Go to **figma.com**
2. Sign up (free) or log in
3. Create a **new file** → Name it **"RKMS Design System"**

---

## Step 2: Install Design Tokens Plugin

1. In your Figma file, go to **top menu → Plugins**
2. Search for **"Design Tokens"** (by Figma)
3. Click **Install** (it's free and official from Figma)
4. Wait for it to install (~5 seconds)

---

## Step 3: Prepare Your Token File

1. **Download the file**:
   - The file `design-tokens.json` is in your **Capstone** folder
   - You'll need the content from this file

2. **Copy the JSON content**:
   - Open `design-tokens.json` in VS Code or notepad
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

**OR** upload it to a publicly accessible location (optional, see step 5)

---

## Step 4: Open Design Tokens Plugin in Figma

1. In your Figma file → **Plugins → Design Tokens** (click to open)
2. A panel will appear on the right side

---

## Step 5: Import Tokens

### Option A: Import JSON Directly (Easiest)

1. In the Design Tokens panel:
   - Click **three dots (...)** menu → **Settings**
   - Look for **"Import Tokens"** or **"Load from file"**
   - Click **"Import"**

2. **Paste your JSON**:
   - The token file content will be in a text field
   - Paste the content from `design-tokens.json`
   - Click **Save/Import**

### Option B: Import from URL (If you uploaded file online)

1. In Design Tokens panel → **Settings**
2. Enter your file URL
3. Click **Sync** or **Import**

---

## Step 6: Apply Tokens to Your Design

Once tokens are imported, you'll see them in the Design Tokens panel:

### Add Colors to a Shape

1. **Draw a rectangle** (press R)
2. **In right panel**, find the **fill color**
3. Click the **token icon** (next to color field)
4. Select **Colors → Primary → Blue**
5. ✅ The color is now linked to your token!

### Create Button with Tokens

1. **Draw a rectangle** (40px height)
2. **Apply color**: Select `colors.primary.blue` token
3. **Apply border radius**: Type `{border-radius.small}` (4px)
4. **Add text** with token font size and weight
5. **Select all + Group** (Ctrl+G)
6. **Right-click → Create component**
7. ✅ You've created your first component!

---

## Step 7: Create Multiple Screens Using Tokens

### Create Login Screen

1. **New Frame** (F key)
2. **Frame size**: 1440 x 900
3. **Name it**: "Login Screen"
4. **Add elements using tokens**:
   - Background: Rectangle → Fill with `colors.neutral.light-gray`
   - Card: Rectangle → Apply `card` tokens
   - Button: Use your button component (with primary blue token)
   - Inputs: Use input component (with input tokens)
   - Text: Apply `typography.font-size.h2` for title

### Create Dashboard Screen

1. **New Frame** (F key)
2. **Frame size**: 1440 x 900
3. **Name it**: "Dashboard Screen"
4. **Add header**:
   - Rectangle 1440x60 → Background: `colors.neutral.white`
   - Add logo and title text
5. **Add sidebar**:
   - Rectangle 250x840 → Background: `colors.neutral.light-gray`
   - Add navigation items
6. **Add main content**:
   - Cards with `card` component tokens
   - Text with typography tokens

---

## Step 8: Sync Updates Across Figma

### Update a Token Color

1. **Go back to Design Tokens panel**
2. **Edit token value**:
   - Find `colors.primary.blue`
   - Change value (e.g., from #007ACC to #0056B3)
3. **Save changes**
4. ✅ ALL elements using this token update automatically!

---

## Step 9: Export Design for Developers

### Share with Your Team

1. **In Figma** → **Share** button (top right)
2. **Toggle "Anyone with link can view"**
3. **Copy link** and share

### Developer Handoff

1. **Inspect components**:
   - Right-click element → **Inspect**
   - Developers can see exact spacing, colors, shadows

2. **Export assets**:
   - Right-click component → **Export**
   - Downloads PNG/SVG

---

## Your Token Structure Explained

```json
{
  "global": {                          // Main section
    "colors": {                        // Color tokens
      "primary": {
        "blue": "#007ACC"              // Primary brand color
      }
    },
    "typography": {                    // Typography tokens
      "font-size": {
        "h1": "32"
      }
    },
    "spacing": {                       // Spacing tokens
      "md": "16"
    },
    "components": {                    // Component specs
      "button": {
        "primary": {                   // Button primary style
          "background": "#007ACC"
        }
      }
    }
  }
}
```

---

## How Tokens Work in Figma

### Before (Without Tokens)
```
Button 1: Blue, 16px font, 10px padding
Button 2: Blue, 16px font, 10px padding
Button 3: Blue, 16px font, 10px padding
← If you change blue, you must edit 3 buttons manually
```

### After (With Tokens)
```
Button 1: Uses "primary.blue" token
Button 2: Uses "primary.blue" token
Button 3: Uses "primary.blue" token
← If you change the token, all 3 buttons update automatically ✅
```

---

## Troubleshooting

### Plugin won't open
- **Solution**: Reload Figma (F5 or Cmd+R)
- Plugins menu → Design Tokens → Try again

### JSON import fails
- **Solution**: Check JSON syntax
  - Make sure all brackets match
  - All commas are in the right place
  - No trailing commas before closing }
- Paste into **jsonlint.com** to validate

### Colors not showing
- **Solution**: Make sure you're using the token name in the right place
- Click the **token icon** (magic wand icon) next to color picker
- Select your token from the list

### Can't find Design Tokens plugin
- **Solution**: Search in Figma → Plugins
- Search: **"Design Tokens"** (the official one by Figma Design Systems team)
- Make sure it shows as "by Figma"

---

## Quick Reference: Using Tokens

| Task | Steps |
|------|-------|
| **Apply color** | Shape → Fill → Click token icon → Select color |
| **Apply spacing** | Create object → Use dimensions from tokens |
| **Create text style** | Text → Set size/weight from tokens → Save as style |
| **Update all instances** | Edit token value → All elements using it update |
| **Export CSS** | Right-click component → Inspect → See CSS values |

---

## Next Steps

### After importing tokens:

1. **✅ Week 1**: Import tokens + create components
2. **✅ Week 2**: Build 3-4 key screens (Login, Dashboard, Admin)
3. **✅ Week 3**: Add interactions/prototypes
4. **✅ Week 4**: Polish and share with team

---

## File Locations

- **Design Tokens**: `c:\Users\rvinn\Capstone\design-tokens.json`
- **Design Spec**: `c:\Users\rvinn\Capstone\FIGMA_DESIGN_SPEC.md`
- **Setup Guide**: `c:\Users\rvinn\Capstone\FIGMA_SETUP_GUIDE.md`

---

## Video Resources (If you get stuck)

- Figma Tokens Playlist: https://www.youtube.com/watch?v=Xn_u84qvCAU
- Design Systems in Figma: https://www.youtube.com/watch?v=RhVsY82o4yI
- Official Figma Design Tokens Docs: https://www.figma.com/design-systems/

---

**You're ready! Open Figma and start building! 🚀**

Questions? Go back to **FIGMA_SETUP_GUIDE.md** for component building tips.
