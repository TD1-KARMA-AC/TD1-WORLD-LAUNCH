# Copy Website Files - Instructions

## Current Location
- **Website files**: `C:\TD1.WORLD\website\`
- **GitHub repo**: `C:\TD1WORLD\`

## Files to Copy

1. **Main pages:**
   - `index.html` → `website/index.html`
   - `PRODUCTS_INDEX.html` → `website/PRODUCTS_INDEX.html`
   - `ABOUT.html` → `website/ABOUT.html`

2. **Assets folder:**
   - `assets/` → `website/assets/`

3. **Demos folder:**
   - `demos/` → `website/demos/`

## Manual Copy Steps

Since the files are in a different directory, you'll need to:

1. **Create website folder in repo:**
   ```powershell
   mkdir website
   ```

2. **Copy files:**
   - Copy `C:\TD1.WORLD\website\*` to `C:\TD1WORLD\website\`
   - Or use Windows Explorer to copy/paste

3. **Or I can help you copy them programmatically**

## After Copying

1. Update navigation links in HTML files
2. Test locally
3. Commit and push to GitHub
4. Netlify will auto-deploy

---

## Quick Copy Command (Run in PowerShell)

```powershell
# From C:\TD1WORLD directory
Copy-Item -Path "C:\TD1.WORLD\website\*" -Destination ".\website\" -Recurse -Force
```

This will copy all files from the website folder to your repo.

